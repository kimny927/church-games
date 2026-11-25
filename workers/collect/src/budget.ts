// 외부 호출 예산. Workers 무료 플랜은 실행 1번에 외부 호출 50개까지라, 넘어서 전체가 실패하기 전에 우리가 먼저 멈춘다.
// 검색·AI·썸네일 호출은 모두 이 fetch를 지나게 해서 센다
export const SUBREQUEST_LIMIT = 40; // 한도 50에서 DB 저장 몫을 남긴다
const TIMEOUT_MS = 8000;

export class BudgetExceeded extends Error {
  constructor() {
    super("외부 호출 예산을 다 썼어요");
  }
}

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export class SubrequestBudget {
  used = 0;
  constructor(readonly limit = SUBREQUEST_LIMIT) {}

  get left() {
    return this.limit - this.used;
  }

  fetch: Fetcher = (url, init) => {
    if (this.used >= this.limit) return Promise.reject(new BudgetExceeded());
    this.used++;
    return fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), ...init });
  };
}
