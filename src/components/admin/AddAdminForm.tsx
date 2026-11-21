"use client";

import { useActionState } from "react";
import { addAdmin } from "@/app/admin/admins/actions";
import SubmitButton from "@/components/ui/SubmitButton";
import ActionMessage from "./ActionMessage";

export default function AddAdminForm() {
  const [state, action] = useActionState(addAdmin, null);
  return (
    <form action={action} className="space-y-2 rounded border p-3">
      <h2 className="font-semibold">관리자 추가</h2>
      <input name="email" type="email" required placeholder="이메일" className="w-full rounded border px-3 py-2" />
      <input name="name" required minLength={2} maxLength={20} placeholder="닉네임 (2~20자, 심의 기록에 표시)" className="w-full rounded border px-3 py-2" />
      <div className="flex gap-2">
        <select name="role" defaultValue="admin" className="flex-1 rounded border px-3 py-2">
          <option value="admin">관리자</option>
          <option value="owner">최고 관리자</option>
        </select>
        <SubmitButton pendingText="추가 중…" className="rounded bg-blue-600 px-4 py-2 font-semibold text-white">
          추가
        </SubmitButton>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}
