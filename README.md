# 교회 수련회 게임 모음 (church-games)

수련회·청년부 모임에서 쓸 수 있는 게임을 모아 소개하는 사이트입니다.
기획 문서는 노션 프로젝트 홈에 있어요.

## 지금 들어있는 것 (1주차 뼈대)
- 게임 목록 + 검색(이름·말씀·태그) + 카테고리 필터 (`src/components/GameBrowser.tsx`)
- 게임 상세 페이지 (`src/app/games/[id]/page.tsx`)
- 하단 신천지 금지 안내 (`src/components/Footer.tsx`)
- 샘플 게임 3개 (`src/lib/sample-games.ts`, 링크는 예시 주소)
- DB 스키마 초안 (`supabase/schema.sql`, Neon용 `neon/schema.sql`로 옮길 예정)

## 다음 할 일
- Neon DB 연결 후 노션 게임 DB 내용을 옮겨오기
- Cloudflare Pages 자동 배포 연결
- 관리자 페이지(심의 포함), 카카오 로그인, 팁 댓글·좋아요·후기

## 내 컴퓨터에서 실행하기
```bash
npm install
npm run dev   # http://localhost:3000
```

## 기술 스택
Next.js · Tailwind CSS · Cloudflare Pages/Workers · Neon PostgreSQL · Firebase Storage
