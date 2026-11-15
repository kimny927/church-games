import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { Game } from "./types";

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
