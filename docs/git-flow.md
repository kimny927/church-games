# 깃 플로우 규칙

GitHub Flow를 간소화해서 쓴다. main 하나와 짧게 사는 작업 브랜치만 둔다.
Git Flow(develop·release 브랜치)는 1인 개발 + main 자동 배포 구조에는 과하다.

## 원칙
- **main = 항상 배포 가능한 상태.** main 병합이 곧 운영 배포다 (Cloudflare Workers).
- **main에 직접 커밋·push하지 않는다.** 모든 변경은 브랜치 → PR → 병합.
- **기능 하나 = 브랜치 하나 = PR 하나.** 며칠 안에 병합할 수 있는 크기로 나눈다.

## 브랜치 이름
`종류/짧은-설명` — 설명은 영어 kebab-case, 이슈가 있으면 번호를 앞에 붙인다.

| 종류 | 언제 |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서만 바꿀 때 |
| `refactor` | 동작은 그대로, 코드 구조만 바꿀 때 |
| `chore` | 설정·의존성·CI 등 기능과 직접 관계없는 작업 |
| `style` | UI 스타일 조정 (동작 변화 없음) |
| `test` | 테스트 추가·수정 |

예: `feat/game-filter`, `fix/mobile-header-overflow`, `feat/12-game-filter` (이슈 #12)

설명을 영어로 쓰는 이유: Cloudflare Workers는 브랜치 이름을 미리보기 주소로 바꿀 때 영문·숫자가 아닌 글자를 `-`로 바꾼다.
한글로 쓰면 `feat/게임-필터`와 `feat/검색-개선`이 같은 주소가 되어 서로 덮어쓸 수 있다.
한국어 설명은 PR 제목과 커밋 메시지에 쓴다.

## 작업 순서
1. 시작 전 main 최신화: `git switch main && git pull`
2. 브랜치 생성: `git switch -c feat/game-filter`
3. 작업 + 커밋 (브랜치 안의 커밋은 자유롭게, 병합 때 하나로 합쳐진다)
4. PR 전 확인: `npm run lint` · `npm run build` 통과, 모바일 화면 확인
   - 스택·명령어·폴더 구조·규칙을 바꿨다면 문서 점검(Claude Code 전역 스킬 `/doc-drift-check`)으로 CLAUDE.md·README·docs가 어긋나지 않았는지 확인
5. push 후 PR 생성: `git push -u origin feat/game-filter` → `gh pr create`
6. CI 통과 + 나연 리뷰 후 **Squash 병합**
7. 정리: 원격·로컬 브랜치 삭제, 로컬 main 동기화
   `gh pr merge --squash --delete-branch` 를 쓰면 한 번에 처리된다.

## PR 본문
제목은 한국어로 무엇을 바꿨는지. 본문은 세 부분:
- **무엇을**: 바꾼 내용
- **왜**: 바꾼 이유
- **확인한 것**: 빌드·린트, 모바일 화면, 미리보기 URL 등

## 병합 방식: Squash만 사용
PR 하나가 main에서 커밋 하나가 된다. Squash 커밋 메시지(PR 제목·본문)는 한국어로 무엇을 왜 바꿨는지 쓴다.
- main 기록이 "커밋 1개 = 기능 1개"로 읽기 쉽다.
- 작업 중의 "오타 수정" 같은 커밋이 main에 남지 않는다.
- 되돌릴 때 커밋 하나만 revert하면 된다.

브랜치 안의 세부 커밋은 PR 페이지에 남는다. 저장소 설정에서 Merge commit·Rebase 병합은 꺼 두었다.

## 시스템으로 강제하는 것
규칙을 글로만 두면 사람도 AI도 놓친다. 그래서 GitHub가 막아 주게 했다.
- **PR 빌드 CI** (`.github/workflows/ci.yml`): PR과 main push마다 `npm ci` → `lint` → `build`를 자동 실행한다.
- **main 브랜치 보호**: PR을 통해서만 병합할 수 있고, CI(`build` 체크) 통과가 필수다. force push와 main 삭제는 막는다.
  - 리뷰 승인은 필수로 두지 않는다 (혼자 개발해서 승인해 줄 사람이 없음).
  - 관리자(나연)는 예외로 둔다. 급한 상황에만 우회하고, 평소에는 규칙대로 PR을 쓴다.

## 배포
- main 병합 → 운영 배포
- 다른 브랜치 → Cloudflare Workers 미리보기 URL (브랜치별 `<브랜치>-church-games.kimny927.workers.dev`, 커밋별 `<버전ID 앞 8자리>-church-games.kimny927.workers.dev`)
  - URL은 PR의 Checks 탭 → "Workers Builds: church-games" 상세에 나온다 (PR 댓글에는 안 나옴)
- 운영 주소: `church-games.kimny927.workers.dev`
