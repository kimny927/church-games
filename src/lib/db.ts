import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { Game, ModerationGame, ReviewStatus } from "./types";

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
    reviewer: ((row.reviewer_email ?? row.approved_by) as string) ?? undefined,
    reviewedAt: (row.approved_at as Date) ?? undefined,
    rejectionReason: (row.rejection_reason as string) ?? undefined,
    adminNotes: (row.admin_notes as string) ?? undefined,
    createdAt: row.created_at as Date,
  };
}

// 대기는 먼저 들어온 것부터, 처리된 것은 최근 처리한 것부터
export async function getGamesByStatus(status: ReviewStatus): Promise<ModerationGame[]> {
  const rows = await sql()`
    select g.*, u.email as reviewer_email
    from games g left join "user" u on u.id = g.approved_by
    where g.status = ${status}
    order by
      case when ${status} = 'pending' then g.created_at end asc,
      g.approved_at desc nulls last, g.created_at desc`;
  return rows.map(toModerationGame);
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

export async function updateAdminNotes(id: string, notes: string | null): Promise<boolean> {
  const rows = await sql()`update games set admin_notes = ${notes} where id = ${id} returning id`;
  return rows.length > 0;
}
