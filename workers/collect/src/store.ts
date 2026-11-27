// 수집 전용 DB 계정(collector)으로 Neon에 붙는다. 이 계정은 neon/collect.sql의 함수 2개만 실행할 수 있다
// (표를 직접 읽거나 쓰지 못함). 쿼리 1개가 외부 호출 1번이다 (HTTP 드라이버)
import { neon } from "@neondatabase/serverless";
import { newGameId } from "../../../src/lib/game-id";
import type { GameDraft } from "./draft";

export type SeenRecord = { link: string; result: string };

// 심의 화면에서 AI 초안과 나란히 보여 줄 참고 정보 (사용자 화면에는 안 나옴)
export type CollectMeta = {
  snippet: string; // 검색 API의 원문 요약
  keyword: string;
  confidence: number;
  author?: string;
  publishedAt?: string;
  model: string;
};

export class StoreError extends Error {}

export function createStore(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return {
    // 아직 안 본 링크만
    async unseen(links: string[]): Promise<Set<string>> {
      if (!links.length) return new Set();
      try {
        const rows = await sql`select l from collect_unseen(${links}::text[]) as l`;
        return new Set(rows.map((r) => r.l as string));
      } catch (e) {
        throw new StoreError(`DB 조회 실패 (${dbErrorCode(e)})`);
      }
    },

    // 초안 저장 + 본 글 기록 (한 번에). 넣은 게임 수를 돌려준다
    async record(drafts: GameDraft[], seen: SeenRecord[], model: string): Promise<number> {
      const rows = drafts.map((d) => ({
        id: newGameId(),
        name: d.name,
        summary: d.summary,
        link: d.link,
        source_type: d.sourceType,
        tags: d.tags,
        game_types: d.gameTypes,
        budget: d.budget,
        ages: d.ages,
        duration: d.duration,
        group_size: d.groupSize,
        supplies: d.supplies ?? null,
        thumbnail_url: d.thumbnailUrl ?? null,
        collect_meta: {
          snippet: d.candidate.snippet,
          keyword: d.candidate.keyword,
          confidence: d.confidence,
          author: d.candidate.author,
          publishedAt: d.candidate.publishedAt,
          model,
        } satisfies CollectMeta,
      }));
      try {
        const result = await sql`select collect_record(${JSON.stringify(rows)}::jsonb, ${JSON.stringify(seen)}::jsonb) as n`;
        return result[0].n as number;
      } catch (e) {
        throw new StoreError(`DB 저장 실패 (${dbErrorCode(e)})`);
      }
    },
  };
}

// 오류 메시지에는 쿼리 값이 섞일 수 있어서 Postgres 오류 코드만 남긴다
function dbErrorCode(e: unknown) {
  const code = (e as { code?: unknown }).code;
  return typeof code === "string" ? code : e instanceof Error ? e.name : "알 수 없는 오류";
}
