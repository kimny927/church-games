// 수집 전용 Worker (church-games-collect). cron이 하루 1번 깨운다. 공개 주소는 없다 (workers_dev: false)
// 검색 → 코드로 거르기 → 안 본 글만 → AI 판단·초안 → 대기로 저장. 사람이 심의해야 공개된다
// 로컬: npm run collect:dev 후 curl http://localhost:8787/__scheduled  (workers/collect/.dev.vars 필요)
import { BudgetExceeded, SubrequestBudget } from "./budget";
import { findCandidates } from "./candidates";
import { createAskModel, draftGames, MODEL } from "./draft";
import { createStore, StoreError, type SeenRecord } from "./store";

export type Env = {
  KAKAO_REST_API_KEY: string;
  YOUTUBE_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  COLLECT_DATABASE_URL: string; // 수집 전용 계정(collector)의 연결 문자열
};

// workers-types를 따로 설치하지 않으려고 쓰는 부분만 적는다
type ScheduledContext = { waitUntil(p: Promise<unknown>): void };

export type CollectSummary = {
  searched: number;
  found: number; // 코드 거르기 + 안 본 글을 지난 후보
  droppedByCode: Record<string, number>;
  aiCalls: number;
  drafts: number;
  saved: number;
  aiDropped: Record<string, number>;
  tokens: { input: number; output: number };
  subrequests: number;
  stopped?: string;
  errors: string[];
};

export async function runCollect(env: Env): Promise<CollectSummary> {
  const budget = new SubrequestBudget();
  const store = createStore(env.COLLECT_DATABASE_URL);

  const found = await findCandidates(env, budget, { filterUnseen: (links) => store.unseen(links) });
  const ai = await draftGames(found.candidates, createAskModel(env.ANTHROPIC_API_KEY, budget), budget);

  // AI가 판단한 글만 '본 글'로 남긴다 (호출 오류는 다음 날 다시)
  const seen: SeenRecord[] = [
    ...ai.drafts.map((d) => ({ link: d.link, result: "초안" })),
    ...ai.dropped.filter((d) => !d.error).map((d) => ({ link: d.candidate.link, result: d.reason })),
  ];
  const saved = seen.length ? await store.record(ai.drafts, seen, MODEL) : 0;

  return {
    searched: found.searched,
    found: found.candidates.length,
    droppedByCode: countBy(found.dropped.map((d) => d.reason)),
    aiCalls: ai.calls,
    drafts: ai.drafts.length,
    saved,
    aiDropped: countBy(ai.dropped.map((d) => d.reason)),
    tokens: ai.usage,
    subrequests: budget.used,
    stopped: ai.stopped,
    errors: found.errors,
  };
}

function countBy(list: string[]) {
  const out: Record<string, number> = {};
  for (const k of list) out[k] = (out[k] ?? 0) + 1;
  return out;
}

const worker = {
  async scheduled(_controller: unknown, env: Env, ctx: ScheduledContext) {
    ctx.waitUntil(
      runCollect(env).then(
        // 로그에는 개수·호출 수만 (글 제목·링크·비밀값은 남기지 않는다)
        (summary) => console.log(JSON.stringify({ collect: "ok", ...summary })),
        (e) => {
          const known = e instanceof StoreError || e instanceof BudgetExceeded;
          console.error(JSON.stringify({ collect: "failed", error: known ? e.message : e instanceof Error ? e.name : "알 수 없는 오류" }));
          throw e; // 대시보드에 실패로 보이게
        },
      ),
    );
  },
};

export default worker;
