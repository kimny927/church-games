// 관리자 게임 등록·수정 폼 값 확인. 서버 액션에서 부른다.
// 브라우저의 required·select는 우회할 수 있으므로 선택지와 길이를 서버에서 다시 본다
import { FILTERS, SOURCE_TYPES, type GameInput } from "./types";

type Result = { ok: true; input: GameInput } | { ok: false; message: string };

const MAX = { name: 100, link: 500, summary: 1000, verse: 100, supplies: 300 };

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

// 고른 값이 목록 안에 있을 때만 그 값을 돌려준다
function pick<T extends string>(form: FormData, key: string, options: readonly T[]): T | undefined {
  const v = text(form, key);
  return options.includes(v as T) ? (v as T) : undefined;
}

// 체크박스 여러 개. 목록에 없는 값이 하나라도 있으면 undefined
function pickMany<T extends string>(form: FormData, key: string, options: readonly T[]): T[] | undefined {
  const values = form.getAll(key).map(String);
  return values.every((v) => options.includes(v as T)) ? [...new Set(values)] as T[] : undefined;
}

export function isHttpUrl(v: string) {
  try {
    const url = new URL(v);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseGameForm(form: FormData): Result {
  const fail = (message: string): Result => ({ ok: false, message });

  const name = text(form, "name");
  const link = text(form, "link");
  const summary = text(form, "summary");
  const verse = text(form, "verse");
  const supplies = text(form, "supplies");

  if (!link) return fail("원본 링크를 넣어 주세요.");
  if (!isHttpUrl(link) || link.length > MAX.link) return fail("원본 링크는 http:// 또는 https:// 로 시작하는 주소여야 해요.");
  if (!name) return fail("게임 이름을 넣어 주세요.");
  if (name.length > MAX.name) return fail(`게임 이름은 ${MAX.name}자까지 쓸 수 있어요.`);
  if (!summary) return fail("소개글을 넣어 주세요.");
  if (summary.length > MAX.summary) return fail(`소개글은 ${MAX.summary}자까지 쓸 수 있어요.`);
  if (verse.length > MAX.verse) return fail(`관련 말씀은 ${MAX.verse}자까지 쓸 수 있어요.`);
  if (supplies.length > MAX.supplies) return fail(`준비물은 ${MAX.supplies}자까지 쓸 수 있어요.`);

  const sourceType = pick(form, "sourceType", SOURCE_TYPES);
  const budget = pick(form, "budget", FILTERS.budget);
  const duration = pick(form, "duration", FILTERS.duration);
  const groupSize = pick(form, "groupSize", FILTERS.groupSize);
  if (!sourceType) return fail("소스 종류를 골라 주세요.");
  if (!budget) return fail("예산을 골라 주세요.");
  if (!duration) return fail("소요 시간을 골라 주세요.");
  if (!groupSize) return fail("인원을 골라 주세요.");

  const tags = pickMany(form, "tags", FILTERS.tags);
  const gameTypes = pickMany(form, "gameTypes", FILTERS.gameTypes);
  const ages = pickMany(form, "ages", FILTERS.ages);
  if (!tags || !gameTypes || !ages) return fail("목록에 없는 선택지가 있어요. 화면을 새로 고쳐 다시 골라 주세요.");

  return {
    ok: true,
    input: {
      name, link, summary, sourceType, budget, duration, groupSize, tags, gameTypes, ages,
      verse: verse || undefined,
      supplies: supplies || undefined,
    },
  };
}
