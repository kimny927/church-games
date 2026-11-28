-- 자동 수집 켜기/끄기와 실행 기록 (3단계 PR ③). neon/collect.sql을 먼저 실행한 DB에서, 소유자 계정으로 Neon 콘솔 SQL Editor에 실행한다.
-- 여러 번 실행해도 된다 (if not exists / create or replace / on conflict do nothing).
-- 수집 Worker는 cron으로 매일 깨지만, 맨 먼저 collect_enabled()를 확인해 꺼져 있으면 검색·AI를 부르지 않는다.
-- 처음 값은 꺼짐. 관리자 화면(/admin/collect)에서 켠다 (docs/decisions.md 2026-11-28)

-- ── 1. 표 ──
-- 한 줄짜리 설정 표. id가 늘 true라서 두 번째 줄을 넣을 수 없다
create table if not exists collect_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  updated_by text references "user"(id) on delete set null,  -- 마지막으로 켜거나 끈 관리자
  updated_at timestamptz
);
insert into collect_settings (id) values (true) on conflict (id) do nothing;

-- 실행 기록. 개수·호출 수·토큰·오류 종류만 (글 제목·링크·비밀값은 넣지 않는다). 최근 60개만 남긴다
create table if not exists collect_runs (
  id bigserial primary key,
  ran_at timestamptz not null default now(),
  status text not null check (status in ('ok', 'off', 'failed')),  -- 수집함 / 꺼져 있어 건너뜀 / 실패
  summary jsonb
);
create index if not exists collect_runs_ran_at on collect_runs (ran_at desc);

-- ── 2. 수집 Worker가 부르는 함수 (collect.sql과 같은 방식: security definer, search_path 고정) ──

-- 켜져 있는지. 설정 줄이 없으면 꺼짐으로 본다
create or replace function collect_enabled() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select enabled from collect_settings where id), false)
$$;

-- 실행 결과 기록. 요약이 크면(4KB 초과) 거절해서, 키가 새도 표를 크게 채우지 못하게 한다
create or replace function collect_log_run(run_status text, run_summary jsonb) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if run_status not in ('ok', 'off', 'failed') then
    raise exception 'collect_log_run: 알 수 없는 상태';
  end if;
  if run_summary is not null and octet_length(run_summary::text) > 4096 then
    raise exception 'collect_log_run: 요약은 4KB까지';
  end if;
  insert into collect_runs (status, summary) values (run_status, run_summary);
  delete from collect_runs where id not in (select id from collect_runs order by ran_at desc, id desc limit 60);
end $$;

-- ── 3. 권한: collector는 함수만 ──
revoke execute on function collect_enabled() from public;
revoke execute on function collect_log_run(text, jsonb) from public;
grant execute on function collect_enabled() to collector;
grant execute on function collect_log_run(text, jsonb) to collector;

-- 확인: npm run collect:db-check
