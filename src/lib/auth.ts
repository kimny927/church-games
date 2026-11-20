// Better Auth 설정. 관리자 계정(이메일+비밀번호)만 쓴다. 서버에서만 import.
import { neon } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";
import { createAuthMiddleware, isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import { NeonDialect } from "kysely-neon";
import { hashPassword, verifyPassword } from "./password";

// 역할: owner(최고 관리자) = 관리자 계정 관리 권한 전부, admin(관리자) = 계정 관리 권한 없음
export const ac = createAccessControl(defaultStatements);
const roles = {
  owner: ac.newRole(adminAc.statements),
  admin: ac.newRole({ user: [], session: [] }),
};
export type AdminRole = keyof typeof roles;

function createAuth() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 이 없어요. .env.local 을 확인하세요.");
  return betterAuth({
    // Neon HTTP 드라이버: 요청이 끝나도 붙잡는 연결이 없어 Workers에 맞다. 대신 트랜잭션은 못 쓴다.
    database: { dialect: new NeonDialect({ neon: neon(url) }), type: "postgres" },
    baseURL: {
      allowedHosts: ["localhost:3000", "localhost:8787", "church-games.kimny927.workers.dev", "*-church-games.kimny927.workers.dev"],
      // 요청 없이 서버에서 직접 부를 때(스크립트) 쓰는 주소
      fallback: "https://church-games.kimny927.workers.dev",
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: true, // 공개 가입 금지. 계정은 최고 관리자만 만든다
      minPasswordLength: 12,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    user: {
      additionalFields: {
        mustChangePassword: { type: "boolean", required: false, defaultValue: false, input: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 14,
      // 세션을 서명된 쿠키에 5분간 담아 매 요청 DB 조회를 줄인다.
      // 대신 역할 변경·세션 해제가 최대 5분 늦게 반영되므로 민감한 확인은 requireAdmin 에서 DB로 다시 본다.
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    // 요청 제한은 /api/auth/* HTTP 경로에만 걸린다. 서버 액션에서 auth.api.signInEmail 등을 직접 부르면 건너뛰므로
    // 로그인·비밀번호 변경은 브라우저에서 /api/auth/* 를 호출한다 (src/lib/auth-client.ts)
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/change-password": { window: 60, max: 5 },
      },
    },
    hooks: {
      // 비밀번호 변경에 성공하면 '첫 로그인 비밀번호 변경' 표시를 끈다
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/change-password") return;
        const returned = ctx.context.returned as { user?: { id: string } } | undefined;
        if (isAPIError(returned) || !returned?.user) return;
        await ctx.context.internalAdapter.updateUser(returned.user.id, { mustChangePassword: false });
      }),
    },
    advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
    plugins: [admin({ ac, roles, defaultRole: "admin", adminRoles: ["owner"] }), nextCookies()],
  });
}

// process.env 는 요청 시점에만 확실히 있으므로 처음 쓸 때 만든다 (빌드 때 DB 접속 방지)
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  return (instance ??= createAuth());
}
