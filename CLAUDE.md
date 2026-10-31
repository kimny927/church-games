# CLAUDE.md

교회 수련회 게임 공유 플랫폼. 이 파일은 Claude Code가 작업을 시작할 때 읽는 프로젝트 안내서입니다.

## 프로젝트 맥락
- 기획 배경, 로드맵, 결정 기록은 `docs/` 를 먼저 읽을 것
  - `docs/project-overview.md`: 무엇을, 누구를 위해 만드는지
  - `docs/dev-plan.md`: 1단계 MVP 범위와 일정
  - `docs/decisions.md`: 지금까지 내린 결정과 이유
- 사람: 진선(아이디어·기획), 나연(개발). 문서에서 '친구'라고 쓰지 말고 이름으로 쓴다.
- 기획 원본과 게임 큐레이션 데이터는 노션에 있음 (`docs/project-overview.md`의 링크 참고)

## 작업 방식
- 나연은 개발자이고, AI-Native Engineer 역량을 키우는 것이 목표다. 결과만 내지 말고 무엇을 왜 하는지 짧게 설명할 것.
- 큰 작업은 먼저 계획을 제안하고 확인받은 뒤 진행한다.
- 한 번에 작은 기능 하나씩. 변경은 리뷰하기 쉬운 크기로.
- main에 직접 push하지 않는다. 브랜치를 만들고 PR로 올린다.
- 커밋 메시지는 한국어로, 무엇을 왜 바꿨는지 쓴다.

## 기술 스택
- Next.js 15 (App Router, `src/app`), TypeScript, Tailwind CSS 4
- Supabase (DB·인증·파일), 스키마 초안은 `supabase/schema.sql`
- 배포: Vercel (GitHub main 브랜치 자동 배포 예정)

## 명령어
- `npm run dev`: 로컬 실행 (http://localhost:3000)
- `npm run build`: 빌드 확인. PR 올리기 전에 반드시 통과시킬 것
- `npm run lint`: 린트

## 코드 구조
- `src/lib/types.ts`: 게임 타입과 필터 옵션. 노션 게임 DB 속성과 맞춘다.
- `src/lib/sample-games.ts`: 임시 샘플 데이터. Supabase 연결 후 교체 예정
- `src/components/GameBrowser.tsx`: 목록 + 검색 + 필터 (클라이언트 컴포넌트)
- `src/app/games/[id]/page.tsx`: 게임 상세
- `src/components/Footer.tsx`: 신천지 금지 안내 (모든 페이지에 유지)

## 지켜야 할 것
- 외부 게임은 원본 내용을 복사하지 않고 '요약 + 원본 링크'로 소개한다 (저작권).
- 모바일 화면에서 먼저 확인한다 (사용자는 주로 휴대폰으로 볼 것).
- 비밀키(Supabase service key 등)는 절대 커밋하지 않는다. `.env.local` 사용.
