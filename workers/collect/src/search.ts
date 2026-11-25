// 공식 검색 API로 후보 글을 찾는다 (HTML 크롤링 없음). 키워드 하나에 외부 호출 1번
// - 카카오 Daum 블로그 검색: 하루 30,000번 무료, 결제 수단 없음 (티스토리·네이버 블로그 등)
// - 유튜브 Data API search: 1번에 100단위, 하루 10,000단위 무료
// 둘 다 무료 한도를 넘으면 오류만 나고 과금되지 않는다.
// 네이버 검색 API는 2026-07에 개발자센터 신규 신청이 끝나고 '한시적 무료'인 NAVER API HUB로 옮겨 가서 쓰지 않는다
import type { Fetcher } from "./budget";
import { RESULTS_PER_KEYWORD } from "./rules";
import { cleanText } from "./text";
import { normalizeLink } from "./url";

export type Candidate = {
  sourceType: "블로그" | "유튜브";
  link: string; // normalizeLink를 거친 주소
  title: string; // 정리한 원래 제목 (100자)
  snippet: string; // 검색 API가 주는 짧은 요약 (300자). AI에는 제목과 이것만 넣는다
  author?: string;
  publishedAt?: string; // YYYY-MM-DD
  thumbnail?: string; // 검색 API가 주는 대표 이미지 (https만)
  keyword: string;
};

export class SearchError extends Error {}

const LIMIT = { title: 100, snippet: 300, author: 50 };

type DaumItem = { title?: string; contents?: string; url?: string; blogname?: string; thumbnail?: string; datetime?: string };

export async function searchDaumBlog(keyword: string, restApiKey: string, fetcher: Fetcher): Promise<Candidate[]> {
  const params = new URLSearchParams({ query: keyword, sort: "recency", size: String(RESULTS_PER_KEYWORD) });
  const res = await fetcher(`https://dapi.kakao.com/v2/search/blog?${params}`, { headers: { Authorization: `KakaoAK ${restApiKey}` } });
  // 응답 본문은 로그에 남기지 않는다 (상태 코드만)
  if (!res.ok) throw new SearchError(`카카오 블로그 검색 실패 (HTTP ${res.status})`);
  const data = (await res.json()) as { documents?: DaumItem[] };

  return (data.documents ?? []).flatMap((item): Candidate[] => {
    const link = item.url && normalizeLink(item.url);
    const title = cleanText(item.title, LIMIT.title);
    if (!link || !title) return [];
    return [
      {
        sourceType: "블로그",
        link,
        title,
        snippet: cleanText(item.contents, LIMIT.snippet),
        author: cleanText(item.blogname, LIMIT.author) || undefined,
        publishedAt: item.datetime?.slice(0, 10), // ISO 8601 (한국 시간)
        thumbnail: item.thumbnail?.startsWith("https://") ? item.thumbnail : undefined,
        keyword,
      },
    ];
  });
}

type YouTubeItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url?: string } | undefined>;
  };
};

export async function searchYouTube(keyword: string, apiKey: string, fetcher: Fetcher): Promise<Candidate[]> {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    order: "date",
    maxResults: String(RESULTS_PER_KEYWORD),
    regionCode: "KR",
    relevanceLanguage: "ko",
    safeSearch: "strict",
    q: keyword,
  });
  // 키는 주소(?key=)가 아니라 헤더로 보낸다. 주소는 오류·로그에 찍히기 쉽다
  const res = await fetcher(`https://www.googleapis.com/youtube/v3/search?${params}`, { headers: { "X-Goog-Api-Key": apiKey } });
  if (!res.ok) throw new SearchError(`유튜브 검색 실패 (HTTP ${res.status})`);
  const data = (await res.json()) as { items?: YouTubeItem[] };

  return (data.items ?? []).flatMap((item): Candidate[] => {
    const id = item.id?.videoId;
    const link = id && normalizeLink(`https://www.youtube.com/watch?v=${id}`);
    const s = item.snippet;
    const title = cleanText(s?.title, LIMIT.title);
    if (!link || !title) return [];
    const thumb = s?.thumbnails?.high?.url ?? s?.thumbnails?.medium?.url ?? s?.thumbnails?.default?.url;
    return [
      {
        sourceType: "유튜브",
        link,
        title,
        snippet: cleanText(s?.description, LIMIT.snippet),
        author: cleanText(s?.channelTitle, LIMIT.author) || undefined,
        publishedAt: s?.publishedAt?.slice(0, 10),
        thumbnail: thumb?.startsWith("https://") ? thumb : undefined,
        keyword,
      },
    ];
  });
}
