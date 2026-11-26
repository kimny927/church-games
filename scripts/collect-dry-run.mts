// 자동 수집 1·2단계(검색 + 거르기 + AI 판단·초안)를 로컬에서 돌려 결과만 출력한다. DB에는 아무것도 쓰지 않는다.
// npm run collect:dry-run
// 필요한 값(.env.local): KAKAO_REST_API_KEY, YOUTUBE_API_KEY, ANTHROPIC_API_KEY
import { SubrequestBudget } from "../workers/collect/src/budget";
import { findCandidates, type CollectEnv } from "../workers/collect/src/candidates";
import { createAskModel, draftGames, MODEL } from "../workers/collect/src/draft";
import { clip } from "../workers/collect/src/text";

const KEYS = ["KAKAO_REST_API_KEY", "YOUTUBE_API_KEY", "ANTHROPIC_API_KEY"] as const;
const missing = KEYS.filter((k) => !process.env[k]);
if (missing.length) {
  // 값은 찍지 않고 이름만
  console.error(`.env.local에 없는 값: ${missing.join(", ")}`);
  process.exit(1);
}
const env = Object.fromEntries(KEYS.map((k) => [k, process.env[k]!])) as CollectEnv & { ANTHROPIC_API_KEY: string };

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
if (errors.length === searched) process.exit(1);

// 2단계: AI 판단·초안
const ai = await draftGames(candidates, createAskModel(env.ANTHROPIC_API_KEY, budget), budget);

console.log(`\n📝 AI 초안 ${ai.drafts.length}개 (심의 대기로 들어갈 것)`);
for (const d of ai.drafts) {
  console.log(`  [${d.sourceType}] ${d.name}  (확신 ${d.confidence})\n      ${d.link}`);
  console.log(`      ${d.summary}`);
  console.log(`      ${d.gameTypes.join("·") || "유형 없음"} / ${d.budget} / ${d.duration} / ${d.groupSize} / ${d.ages.join("·") || "나이 없음"}`);
  console.log(`      태그: ${d.tags.join(", ") || "없음"}  준비물: ${d.supplies ?? "없음"}`);
}
console.log(`\n🤖 AI가 버린 글 ${ai.dropped.length}개`);
ai.dropped.forEach((d) => console.log(`  (${d.reason}) ${clip(d.candidate.title, 40)}  ${d.candidate.link}`));
if (ai.stopped) console.log(`\n⏹️ 멈춘 이유: ${ai.stopped}`);

// Haiku 5.5: 입력 $0.10, 출력 $0.50 (100만 토큰당)
const cost = (ai.usage.input * 0.1 + ai.usage.output * 0.5) / 1_000_000;
console.log(`\n${MODEL} 호출 ${ai.calls}번, 토큰 입력 ${ai.usage.input} / 출력 ${ai.usage.output}, 약 $${cost.toFixed(4)}`);
console.log(`외부 호출 ${budget.used}/${budget.limit}, 검색 ${searched}번, ${Date.now() - started}ms`);
