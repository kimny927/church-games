import GameForm from "@/components/admin/GameForm";
import NavLink from "@/components/ui/NavLink";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <NavLink href="/admin" className="text-sm text-blue-600">← 관리자 홈</NavLink>
      <h1 className="text-xl font-bold">게임 등록</h1>
      <p className="text-sm text-gray-600">등록하면 심의 대기로 들어가요. 심의 화면에서 승인해야 사용자 페이지에 보여요.</p>
      <GameForm />
    </div>
  );
}
