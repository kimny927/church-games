import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { newGameId } from "./game-id";
import type { CollectMeta, Game, GameInput, ModerationGame, ReviewStatus } from "./types";

// Neon HTTP 드라이버: 요청마다 HTTP로 쿼리해서 Cloudflare Workers처럼 연결을 오래 못 잡는 환경에 맞아요.
// DATABASE_URL 은 서버에서만 읽어요. 브라우저 코드에서 이 파일을 import 하지 마세요.
let client: NeonQueryFunction<false, false> | undefined;

function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL 이 없어요. .env.local 을 확인하세요.");
    client = neon(url);
  }
  return client;
}

// DB 칼럼(snake_case) → Game 타입(camelCase). 심의 칼럼은 사용자 화면에 필요 없어서 뺀다.
function toGame(row: Record<string, unknown>): Game {
  return {
    id: row.id as string,
    name: row.name as string,
    kind: row.kind as Game["kind"],
    summary: (row.summary as string) ?? "",
    link: (row.link as string) ?? "",
    sourceType: row.source_type as Game["sourceType"],
    tags: row.tags as string[],
    verse: (row.verse as string) ?? undefined,
    gameTypes: row.game_types as Game["gameTypes"],
    budget: row.budget as Game["budget"],
    ages: row.ages as string[],
    duration: row.duration as Game["duration"],
    groupSize: row.group_size as Game["groupSize"],
    supplies: (row.supplies as string) ?? undefined,
    thumbnailUrl: (row.thumbnail_url as string) ?? undefined,
  };
}

// 사용자 페이지용: 승인된 게임만
export async function getPublishedGames(): Promise<Game[]> {
  const rows = await sql()`select * from games where status = 'approved' order by created_at desc`;
  return rows.map(toGame);
}

export async function getPublishedGame(id: string): Promise<Game | undefined> {
  const rows = await sql()`select * from games where id = ${id} and status = 'approved'`;
  return rows[0] ? toGame(rows[0]) : undefined;
}

// ── 관리자 심의용 (requireAdmin 뒤에서만 부른다) ──

function toModerationGame(row: Record<string, unknown>): ModerationGame {
  return {
    ...toGame(row),
    status: row.status as ReviewStatus,
    autoScraped: row.auto_scraped as boolean,
    // 닉네임으로 보여 준다. 계정이 없으면(예: seed) 칼럼의 원래 값
    creator: ((row.creator_name ?? row.created_by) as string) ?? undefined,
    creatorEmail: (row.creator_email as string) ?? undefined,
    reviewer: ((row.reviewer_name ?? row.approved_by) as string) ?? undefined,
    reviewerEmail: (row.reviewer_email as string) ?? undefined,
    reviewedAt: (row.approved_at as Date) ?? undefined,
    rejectionReason: (row.rejection_reason as string) ?? undefined,
    adminNotes: (row.admin_notes as string) ?? undefined,
    createdAt: row.created_at as Date,
    // jsonb는 드라이버가 객체로 준다
    collectMeta: (row.collect_meta as CollectMeta | null) ?? undefined,
  };
}

// 대기는 먼저 들어온 것부터, 처리된 것은 최근 처리한 것부터
export async function getGamesByStatus(status: ReviewStatus): Promise<ModerationGame[]> {
  const rows = await sql()`
    select g.*, r.name as reviewer_name, r.email as reviewer_email, c.name as creator_name, c.email as creator_email
    from games g
      left join "user" r on r.id = g.approved_by
      left join "user" c on c.id = g.created_by
    where g.status = ${status}
    order by
      case when ${status} = 'pending' then g.created_at end asc,
      g.approved_at desc nulls last, g.created_at desc`;
  return rows.map(toModerationGame);
}

// 수정 화면용: 상태와 상관없이 1개
export async function getGameForAdmin(id: string): Promise<ModerationGame | undefined> {
  const rows = await sql()`
    select g.*, r.name as reviewer_name, r.email as reviewer_email, c.name as creator_name, c.email as creator_email
    from games g
      left join "user" r on r.id = g.approved_by
      left join "user" c on c.id = g.created_by
    where g.id = ${id}`;
  return rows[0] ? toModerationGame(rows[0]) : undefined;
}

