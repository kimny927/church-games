"use client";

import { useState, useTransition } from "react";
import type { ActionState } from "@/app/admin/admins/actions";
import { updateNickname } from "@/app/admin/profile/actions";
import SubmitButton from "@/components/ui/SubmitButton";
import ActionMessage from "./ActionMessage";

// <form action>은 제출 후 입력을 비워서, 오류가 나면 쓴 닉네임이 사라진다. 그래서 onSubmit으로 부른다 (GameForm과 같은 방식)
export default function NicknameForm({ current }: { current: string }) {
  const [state, setState] = useState<ActionState>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState(null);
    startTransition(async () => setState(await updateNickname(null, form)));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label className="block space-y-1">
        <span className="text-sm font-medium">닉네임</span>
        <span className="flex gap-2">
          <input name="name" required minLength={2} maxLength={20} defaultValue={current} className="min-w-0 flex-1 rounded border px-3 py-2" />
          <SubmitButton pending={pending} pendingText="저장 중…" className="rounded bg-blue-600 px-4 py-2 font-semibold text-white">
            저장
          </SubmitButton>
        </span>
        <span className="block text-xs text-gray-500">2~20자. 심의 기록에 이 이름으로 보여요. 다른 관리자와 겹칠 수 없어요.</span>
      </label>
      <ActionMessage state={state} />
    </form>
  );
}
