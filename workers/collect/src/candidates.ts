// 1단계: 검색 → 주소 맞추기 → 중복·이미 본 글·오래된 글·거를 말·주입 흔적·게임 말 없음 거르기.
// AI(유료·느림·공격받을 수 있음)에 보내기 전에 코드(무료·빠름)로 최대한 거른다.
// 순서도 코드가 정한다(출처를 번갈아, 최신순). AI의 확신도로 순위를 정하면 주입으로 자리를 차지할 수 있어서
import { BudgetExceeded, type SubrequestBudget } from "./budget";
import { findBlocked, looksLikeGame, looksLikeInjection, MAX_AGE_DAYS, SEARCH_KEYWORDS } from "./rules";
import { SearchError, searchDaumBlog, searchYouTube, type Candidate } from "./search";

export type CollectEnv = {
  KAKAO_REST_API_KEY: string;
  YOUTUBE_API_KEY: string;
};

export type DropReason = "중복" | "이미 본 글" | "오래된 글" | "이단" | "광고" | "주입 의심" | "게임 말 없음";
export type Dropped = { candidate: Candidate; reason: DropReason | string };

export type FindResult = {
  candidates: Candidate[];
  dropped: Dropped[];
  errors: string[]; // 키워드별 검색 실패 (하나가 실패해도 나머지는 계속)
  searched: number;
};

export async function findCandidates(
  env: CollectEnv,
  budget: SubrequestBudget,
  // filterUnseen: 거르기를 마친 후보 링크 중 아직 안 본 것만 돌려준다 (Worker는 DB에 1번 물어봄, dry-run은 없음)
  opts: { filterUnseen?: (links: string[]) => Promise<Set<string>>; now?: Date } = {},
): Promise<FindResult> {
  const searches = [
    ...SEARCH_KEYWORDS.blog.map((k) => () => searchDaumBlog(k, env.KAKAO_REST_API_KEY, budget.fetch)),
    ...SEARCH_KEYWORDS.youtube.map((k) => () => searchYouTube(k, env.YOUTUBE_API_KEY, budget.fetch)),
  ];
  const results = await Promise.allSettled(searches.map((run) => run()));

  const errors: string[] = [];
  const found: Candidate[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") found.push(...r.value);
    // 우리가 만든 오류만 메시지를 남긴다. 그 밖의 오류 메시지에는 요청 주소 같은 것이 섞일 수 있어서 종류만
    else if (r.reason instanceof SearchError || r.reason instanceof BudgetExceeded) errors.push(r.reason.message);
    else errors.push(`검색 실패 (${r.reason instanceof Error ? r.reason.name : "알 수 없는 오류"})`);
  }

  const minDate = new Date((opts.now ?? new Date()).getTime() - MAX_AGE_DAYS * 86_400_000).toISOString().slice(0, 10);
  const inRun = new Set<string>();
  const kept: Candidate[] = [];
  const dropped: Dropped[] = [];

  for (const c of found) {
    const reason: string | undefined = inRun.has(c.link)
      ? "중복"
      : c.publishedAt && c.publishedAt < minDate
        ? "오래된 글"
        : contentDropReason(c);
    inRun.add(c.link);
    if (reason) dropped.push({ candidate: c, reason });
    else kept.push(c);
  }

  // 이미 본 글은 코드 거르기를 마친 뒤 한 번에 묻는다 (물어볼 링크 수와 DB 호출을 줄이려고)
  let fresh = kept;
  if (opts.filterUnseen && kept.length) {
    const unseen = await opts.filterUnseen(kept.map((c) => c.link));
    fresh = kept.filter((c) => unseen.has(c.link));
    for (const c of kept) if (!unseen.has(c.link)) dropped.push({ candidate: c, reason: "이미 본 글" });
  }

  return { candidates: interleaveBySource(fresh), dropped, errors, searched: searches.length };
}

// 글 내용으로 거를 이유 (거를 말 → 주입 흔적 → 게임 말 없음 순서). 없으면 undefined
export function contentDropReason(c: Pick<Candidate, "title" | "snippet" | "author">): string | undefined {
  const text = `${c.title} ${c.snippet} ${c.author ?? ""}`;
  return findBlocked(text) ?? (looksLikeInjection(text) ? "주입 의심" : looksLikeGame(text) ? undefined : "게임 말 없음");
}

// 블로그·유튜브를 번갈아 놓는다. 각 출처 안에서는 최신순
function interleaveBySource(list: Candidate[]) {
  const byDate = (a: Candidate, b: Candidate) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
  const blog = list.filter((c) => c.sourceType === "블로그").sort(byDate);
  const youtube = list.filter((c) => c.sourceType === "유튜브").sort(byDate);
  const out: Candidate[] = [];
  for (let i = 0; i < Math.max(blog.length, youtube.length); i++) {
    if (blog[i]) out.push(blog[i]);
    if (youtube[i]) out.push(youtube[i]);
  }
  return out;
}
