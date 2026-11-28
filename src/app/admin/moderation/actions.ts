"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/app/admin/admins/actions";
import { requireAdmin } from "@/lib/admin";
import { isAutoScraped, revertToPending, reviewGame, updateAdminNotes } from "@/lib/db";
import type { ReviewStatus } from "@/lib/types";

const MAX_REASON = 500;
const MAX_NOTES = 2000;

// 허용하는 상태 변경: 대기 → 승인/거절, 승인 → 거절(거절로 내리기), 거절 → 승인(다시 승인). 승인 → 대기(다시 심의하기)는 revertGame
const ALLOWED_FROM: Record<"approved" | "rejected", ReviewStatus[]> = {
  approved: ["pending", "rejected"],
  rejected: ["pending", "approved"],
};

const ALREADY_DONE = "다른 관리자가 먼저 처리했어요. 화면을 새로 고쳐 확인해 주세요.";

// 승인·거절: 심의자는 폼이 아니라 DB로 확인한 세션에서 가져온다 (approved_by를 브라우저가 바꿀 수 없게)
// 성공하면 들어왔던 목록 탭(= 처리 전 상태)으로 돌아가 알림을 띄우고, 실패하면 세부 페이지에 머물며 이유를 돌려준다
async function review(to: "approved" | "rejected", form: FormData, reason?: string): Promise<ActionState> {
  const { user } = await requireAdmin({ fresh: true });
  const id = String(form.get("id"));
  const from = String(form.get("from")) as ReviewStatus;
  if (!ALLOWED_FROM[to].includes(from)) return { ok: false, message: "할 수 없는 상태 변경이에요." };

  const done = await reviewGame({ id, from, to, reviewerId: user.id, reason });
  if (!done) return { ok: false, message: ALREADY_DONE };
  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
  redirect(`/admin/moderation?status=${from}&done=${to}`);
}

export async function approveGame(_: ActionState, form: FormData): Promise<ActionState> {
  // 자동 수집 게임은 원본 글을 확인했다고 체크해야 승인한다. 체크박스는 화면 편의일 뿐이라
  // 체크가 없으면 폼이 아니라 DB로 자동 수집 여부를 확인한다 (체크 여부는 저장하지 않음, decisions 2026-11-28)
  if (form.get("sourceChecked") !== "on") {
    await requireAdmin({ fresh: true });
    if (await isAutoScraped(String(form.get("id")))) {
      return { ok: false, message: "자동 수집 게임은 원본 글을 먼저 확인하고 체크해 주세요." };
    }
  }
  return review("approved", form);
}

export async function rejectGame(_: ActionState, form: FormData): Promise<ActionState> {
  const reason = String(form.get("reason") ?? "").trim();
  // DB 제약(rejection_needs_reason)에 걸리기 전에 알아보기 쉬운 메시지로
  if (!reason) return { ok: false, message: "거절 사유를 적어 주세요." };
  if (reason.length > MAX_REASON) return { ok: false, message: `거절 사유는 ${MAX_REASON}자까지 쓸 수 있어요.` };
  return review("rejected", form, reason);
}

// 서울 날짜 YYYY-MM-DD (en-CA 형식이 이 모양이다)
const seoulDate = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

// 승인 → 대기('다시 심의하기'). owner·admin 모두 가능. 사유는 선택이고, 칼럼 대신 메모 끝에 '[다시 심의 날짜 닉네임] 사유'로 남긴다.
// 승인 기록을 비우므로 사유가 없어도 누가·언제는 메모에 남긴다 (decisions 2026-11-28)
// 대기로 돌아간 자동 수집 게임을 다시 승인할 때는 approveGame의 '원본 확인' 규칙이 그대로 적용된다
export async function revertGame(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ fresh: true });
  const id = String(form.get("id"));
  const from = String(form.get("from"));
  if (from !== "approved") return { ok: false, message: "할 수 없는 상태 변경이에요." };

  // 메모가 한 줄 기록으로 남도록 줄바꿈·연속 공백은 공백 하나로
  const reason = String(form.get("reason") ?? "").replace(/\s+/g, " ").trim();
  if (reason.length > MAX_REASON) return { ok: false, message: `사유는 ${MAX_REASON}자까지 쓸 수 있어요.` };

  const noteLine = `[다시 심의 ${seoulDate()} ${user.name || "관리자"}]${reason ? ` ${reason}` : ""}`;
  const result = await revertToPending({ id, noteLine, maxNotes: MAX_NOTES });
  if (result === "changed") return { ok: false, message: ALREADY_DONE };
  if (result === "too_long") {
    return { ok: false, message: `메모가 ${MAX_NOTES}자를 넘게 돼요. 메모를 줄여 저장한 뒤 다시 해 주세요.` };
  }
  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
  redirect(`/admin/moderation?status=approved&done=pending`);
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
