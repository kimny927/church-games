// 원본 링크에서 제목·설명·썸네일을 가져온다 (게임 등록 폼의 '정보 가져오기'). 서버에서만 import.
// 관리자가 버튼을 누를 때 한 번 가져오는 링크 미리보기다. 정기 수집(스크래핑)은 여기서 하지 않는다.
// Workers 무료 플랜은 CPU 10ms라서 DOM 파서 없이 <head> 부분만 정규식으로 읽는다 (응답 대기 시간은 CPU에 안 들어감)
import { isHttpUrl } from "./game-form";
import type { SourceType } from "./types";

export type LinkMeta = {
  title?: string;
  description?: string; // 원문 설명. 참고로만 보여 주고 저장하지 않는다 (저작권)
  image?: string;
  sourceType: SourceType;
};

type Result = { ok: true; meta: LinkMeta } | { ok: false; message: string };

const TIMEOUT_MS = 5000;
const MAX_BYTES = 256 * 1024; // <head>가 이보다 길면 거기까지만 본다
const MAX_REDIRECTS = 3;
const MAX = { title: 100, description: 300, image: 1000 };
const USER_AGENT = "Mozilla/5.0 (compatible; church-games-link-preview/1.0)";

const BLOG_HOSTS = ["blog.naver.com", "m.blog.naver.com", "brunch.co.kr", "medium.com", "velog.io"];
const BLOG_SUFFIXES = [".tistory.com", ".blogspot.com"];

const hostOf = (url: string) => new URL(url).hostname.toLowerCase().replace(/^www\./, "");

// 주소만 보고 소스 종류를 추측한다. 관리자가 폼에서 바꿀 수 있다
export function guessSourceType(url: string): SourceType {
  const host = hostOf(url);
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") return "유튜브";
  if (host === "instagram.com") return "인스타그램";
  if (BLOG_HOSTS.includes(host) || BLOG_SUFFIXES.some((s) => host.endsWith(s))) return "블로그";
  return "기타";
}

// 내부 주소로 요청하지 않게 막는다 (SSRF). 배포 환경은 wrangler의 global_fetch_strictly_public가 한 번 더 막지만,
// next dev(Node)에는 그 설정이 없어서 코드에서도 거른다. IP를 직접 쓴 주소는 게임 소개 글일 리 없어 모두 거절
function isAllowedUrl(url: string) {
  if (!isHttpUrl(url)) return false;
  const host = new URL(url).hostname.toLowerCase();
  if (host === "localhost" || /\.(localhost|local|internal)$/.test(host)) return false;
  if (/^\d+(\.\d+){3}$/.test(host) || host.startsWith("[")) return false;
  return true;
}

// 리다이렉트를 직접 따라가며 단계마다 주소를 다시 확인한다 (자동으로 따라가면 내부 주소로 튀어도 모른다)
async function safeFetch(url: string, signal: AbortSignal): Promise<Response | undefined> {
  let current = url;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    if (!isAllowedUrl(current)) return undefined;
    const res = await fetch(current, {
      redirect: "manual",
      signal,
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/json;q=0.9,*/*;q=0.5" },
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current).toString();
      continue;
    }
    return res;
  }
  return undefined;
}

const clip = (v: string | undefined, max: number) => {
  const s = v?.replace(/\s+/g, " ").trim();
  return s ? (s.length > max ? `${s.slice(0, max - 1)}…` : s) : undefined;
};

// og 태그에 자주 나오는 엔티티만 푼다
function decodeEntities(s: string) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

// 썸네일은 http(s) 절대 주소만 받는다 (상대 경로는 원본 주소 기준으로 바꿈)
function toImageUrl(src: string | undefined, base: string) {
  if (!src) return undefined;
  try {
    const url = new URL(src, base).toString();
    return isHttpUrl(url) && url.length <= MAX.image ? url : undefined;
  } catch {
    return undefined;
  }
}

// 본문을 앞에서부터 읽다가 </head>를 만나거나 MAX_BYTES가 되면 멈춘다
async function readHead(res: Response): Promise<string> {
  const charset = /charset=([^;]+)/i.exec(res.headers.get("content-type") ?? "")?.[1]?.trim();
  let decoder: TextDecoder;
  try {
    decoder = new TextDecoder(charset || "utf-8");
  } catch {
    decoder = new TextDecoder("utf-8"); // 런타임이 모르는 charset이면 utf-8로 (한글이 깨질 수 있음)
  }
  if (!res.body) return "";
  const reader = res.body.getReader();
  let text = "";
  let bytes = 0;
  while (bytes < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    text += decoder.decode(value, { stream: true });
    if (/<\/head>/i.test(text)) break;
  }
  await reader.cancel().catch(() => {});
  const end = text.search(/<\/head>/i);
  return end >= 0 ? text.slice(0, end) : text;
}

// <meta property|name="..." content="..."> 를 {이름: 값}으로. 속성 순서와 따옴표 종류가 사이트마다 달라서 속성을 하나씩 읽는다
function parseMetaTags(head: string) {
  const meta: Record<string, string> = {};
  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs: Record<string, string> = {};
    for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
      attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
    }
    const key = (attrs.property ?? attrs.name)?.toLowerCase();
    if (key && attrs.content && !(key in meta)) meta[key] = decodeEntities(attrs.content);
  }
  return meta;
}

// 유튜브는 oEmbed(JSON)가 HTML보다 가볍고 정확하다. 설명은 주지 않는다
async function fetchYouTube(url: string, signal: AbortSignal): Promise<LinkMeta | undefined> {
  const res = await safeFetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, signal);
  if (!res?.ok) return undefined;
  const data = (await res.json()) as { title?: string; thumbnail_url?: string };
  return {
    title: clip(data.title, MAX.title),
    image: toImageUrl(data.thumbnail_url, url),
    sourceType: "유튜브",
  };
}

async function fetchHtml(url: string, signal: AbortSignal): Promise<LinkMeta | undefined> {
  const res = await safeFetch(url, signal);
  if (!res?.ok || !/html/i.test(res.headers.get("content-type") ?? "")) return undefined;
  const head = await readHead(res);
  const meta = parseMetaTags(head);
  const titleTag = /<title[^>]*>([^<]*)<\/title>/i.exec(head)?.[1];
  const result: LinkMeta = {
    title: clip(meta["og:title"] ?? meta["twitter:title"] ?? (titleTag && decodeEntities(titleTag)), MAX.title),
    description: clip(meta["og:description"] ?? meta["twitter:description"] ?? meta.description, MAX.description),
    image: toImageUrl(meta["og:image"] ?? meta["twitter:image"], url),
    sourceType: guessSourceType(url),
  };
  return result.title || result.description || result.image ? result : undefined;
}

export async function fetchLinkMeta(url: string): Promise<Result> {
  if (!isAllowedUrl(url)) return { ok: false, message: "이 주소에서는 정보를 가져올 수 없어요." };
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  try {
    const meta =
      (guessSourceType(url) === "유튜브" ? await fetchYouTube(url, signal) : undefined) ??
      (await fetchHtml(url, signal));
    if (meta) return { ok: true, meta };
  } catch (e) {
    // 시간 초과·연결 실패·차단. 원인은 서버 로그로만 남긴다
    console.warn("link meta fetch failed", url, e instanceof Error ? e.message : e);
  }
  return { ok: false, message: "정보를 가져오지 못했어요. 직접 입력해 주세요." };
}
