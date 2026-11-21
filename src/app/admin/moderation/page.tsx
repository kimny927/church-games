import ModerationList from "@/components/admin/ModerationList";
import NavLink from "@/components/ui/NavLink";
import { requireAdmin } from "@/lib/admin";
import { countGamesByStatus, getGamesByStatus } from "@/lib/db";
import { REVIEW_STATUS_LABEL, type ReviewStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const TABS: ReviewStatus[] = ["pending", "approved", "rejected"];

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  // 보기는 쿠키 캐시로 충분하다. 승인·거절은 actions.ts에서 DB로 다시 확인한다
  await requireAdmin();
  const { status: param } = await searchParams;
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
      <ModerationList games={games} emptyText={`${REVIEW_STATUS_LABEL[status]} 상태인 게임이 없어요.`} />
    </div>
  );
}
