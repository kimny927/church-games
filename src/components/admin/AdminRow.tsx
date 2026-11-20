"use client";

import { useActionState } from "react";
import { removeAdmin, resetPassword, setRole } from "@/app/admin/admins/actions";
import ActionMessage from "./ActionMessage";

type Props = { id: string; email: string; name: string; role: string; mustChangePassword: boolean; isMe: boolean };

const ROLE_LABEL: Record<string, string> = { owner: "최고 관리자", admin: "관리자" };

// 휴대폰에서도 버튼이 눌리기 쉽게 표 대신 카드로 그린다
export default function AdminRow({ id, email, name, role, mustChangePassword, isMe }: Props) {
  const [resetState, resetAction, resetting] = useActionState(resetPassword, null);
  const [roleState, roleAction, changingRole] = useActionState(setRole, null);
  const [removeState, removeAction, removing] = useActionState(removeAdmin, null);
  const pending = resetting || changingRole || removing;

  const confirmSubmit = (msg: string) => (e: React.FormEvent) => {
    if (!confirm(msg)) e.preventDefault();
  };

  return (
    <li className="space-y-2 rounded border p-3">
      <div>
        <p className="font-medium break-all">
          {name} {isMe && <span className="text-sm text-gray-500">(나)</span>}
        </p>
        <p className="text-sm break-all text-gray-600">{email}</p>
        <p className="text-sm text-gray-600">
          {ROLE_LABEL[role] ?? role}
          {mustChangePassword && <span className="ml-2 text-amber-700">· 첫 비밀번호 변경 전</span>}
        </p>
      </div>
      {/* 자기 계정은 관리 API로 바꿀 수 없다 (auth.ts hooks.before). 내 비밀번호는 비밀번호 변경 화면에서 */}
      {!isMe && (
        <div className="flex flex-wrap gap-2 text-sm">
          <form action={roleAction} className="flex gap-1">
            <input type="hidden" name="userId" value={id} />
            <select name="role" defaultValue={role} disabled={pending} className="rounded border px-2 py-1">
              <option value="admin">관리자</option>
              <option value="owner">최고 관리자</option>
            </select>
            <button disabled={pending} className="rounded border px-2 py-1">역할 저장</button>
          </form>
          <form action={resetAction} onSubmit={confirmSubmit(`${email}의 비밀번호를 초기화할까요?`)}>
            <input type="hidden" name="userId" value={id} />
            <button disabled={pending} className="rounded border px-2 py-1">비밀번호 초기화</button>
          </form>
          <form action={removeAction} onSubmit={confirmSubmit(`${email} 계정을 삭제할까요? 되돌릴 수 없어요.`)}>
            <input type="hidden" name="userId" value={id} />
            <button disabled={pending} className="rounded border border-red-300 px-2 py-1 text-red-600">삭제</button>
          </form>
        </div>
      )}
      <ActionMessage state={roleState} />
      <ActionMessage state={resetState} />
      <ActionMessage state={removeState} />
    </li>
  );
}
