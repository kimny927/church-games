"use client";

import { useState } from "react";
import type { ActionState } from "@/app/admin/admins/actions";

// 서버 액션 결과. 임시 비밀번호는 이 화면에서 한 번만 보이고 어디에도 저장되지 않는다
export default function ActionMessage({ state }: { state: ActionState }) {
  const [copied, setCopied] = useState(false);
  if (!state) return null;
  return (
    <div className={`space-y-2 rounded p-3 text-sm ${state.ok ? "bg-green-50" : "bg-red-50 text-red-700"}`}>
      <p>{state.message}</p>
      {state.tempPassword && (
        <>
          <div className="flex items-center gap-2">
            <code className="rounded bg-white px-2 py-1 font-mono text-base">{state.tempPassword}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(state.tempPassword!).then(() => setCopied(true))}
              className="rounded border bg-white px-2 py-1"
            >
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
          <p className="text-gray-600">이 임시 비밀번호는 다시 볼 수 없어요. 지금 복사해서 직접 전달해 주세요.</p>
        </>
      )}
    </div>
  );
}
