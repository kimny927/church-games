// [spike] 비밀번호 해시: Web Crypto PBKDF2-SHA256.
// Better Auth 기본(scrypt, JS 구현)은 Workers 무료 플랜 CPU 10ms를 넘기기 쉬워 네이티브 PBKDF2로 바꾼다.
// Workers 런타임은 PBKDF2 반복 횟수를 최대 100,000으로 제한한다.
const ITERATIONS = 100_000;
const enc = new TextEncoder();

const toB64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
}

// 저장 형식: pbkdf2_sha256$반복횟수$salt$hash
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2_sha256$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword({ hash, password }: { hash: string; password: string }) {
  const [algo, iter, salt, expected] = hash.split("$");
  if (algo !== "pbkdf2_sha256" || !iter || !salt || !expected) return false;
  const actual = await derive(password, fromB64(salt), Number(iter));
  const want = fromB64(expected);
  // 길이·내용을 끝까지 비교해 응답 시간으로 정답을 추측하지 못하게 한다(상수 시간 비교)
  let diff = actual.length ^ want.length;
  for (let i = 0; i < Math.min(actual.length, want.length); i++) diff |= actual[i] ^ want[i];
  return diff === 0;
}
