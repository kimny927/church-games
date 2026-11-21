// 관리자 닉네임 규칙. 심의 기록에서 '누가 했는지'를 알아보는 이름이라 관리자끼리 겹치지 않게 한다 (중복 확인은 db.ts)
// 닉네임은 Better Auth의 user.name 칼럼에 저장한다
const MIN = 2;
const MAX = 20;

export function parseNickname(raw: FormDataEntryValue | null): { ok: true; name: string } | { ok: false; message: string } {
  // 앞뒤 공백을 지우고, 가운데 연속 공백은 하나로
  const name = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (name.length < MIN || name.length > MAX) return { ok: false, message: `닉네임은 ${MIN}~${MAX}자로 써 주세요.` };
  return { ok: true, name };
}

export const NICKNAME_TAKEN = "이미 쓰는 닉네임이에요. 다른 닉네임을 써 주세요.";
