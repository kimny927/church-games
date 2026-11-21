// Better Auth 설정. 관리자 계정(이메일+비밀번호)만 쓴다. 서버에서만 import.
import { neon } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getAuthoritativeSessionFromCtx, getSessionFromCtx, isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";
import { NeonDialect } from "kysely-neon";
import { isNicknameTaken } from "./db";
import { NICKNAME_TAKEN, parseNickname } from "./nickname";
import { hashPassword, verifyPassword } from "./password";

// 역할: owner(최고 관리자) = 관리자 계정 관리, admin(관리자) = 계정 관리 권한 없음
// owner에게도 impersonate(다른 사람으로 로그인)·ban·이메일 변경은 주지 않는다. 승인자(approved_by) 기록을 믿을 수 있게
export const ac = createAccessControl(defaultStatements);
const roles = {
  owner: ac.newRole({
    user: ["create", "list", "get", "update", "set-role", "set-password", "delete"],
    session: ["list", "revoke", "delete"],
  }),
  admin: ac.newRole({ user: [], session: [] }),
};
export type AdminRole = keyof typeof roles;

type HookCtx = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0];

// 관리 API(/admin/*) 공통 규칙. 통과하면 true, 로그인이 안 됐으면 false(플러그인이 401로 거절)
async function checkAdminApi(ctx: HookCtx): Promise<boolean> {
  // 헤더 없는 서버 호출(첫 owner 생성 스크립트)은 권한 확인 자체가 없다
  if (!ctx.headers) return true;
  // 쿠키 캐시가 아니라 DB의 최신 역할·상태로 판단한다 (역할 변경·초기화가 바로 반영되게)
  const session = await getAuthoritativeSessionFromCtx(ctx);
  if (!session) return false;
  // 플러그인의 역할 확인은 쿠키 캐시 값을 쓸 수 있어, 역할을 내린 직후에도 막히도록 DB 값으로 한 번 더 본다
  if (session.user.role !== "owner") {
    throw new APIError("FORBIDDEN", { message: "최고 관리자만 할 수 있어요." });
  }
  if (session.user.mustChangePassword) {
    throw new APIError("FORBIDDEN", { message: "비밀번호를 먼저 바꿔야 해요." });
  }
  // 관리 API로 자기 자신은 못 바꾼다 (내 비밀번호는 /change-password).
  // 그래서 작업하는 owner 본인이 항상 남아 'owner 최소 1명'이 지켜진다
  const targetId = (ctx.body as { userId?: unknown } | undefined)?.userId;
  if (targetId !== undefined && String(targetId) === session.user.id) {
    throw new APIError("FORBIDDEN", { message: "자기 계정은 여기서 바꿀 수 없어요." });
  }
  return true;
}

// 닉네임(user.name)을 정하거나 바꾸는 모든 경로에서 규칙과 중복을 확인한다.
// 서버 액션에서만 확인하면 /api/auth/update-user 를 직접 불러 다른 관리자와 같은 닉네임을 쓸 수 있다
async function checkNickname(ctx: HookCtx) {
  const body = (ctx.body ?? {}) as { name?: unknown; userId?: unknown; data?: { name?: unknown } };
  let name: unknown;
  let exceptUserId: string | undefined;
  if (ctx.path === "/update-user") {
    // 본인 정보 수정: 나를 빼고 비교. 로그인이 안 됐으면 Better Auth가 401로 거절하니 여기선 보지 않는다
    const session = await getSessionFromCtx(ctx);
    if (!session) return;
    name = body.name;
    exceptUserId = session.user.id;
  } else if (ctx.path === "/admin/create-user") {
    name = body.name;
  } else if (ctx.path === "/admin/update-user") {
    name = body.data?.name;
    exceptUserId = body.userId === undefined ? undefined : String(body.userId);
  } else {
    return;
  }
  if (name === undefined) return;

  const parsed = parseNickname(String(name));
  // 앞뒤 공백·연속 공백이 있으면 겹침 판단이 흐려지므로 정리된 값만 받는다 (화면의 폼은 정리해서 보낸다)
  if (!parsed.ok || parsed.name !== name) {
    throw new APIError("BAD_REQUEST", { message: parsed.ok ? "닉네임 앞뒤나 가운데의 여러 칸 공백을 지워 주세요." : parsed.message });
  }
  if (await isNicknameTaken(parsed.name, exceptUserId)) throw new APIError("BAD_REQUEST", { message: NICKNAME_TAKEN });
}

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
      // 관리 API(/admin/*) 공통 규칙과 닉네임 규칙. 서버 액션·HTTP 직접 호출 모두 여기를 지난다
      // 권한을 먼저 보고 나서 닉네임을 본다 (권한 없는 사람이 '이미 쓰는 닉네임'인지 알아내지 못하게)
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path.startsWith("/admin/") && !(await checkAdminApi(ctx))) return;
        await checkNickname(ctx);
      }),
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
