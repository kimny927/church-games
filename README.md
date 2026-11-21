# 교회 수련회 게임 모음 (church-games)

수련회·청년부 모임에서 쓸 수 있는 게임을 모아 소개하는 사이트입니다.
기획 문서는 노션 프로젝트 홈에, 게임 데이터는 Neon DB에 있어요.

## 지금 들어있는 것
- 게임 목록 + 검색(이름·말씀·태그) + 카테고리 필터 (`src/components/GameBrowser.tsx`)
- 게임 상세 페이지 (`src/app/(site)/games/[id]/page.tsx`)
- 하단 신천지 금지 안내 (`src/components/Footer.tsx`)
- Neon DB에서 승인된 게임만 읽어 표시 (`src/lib/db.ts`)
- DB 스키마와 샘플 데이터 (`neon/schema.sql`, `neon/seed.sql`, 지금은 games 테이블만, 샘플 링크는 예시 주소)
- Cloudflare Workers 자동 배포 (main 병합 시 운영, 다른 브랜치는 미리보기)
- 관리자 로그인·계정 관리 (`/admin`, Better Auth, 최고 관리자/관리자)
- 게임 심의 (`/admin/moderation`, 대기·승인·거절, 승인자 기록)
- 게임 등록·수정 (`/admin/games`, 등록하면 심의 대기로)
- 버튼·화면 전환 로딩 표시 (`src/components/ui/`)

## 다음 할 일
- 링크 메타데이터 자동 추출
- 검색 개선
- 카카오 로그인, 팁 댓글·좋아요·후기

## 내 컴퓨터에서 실행하기
```bash
npm install
npm run dev   # http://localhost:3000
```

## 기술 스택
Next.js · Tailwind CSS · Cloudflare Workers(OpenNext) · Neon PostgreSQL · Firebase Storage(예정)
