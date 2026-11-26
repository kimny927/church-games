// AI가 쓴 초안을 저장하기 전에 코드로 다시 검사한다.
// 글 안의 주입으로 AI가 조작되면 소개글에 광고 링크·연락처·이단 이름을 넣을 수 있다. 그런 출력은 고치지 않고 버린다
import { findBlocked, looksLikeInjection } from "./rules";

export const SUMMARY_LIMIT = { min: 20, max: 200 };
export const SUPPLIES_MAX = 100;

// 연락처·링크 흔적. 소개글·준비물에는 필요 없는 것들이라 넓게 잡는다
const CONTACT_PATTERNS: [string, RegExp][] = [
  ["링크", /https?:|www\.|[a-z0-9가-힣-]+\.(com|net|org|kr|io|ly|me|co|site|shop|xyz|link|app)\b/i],
  ["전화번호", /0\d{1,2}[\s.-]?\d{3,4}[\s.-]?\d{4}/],
  ["이메일", /[\w.+-]+@[\w-]+\.[\w.]+/],
  ["오픈채팅", /오픈\s*채팅|open\.?kakao|카톡\s*(아이디|id)|카카오톡\s*(아이디|id)/i],
  ["아이디", /(^|[^\w])@[a-z0-9_.]{2,}/i],
];

export type OutputCheck = { ok: true } | { ok: false; reason: string };

export function checkOutput(out: { summary: string; supplies?: string | null }): OutputCheck {
  const summary = out.summary.trim();
  const supplies = out.supplies?.trim() ?? "";
  const length = Array.from(summary).length;
  if (length < SUMMARY_LIMIT.min) return { ok: false, reason: "소개글이 너무 짧음" };
  if (length > SUMMARY_LIMIT.max) return { ok: false, reason: "소개글이 너무 김" };
  if (Array.from(supplies).length > SUPPLIES_MAX) return { ok: false, reason: "준비물이 너무 김" };

  const text = `${summary} ${supplies}`;
  for (const [label, re] of CONTACT_PATTERNS) if (re.test(text)) return { ok: false, reason: `출력에 ${label}` };
  const blocked = findBlocked(text);
  if (blocked) return { ok: false, reason: `출력에 ${blocked}` };
  if (looksLikeInjection(text)) return { ok: false, reason: "출력에 주입 흔적" };
  return { ok: true };
}
