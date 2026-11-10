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
- Cloudflare Pages (무료, 상업 사용 OK) + GitHub 자동 배포

**백엔드·데이터:**
- Cloudflare Workers (서버리스 함수, 스크래핑/API 로직)
- Neon PostgreSQL (무료, 1GB × 100 프로젝트)

**파일 저장:**
- Firebase Storage (무료, 5GB)

**자동화:**
- GitHub Actions (무료, 정기적인 콘텐츠 스크래핑)

**인증 (예정):**
- Supabase Auth (카카오 로그인) 또는 직접 구현

**특징:** 완전 무료로 시작, 상업 사용 가능 (광고 포함), 트래픽 증가 시에만 비용 발생

## 명령어
- `npm run dev`: 로컬 실행 (http://localhost:3000)
- `npm run build`: 빌드 확인. PR 올리기 전에 반드시 통과시킬 것
- `npm run lint`: 린트

## 코드 구조
**사용자 페이지:**
- `src/lib/types.ts`: 게임 타입과 필터 옵션. Neon DB 스키마와 맞춘다.
- `src/lib/sample-games.ts`: 임시 샘플 데이터. Neon 연결 후 교체 예정
- `src/components/GameBrowser.tsx`: 목록 + 검색 + 필터 (클라이언트 컴포넌트)
- `src/app/games/[id]/page.tsx`: 게임 상세 페이지
- `src/components/Footer.tsx`: 신천지 금지 안내 (모든 페이지에 유지)

**관리자 페이지:**
- `src/app/admin/`: 관리자 전용 페이지 (카카오 로그인 후 접근)
  - `moderation/page.tsx`: 콘텐츠 심의 (대기 중 게임 검토, 승인/거절/수정)
  - `settings/page.tsx`: 필터링 설정 (자동 승인 vs 수동 승인, 소스별 설정)
  - `analytics/page.tsx`: 스크래핑 현황 (선택사항)

**Cloudflare Workers:**
- `workers/scrape.ts`: 메타데이터 추출 (제목, 설명, 썸네일, 링크)
- `workers/filtering.ts`: 필터링 로직 (자동 필터링 규칙 적용)
- `workers/api.ts`: 관리 API (게임 승인/거절/수정 엔드포인트)

**GitHub Actions:**
- `.github/workflows/scrape.yml`: 자동 스크래핑 (매일 자정 실행)

## 콘텐츠 수집 방식

**2가지 병렬 지원:**

**A. 반자동 (수동 입력 + 자동 추출)**
- 진선이가 블로그/유튜브/노션 URL 입력
- Cloudflare Workers가 자동으로 메타데이터 추출 (제목, 설명, 썸네일, 링크)
- 즉시 또는 심의 후 사용자 페이지 표시
- 장점: 신뢰할 수 있는 콘텐츠만 추가, 품질 관리 용이
- 시간: 진선이가 월 5~15개 정도 입력 가능

**B. 완전 자동 (GitHub Actions로 정기 스크래핑)**
- GitHub Actions가 매일 자정에 자동 실행
- RSS 피드, 블로그, 유튜브, 노션 등에서 자동 수집
- 메타데이터 자동 추출 후 Neon에 저장 (status: 'pending')
- 진선이 심의 후 승인 필요 (또는 자동 승인 설정 가능)
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

**소스별 개별 설정:**
- 유튜브: 수동 승인 필수
- 블로그: 자동 승인 가능
- 노션: 수동 승인 필수 (진선이 큐레이션 우선)

**자동 필터링 규칙:**
- 최소 길이 제한 (예: 60초 이상 영상만)
- 최대 나이 제한 (예: 1년 이내 콘텐츠만)
- 제외 키워드 (예: "신천지", "이단" 포함 콘텐츠 자동 거절)

**Neon DB에 저장되는 심의 정보:**
- `status`: 'pending', 'approved', 'rejected', 'modified'
- `approved_by`: 심의한 운영자 ID
- `approved_at`: 심의 시간
- `rejection_reason`: 거절 사유
- `admin_notes`: 운영자 메모

## 지켜야 할 것
- 외부 게임은 원본 내용을 복사하지 않고 '요약 + 원본 링크'로 소개한다 (저작권).
- 모바일 화면에서 먼저 확인한다 (사용자는 주로 휴대폰으로 볼 것).
- 비밀키(Neon DB 연결, Firebase API 키 등)는 절대 커밋하지 않는다. `.env.local` 또는 Cloudflare 환경변수 사용.
- 스크래핑할 때 각 사이트의 `robots.txt`와 이용약관 확인 (무단 크롤링 방지).
- 자동 스크래핑은 RSS 피드 우선, HTML 파싱은 최후의 수단 (부하 고려).
- Cloudflare Workers는 10초 제한이 있으므로 복잡한 로직은 GitHub Actions에서 처리.
- Firebase Storage 5GB 무료 한계 모니터링 (초과 시 월 ~$2 추가 비용).

## Neon DB 스키마 (초기)
- 기존 게임 테이블에 다음 칼럼 추가:
  - `status`: 'pending', 'approved', 'rejected', 'modified'
  - `source_url`: 원본 블로그/유튜브/노션 링크
  - `auto_scraped`: true/false (A방식 vs B방식)
  - `approved_by`: 심의자 ID
  - `approved_at`: 심의 시간
  - `rejection_reason`: 거절 사유
- 참고: `supabase/schema.sql` → `neon/schema.sql`로 이름 변경 후 수정

## 환경변수 설정 (Cloudflare + Neon + Firebase)
```
# Cloudflare Workers
NEON_CONNECTION_STRING=postgresql://user:password@...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_API_KEY=...

# GitHub Actions (스크래핑용)
NEON_DATABASE_URL=postgresql://...
```

## 참고자료
- **기획 & 레퍼런스:**
  - 노션 게임 DB: https://app.notion.com/p/c2489a37462a4f2f8ba1e73c3576617a
  - Surfit.io (자동 콘텐츠 큐레이션 레퍼런스): https://www.surfit.io/
  
- **기술 문서:**
  - Neon PostgreSQL: https://neon.tech/docs
  - Cloudflare Pages & Workers: https://developers.cloudflare.com
  - Firebase Storage: https://firebase.google.com/docs/storage
  - GitHub Actions: https://docs.github.com/en/actions
  
- **유튜브/블로그 RSS 피드:**
  - 유튜브 채널 RSS: `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`
  - Blogger RSS: `https://blog-name.blogspot.com/feeds/posts/default`
  - Medium RSS: `https://medium.com/feed/@username`
