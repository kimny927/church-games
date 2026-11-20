// 첫 최고 관리자(owner) 계정을 만들고 임시 비밀번호를 출력한다.
// npx tsx --env-file=.env.local scripts/admin-create-owner.mts <이메일>
// 그 다음 관리자는 화면(owner 전용 관리자 관리)에서 추가한다.
import { getAuth } from "../src/lib/auth";
import { generateTempPassword } from "../src/lib/password";

const email = process.argv[2];
if (!email) {
  console.error("사용법: npx tsx --env-file=.env.local scripts/admin-create-owner.mts <이메일>");
  process.exit(1);
}

const temp = generateTempPassword();
// 헤더 없이 서버에서 부르면 권한 확인을 건너뛴다. 로그인한 owner가 아직 없는 첫 계정 만들기 전용이다.
// 서버 액션에서는 반드시 headers: await headers() 를 넘길 것
const { user } = await getAuth().api.createUser({
  body: { email, password: temp, name: email.split("@")[0], role: "owner", data: { mustChangePassword: true } },
});
console.log(`생성: ${user.email} (owner)`);
console.log(`임시 비밀번호: ${temp}  ← 첫 로그인 때 바꾸게 됩니다`);
