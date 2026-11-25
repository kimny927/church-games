// 같은 글이 다른 주소로 오는 경우를 하나로 맞춘다 (중복 확인용, 저장할 원본 링크도 이 모양으로)
// - 네이버 블로그: m.blog.naver.com, PostView.naver?blogId=&logNo= → https://blog.naver.com/{아이디}/{글번호}
// - 유튜브: youtu.be, shorts, m.youtube.com → https://www.youtube.com/watch?v={id}
// - 그 밖: #뒤와 utm_* 추적 값을 지우고 끝의 / 를 뗀다
export function normalizeLink(raw: string): string | undefined {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return undefined;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const parts = u.pathname.split("/").filter(Boolean);

  if (host === "blog.naver.com" || host === "m.blog.naver.com") {
    const blogId = u.searchParams.get("blogId") ?? parts[0];
    const logNo = u.searchParams.get("logNo") ?? parts[1];
    if (blogId && logNo && /^[\w-]+$/.test(blogId) && /^\d+$/.test(logNo)) return `https://blog.naver.com/${blogId}/${logNo}`;
    return undefined; // 블로그 홈 같은 글이 아닌 주소
  }

  if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com") {
    const id =
      host === "youtu.be" ? parts[0] : parts[0] === "shorts" ? parts[1] : parts[0] === "watch" ? u.searchParams.get("v") : undefined;
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube.com/watch?v=${id}` : undefined;
  }

  u.hash = "";
  for (const key of [...u.searchParams.keys()]) if (key.startsWith("utm_")) u.searchParams.delete(key);
  return u.toString().replace(/\/$/, "");
}
