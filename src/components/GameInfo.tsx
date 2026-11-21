import type { Game } from "@/lib/types";

// 게임 세부 정보 표. 사용자 상세 페이지와 관리자 심의 카드가 같이 써서 보여 주는 항목이 어긋나지 않게 한다
// showEmpty: 관리자는 비어 있는 칸도 '—'로 봐야 무엇이 빠졌는지 안다
export default function GameInfo({ game, showEmpty = false, className = "" }: { game: Game; showEmpty?: boolean; className?: string }) {
  const rows: [string, string | undefined][] = [
    ["관련 말씀", game.verse],
    ["게임 유형", game.gameTypes.join(", ")],
    ["대상 나이", game.ages.join(", ")],
    ["소요 시간", game.duration],
    ["인원", game.groupSize],
    ["예산", game.budget],
    ["준비물", game.supplies],
  ];

  return (
    <dl className={`grid grid-cols-[6rem_1fr] gap-y-2 text-sm ${className}`}>
      {rows.filter(([, v]) => v || showEmpty).map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-semibold text-gray-600">{k}</dt>
          <dd className={v ? "" : "text-gray-400"}>{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
