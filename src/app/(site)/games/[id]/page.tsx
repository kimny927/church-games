import Link from "next/link";
import { notFound } from "next/navigation";
import GameInfo from "@/components/GameInfo";
import { getPublishedGame } from "@/lib/db";

// 요청마다 DB에서 읽는다(SSR). 승인되지 않은 게임은 조회되지 않아 404가 된다.
export const dynamic = "force-dynamic";

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getPublishedGame(id);
  if (!game) notFound();

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

      <GameInfo game={game} className="mt-6" />

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
