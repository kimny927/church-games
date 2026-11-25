// 무엇을 검색하고, AI에 보내기 전에 무엇을 거를지. 바꾸기 쉽게 한곳에 모은다
import { compact, spaced } from "./text";

// 매일 날짜순으로 검색해서 새 글을 본다. 키워드 하나가 외부 호출 1번이라 무료 플랜 한도(50)를 생각해 적게 둔다
export const SEARCH_KEYWORDS = {
  blog: ["교회 수련회 게임", "교회 레크레이션 게임", "주일학교 게임"],
  youtube: ["교회 수련회 게임", "교회 레크레이션"],
};
export const RESULTS_PER_KEYWORD = 20;
export const MAX_AGE_DAYS = 365; // 1년보다 오래된 글은 거른다

// 거르는 말. 놓친 좋은 글은 다음에 또 찾을 수 있지만, 통과한 이단 글은 피해가 크다. 그래서 넉넉하게 거른다.
// - compact: 붙여 쓴 글(compact)에서 찾는다. 띄어쓰기·기호로 쪼갠 우회('신.천.지')도 잡는다
// - spaced: 짧아서 다른 낱말 사이에 우연히 생기는 말('놀이 단체' → '놀이단체' 안의 '이단')은 낱말 시작에서만 찾는다
type Rule = { label: string; on: "compact" | "spaced"; re: RegExp };
const BLOCK_RULES: Rule[] = [
  // 이단·사이비
  { label: "이단", on: "compact", re: /신천지|새천지|안상홍|어머니하나님|세계복음선교|정명석|만민중앙|여호와의증인/ },
  { label: "이단", on: "compact", re: /통일교(?!육)|구원파(?!티)/ }, // '통일교육', '구원 파티'는 빼고
  { label: "이단", on: "compact", re: /기쁜소식선교회|박옥수|그라시아스합창단/ }, // IYF(국제청소년연합)의 모체
  { label: "이단", on: "spaced", re: /(^| )(이단|사이비)|(^| )(jms|iyf)( |$)/ },
  // 광고 글
  { label: "광고", on: "compact", re: /체험단|협찬|원고료|쿠팡파트너스|소정의수수료/ },
];

// 게임과 관련된 말이 하나도 없으면 AI에 보내지 않는다. 최신순 블로그 검색에는 펜션 광고·일기 같은 글이 많이 섞여서,
// 하루 10번뿐인 AI 호출을 아끼려고 코드로 먼저 거른다 (붙여 쓴 글에서 찾음)
const GAME_WORDS = /게임|레크|놀이|퀴즈|미션|팀빌딩|보물찾기|릴레이|챌린지|ox/;
export const looksLikeGame = (text: string) => GAME_WORDS.test(compact(text));

// 거를 말이 있으면 그 종류를 돌려준다
export function findBlocked(text: string): string | undefined {
  const forms = { compact: compact(text), spaced: spaced(text) };
  return BLOCK_RULES.find((r) => r.re.test(forms[r.on]))?.label;
}

// AI에게 지시하려는 흔적. 찾으면 AI에 보내지 않고 버린다.
// 버리기만 하는 단방향 검사라 조금 넓게 잡아도 손해가 작다 (좋은 글 하나를 놓칠 뿐)
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+|the\s+|any\s+)?(previous|prior|above)/,
  /(system|developer)\s*(prompt|message)/,
  /프롬프트/,
  /(이전|앞|위)(의|에서|에)?\s*(모든\s*)?(지시|명령|규칙)/,
  /(지시|명령)\S*\s*(무시|따르지)/,
  /(^|[^a-z])(ai|assistant|claude|gpt|llm)\s*(에게|한테|야|님)/,
  /(인공지능|어시스턴트|챗봇)\s*(에게|한테|야|님)/,
  /<\/?\s*(post|system|instructions?|user|assistant)\b/,
];

export function looksLikeInjection(text: string) {
  const t = text.normalize("NFKC").toLowerCase();
  return INJECTION_PATTERNS.some((re) => re.test(t));
}
