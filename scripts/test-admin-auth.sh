#!/bin/bash
# 관리자 인증·권한 시나리오 테스트. `npm run preview` 를 띄운 뒤 다른 터미널에서 실행한다.
# .env.local 의 DATABASE_URL 에 @test.local 테스트 계정을 만들고 끝나면 지운다.
# 화면(서버 액션)이 부르는 것과 같은 /api/auth/* 를 호출해 Better Auth 설정과 hooks 를 확인한다.
cd "$(dirname "$0")/.."
B=${BASE_URL:-http://localhost:8787}; D=$(mktemp -d); O="Origin: $B"; J="Content-Type: application/json"
FX="npx tsx --env-file=.env.local scripts/test-admin-auth-fixtures.mts"
post() { curl -s -o "$D/body" -w "%{http_code}" -X POST -H "$O" -H "$J" -b "$D/$1" -c "$D/$1" "$B/api/auth$2" -d "$3"; }
get() { curl -s -o "$D/body" -w "%{http_code}" -H "$O" -b "$D/$1" -c "$D/$1" "$B/api/auth$2"; }
page() { curl -s -o /dev/null -w "%{http_code} %{redirect_url}" -b "$D/$1" -c "$D/$1" "$B$2"; }
fail=0
chk() { if [[ "$2" == $3* ]]; then r=PASS; else r=FAIL; fail=1; fi; printf "%s  %s  (기대 %s, 결과 %s)\n" "$r" "$1" "$3" "$2"; }
login() { post "$1" /sign-in/email "{\"email\":\"test-$2@test.local\",\"password\":\"$3\"}"; }
# 관리 API를 사용자 ID 대상으로 호출. 따옴표가 겹치면 macOS bash 3.2가 잘못 해석해서 JSON은 여기서 만든다
target() { post "$1" "$2" "{\"userId\":\"$3\"$4}"; }
chpw() { post "$1" /change-password "{\"currentPassword\":\"temp-password-$2\",\"newPassword\":\"new-password-$2\"$3}"; }

$FX setup || exit 1
trap '$FX cleanup' EXIT

echo "--- 로그인·첫 비밀번호 변경"
chk "공개 가입 차단" "$(post x /sign-up/email '{"email":"x@test.local","password":"aaaaaaaaaaaa","name":"x"}')" 400
chk "비로그인 /admin → 로그인" "$(page x /admin)" "307 $B/admin/login"
chk "비로그인 관리 API" "$(get x /admin/list-users)" 401
chk "admin 로그인" "$(login a admin temp-password-admin)" 200
cp "$D/a" "$D/a2"  # 같은 계정의 다른 기기 세션
chk "임시 비밀번호면 /admin/password 로" "$(page a /admin)" "307 $B/admin/password"
chk "짧은 새 비밀번호 거절" "$(post a /change-password '{"currentPassword":"temp-password-admin","newPassword":"short"}')" 400
chk "비밀번호 변경 (다른 세션 해제)" "$(chpw a admin ',"revokeOtherSessions":true')" 200
chk "변경 후 /admin 열림" "$(page a /admin)" 200
chk "다른 기기 세션 해제됨" "$(page a2 /admin)" "307 $B/admin/login"
chk "로그인 상태로 /admin/login → 홈" "$(page a /admin/login)" "307 $B/admin"
chk "admin은 /admin/admins 못 들어감" "$(page a /admin/admins)" "307 $B/admin"

echo "--- 역할 권한"
chk "admin의 관리 API 거절" "$(get a /admin/list-users)" 403
chk "admin의 set-role 거절" "$(post a /admin/set-role '{"userId":"x","role":"owner"}')" 403
chk "owner 로그인" "$(login o owner temp-password-owner)" 200
chk "임시 비밀번호 owner의 관리 API 거절" "$(get o /admin/list-users)" 403
chk "owner 비밀번호 변경" "$(chpw o owner)" 200
chk "owner의 list-users 허용" "$(get o /admin/list-users)" 200
ids=$(cat "$D/body")
uid_of() { jq -r ".users[] | select(.email==\"test-$1@test.local\") | .id" <<<"$ids"; }
ME=$(uid_of owner); ADMIN=$(uid_of admin); OWNER2=$(uid_of owner2)
chk "/admin/admins 열림" "$(page o /admin/admins)" 200
chk "owner의 create-user 허용" "$(post o /admin/create-user '{"email":"test-created@test.local","password":"aaaaaaaaaaaa","name":"test-created","role":"admin"}')" 200

echo "--- 닉네임 (auth.ts checkNickname: 화면을 거치지 않고 API를 직접 불러도 규칙·중복 확인)"
chk "겹치는 닉네임으로 관리자 생성 거절" "$(post o /admin/create-user '{"email":"test-dup@test.local","password":"aaaaaaaaaaaa","name":"test-admin","role":"admin"}')" 400
chk "1자 닉네임으로 관리자 생성 거절" "$(post o /admin/create-user '{"email":"test-dup@test.local","password":"aaaaaaaaaaaa","name":"d","role":"admin"}')" 400
chk "다른 관리자 닉네임을 겹치게 수정 거절" "$(target o /admin/update-user "$ADMIN" ',"data":{"name":"test-owner"}')" 400
chk "내 닉네임을 남과 겹치게(대소문자만 다르게) 거절" "$(post a /update-user '{"name":"TEST-OWNER"}')" 400
chk "앞뒤 공백 닉네임 거절" "$(post a /update-user '{"name":"  test-new  "}')" 400
chk "내 역할을 스스로 owner로 거절" "$(post a /update-user '{"role":"owner"}')" 400
chk "내 닉네임 변경 허용" "$(post a /update-user '{"name":"test-admin-new"}')" 200

echo "--- 자기 보호 (owner 최소 1명)"
chk "자기 역할 변경 거절 (set-role)" "$(target o /admin/set-role "$ME" ',"role":"admin"')" 403
chk "자기 역할 변경 거절 (update-user)" "$(target o /admin/update-user "$ME" ',"data":{"role":"admin"}')" 403
chk "자기 삭제 거절" "$(target o /admin/remove-user "$ME")" 403
chk "impersonate 권한 없음" "$(target o /admin/impersonate-user "$ADMIN")" 403
chk "ban 권한 없음" "$(target o /admin/ban-user "$ADMIN")" 403

echo "--- 초기화·역할 변경 즉시 반영"
chk "초기화: 비밀번호 설정" "$(target o /admin/set-user-password "$ADMIN" ',"newPassword":"temp-password-reset"')" 200
chk "초기화: 변경 필요 표시" "$(target o /admin/update-user "$ADMIN" ',"data":{"mustChangePassword":true}')" 200
chk "초기화: 세션 해제" "$(target o /admin/revoke-user-sessions "$ADMIN")" 200
# 페이지 보기는 쿠키 캐시(5분)라 바로 막히지 않을 수 있다 (docs/decisions.md 2026-11-21에서 받아들인 대가).
# 그래서 DB 기준으로 세션이 지워졌는지를 본다. 쓰기 작업(requireAdmin fresh)·관리 API는 DB 기준이라 바로 막힌다
chk "초기화된 admin의 기존 세션 끊김 (DB 기준)" "$(get a "/get-session?disableCookieCache=true") $(cat "$D/body")" "200 null"
chk "새 임시 비밀번호로 로그인" "$(login a3 admin temp-password-reset)" 200
chk "→ 다시 비밀번호 변경 강제" "$(page a3 /admin)" "307 $B/admin/password"
chk "owner2 로그인" "$(login o2 owner2 temp-password-owner2)" 200
chk "owner2 비밀번호 변경" "$(chpw o2 owner2)" 200
chk "owner2 관리 API 허용" "$(get o2 /admin/list-users)" 200
chk "owner2를 admin으로 변경" "$(target o /admin/set-role "$OWNER2" ',"role":"admin"')" 200
chk "내려간 owner2는 쿠키 캐시가 있어도 바로 거절" "$(get o2 /admin/list-users)" 403
chk "다른 관리자 삭제 허용" "$(target o /admin/remove-user "$OWNER2")" 200

echo "--- 요청 제한·검색 노출"
for i in 1 2 3 4 5; do login w admin wrong-password >/dev/null; done
chk "1분 5회 초과 로그인 → 429" "$(login w admin wrong-password)" 429
curl -s "$B/admin/login" | grep -q 'name="robots" content="noindex' && chk "관리자 화면 noindex" ok ok || chk "관리자 화면 noindex" none ok

[ $fail = 0 ] && echo "모두 통과" || { echo "실패 있음"; exit 1; }
