import PasswordForm from "@/components/admin/PasswordForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function PasswordPage() {
  const { user } = await requireAdmin({ allowMustChangePassword: true });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">비밀번호 변경</h1>
      {user.mustChangePassword && (
        <p className="rounded bg-yellow-50 p-3 text-sm">임시 비밀번호로 로그인했어요. 계속하려면 새 비밀번호로 바꿔 주세요.</p>
      )}
      <PasswordForm />
    </div>
  );
}
