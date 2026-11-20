// Better Auth 테이블을 만들거나 맞추는 SQL을 출력한다. DB는 읽기만 한다(현재 스키마와 비교).
// npx tsx --env-file=.env.local scripts/auth-sql.mts > neon/auth.sql
// 출력된 SQL은 Neon 콘솔 SQL Editor에서 실행한다 (schema.sql 과 같은 방식)
import { getMigrations } from "better-auth/db/migration";
import { getAuth } from "../src/lib/auth";

const { toBeCreated, toBeAdded, compileMigrations } = await getMigrations(getAuth().options);
console.error("만들 테이블:", toBeCreated.map((t) => t.table), "칼럼 추가:", toBeAdded.map((t) => t.table));
console.log("-- Better Auth 테이블 (scripts/auth-sql.mts 로 생성)");
console.log(await compileMigrations());
