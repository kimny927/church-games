import { notFound } from "next/navigation";
import GameInfo from "@/components/GameInfo";
import ReviewPanel from "@/components/admin/ReviewPanel";
import Thumbnail from "@/components/ui/Thumbnail";
import NavLink from "@/components/ui/NavLink";
import { requireAdmin } from "@/lib/admin";
import { getGameForAdmin } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { REVIEW_STATUS_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

// 닉네임으로 보여 주고, 정확히 누구인지 확인할 수 있게 이메일을 작게 붙인다
function Person({ name, email }: { name: string; email?: string }) {
  return (
    <>
      {name}
      {email && <span className="text-xs text-gray-400"> ({email})</span>}
    </>
  );
}

// 심의 세부: 게임 한 개의 내용을 모두 보고 승인·거절한다 (목록은 보여 주기만)
export default async function ModerationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // 보기는 쿠키 캐시로 충분하다. 승인·거절은 actions.ts에서 DB로 다시 확인한다
  await requireAdmin();
  const { id } = await params;
  const game = await getGameForAdmin(id);
  if (!game) notFound();

  return (
    <div className="space-y-4">
      <NavLink href={`/admin/moderation?status=${game.status}`} className="text-sm text-blue-600">
        ← {REVIEW_STATUS_LABEL[game.status]} 목록
      </NavLink>

      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold break-all">{game.name}</h1>
          <NavLink href={`/admin/games/${game.id}/edit`} className="shrink-0 text-sm text-blue-600">수정</NavLink>
        </div>
        <p className="text-sm text-gray-600">
          <span className="rounded bg-gray-100 px-2 py-0.5">{REVIEW_STATUS_LABEL[game.status]}</span>
          {" "}{game.sourceType ?? "소스 없음"} · 등록 {formatDateTime(game.createdAt)}
          {game.creator && <> · <Person name={game.creator} email={game.creatorEmail} /></>}
          {game.autoScraped && <span className="ml-1 text-amber-700">· 자동 수집</span>}
        </p>
        {game.link && (
          <a href={game.link} target="_blank" rel="noopener noreferrer" className="block text-sm break-all text-blue-600">
            원본 보기 ↗ <span className="text-gray-500">{game.link}</span>
          </a>
        )}
      </div>

      {/* 사용자 화면과 달리 없어도 자리를 보여 준다 (승인 전에 빠진 것을 알 수 있게) */}
      <Thumbnail src={game.thumbnailUrl} fallback="썸네일 없음" className="aspect-video w-full max-w-sm rounded" />
      {game.summary && <p className="text-sm leading-relaxed whitespace-pre-line">{game.summary}</p>}
      {game.tags.length > 0 && <p className="text-xs text-gray-500">{game.tags.map((t) => `#${t}`).join(" ")}</p>}
      {/* 사용자 상세 페이지와 같은 항목. 빠진 칸도 '—'로 보여서 승인 전에 확인할 수 있게 */}
      <GameInfo game={game} showEmpty />

      {game.status !== "pending" && (
        <div className="rounded bg-gray-50 p-3 text-sm text-gray-700">
          <p>
            {REVIEW_STATUS_LABEL[game.status]}: {game.reviewer ? <Person name={game.reviewer} email={game.reviewerEmail} /> : "알 수 없음"}
            {game.reviewedAt && ` · ${formatDateTime(game.reviewedAt)}`}
          </p>
          {game.rejectionReason && <p className="mt-1">사유: {game.rejectionReason}</p>}
        </div>
      )}

      <hr />
      <ReviewPanel game={game} />
    </div>
  );
}
