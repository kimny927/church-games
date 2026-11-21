import { notFound } from "next/navigation";
import GameForm from "@/components/admin/GameForm";
import NavLink from "@/components/ui/NavLink";
import { requireAdmin } from "@/lib/admin";
import { getGameForAdmin } from "@/lib/db";
import { REVIEW_STATUS_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const game = await getGameForAdmin(id);
  if (!game) notFound();

  return (
    <div className="space-y-4">
      <NavLink href={`/admin/moderation?status=${game.status}`} className="text-sm text-blue-600">← 게임 심의</NavLink>
      <h1 className="text-xl font-bold">게임 수정</h1>
      <p className="text-sm text-gray-600">
        지금 상태: {REVIEW_STATUS_LABEL[game.status]}.
        {game.status === "approved" ? " 저장하면 사용자 페이지에 바로 반영돼요." : " 수정해도 상태는 바뀌지 않아요."}
      </p>
      <GameForm game={game} />
    </div>
  );
}
