"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/app/admin/admins/actions";
import { requireAdmin } from "@/lib/admin";
import { createGame, updateGame } from "@/lib/db";
import { isHttpUrl, parseGameForm } from "@/lib/game-form";
import { fetchLinkMeta } from "@/lib/link-meta";

// 원본 링크에서 제목·설명·썸네일 가져오기. 아무것도 저장하지 않는 읽기라 쿠키 캐시 세션으로 충분하다
export async function fetchLinkMetaAction(link: string) {
  await requireAdmin();
  const url = String(link ?? "").trim();
  if (!isHttpUrl(url) || url.length > 500) {
    return { ok: false as const, message: "원본 링크는 http:// 또는 https:// 로 시작하는 주소여야 해요." };
  }
  return fetchLinkMeta(url);
}

// 등록·수정이 끝나면 그 게임의 심의 세부 페이지로 보낸다. 입력한 내용을 바로 확인하고 승인할 수 있게

// 등록: 대기로 시작한다. 등록자는 폼이 아니라 DB로 확인한 세션에서
export async function createGameAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ fresh: true });
  const parsed = parseGameForm(form);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { id } = await createGame(parsed.input, user.id);
  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
  redirect(`/admin/moderation/${id}`);
}

// 수정: 상태는 그대로
export async function updateGameAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin({ fresh: true });
  const parsed = parseGameForm(form);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const id = String(form.get("id"));
  if (!(await updateGame(id, parsed.input))) return { ok: false, message: "게임을 찾지 못했어요. 이미 지워졌을 수 있어요." };
  revalidatePath("/admin/moderation");
  redirect(`/admin/moderation/${id}`);
}
