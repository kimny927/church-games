import GameBrowser from "@/components/GameBrowser";
import { getPublishedGames } from "@/lib/db";

// 요청마다 DB에서 읽는다(SSR). 빼면 빌드 때 DB를 호출해서 DATABASE_URL 없는 CI가 실패하고, 데이터도 빌드 시점에 고정된다.
export const dynamic = "force-dynamic";

export default async function Home() {
  const games = (await getPublishedGames()).filter((g) => g.kind === "외부 링크");

  return (
    <div>
      <h1 className="text-2xl font-bold">수련회 게임 찾기</h1>
      <p className="mt-1 text-gray-600">온라인에 공유된 교회 게임을 골라 소개합니다.</p>
      <div className="mt-6">
        {games.length > 0 ? (
          <GameBrowser games={games} />
        ) : (
          <p className="mt-8 text-center text-gray-500">아직 소개할 게임이 없어요. 곧 채워질 예정이에요.</p>
        )}
      </div>
    </div>
  );
}
