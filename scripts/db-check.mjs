// Neon 연결 확인: npm run db:check
// .env.local 의 DATABASE_URL 로 접속해서 게임 개수를 상태별로 보여줘요.
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL 이 없어요. .env.local 에 넣었는지 확인하세요.");
  process.exit(1);
}

const sql = neon(url);
try {
  const [{ version }] = await sql`select version()`;
  console.log("연결 성공:", version.split(" ").slice(0, 2).join(" "));
  const rows = await sql`select status, count(*)::int as count from games group by status order by status`;
  if (rows.length === 0) console.log("games 테이블은 있지만 비어 있어요. neon/seed.sql 을 실행해 보세요.");
  for (const r of rows) console.log(`  ${r.status}: ${r.count}개`);
} catch (e) {
  if (String(e.message).includes('relation "games" does not exist')) {
    console.error("연결은 됐지만 games 테이블이 없어요. neon/schema.sql 을 먼저 실행하세요.");
  } else {
    console.error("연결 실패:", e.message);
  }
  process.exit(1);
}
