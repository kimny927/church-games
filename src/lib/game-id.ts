// 게임 주소에 쓰는 id (g- + 무작위 6자, decisions 2026-11-21). 사이트(db.ts)와 수집 Worker가 같이 쓴다.
// 헷갈리는 글자(0·o, 1·l)는 뺀다. 등록 후에는 바꾸지 않는다 (링크가 깨지지 않게)
const ID_CHARS = "abcdefghijkmnpqrstuvwxyz23456789";

export function newGameId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "g-" + Array.from(bytes, (b) => ID_CHARS[b % ID_CHARS.length]).join("");
}
