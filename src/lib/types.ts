// 게임 한 개의 정보. 노션 게임 데이터베이스의 항목과 같은 구조예요.
export type SourceType = "블로그" | "유튜브" | "인스타그램" | "기타";

// 나중에 자체 판매(2단계), 사용자 판매(3단계) 게임도 같은 목록에 넣기 위한 구분
export type GameKind = "외부 링크" | "자체 판매" | "사용자 판매";

export type Game = {
  id: string;
  name: string;
  kind: GameKind;
  summary: string; // 큐레이터 소개글
  link: string;
  sourceType: SourceType;
  tags: string[];
  verse?: string; // 관련 말씀
  gameTypes: ("두뇌형" | "신체형")[];
  budget: "무료" | "1만원 이하" | "1~5만원" | "5만원 이상";
  ages: string[];
  duration: "10분 이내" | "10~30분" | "30분~1시간" | "1시간 이상";
  groupSize: "소그룹(~10명)" | "중그룹(10~30명)" | "대그룹(30명 이상)";
  supplies?: string; // 준비물
};

export const FILTERS = {
  gameTypes: ["두뇌형", "신체형"],
  budget: ["무료", "1만원 이하", "1~5만원", "5만원 이상"],
  ages: ["유아·유치부", "초등부", "중고등부", "청년부", "장년부"],
  duration: ["10분 이내", "10~30분", "30분~1시간", "1시간 이상"],
  groupSize: ["소그룹(~10명)", "중그룹(10~30명)", "대그룹(30명 이상)"],
  tags: ["아이스브레이킹", "팀 대항", "레크리에이션", "말씀 묵상", "실내", "야외"],
} as const;