export async function countGamesByStatus(): Promise<Record<ReviewStatus, number>> {
  const rows = await sql()`select status, count(*)::int as n from games group by status`;
  const counts = { pending: 0, approved: 0, rejected: 0 };
  for (const r of rows) counts[r.status as ReviewStatus] = r.n as number;
  return counts;
}

// 심의 결과 기록. 화면을 본 시점의 상태(from)일 때만 바꿔서, 다른 관리자가 먼저 처리했으면 false
// approved_by 는 거절할 때도 '심의한 사람'. 승인하면 거절 사유는 비운다 (지금 상태의 사유만 남김)
export async function reviewGame(args: {
  id: string;
  from: ReviewStatus;
  to: Exclude<ReviewStatus, "pending">;
  reviewerId: string;
  reason?: string;
}): Promise<boolean> {
  const { id, from, to, reviewerId, reason } = args;
  const rows = await sql()`
    update games
    set status = ${to}, approved_by = ${reviewerId}, approved_at = now(),
        rejection_reason = ${to === "rejected" ? (reason ?? null) : null}
    where id = ${id} and status = ${from}
    returning id`;
  return rows.length > 0;
}

// 승인 전 '원본 확인'이 필요한지 판단할 때. 폼 값이 아니라 DB를 믿는다
export async function isAutoScraped(id: string): Promise<boolean> {
  const rows = await sql()`select auto_scraped from games where id = ${id}`;
  return rows[0]?.auto_scraped === true;
}

export async function updateAdminNotes(id: string, notes: string | null): Promise<boolean> {
  const rows = await sql()`update games set admin_notes = ${notes} where id = ${id} returning id`;
  return rows.length > 0;
}

// ── 관리자 등록·수정 ──

// 새 게임은 대기(pending, DB 기본값)로 시작해 심의 화면에서 승인해야 공개된다
export async function createGame(input: GameInput, createdBy: string): Promise<{ id: string; status: ReviewStatus }> {
  const g = input;
  // id는 기본 키라 겹치면 DB가 거부한다(23505). 그때는 새 id로 다시 시도해서 같은 주소가 두 개 생기지 않는다
  // (32^6 ≈ 10억 가지라 겹치는 일 자체가 드물다)
  for (let attempt = 0; ; attempt++) {
    const id = newGameId();
    try {
      await sql()`
        insert into games (id, name, summary, link, source_type, tags, verse, game_types, budget, ages, duration, group_size, supplies, thumbnail_url, created_by)
        values (${id}, ${g.name}, ${g.summary}, ${g.link}, ${g.sourceType}, ${g.tags}, ${g.verse ?? null}, ${g.gameTypes},
                ${g.budget}, ${g.ages}, ${g.duration}, ${g.groupSize}, ${g.supplies ?? null}, ${g.thumbnailUrl ?? null}, ${createdBy})`;
      return { id, status: "pending" };
    } catch (e) {
      const uniqueViolation = (e as { code?: string }).code === "23505";
      if (!uniqueViolation || attempt >= 2) throw e;
    }
  }
}

// 내용만 고친다. 상태·심의 기록은 그대로 (승인된 게임은 바로 반영). 고친 시각은 updated_at 트리거가 남긴다
export async function updateGame(id: string, input: GameInput): Promise<ReviewStatus | undefined> {
  const g = input;
  const rows = await sql()`
    update games
    set name = ${g.name}, summary = ${g.summary}, link = ${g.link}, source_type = ${g.sourceType}, tags = ${g.tags},
        verse = ${g.verse ?? null}, game_types = ${g.gameTypes}, budget = ${g.budget}, ages = ${g.ages},
        duration = ${g.duration}, group_size = ${g.groupSize}, supplies = ${g.supplies ?? null},
        thumbnail_url = ${g.thumbnailUrl ?? null}
    where id = ${id}
    returning status`;
  return rows[0]?.status as ReviewStatus | undefined;
}

// ── 관리자 닉네임 (Better Auth의 user.name) ──

// 대소문자·앞뒤 공백을 무시하고 겹치는지 본다. 내 닉네임을 그대로 저장할 때는 exceptUserId로 나를 뺀다
export async function isNicknameTaken(name: string, exceptUserId?: string): Promise<boolean> {
  const rows = await sql()`
    select 1 from "user"
    where lower(trim(name)) = lower(${name}) and id <> ${exceptUserId ?? ""}
    limit 1`;
  return rows.length > 0;
}
