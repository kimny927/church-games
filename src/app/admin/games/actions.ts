"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/app/admin/admins/actions";
import { requireAdmin } from "@/lib/admin";
import { createGame, updateGame } from "@/lib/db";
import { parseGameForm } from "@/lib/game-form";

// 등록: 대기로 들어가서 심의 화면 대기 탭으로 보낸다. 등록자는 폼이 아니라 DB로 확인한 세션에서
export async function createGameAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ fresh: true });
  const parsed = parseGameForm(form);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { status } = await createGame(parsed.input, user.id);
  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
  redirect(`/admin/moderation?status=${status}`);
}

// 수정: 상태는 그대로라 그 게임이 있는 탭으로 돌아간다
export async function updateGameAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin({ fresh: true });
  const parsed = parseGameForm(form);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const status = await updateGame(String(form.get("id")), parsed.input);
  if (!status) return { ok: false, message: "게임을 찾지 못했어요. 이미 지워졌을 수 있어요." };
  revalidatePath("/admin/moderation");
  redirect(`/admin/moderation?status=${status}`);
}
