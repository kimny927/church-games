// 자동 수집 1단계(검색 + 거르기)를 로컬에서 돌려 결과만 출력한다. DB에는 아무것도 쓰지 않는다.
// npm run collect:dry-run
// 필요한 값(.env.local): KAKAO_REST_API_KEY, YOUTUBE_API_KEY
import { SubrequestBudget } from "../workers/collect/src/budget";
import { findCandidates, type CollectEnv } from "../workers/collect/src/candidates";
import { clip } from "../workers/collect/src/text";

const KEYS = ["KAKAO_REST_API_KEY", "YOUTUBE_API_KEY"] as const;
const missing = KEYS.filter((k) => !process.env[k]);
if (missing.length) {
  // 값은 찍지 않고 이름만
  console.error(`.env.local에 없는 값: ${missing.join(", ")}`);
  process.exit(1);
}
const env = Object.fromEntries(KEYS.map((k) => [k, process.env[k]!])) as CollectEnv;

const budget = new SubrequestBudget();
const started = Date.now();
const { candidates, dropped, errors, searched } = await findCandidates(env, budget);

const row = (c: (typeof candidates)[number]) =>
  `  [${c.sourceType}] ${c.publishedAt ?? "날짜 없음"}  ${clip(c.title, 40)}\n      ${c.link}  (키워드: ${c.keyword})`;

console.log(`\n✅ AI에 보낼 후보 ${candidates.length}개 (이 순서로 보냄)`);
candidates.forEach((c) => console.log(row(c)));

const counts = new Map<string, number>();
for (const d of dropped) counts.set(d.reason, (counts.get(d.reason) ?? 0) + 1);
console.log(`\n🚫 거른 글 ${dropped.length}개: ${[...counts].map(([r, n]) => `${r} ${n}`).join(", ") || "없음"}`);
dropped
  .filter((d) => d.reason !== "중복")
  .forEach((d) => console.log(`  (${d.reason}) ${clip(d.candidate.title, 40)}  ${d.candidate.link}`));

if (errors.length) console.log(`\n⚠️ 검색 실패 ${errors.length}개: ${errors.join(" / ")}`);
console.log(`\n외부 호출 ${budget.used}/${budget.limit}, 검색 ${searched}번, ${Date.now() - started}ms`);
if (errors.length === searched) process.exit(1);
