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
- 관리자 로그인·계정 관리 (`/admin`, Better Auth, 최고 관리자/관리자, 닉네임)
- 게임 심의 (`/admin/moderation`, 대기·승인·거절, 승인자 기록, 다시 심의하기, 자동 수집 게임은 AI 초안과 원문 비교·원본 확인 후 승인)
- 게임 등록·수정 (`/admin/games`, 등록하면 심의 대기로, 링크에서 제목·썸네일 가져오기)
- 게임 썸네일 (카드·상세·심의 화면, 원본 이미지 주소만 저장)
- 버튼·화면 전환 로딩 표시 (`src/components/ui/`)
- 자동 수집 (매일 06:00 블로그·유튜브 검색 → AI가 하루 최대 3개 초안 → 심의 대기, 자동 승인 없음. `/admin/collect`에서 켜기/끄기·실행 기록, `workers/collect/`)

## 다음 할 일
- 자동 수집 결과 보고 수량·거르기 조정
- 관리자 이메일 비밀번호 재설정 (계획 중, 도메인 결정 필요)
- 검색 개선
- 카카오 로그인, 팁 댓글·좋아요·후기

## 내 컴퓨터에서 실행하기
```bash
npm install
npm run dev   # http://localhost:3000
```

## 기술 스택
Next.js · Tailwind CSS · Cloudflare Workers(OpenNext) · Neon PostgreSQL · Firebase Storage(예정)
