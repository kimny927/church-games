import GameBrowser from "@/components/GameBrowser";
import { sampleGames } from "@/lib/sample-games";

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-bold">수련회 게임 찾기</h1>
      <p className="mt-1 text-gray-600">온라인에 공유된 교회 게임을 골라 소개합니다.</p>
      <div className="mt-6">
        <GameBrowser games={sampleGames.filter((g) => g.kind === "외부 링크")} />
      </div>
    </div>
  );
}
