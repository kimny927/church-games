import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import NavLink from "@/components/ui/NavLink";
import SubmitButton from "@/components/ui/SubmitButton";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { owner: "최고 관리자", admin: "관리자" };

async function logout() {
  "use server";
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/admin/login");
}

export default async function AdminHome() {
  const { user } = await requireAdmin();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">관리자 홈</h1>
      <p className="text-sm text-gray-600">
        {user.email} · {ROLE_LABEL[user.role ?? ""] ?? user.role}
      </p>
      {user.role === "owner" && (
        <NavLink href="/admin/admins" className="block rounded border p-3 font-medium">관리자 관리 →</NavLink>
      )}
      <div className="flex gap-4 text-sm">
        <NavLink href="/admin/password" className="text-blue-600">비밀번호 변경</NavLink>
        <form action={logout}>
          <SubmitButton pendingText="로그아웃 중…" className="text-blue-600">로그아웃</SubmitButton>
        </form>
      </div>
    </div>
  );
}
