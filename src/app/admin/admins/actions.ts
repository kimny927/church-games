"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { isAPIError } from "better-auth/api";
import { requireAdmin } from "@/lib/admin";
import { getAuth, type AdminRole } from "@/lib/auth";
import { generateTempPassword } from "@/lib/password";

export type ActionState = { ok: boolean; message: string; tempPassword?: string } | null;

// 모든 액션: owner인지 확인 → 로그인한 사람의 headers를 넘겨 Better Auth가 권한을 다시 확인하게 한다
async function run(work: () => Promise<Omit<NonNullable<ActionState>, "ok">>): Promise<ActionState> {
  await requireAdmin({ role: "owner" });
  try {
    const result = await work();
    revalidatePath("/admin/admins");
    return { ok: true, ...result };
  } catch (e) {
    if (isAPIError(e)) return { ok: false, message: e.body?.message ?? e.message };
    throw e;
  }
}

const toRole = (v: FormDataEntryValue | null): AdminRole => (v === "owner" ? "owner" : "admin");

export async function addAdmin(_: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get("email")).trim().toLowerCase();
  const name = String(form.get("name")).trim() || email.split("@")[0];
  return run(async () => {
    const tempPassword = generateTempPassword();
    await getAuth().api.createUser({
      body: { email, name, password: tempPassword, role: toRole(form.get("role")), data: { mustChangePassword: true } },
      headers: await headers(),
    });
    return { message: `${email} 계정을 만들었어요.`, tempPassword };
  });
}

// 비밀번호 초기화: 임시 비밀번호 → 변경 필요 표시 → 기존 로그인 해제 (트랜잭션이 없어 이 순서로)
export async function resetPassword(_: ActionState, form: FormData): Promise<ActionState> {
  const userId = String(form.get("userId"));
  return run(async () => {
    const h = await headers();
    const tempPassword = generateTempPassword();
    await getAuth().api.setUserPassword({ body: { userId, newPassword: tempPassword }, headers: h });
    await getAuth().api.adminUpdateUser({ body: { userId, data: { mustChangePassword: true } }, headers: h });
    await getAuth().api.revokeUserSessions({ body: { userId }, headers: h });
    return { message: "비밀번호를 초기화했어요. 기존 로그인은 모두 끊겼어요.", tempPassword };
  });
}

export async function setRole(_: ActionState, form: FormData): Promise<ActionState> {
  const userId = String(form.get("userId"));
  return run(async () => {
    await getAuth().api.setRole({ body: { userId, role: toRole(form.get("role")) }, headers: await headers() });
    return { message: "역할을 바꿨어요." };
  });
}

export async function removeAdmin(_: ActionState, form: FormData): Promise<ActionState> {
  const userId = String(form.get("userId"));
  return run(async () => {
    await getAuth().api.removeUser({ body: { userId }, headers: await headers() });
    return { message: "계정을 삭제했어요." };
  });
}
