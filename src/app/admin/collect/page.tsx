import CollectToggle from "@/components/admin/CollectToggle";
import NavLink from "@/components/ui/NavLink";
import Toast from "@/components/ui/Toast";
import { requireAdmin } from "@/lib/admin";
import { getCollectStatus, type CollectRun } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const DONE_MESSAGE: Record<string, string> = { on: "자동 수집을 켰습니다", off: "자동 수집을 껐습니다" };

// 실행 기록 한 줄: 결과와 AI 호출 수만 (기록에는 제목·링크가 없다)
function runText(run: CollectRun) {
  const s = run.summary ?? {};
  if (run.status === "off") return "꺼져 있어 건너뜀";
  if (run.status === "failed") return `실패: ${String(s.error ?? "알 수 없음")}`;
  const parts = [`저장 ${Number(s.saved ?? 0)}개`, `AI 호출 ${Number(s.aiCalls ?? 0)}번`];
  if (Array.isArray(s.errors) && s.errors.length) parts.push(`검색 오류 ${s.errors.length}건`);
  return parts.join(" · ");
}

// 자동 수집 켜기/끄기와 최근 실행 (owner·admin)
export default async function CollectPage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  await requireAdmin();
  const { done } = await searchParams;
  const status = await getCollectStatus();

  return (
    <div className="space-y-4">
      <NavLink href="/admin" className="text-sm text-blue-600">← 관리자 홈</NavLink>
      <h1 className="text-xl font-bold">자동 수집</h1>

      {!status.ready ? (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
          아직 DB 준비 전이에요. Neon에 <code>neon/collect-settings.sql</code>을 실행하면 켜고 끌 수 있어요.
        </p>
      ) : (
        <>
          <section className="space-y-3 rounded border p-3">
            <p className="flex items-center gap-2 text-lg font-semibold">
              <span className={`size-3 rounded-full ${status.enabled ? "bg-green-500" : "bg-gray-300"}`} aria-hidden />
              {status.enabled ? "켜짐" : "꺼짐"}
            </p>
            <p className="text-sm text-gray-600">
              매일 06:00에 블로그·유튜브에서 게임을 찾아 하루 최대 3개를 심의 대기에 올려요. 자동으로 승인하지 않아요.
            </p>
            {status.updatedAt && (
              <p className="text-xs text-gray-500">
                마지막 변경: {status.updatedBy ?? "알 수 없음"} · {formatDateTime(status.updatedAt)}
              </p>
            )}
            <CollectToggle enabled={status.enabled} />
          </section>

          <section className="space-y-1 text-sm">
            <p>마지막 수집: {status.lastCollectedAt ? formatDateTime(status.lastCollectedAt) : "아직 없음"}</p>
            <NavLink href="/admin/moderation?status=pending" className="text-blue-600">
              심의 대기 중인 자동 수집 게임 {status.pendingAuto}개 →
            </NavLink>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">최근 실행</h2>
            {status.runs.length === 0 ? (
              <p className="text-sm text-gray-500">아직 실행 기록이 없어요.</p>
            ) : (
              <ul className="divide-y rounded border text-sm">
                {status.runs.map((run) => (
                  <li key={run.ranAt.toString()} className="flex flex-wrap justify-between gap-x-3 px-3 py-2">
                    <span className="text-gray-500">{formatDateTime(run.ranAt)}</span>
                    <span className={run.status === "failed" ? "text-red-600" : run.status === "off" ? "text-gray-500" : ""}>
                      {runText(run)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      <Toast message={done ? DONE_MESSAGE[done] : undefined} clearParam="done" />
    </div>
  );
}
