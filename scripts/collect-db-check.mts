// 수집 전용 DB 계정(collector)이 정말 '함수 2개만' 할 수 있는지 직접 시험한다. DB에 아무것도 남기지 않는다.
// npm run collect:db-check
// 필요한 값(.env.local): COLLECT_DATABASE_URL (collector 계정의 연결 문자열. Neon 브랜치에서 시험할 때는 그 브랜치 주소)
import { neon } from "@neondatabase/serverless";

const url = process.env.COLLECT_DATABASE_URL;
if (!url) {
  console.error(".env.local에 없는 값: COLLECT_DATABASE_URL");
  process.exit(1);
}
const sql = neon(url);

let failed = 0;
async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}\n    ${(e as Error).message.split("\n")[0]}`);
  }
}

// 권한 거부(42501)가 나야 통과
async function denied(query: () => Promise<unknown>) {
  try {
    await query();
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "42501") return;
    throw new Error(`권한 거부(42501)가 아니라 다른 오류: ${code ?? (e as Error).name}`);
  }
  throw new Error("거부되지 않음 (권한이 너무 넓다)");
}

console.log("계정");
await check("collector로 접속", async () => {
  const [r] = await sql`select current_user as u`;
  if (r.u !== "collector") throw new Error(`지금 계정: ${r.u}`);
});
await check("neon_superuser가 아님 (콘솔이 아니라 SQL로 만든 계정)", async () => {
  const [r] = await sql`select exists (select 1 from pg_roles where rolname = 'neon_superuser') and pg_has_role(current_user, 'neon_superuser', 'member') as su`;
  if (r.su) throw new Error("neon_superuser 멤버다. 계정을 SQL로 다시 만든다");
});

console.log("할 수 있는 것");
await check("collect_unseen 실행", async () => {
  const rows = await sql`select l from collect_unseen(${["https://example.com/collect-db-check"]}::text[]) as l`;
  if (rows.length !== 1) throw new Error("처음 보는 링크인데 돌려주지 않음");
});
await check("collect_record는 초안 4개 이상을 거절", async () => {
  // id·link가 규칙에 안 맞는 값이라, 혹시 제한이 없어도 아무것도 들어가지 않는다
  const junk = JSON.stringify(Array.from({ length: 4 }, () => ({ id: "x", link: "x" })));
  try {
    await sql`select collect_record(${junk}::jsonb, '[]'::jsonb)`;
  } catch (e) {
    if ((e as { code?: string }).code === "P0001") return;
    throw e;
  }
  throw new Error("4개를 거절하지 않음");
});

console.log("할 수 없는 것 (권한 거부가 나야 함)");
await check("games 읽기", () => denied(() => sql`select id from games limit 1`));
await check("games 넣기", () => denied(() => sql`insert into games (id, name) values ('g-check', 'x')`));
await check("games 승인 (상태 바꾸기)", () => denied(() => sql`update games set status = 'approved' where false`));
await check("games 지우기", () => denied(() => sql`delete from games where false`));
await check("collect_seen 직접 읽기", () => denied(() => sql`select link from collect_seen limit 1`));
await check("관리자 계정 표(user) 읽기", () => denied(() => sql`select id from "user" limit 1`));

console.log("함수 실행 권한");
for (const fn of ["collect_unseen(text[])", "collect_record(jsonb, jsonb)"]) {
  await check(`${fn}: 누구나(PUBLIC) 실행할 수 없음`, async () => {
    const [r] = await sql`select has_function_privilege('public', ${fn}, 'execute') as ok`;
    if (r.ok) throw new Error("PUBLIC에 실행 권한이 남아 있다. revoke execute ... from public");
  });
}

console.log(failed ? `\n${failed}개 실패` : "\n모두 통과");
process.exit(failed ? 1 : 0);
