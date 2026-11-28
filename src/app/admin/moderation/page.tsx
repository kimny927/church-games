import NavLink from "@/components/ui/NavLink";
import Toast from "@/components/ui/Toast";
import { requireAdmin } from "@/lib/admin";
import { countGamesByStatus, getGamesByStatus } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { REVIEW_STATUS_LABEL, type ReviewStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const TABS: ReviewStatus[] = ["pending", "approved", "rejected"];

// 세부 페이지에서 승인·거절·대기로 되돌리기에 성공하면 ?done=approved|rejected|pending 으로 돌아온다
const DONE_MESSAGE: Record<string, string> = {
  approved: "승인되었습니다.",
  rejected: "거절되었습니다.",
  pending: "대기로 되돌렸습니다.",
};

// 심의 목록: 대상 게임을 보여 주기만 한다. 승인·거절은 세부 페이지(/admin/moderation/[id])에서
export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ status?: string; done?: string }> }) {
  await requireAdmin();
  const { status: param, done } = await searchParams;
  const status = TABS.find((t) => t === param) ?? "pending";
  const [games, counts] = await Promise.all([getGamesByStatus(status), countGamesByStatus()]);

  return (
    <div className="space-y-4">
      <NavLink href="/admin" className="text-sm text-blue-600">← 관리자 홈</NavLink>
      <h1 className="text-xl font-bold">게임 심의</h1>
      <nav className="flex gap-2 text-sm">
        {TABS.map((t) => (
          <NavLink
            key={t}
            href={`/admin/moderation?status=${t}`}
            aria-current={t === status ? "page" : undefined}
            className={`rounded-full border px-3 py-1 ${t === status ? "border-blue-600 bg-blue-600 text-white" : ""}`}
          >
            {REVIEW_STATUS_LABEL[t]} {counts[t]}
          </NavLink>
        ))}
      </nav>

      {games.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{REVIEW_STATUS_LABEL[status]} 상태인 게임이 없어요.</p>
      ) : (
        <ul className="divide-y rounded border">
          {games.map((g) => (
            <li key={g.id}>
              <NavLink href={`/admin/moderation/${g.id}`} className="block p-3 hover:bg-gray-50">
                <span className="block font-medium break-all">{g.name}</span>
                <span className="block text-xs text-gray-500">
                  {g.sourceType ?? "소스 없음"} · 등록 {formatDateTime(g.createdAt)}
                  {g.creator && ` · ${g.creator}`}
                  {g.autoScraped && " · 자동 수집"}
                </span>
                {status !== "pending" && (
                  <span className="block text-xs text-gray-500">
                    {REVIEW_STATUS_LABEL[status]}: {g.reviewer ?? "알 수 없음"}
                    {g.reviewedAt && ` · ${formatDateTime(g.reviewedAt)}`}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      )}

      <Toast message={done ? DONE_MESSAGE[done] : undefined} clearParam="done" />
    </div>
  );
}
