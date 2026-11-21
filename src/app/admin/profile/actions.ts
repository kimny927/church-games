"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { ActionState } from "@/app/admin/admins/actions";
import { requireAdmin } from "@/lib/admin";
import { getAuth } from "@/lib/auth";
import { isNicknameTaken } from "@/lib/db";
import { NICKNAME_TAKEN, parseNickname } from "@/lib/nickname";

// 내 닉네임 바꾸기. Better Auth의 updateUser는 로그인한 본인만 바꾸고, 역할·mustChangePassword는 입력으로 받지 않는다
export async function updateNickname(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ fresh: true });
  const parsed = parseNickname(form.get("name"));
  if (!parsed.ok) return { ok: false, message: parsed.message };
  if (parsed.name === user.name) return { ok: true, message: "지금 닉네임과 같아요." };
  if (await isNicknameTaken(parsed.name, user.id)) return { ok: false, message: NICKNAME_TAKEN };

  await getAuth().api.updateUser({ body: { name: parsed.name }, headers: await headers() });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `닉네임을 '${parsed.name}'(으)로 바꿨어요.` };
}
