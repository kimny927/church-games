# CLAUDE.md

교회 수련회 게임 공유 플랫폼. 이 파일은 Claude Code가 작업을 시작할 때 읽는 프로젝트 안내서입니다.

## 프로젝트 맥락
- 기획 배경, 로드맵, 결정 기록은 `docs/` 를 먼저 읽을 것
  - `docs/project-overview.md`: 무엇을, 누구를 위해 만드는지
  - `docs/dev-plan.md`: 1단계 MVP 범위와 일정
  - `docs/decisions.md`: 지금까지 내린 결정과 이유
- 사람: 진선(아이디어·기획), 나연(개발). 문서에서 '친구'라고 쓰지 말고 이름으로 쓴다.
- 기획 원본은 노션에 있음 (`docs/project-overview.md`의 링크 참고). 게임 데이터는 Neon `games` 테이블이 기준이다 (노션 게임 DB는 비어 있음)

## 작업 방식
- 나연은 개발자이고, AI-Native Engineer 역량을 키우는 것이 목표다. 결과만 내지 말고 무엇을 왜 하는지 짧게 설명할 것.
- 큰 작업은 먼저 계획을 제안하고 확인받은 뒤 진행한다.
- 한 번에 작은 기능 하나씩. 변경은 리뷰하기 쉬운 크기로.
- 깃 규칙은 `docs/git-flow.md`를 따른다. 요약:
  - main에 직접 push하지 않는다. `git switch main && git pull` 후 브랜치를 만들고 PR로 올린다.
  - 브랜치 이름: `종류/짧은-설명` (feat, fix, docs, refactor, chore, style, test / 영어 kebab-case)
  - PR 본문은 무엇을 / 왜 / 확인한 것. 병합은 Squash만.
- 커밋 메시지와 PR 제목은 한국어로, 무엇을 왜 바꿨는지 쓴다.

## 발전을 위한 학습 규칙

### 목표
AI-Native Engineer로 성장하기 위해 매 작업에서 다양한 기술 영역을 경험.

### 적용 방식 (작업 성격별)

**큰 작업/기획 단계**
- 크로스스택 기술, AI 기반 개발 워크플로우, 비즈니스 임팩트를 함께 고민
- 예: 새 기능 설계, 아키텍처 검토, 성능 개선 전략

**중간 크기 작업**
- 현재 작업과 가장 관련 있는 영역 중심 (기술 계층, AI 활용, 사용자 영향)
- 예: 컴포넌트 구현, API 연결, 리팩토링

**작은 작업**
- 필요시 선택적으로 1개 개념 추가
- 예: 버그 픽스, 스타일 수정, 라이브러리 업데이트

### 학습 카테고리 (로테이션하며 활용)
1. **크로스스택 아키텍처**: 프론트엔드-백엔드-인프라 간 상호작용과 트레이드오프
2. **AI 기반 개발**: LLM 활용, 프롬프트 엔지니어링, 개발 워크플로우 자동화
3. **프로덕트 사고**: 사용자 경험, 성능 영향, 간단함 vs 확장성 결정

### 포맷
- 개념 소개는 간결하게 `💡 함께 알면 좋은 개념:` 섹션에서 1줄/개념
- 실무에서 중요하게 다뤄지는 고급 기술이나 아키텍처 위주로 선정
- **모든 설명과 답변은 한국어로 작성한다.**

### 질문을 통한 학습
- 나연의 질문에서 부족한 부분을 인식하면, 최대 3개까지의 학습 힌트를 제안한다
- 예: 특정 개념이 빠졌거나, 기술 선택의 근거가 명확하지 않거나, 아키텍처 이해가 부분적일 때
- 힌트는 `💡 함께 알면 좋은 개념:` 형식으로, 학습 카테고리(크로스스택, AI 기반, 프로덕트 사고)와 연결시킨다
- 강요하지 않고, 선택적으로 "더 깊이 있으려면 이것도 살펴보면 좋습니다" 정도의 톤으로 제안한다

