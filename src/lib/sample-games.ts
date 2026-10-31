import type { Game } from "./types";

// 임시 샘플 데이터예요. Supabase를 연결하면 실제 데이터로 바뀝니다.
// 링크는 예시 주소라 실제 게임 링크로 교체해야 해요.
export const sampleGames: Game[] = [
  {
    id: "bible-character-quiz",
    name: "성경 인물 스무고개",
    kind: "외부 링크",
    summary: "한 사람이 성경 인물을 떠올리고, 나머지가 예/아니오 질문 20개로 맞히는 게임. 준비물 없이 바로 할 수 있어요.",
    link: "https://example.com/bible-20-questions",
    sourceType: "블로그",
    tags: ["아이스브레이킹", "말씀 묵상", "실내"],
    verse: "히브리서 11장",
    gameTypes: ["두뇌형"],
    budget: "무료",
    ages: ["초등부", "중고등부", "청년부"],
    duration: "10~30분",
    groupSize: "소그룹(~10명)",
  },
  {
    id: "jericho-relay",
    name: "여리고성 무너뜨리기 릴레이",
    kind: "외부 링크",
    summary: "종이컵으로 성을 쌓고 팀별로 공을 던져 무너뜨리는 팀 대항 게임. 여호수아 6장 말씀과 연결해 진행해요.",
    link: "https://example.com/jericho-relay",
    sourceType: "유튜브",
    tags: ["팀 대항", "레크리에이션", "실내"],
    verse: "여호수아 6장",
    gameTypes: ["신체형"],
    budget: "1만원 이하",
    ages: ["초등부", "중고등부", "청년부"],
    duration: "30분~1시간",
    groupSize: "대그룹(30명 이상)",
    supplies: "종이컵 100개, 작은 공 4개",
  },
  {
    id: "verse-puzzle",
    name: "말씀 구절 퍼즐 맞추기",
    kind: "외부 링크",
    summary: "말씀 구절을 단어 카드로 잘라 섞어두고 팀별로 먼저 순서대로 맞추는 게임.",
    link: "https://example.com/verse-puzzle",
    sourceType: "인스타그램",
    tags: ["팀 대항", "말씀 묵상", "실내"],
    verse: "시편 23편",
    gameTypes: ["두뇌형"],
    budget: "무료",
    ages: ["중고등부", "청년부", "장년부"],
    duration: "10분 이내",
    groupSize: "중그룹(10~30명)",
    supplies: "인쇄한 단어 카드",
  },
];

export function getGame(id: string) {
  return sampleGames.find((g) => g.id === id);
}
