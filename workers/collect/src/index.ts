// 수집 전용 Worker (church-games-collect). cron이 하루 1번 깨운다. 공개 주소는 없다 (workers_dev: false)
// 켜져 있는지 확인(관리자 화면 /admin/collect) → 검색 → 코드로 거르기 → 안 본 글만 → AI 판단·초안 → 대기로 저장 → 실행 기록.
// 사람이 심의해야 공개된다
// 로컬: npm run collect:dev 후 curl http://localhost:8787/__scheduled  (workers/collect/.dev.vars 필요)
import { BudgetExceeded, SubrequestBudget } from "./budget";
import { findCandidates } from "./candidates";
import { createAskModel, draftGames, MODEL } from "./draft";
import { createStore, StoreError, type SeenRecord, type Store } from "./store";

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

// 수집 한 번 (켜져 있는지는 runScheduled가 먼저 확인한다)
export async function runCollect(env: Env, store: Store = createStore(env.COLLECT_DATABASE_URL)): Promise<CollectSummary> {
  const budget = new SubrequestBudget();

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

export type ScheduledResult =
  | { status: "off" }
  | { status: "ok"; summary: CollectSummary }
  | { status: "failed"; error: string };

// cron 한 번: 켜져 있는지 확인 → (켜져 있으면) 수집 → 결과 기록.
// 설정을 못 읽으면 꺼진 것으로 본다 (fail-closed: 검색·AI를 부르지 않음).
// 기록이 실패해도 원래 결과는 그대로 돌려준다 (로그에는 남음)
export async function runScheduled(
  env: Env,
  store: Pick<Store, "enabled" | "logRun"> = createStore(env.COLLECT_DATABASE_URL),
  collect: (env: Env) => Promise<CollectSummary> = runCollect, // 테스트에서 가짜로 바꾼다
): Promise<ScheduledResult> {
  let result: ScheduledResult;
  let on = false;
  try {
    on = await store.enabled();
  } catch (e) {
    result = { status: "failed", error: errorKind(e) };
    await store.logRun("failed", { error: result.error }).catch(() => {});
    return result;
  }
  if (!on) {
    result = { status: "off" };
    await store.logRun("off", null).catch(() => {});
    return result;
  }
  try {
    const summary = await collect(env);
    result = { status: "ok", summary };
    await store.logRun("ok", runRecord(summary)).catch(() => {});
  } catch (e) {
    result = { status: "failed", error: errorKind(e) };
    await store.logRun("failed", { error: result.error }).catch(() => {});
  }
  return result;
}

// 관리자 화면에 보여 줄 만큼만 (요약 4KB 제한 안에서). 오류는 우리가 만든 메시지만 들어 있다
function runRecord(s: CollectSummary) {
  return {
    searched: s.searched,
    found: s.found,
    aiCalls: s.aiCalls,
    drafts: s.drafts,
    saved: s.saved,
    subrequests: s.subrequests,
    tokens: s.tokens,
    stopped: s.stopped ? s.stopped.slice(0, 100) : undefined,
    errors: s.errors.slice(0, 3).map((m) => m.slice(0, 100)),
  };
}

// 우리가 만든 오류는 메시지, 그 밖은 종류 이름만 (요청 주소·응답 본문·비밀값이 섞이지 않게)
function errorKind(e: unknown) {
  const known = e instanceof StoreError || e instanceof BudgetExceeded;
  return known ? (e as Error).message : e instanceof Error ? e.name : "알 수 없는 오류";
}

function countBy(list: string[]) {
  const out: Record<string, number> = {};
  for (const k of list) out[k] = (out[k] ?? 0) + 1;
  return out;
}

const worker = {
  async scheduled(_controller: unknown, env: Env, ctx: ScheduledContext) {
    ctx.waitUntil(
      runScheduled(env).then((r) => {
        // 로그에는 개수·호출 수만 (글 제목·링크·비밀값은 남기지 않는다)
        if (r.status === "ok") console.log(JSON.stringify({ collect: "ok", ...r.summary }));
        else if (r.status === "off") console.log(JSON.stringify({ collect: "off" }));
        else {
          console.error(JSON.stringify({ collect: "failed", error: r.error }));
          throw new Error(r.error); // 대시보드에 실패로 보이게
        }
      }),
    );
  },
};

export default worker;
