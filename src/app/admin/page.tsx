import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import NavLink from "@/components/ui/NavLink";
import SubmitButton from "@/components/ui/SubmitButton";
import { getAuth } from "@/lib/auth";
import { countGamesByStatus, getCollectStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { owner: "최고 관리자", admin: "관리자" };

async function logout() {
  "use server";
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/admin/login");
}

export default async function AdminHome() {
  const { user } = await requireAdmin();
  // 자동 수집 상태는 표시만. 못 읽어도(SQL 실행 전·DB 오류) 홈은 그대로 보여 준다
  const [{ pending }, collect] = await Promise.all([countGamesByStatus(), getCollectStatus().catch(() => null)]);
  const collectLabel = collect?.ready ? (collect.enabled ? "켜짐" : "꺼짐") : undefined;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">관리자 홈</h1>
      <p className="text-sm text-gray-600">
        {user.name} · {ROLE_LABEL[user.role ?? ""] ?? user.role}
        <span className="block text-xs text-gray-400">{user.email}</span>
      </p>
      <NavLink href="/admin/games/new" className="block rounded border p-3 font-medium">게임 등록 +</NavLink>
      <NavLink href="/admin/moderation" className="block rounded border p-3 font-medium">
        게임 심의 →{pending > 0 && <span className="ml-2 rounded-full bg-red-600 px-2 text-sm text-white">대기 {pending}</span>}
      </NavLink>
      <NavLink href="/admin/collect" className="block rounded border p-3 font-medium">
        자동 수집 →
        {collectLabel && (
          <span className={`ml-2 rounded-full px-2 text-sm ${collect?.ready && collect.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
            {collectLabel}
          </span>
        )}
      </NavLink>
      {user.role === "owner" && (
        <NavLink href="/admin/admins" className="block rounded border p-3 font-medium">관리자 관리 →</NavLink>
      )}
      <div className="flex gap-4 text-sm">
        <NavLink href="/admin/profile" className="text-blue-600">내 정보</NavLink>
        <NavLink href="/admin/password" className="text-blue-600">비밀번호 변경</NavLink>
        <form action={logout}>
          <SubmitButton pendingText="로그아웃 중…" className="text-blue-600">로그아웃</SubmitButton>
        </form>
      </div>
    </div>
  );
}
