import Link from "next/link";
import { notFound } from "next/navigation";
import { getGame, sampleGames } from "@/lib/sample-games";

export function generateStaticParams() {
  return sampleGames.map((g) => ({ id: g.id }));
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

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
    <article>
      <Link href="/" className="text-sm text-blue-600">← 목록으로</Link>
      <h1 className="mt-3 text-2xl font-bold">{game.name}</h1>
      <div className="mt-2 flex flex-wrap gap-1">
        {game.tags.map((t) => (
          <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">#{t}</span>
        ))}
      </div>
      <p className="mt-4 leading-relaxed text-gray-800">{game.summary}</p>

      <dl className="mt-6 grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-semibold text-gray-600">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <a
        href={game.link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
      >
        원본 보러 가기 ({game.sourceType}) ↗
      </a>

      <section className="mt-10 rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
        💬 팁 댓글과 후기는 로그인 기능과 함께 추가될 예정이에요.
      </section>
    </article>
  );
}
