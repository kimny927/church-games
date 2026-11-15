-- 교회 수련회 게임 플랫폼 데이터 구조 (1단계: 게임)
-- Neon 콘솔 > SQL Editor 에 붙여넣고 실행하면 표가 만들어져요.
-- 회원·댓글·후기 테이블은 로그인 방식을 정하는 4주차에 추가합니다.
--
-- Neon에는 Supabase의 auth·RLS가 없어서, 권한은 서버 코드가 판단합니다.
-- 브라우저는 DB에 직접 붙지 않고, 사용자 페이지는 status = 'approved' 게임만 조회합니다.

create table games (
  id text primary key,                       -- 주소에 쓰이는 영문 이름 (예: jericho-relay)
  name text not null,
  kind text not null default '외부 링크' check (kind in ('외부 링크','자체 판매','사용자 판매')),
  summary text,                              -- 큐레이터 소개글 (원본 복사 금지, 요약만)
  link text,                                 -- 원본 블로그·유튜브·노션 링크
  source_type text check (source_type in ('블로그','유튜브','인스타그램','기타')),
  tags text[] not null default '{}',
  verse text,                                -- 관련 말씀
  game_types text[] not null default '{}',
  budget text,
  ages text[] not null default '{}',
  duration text,
  group_size text,
  supplies text,                             -- 준비물

  -- 심의
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  auto_scraped boolean not null default false, -- false: 직접 입력(반자동), true: 자동 수집
  approved_by text,                          -- 심의한 운영자. 회원 테이블이 생기면 참조로 바꿈
  approved_at timestamptz,
  rejection_reason text,
  admin_notes text,                          -- 관리자만 보는 메모

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 거절할 때는 사유를 꼭 남긴다 (관리자 페이지든 스크래핑이든 같은 규칙)
  constraint rejection_needs_reason check (status <> 'rejected' or rejection_reason is not null)
);

-- 사용자 페이지는 승인된 게임만 조회하므로 status로 자주 거른다
create index games_status_idx on games (status);

-- 행을 고치면 updated_at 을 자동으로 갱신
create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger games_set_updated_at before update on games
  for each row execute function set_updated_at();
