import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // 이미 로그인했으면 관리자 홈으로
  if (await getAuth().api.getSession({ headers: await headers() })) redirect("/admin");
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">관리자 로그인</h1>
      <LoginForm />
    </div>
  );
}
