"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/app/admin/admins/actions";
import { requireAdmin } from "@/lib/admin";
import { reviewGame, updateAdminNotes } from "@/lib/db";
import type { ReviewStatus } from "@/lib/types";

const MAX_REASON = 500;
const MAX_NOTES = 2000;

// 허용하는 상태 변경: 대기 → 승인/거절, 승인 → 거절(내리기), 거절 → 승인(다시 승인)
const ALLOWED_FROM: Record<"approved" | "rejected", ReviewStatus[]> = {
  approved: ["pending", "rejected"],
  rejected: ["pending", "approved"],
};

const ALREADY_DONE = "다른 관리자가 먼저 처리했어요. 화면을 새로 고쳐 확인해 주세요.";

// 승인·거절: 심의자는 폼이 아니라 DB로 확인한 세션에서 가져온다 (approved_by를 브라우저가 바꿀 수 없게)
async function review(to: "approved" | "rejected", form: FormData, reason?: string): Promise<ActionState> {
  const { user } = await requireAdmin({ fresh: true });
  const id = String(form.get("id"));
  const from = String(form.get("from")) as ReviewStatus;
  if (!ALLOWED_FROM[to].includes(from)) return { ok: false, message: "할 수 없는 상태 변경이에요." };

  const done = await reviewGame({ id, from, to, reviewerId: user.id, reason });
  if (!done) return { ok: false, message: ALREADY_DONE };
  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
  return { ok: true, message: to === "approved" ? "승인했어요. 사용자 페이지에 보여요." : "거절했어요. 사용자 페이지에서 빠졌어요." };
}

export async function approveGame(_: ActionState, form: FormData): Promise<ActionState> {
  return review("approved", form);
}

export async function rejectGame(_: ActionState, form: FormData): Promise<ActionState> {
  const reason = String(form.get("reason") ?? "").trim();
  // DB 제약(rejection_needs_reason)에 걸리기 전에 알아보기 쉬운 메시지로
  if (!reason) return { ok: false, message: "거절 사유를 적어 주세요." };
  if (reason.length > MAX_REASON) return { ok: false, message: `거절 사유는 ${MAX_REASON}자까지 쓸 수 있어요.` };
  return review("rejected", form, reason);
}

export async function saveNotes(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin({ fresh: true });
  const notes = String(form.get("notes") ?? "").trim();
  if (notes.length > MAX_NOTES) return { ok: false, message: `메모는 ${MAX_NOTES}자까지 쓸 수 있어요.` };
  const done = await updateAdminNotes(String(form.get("id")), notes || null);
  if (!done) return { ok: false, message: "게임을 찾지 못했어요." };
  revalidatePath("/admin/moderation");
  return { ok: true, message: "메모를 저장했어요." };
}
