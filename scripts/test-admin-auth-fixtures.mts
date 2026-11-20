// test-admin-auth.sh 용 테스트 계정 만들기·지우기. 이메일이 @test.local 인 계정만 다룬다.
// npx tsx --env-file=.env.local scripts/test-admin-auth-fixtures.mts <setup|cleanup>
import { neon } from "@neondatabase/serverless";
import { getAuth } from "../src/lib/auth";

const sql = neon(process.env.DATABASE_URL!);
const cleanup = () => sql`delete from "user" where email like '%@test.local' returning email`;

if (process.argv[2] === "setup") {
  await cleanup();
  // 로컬 preview 의 요청 제한 기록(IP가 :: 로 잡힘)을 지워, 연달아 돌려도 429가 나지 않게 한다
  await sql`delete from "rateLimit" where key like '0000:0000:0000:0000:0000:0000:0000:0000|%'`;
  // 헤더 없는 서버 호출이라 권한 확인 없이 만든다 (owner 생성 스크립트와 같은 방식)
  for (const r of ["owner", "owner2", "admin"]) {
    await getAuth().api.createUser({
      body: { email: `test-${r}@test.local`, password: `temp-password-${r}`, name: `test-${r}`, role: r === "admin" ? "admin" : "owner", data: { mustChangePassword: true } },
    });
  }
  console.log("테스트 계정 3개 생성");
} else if (process.argv[2] === "cleanup") {
  console.log("삭제:", (await cleanup()).map((r) => r.email).join(", "));
} else {
  console.error("사용법: setup | cleanup");
}
