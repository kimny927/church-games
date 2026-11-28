"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/app/admin/admins/actions";
import { requireAdmin } from "@/lib/admin";
import { setCollectEnabled } from "@/lib/db";

// 자동 수집 켜기/끄기 (owner·admin). 누가 바꿨는지 남기는 쓰기라서 쿠키 캐시가 아니라 DB로 다시 확인한다
export async function setCollect(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ fresh: true });
  const value = form.get("enabled");
  if (value !== "on" && value !== "off") return { ok: false, message: "알 수 없는 요청이에요." };

  try {
    const done = await setCollectEnabled(value === "on", user.id);
    if (!done) return { ok: false, message: "설정 줄이 없어요. neon/collect-settings.sql을 다시 실행해 주세요." };
  } catch (e) {
    if ((e as { code?: string }).code === "42P01") {
      return { ok: false, message: "아직 DB 준비 전이에요 (neon/collect-settings.sql 실행 필요)." };
    }
    throw e;
  }
  revalidatePath("/admin/collect");
  revalidatePath("/admin");
  redirect(`/admin/collect?done=${value}`);
}
