// 게임 한 개의 정보. 노션 게임 데이터베이스의 항목과 같은 구조예요.
// 값을 바꾸면 neon/schema.sql 의 source_type 제약도 같이 바꾼다
export const SOURCE_TYPES = ["블로그", "유튜브", "인스타그램", "기타"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

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
  thumbnailUrl?: string; // 원본의 대표 이미지 (외부 주소라 만료·차단될 수 있어 화면에서 깨지면 기본 모양)
};

export const FILTERS = {
  gameTypes: ["두뇌형", "신체형"],
  budget: ["무료", "1만원 이하", "1~5만원", "5만원 이상"],
  ages: ["유아·유치부", "초등부", "중고등부", "청년부", "장년부"],
  duration: ["10분 이내", "10~30분", "30분~1시간", "1시간 이상"],
  groupSize: ["소그룹(~10명)", "중그룹(10~30명)", "대그룹(30명 이상)"],
  tags: ["아이스브레이킹", "팀 대항", "레크리에이션", "말씀 묵상", "실내", "야외"],
} as const;

// 심의 상태. DB 값은 영어, 화면에는 한국어로 (docs/decisions.md 2026-11-15)
export type ReviewStatus = "pending" | "approved" | "rejected";

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "거절",
};

// 관리자 심의 화면용: 사용자 화면에는 없는 심의 칼럼까지
export type ModerationGame = Game & {
  status: ReviewStatus;
  autoScraped: boolean;
  creator?: string; // 등록한 관리자 닉네임
  creatorEmail?: string;
  reviewer?: string; // 심의한 관리자 닉네임 (계정이 없으면 approved_by 원래 값)
  reviewerEmail?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: Date;
  collectMeta?: CollectMeta; // 자동 수집 게임만
};

// 자동 수집 게임의 심의 참고 정보 (games.collect_meta, jsonb). 수집 Worker가 저장하고 심의 세부가 읽는다.
// snippet은 검색 API가 준 원문 요약이라 믿을 수 없는 글이다. 화면에는 텍스트로만 보여 준다
export type CollectMeta = {
  snippet: string;
  keyword: string; // 찾은 검색어
  confidence: number; // AI 확신도 0~1
  author?: string;
  publishedAt?: string; // 글 날짜 (ISO)
  model: string;
  // AI가 쓴 소개글 원래 문구 (추천 문구). summary는 관리자가 고칠 수 있어서 따로 남긴다. 2026-11-28 전 수집분엔 없음
  aiSummary?: string;
};

// 관리자 등록·수정 폼에서 받는 값. id(자동 생성)와 kind(지금은 '외부 링크' 고정)는 서버가 정한다
export type GameInput = Omit<Game, "id" | "kind">;
