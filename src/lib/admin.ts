// 관리자 페이지·서버 액션의 접근 확인. 서버에서만 import.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth, type AdminRole } from "./auth";

type Options = {
  role?: AdminRole; // 이 역할만 허용 (없으면 owner·admin 모두)
  allowMustChangePassword?: boolean; // 비밀번호 변경 화면 자신만 true
};

async function getSession(fresh: boolean) {
  return getAuth().api.getSession({
    headers: await headers(),
    query: fresh ? { disableCookieCache: true } : undefined,
  });
}

// 로그인한 관리자 세션을 돌려준다. 조건이 안 맞으면 알맞은 화면으로 보낸다.
export async function requireAdmin({ role, allowMustChangePassword = false }: Options = {}) {
  // owner 전용 작업(계정 관리)은 쿠키 캐시를 믿지 않고 DB에서 역할을 확인한다
  let session = await getSession(role === "owner");
  if (!session) redirect("/admin/login");

  // 비밀번호를 바꾼 직후에도 쿠키 캐시엔 예전 값이 남을 수 있어, 걸릴 때만 DB로 다시 본다
  if (session.user.mustChangePassword && !allowMustChangePassword) {
    session = await getSession(true);
    if (!session) redirect("/admin/login");
    if (session.user.mustChangePassword) redirect("/admin/password");
  }

  if (role && session.user.role !== role) redirect("/admin");
  return session;
}