## 기술 스택
**프론트엔드·배포:**
- Next.js 15 (App Router, `src/app`), TypeScript, Tailwind CSS 4
- Cloudflare Workers + OpenNext 어댑터 (`@opennextjs/cloudflare`, 무료, 상업 사용 OK) + GitHub 자동 배포(Workers Builds)
  - 설정: `wrangler.jsonc`, `open-next.config.ts`. Edge 런타임(`export const runtime = "edge"`)은 쓰지 않는다

**백엔드·데이터:**
- Neon PostgreSQL (무료, 1GB × 100 프로젝트). 지금 사용 중
- 서버 로직은 별도 Workers 없이 Next.js 서버 액션 (게임 승인·거절·수정, 링크 메타데이터 추출). 이유는 `docs/decisions.md` 2026-11-25

**파일 저장 (예정):**
- Firebase Storage (무료, 5GB)

**자동화:**
- GitHub Actions: PR 빌드 CI(`ci.yml`)만. 비밀값을 넣지 않는다 (공개 저장소라 로그가 공개됨)
- 자동 수집: 수집 전용 Worker(`workers/collect/`)의 cron, 하루 1번 최대 3개 (만드는 중). 이유는 `docs/decisions.md` 2026-11-25

**인증:**
- 관리자 (3주차): Better Auth 이메일+비밀번호. 역할 `owner`(최고 관리자) / `admin`(관리자), 공개 가입 금지, 해시는 Web Crypto PBKDF2. 이유는 `docs/decisions.md` 2026-11-19
- 일반 사용자: 카카오 로그인 (자동 수집보다 우선순위를 낮춤, `docs/decisions.md` 2026-11-25)

**특징:** 완전 무료로 시작, 상업 사용 가능 (광고 포함), 트래픽 증가 시에만 비용 발생

