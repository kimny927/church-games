"use client";

import { useActionState } from "react";
import { setCollect } from "@/app/admin/collect/actions";
import SubmitButton from "@/components/ui/SubmitButton";
import ActionMessage from "./ActionMessage";

// 켜기/끄기 버튼. 켤 때만 한 번 확인한다 (끄는 쪽은 빨리 멈출 수 있게 바로)
export default function CollectToggle({ enabled }: { enabled: boolean }) {
  const [state, action] = useActionState(setCollect, null);
  const confirmOn = (e: React.FormEvent) => {
    if (!enabled && !confirm("자동 수집을 켤까요?\n매일 06:00에 최대 3개를 찾아 심의 대기에 올려요.")) e.preventDefault();
  };
  return (
    <form action={action} onSubmit={confirmOn} className="space-y-2">
      <input type="hidden" name="enabled" value={enabled ? "off" : "on"} />
      <SubmitButton
        pendingText={enabled ? "끄는 중…" : "켜는 중…"}
        className={`w-full rounded py-2 font-semibold ${enabled ? "border border-red-300 text-red-600" : "bg-blue-600 text-white"}`}
      >
        {enabled ? "자동 수집 끄기" : "자동 수집 켜기"}
      </SubmitButton>
      <ActionMessage state={state} />
    </form>
  );
}
