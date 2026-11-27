-- 자동 수집 3단계: 수집 Worker가 쓰는 DB 구조와 수집 전용 계정 (decisions 2026-11-27)
-- Neon 콘솔 > SQL Editor에서 '소유자 계정(neondb_owner)'으로 1 → 2 → 3 순서로 실행한다.
-- 먼저 테스트용 Neon 브랜치에서 실행해 확인하고, 그다음 운영(main) 브랜치에서 실행한다.
--
-- 설계: 수집 계정(collector)에는 테이블 권한을 주지 않고 아래 함수 2개의 실행 권한만 준다.
-- 함수가 상태를 'pending', auto_scraped를 true로 고정하므로, 수집 키가 새도 게임을 읽거나 승인·수정·삭제할 수 없다.

-- ── 1. 칼럼·테이블 ──

-- 자동 수집 게임의 심의 참고 정보 (검색 API의 원문 요약·검색어·AI 확신도·글 날짜). 관리자 화면에서만 읽는다
alter table games add column if not exists collect_meta jsonb;

-- AI까지 보낸 글. 다음 날 같은 글에 AI 호출을 다시 쓰지 않게 한다.
-- 호출 오류로 판단을 못 받은 글은 넣지 않는다 (다음 날 다시 시도)
create table if not exists collect_seen (
  link text primary key,                 -- normalizeLink를 거친 주소
  result text not null,                  -- '초안' 또는 AI가 버린 이유
  seen_at timestamptz not null default now()
);

-- ── 2. 수집 Worker가 부르는 함수 ──
-- security definer: 함수를 만든 소유자 권한으로 돈다. search_path를 고정해 다른 스키마의 같은 이름 표로 바꿔치기하지 못하게 한다

-- 아직 안 본 링크만 돌려준다. 관리자가 직접 등록한 게임의 링크도 '본 글'로 친다
create or replace function collect_unseen(links text[]) returns setof text
language sql stable security definer set search_path = public, pg_temp as $$
  select distinct l from unnest(links) as l
  where not exists (select 1 from collect_seen s where s.link = l)
    and not exists (select 1 from games g where g.link = l)
$$;

-- 초안 저장과 '본 글' 기록을 한 번에 (둘 중 하나만 되는 일이 없게). 넣은 게임 수를 돌려준다
create or replace function collect_record(drafts jsonb, seen jsonb) returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  inserted int;
begin
  -- 수집은 하루 최대 3개. 키가 새서 누가 대기열을 채우려 해도 한 번에 많이 넣지 못하게
  if jsonb_array_length(drafts) > 3 then
    raise exception 'collect_record: 초안은 한 번에 3개까지';
  end if;

  insert into games (id, name, summary, link, source_type, tags, game_types, budget, ages, duration, group_size,
                     supplies, thumbnail_url, collect_meta, status, auto_scraped)
  select d.id, left(d.name, 100), left(d.summary, 300), d.link, d.source_type,
         coalesce(d.tags, '{}'), coalesce(d.game_types, '{}'), d.budget, coalesce(d.ages, '{}'), d.duration, d.group_size,
         left(d.supplies, 200), d.thumbnail_url, d.collect_meta,
         'pending', true                -- 함수가 고정한다. 자동 수집 게임은 자동 승인하지 않는다 (2026-11-25)
  from jsonb_to_recordset(drafts) as d(
    id text, name text, summary text, link text, source_type text, tags text[], game_types text[], budget text,
    ages text[], duration text, group_size text, supplies text, thumbnail_url text, collect_meta jsonb)
  where d.id like 'g-%' and d.link like 'https://%'
    and not exists (select 1 from games g where g.link = d.link);
  get diagnostics inserted = row_count;

  insert into collect_seen (link, result)
  select s.link, left(s.result, 100) from jsonb_to_recordset(seen) as s(link text, result text)
  where s.link like 'https://%'
  on conflict (link) do nothing;

  return inserted;
end $$;

-- ── 3. 수집 전용 계정 ──
-- 콘솔의 Roles 화면에서 만들면 neon_superuser에 들어가 권한이 넓어진다. 그래서 SQL로 만든다.
-- 비밀번호는 별도 터미널에서 `openssl rand -hex 32`로 만들어 아래에 넣고, 실행한 뒤 SQL Editor 기록에서 지운다.
-- (hex는 연결 문자열에서 인코딩할 문자가 없다. Claude Code의 `!`로 만들면 대화 기록에 남으니 쓰지 않는다)
-- create role collector with login password '여기에-비밀번호';

-- 함수는 기본으로 누구나(PUBLIC) 실행할 수 있다. 먼저 빼고 collector에게만 준다
revoke execute on function collect_unseen(text[]) from public;
revoke execute on function collect_record(jsonb, jsonb) from public;
grant execute on function collect_unseen(text[]) to collector;
grant execute on function collect_record(jsonb, jsonb) to collector;

-- 확인: npm run collect:db-check (collector로 표를 읽거나 쓰려 하면 거부되는지 본다)