## 명령어
- `npm run dev`: 로컬 실행 (http://localhost:3000)
- `npm run build`: 빌드 확인. PR 올리기 전에 반드시 통과시킬 것
- `npm run lint`: 린트
- `npm run preview`: Cloudflare Workers 런타임으로 로컬 실행 (배포 환경에서만 생기는 문제 확인용)
- `npm run deploy`: 수동 배포 (평소에는 main 병합 시 자동 배포)
- `npm run db:check`: Neon 연결 확인 (`.env.local`의 `DATABASE_URL` 사용, 상태별 게임 개수 출력)
- `npm run collect:dry-run`: 자동 수집을 로컬에서 돌려 후보·거른 글만 출력 (DB에 안 씀, `.env.local`의 검색 API 키 사용)
- `npm run test:collect`: 자동 수집의 글 정리·거르기·주소 맞추기 테스트 (키 없이 돎). 거르기 규칙을 바꾸면 반드시 돌린다
- `npx tsx --env-file=.env.local scripts/auth-sql.mts > neon/auth.sql`: Better Auth 테이블 SQL 생성 (DB는 읽기만, Better Auth 업그레이드 후 다시 실행)
- `npx tsx --env-file=.env.local scripts/admin-create-owner.mts <이메일> [닉네임]`: 첫 최고 관리자 생성, 임시 비밀번호 출력 (닉네임을 빼면 이메일 앞부분)
- `scripts/test-admin-auth.sh`: 관리자 인증·권한 시나리오 테스트. `npm run preview`를 띄운 뒤 실행 (`@test.local` 테스트 계정을 만들고 끝나면 지움). 인증·권한을 바꾼 PR마다 돌린다

## 코드 구조
**사용자 페이지:**
- `src/lib/types.ts`: 게임 타입과 필터 옵션. Neon DB 스키마와 맞춘다.
- `src/lib/db.ts`: Neon 연결(HTTP 드라이버)과 게임 조회 함수. 서버에서만 import. 목록·상세 페이지가 요청마다 여기서 승인된 게임을 읽는다(SSR, `force-dynamic`)
- `neon/schema.sql`, `neon/seed.sql`: DB 스키마와 샘플 데이터 (Neon 콘솔 SQL Editor에서 실행)
- `src/components/GameBrowser.tsx`: 목록 + 검색 + 필터 (클라이언트 컴포넌트)
- `src/app/(site)/games/[id]/page.tsx`: 게임 상세 페이지
- `src/components/Footer.tsx`: 신천지 금지 안내 (모든 페이지에 유지)
- `src/components/ui/`: 공통 UI (`Spinner`, `LoadingScreen`, `SubmitButton`, `NavLink`, `Toast`(잠깐 뜨는 알림), `AlertDialog`(확인 팝업), `Thumbnail`(외부 이미지, 없거나 깨지면 기본 모양)). 테마를 바꿀 때 여기부터 고친다
- `src/components/GameInfo.tsx`: 게임 세부 정보 표. 사용자 상세 페이지와 관리자 심의 세부가 같이 쓴다
  - 폼 제출 버튼은 `SubmitButton` (서버 액션 폼이면 제출 중을 스스로 앎, 아니면 `pending` prop)
  - 화면 전환: 사용자 페이지는 `src/app/(site)/loading.tsx`(URL엔 `(site)`가 안 붙음), 관리자 화면은 링크에 `NavLink`. 관리자 쪽에 `loading.tsx`를 두면 응답을 먼저 보내서 `requireAdmin`의 redirect가 307이 아니게 되므로 두지 않는다

**관리자 인증:**
- `src/lib/auth.ts`: Better Auth 설정 (역할, 쿠키 캐시 5분, 요청 제한, hook). 서버에서만 import
  - 역할 권한: owner에게도 impersonate·ban·이메일 변경은 없다 (승인자 기록을 믿을 수 있게)
  - `hooks.before`: 관리 API(`/admin/*`)는 DB 기준 owner만, 비밀번호 변경 전이면 거절, 자기 자신 대상 거절 (그래서 owner가 항상 1명 이상 남는다)
  - `hooks.before`: 닉네임(`user.name`)을 정하거나 바꾸는 경로(`/update-user`, `/admin/create-user`, `/admin/update-user`)는 규칙(2~20자)·중복(대소문자 무시)을 확인한다. 서버 액션만 확인하면 API 직접 호출로 건너뛸 수 있어서. 권한 확인을 먼저 한다
  - `hooks.after`: 비밀번호 변경 성공 시 `mustChangePassword` 해제
- `src/lib/password.ts`: PBKDF2 비밀번호 해시 (Workers CPU 절약)
- `src/lib/admin.ts`: `requireAdmin({ role, fresh })`. 관리자 페이지·서버 액션 맨 앞에서 부른다. owner 전용 확인과 `fresh: true`(심의처럼 기록이 남는 쓰기)는 쿠키 캐시 대신 DB로
- `src/lib/auth-client.ts`, `src/components/admin/LoginForm.tsx`·`PasswordForm.tsx`: 로그인·비밀번호 변경 폼. 요청 제한은 `/api/auth/*` HTTP 경로에만 걸리므로 이 둘은 서버 액션에서 `auth.api`를 직접 부르지 않는다
- `src/app/api/auth/[...all]/route.ts`: Better Auth HTTP 엔드포인트
- `src/app/admin/`: `layout.tsx`(noindex), `page.tsx`(홈·로그아웃), `login/`, `password/`(임시 비밀번호로 첫 로그인 시 강제), `profile/`(내 정보: 닉네임 변경)
- 관리자 닉네임: Better Auth의 `user.name`을 쓴다 (DB 변경 없음). 규칙은 `src/lib/nickname.ts`, 중복 확인은 `db.ts`의 `isNicknameTaken`. 심의 기록·관리자 목록에 이메일 대신 닉네임을 보여 준다
- `src/app/admin/admins/`: 관리자 관리 (owner 전용: 이메일·닉네임·역할로 추가, 임시 비밀번호 한 번 표시, 초기화, 역할 변경, 삭제). 서버 액션은 `actions.ts`, 임시 비밀번호는 URL이 아니라 액션 반환값으로만 보여준다
- `src/app/admin/moderation/`: 게임 심의 (owner·admin). 목록(`page.tsx`)은 대기/승인/거절 탭과 항목만 보여 주고, 세부(`[id]/page.tsx`)에서 내용을 보고 승인·거절(사유 필수)·내리기·다시 승인·메모를 한다 (`src/components/admin/ReviewPanel.tsx`)
  - 성공하면 원래 목록 탭으로 돌아가 '승인되었습니다/거절되었습니다' 알림(`?done=`), 실패하면 세부에 머물며 팝업
- `src/app/admin/games/`: 게임 등록(`new/`)·수정(`[id]/edit/`) (owner·admin). 폼은 `src/components/admin/GameForm.tsx`, 값 확인은 `src/lib/game-form.ts`(선택지·길이를 서버에서 다시 확인)
  - 새 게임은 대기로 시작, id는 자동 생성(`g-` + 6자, 겹치면 다시 뽑음). 수정해도 상태·심의 기록은 그대로
  - 폼은 `<form action>` 대신 `onSubmit`으로 서버 액션을 부른다 (React 19가 action 폼을 제출 후 비워서 오류 때 입력이 사라짐)
  - 심의자(`approved_by`)는 폼이 아니라 세션의 `user.id`. 상태 변경은 `db.ts`의 `reviewGame`이 '화면을 본 시점의 상태'일 때만 해서 동시 처리를 막는다
  - '정보 가져오기': `src/lib/link-meta.ts`가 링크에서 제목·설명·썸네일을 가져오고 소스 종류를 추측한다 (유튜브 oEmbed, 그 밖은 `<head>`의 og 태그). 빈 칸만 채우고, 원본 설명은 참고로만 보여 주며 저장하지 않는다. 썸네일은 새로 가져오면 바꾸고 '썸네일 빼기'로 지울 수 있다(숨은 칸 `thumbnailUrl`)
  - `link-meta.ts`는 `localhost`·IP 주소를 거절하고 리다이렉트를 직접 따라가며 다시 확인한다 (배포 환경은 `wrangler.jsonc`의 `global_fetch_strictly_public`도 막음). 5초·256KB 제한
- `neon/auth.sql`: Better Auth 테이블 (user, session, account, verification, rateLimit)
- 서버에서 `auth.api.createUser` 등 관리 API를 부를 때는 반드시 `headers: await headers()`를 넘긴다. 헤더가 없으면 권한 확인을 건너뛴다 (첫 owner 생성 스크립트만 예외)

**자동 수집 (`workers/collect/src/`, 만드는 중):** Next.js 코드(`@/` 경로, `next/*`)를 쓰지 않는다. 수집 전용 Worker에서 돈다
- `search.ts`: 카카오 Daum 블로그·유튜브 검색 API → 후보 (네이버 검색 API는 쓰지 않음, decisions 2026-11-25). 유튜브 키는 주소가 아니라 헤더로
- `rules.ts`: 검색 키워드, 거를 말(이단·광고), 게임 관련 말(없으면 거름), 주입 흔적 패턴. 이단 단체 이름은 심의에서 발견할 때마다 추가한다. `candidates.ts`: 검색 → 주소 맞추기 → 거르기 → 순서(출처를 번갈아 최신순, AI 확신도로 정하지 않음)
- `text.ts`: 태그·엔티티·안 보이는 문자 제거, NFKC. 비교용 `compact`(붙여 씀, 우회 잡기)·`spaced`(짧은 낱말은 낱말 시작에서만)
- `url.ts`: 네이버 블로그·유튜브 주소를 한 모양으로 (중복 확인). `budget.ts`: 외부 호출 예산 40 (무료 플랜 50)
- 오류는 우리가 만든 메시지나 종류만 남긴다 (요청 주소·응답 본문·비밀값을 로그에 남기지 않음)
- 다음 PR: Claude Haiku 초안과 출력 검사, Worker·cron·`collect_seen`·수집 전용 DB 계정

**GitHub Actions:**
- `.github/workflows/ci.yml`: PR·main push마다 lint + build

아래는 아직 없는 파일이다. 만들 때 이 구조를 따른다.

**관리자 페이지 (예정):**
  - `settings/page.tsx`: 필터링 설정 (자동 승인 vs 수동 승인, 소스별 설정) (MVP 이후)
  - `analytics/page.tsx`: 스크래핑 현황 (MVP 이후, 선택사항)

## 콘텐츠 수집 방식

**2가지 병렬 지원:**

**A. 반자동 (수동 입력 + 자동 추출)**
- 진선이가 블로그/유튜브/인스타그램 URL 입력 (노션 공개 페이지 등 그 밖의 곳은 '기타')
- 게임 폼의 '정보 가져오기'가 메타데이터 추출 (제목, 설명, 썸네일, 소스 종류)
- 즉시 또는 심의 후 사용자 페이지 표시
- 장점: 신뢰할 수 있는 콘텐츠만 추가, 품질 관리 용이
- 시간: 진선이가 월 5~15개 정도 입력 가능

**B. 자동 수집 (만드는 중)**
- 수집 전용 Worker의 cron이 하루 1번, 최대 3개
- 카카오 Daum 블로그·유튜브 공식 검색 API로 키워드 검색 (RSS는 아는 채널만 볼 수 있어서)
- 코드로 거른 뒤 Claude Haiku가 게임인지 판단하고 초안 작성 → Neon에 저장 (status: 'pending', `auto_scraped` true)
- 진선이 심의 후 승인 필요. 자동 승인은 하지 않는다
- 장점: 콘텐츠 풍부, 최신 정보 자동 업데이트
- 단점: 운영자 심의 시간 필요

**스크래핑 레퍼런스:** https://www.surfit.io/ (자동 콘텐츠 수집 및 큐레이션 플랫폼)

## 필터링 & 심의 프로세스

**필터링 모드 (운영자가 선택 가능):**

**모드 1: 자동 승인 (Approval-less)**
- 자동 스크래핑된 콘텐츠 → 바로 사용자 페이지 표시
- 사용: 콘텐츠 빠르게 업데이트하고 싶을 때
- 주의: 품질 관리 어려움

**모드 2: 수동 승인 (Approval-required) ← 초기 권장**
- 자동 스크래핑된 콘텐츠 → [대기] → 진선이 검토 → 승인/거절/수정 → 사용자 표시
- 사용: 높은 품질 유지, 필터링 필요
- 심의 시간: 1~2시간/일 (운영 초기)

**소스별 개별 설정 (`source_type`: 블로그·유튜브·인스타그램·기타):**
- 유튜브: 수동 승인 필수
- 블로그: 수동 승인 필수 (자동 수집한 게임은 출처와 상관없이 자동 승인하지 않는다, 2026-11-25)
- 인스타그램·기타: 수동 승인 필수 (진선이 큐레이션 우선)

**자동 필터링 규칙 (`workers/collect/src/rules.ts`, AI에 보내기 전에 코드로 거름):**
- 1년보다 오래된 글, 이미 본 글·중복
- 제외 키워드: 이단(띄어쓰기·기호 우회 포함)·광고 글
- 게임 관련 말이 없는 글, AI에게 지시하려는 흔적이 있는 글
- 최소 길이 제한 (예: 60초 이상 영상만): 아직 없음

**Neon DB에 저장되는 심의 정보:**
- `status`: 'pending', 'approved', 'rejected' (사용자 페이지에는 'approved'만 표시. 관리자 수정 여부는 `updated_at`으로 확인)
- `approved_by`: 심의한 운영자 ID
- `approved_at`: 심의 시간
- `rejection_reason`: 거절 사유
- `admin_notes`: 운영자 메모

## 지켜야 할 것
- 외부 게임은 원본 내용을 복사하지 않고 '요약 + 원본 링크'로 소개한다 (저작권).
- 모바일 화면에서 먼저 확인한다 (사용자는 주로 휴대폰으로 볼 것).
- 비밀키(Neon DB 연결, Firebase API 키 등)는 절대 커밋하지 않는다. `.env.local` 또는 Cloudflare 런타임 Secret 사용.
- 스크래핑할 때 각 사이트의 `robots.txt`와 이용약관 확인 (무단 크롤링 방지).
- 자동 수집은 공식 API(검색 API·RSS) 우선, HTML 파싱은 최후의 수단 (부하 고려). 지금은 페이지를 직접 가져오지 않는다 (썸네일도 검색 API가 주는 것).
- 자동 수집 글은 믿을 수 없는 데이터다. AI에는 제목과 짧은 요약만 넣고, AI 판단은 후보를 버리는 데만 쓴다 (통과시키지 않음). 링크·이름·순서는 코드가 정한다.
- Cloudflare Workers 무료 플랜은 요청당 CPU 시간 10ms, 외부 호출(subrequest) 50개로 제한된다 (응답 대기 시간은 CPU에 안 들어감, 2026-11 공식 문서 기준). 자동 수집은 `budget.ts`로 외부 호출을 세고, 목표를 하루 3개로 줄여 이 한도에 맞춘다.
- Firebase Storage 5GB 무료 한계 모니터링 (초과 시 월 ~$2 추가 비용).

## Neon DB 스키마 (`neon/schema.sql`)
- 지금은 `games` 테이블만 있다. 회원·댓글·후기는 로그인 방식을 정하는 4주차에 추가.
- 심의 칼럼: `status`('pending'/'approved'/'rejected'), `auto_scraped`(A방식 false / B방식 true), `created_by`(등록한 관리자), `approved_by`, `approved_at`, `rejection_reason`(거절 시 필수, DB 제약조건), `admin_notes`, `updated_at`(트리거로 자동 갱신)
- 원본 링크는 `link` 칼럼 (별도 `source_url` 없음)
- 썸네일은 `thumbnail_url` 칼럼. 원본 사이트의 이미지 주소만 저장하고 파일은 복사하지 않는다 (사용자 카드·상세는 있을 때만, 관리자 심의 세부는 없으면 '썸네일 없음')
- Neon에는 Supabase의 auth·RLS가 없다. 브라우저는 DB에 직접 붙지 않고, 서버 코드가 권한을 판단한다 (사용자 페이지는 `approved`만 조회).
- DB 칼럼은 snake_case, `Game` 타입은 camelCase. 변환은 `src/lib/db.ts`에서.

## 환경변수 설정 (Cloudflare + Neon + Firebase)
`.env.example`을 복사해 `.env.local`을 만든다. Neon 연결은 어디서든 `DATABASE_URL` 하나로 쓴다.
- 배포 환경: Cloudflare 대시보드 > church-games > Settings > **Variables and Secrets**(런타임)에 Secret으로 넣는다. Build 아래의 변수는 빌드 때만 보여서 SSR에서 못 읽는다. `npx wrangler secret list`로 확인.
- 값을 바꾸면 이미 만들어진 미리보기 버전에는 반영되지 않는다. 브랜치에 다시 push해서 새로 빌드한다.
```
# Neon (Next.js 서버, Cloudflare Workers 공통)
DATABASE_URL=postgresql://user:password@...

# Better Auth 세션 서명 키 (openssl rand -base64 32). 운영은 Cloudflare Secret에 이미 있음
BETTER_AUTH_SECRET=...

# 자동 수집 검색 API (로컬 dry-run, 나중에 수집 Worker Secret)
KAKAO_REST_API_KEY=...   # Kakao Developers > 앱 > 플랫폼 키 > REST API 키 (카카오 로그인에도 쓰는 키)
YOUTUBE_API_KEY=...      # Google Cloud, YouTube Data API v3만 허용하도록 제한

# Firebase Storage (예정)
FIREBASE_STORAGE_BUCKET=...
FIREBASE_API_KEY=...
```

## 참고자료
- **기획 & 레퍼런스:**
  - 노션 게임 DB: https://app.notion.com/p/c2489a37462a4f2f8ba1e73c3576617a
  - Surfit.io (자동 콘텐츠 큐레이션 레퍼런스): https://www.surfit.io/
  
- **기술 문서:**
  - Neon PostgreSQL: https://neon.tech/docs
  - Cloudflare Workers (Next.js/OpenNext): https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
  - Workers 한도: https://developers.cloudflare.com/workers/platform/limits/
  - Firebase Storage: https://firebase.google.com/docs/storage
  - GitHub Actions: https://docs.github.com/en/actions
  
- **유튜브/블로그 RSS 피드:**
  - 유튜브 채널 RSS: `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`
  - Blogger RSS: `https://blog-name.blogspot.com/feeds/posts/default`
  - Medium RSS: `https://medium.com/feed/@username`
