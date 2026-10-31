-- 교회 수련회 게임 플랫폼 데이터 구조 (초안)
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하면 표가 만들어져요.

-- 회원 정보 (로그인하면 자동으로 한 줄 생김). 교회·전화번호는 4단계에서 사용
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  email text,
  church text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- 게임
create table games (
  id text primary key,                       -- 주소에 쓰이는 영문 이름 (예: jericho-relay)
  name text not null,
  kind text not null default '외부 링크' check (kind in ('외부 링크','자체 판매','사용자 판매')),
  summary text,
  link text,
  source_type text check (source_type in ('블로그','유튜브','인스타그램','기타')),
  tags text[] not null default '{}',
  verse text,
  game_types text[] not null default '{}',
  budget text,
  ages text[] not null default '{}',
  duration text,
  group_size text,
  supplies text,
  status text not null default '검토 전' check (status in ('검토 전','검토 중','게시','보류')),
  curator_memo text,                         -- 관리자만 보는 메모
  created_at timestamptz not null default now()
);

-- 팁 댓글
create table tips (
  id bigint generated always as identity primary key,
  game_id text not null references games on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  body text not null,
  hidden boolean not null default false,     -- 관리자가 숨김 처리
  created_at timestamptz not null default now()
);

-- 팁 좋아요 (한 사람이 한 댓글에 한 번만)
create table tip_likes (
  tip_id bigint references tips on delete cascade,
  user_id uuid references profiles on delete cascade,
  primary key (tip_id, user_id)
);

-- 후기
create table reviews (
  id bigint generated always as identity primary key,
  game_id text not null references games on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  rating int check (rating between 1 and 5),
  played_with int,                           -- 몇 명이서 했는지
  body text,
  created_at timestamptz not null default now()
);

-- 보안 규칙: 누구나 '게시' 상태 게임과 숨기지 않은 댓글을 볼 수 있고,
-- 글쓰기는 로그인한 본인만, 게임 관리는 관리자만 가능
alter table profiles enable row level security;
alter table games enable row level security;
alter table tips enable row level security;
alter table tip_likes enable row level security;
alter table reviews enable row level security;

create function is_admin() returns boolean language sql security definer stable as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
$$;

create policy "본인 프로필 보기" on profiles for select using (id = auth.uid() or is_admin());
create policy "본인 프로필 수정" on profiles for update using (id = auth.uid());

create policy "게시된 게임 보기" on games for select using (status = '게시' or is_admin());
create policy "관리자 게임 관리" on games for all using (is_admin()) with check (is_admin());

create policy "댓글 보기" on tips for select using (not hidden or is_admin());
create policy "댓글 쓰기" on tips for insert with check (user_id = auth.uid());
create policy "댓글 삭제" on tips for delete using (user_id = auth.uid() or is_admin());
create policy "관리자 댓글 숨김" on tips for update using (is_admin());

create policy "좋아요 보기" on tip_likes for select using (true);
create policy "좋아요 누르기" on tip_likes for insert with check (user_id = auth.uid());
create policy "좋아요 취소" on tip_likes for delete using (user_id = auth.uid());

create policy "후기 보기" on reviews for select using (true);
create policy "후기 쓰기" on reviews for insert with check (user_id = auth.uid());
create policy "후기 삭제" on reviews for delete using (user_id = auth.uid() or is_admin());

-- 로그인하면 profiles 에 자동으로 추가
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
