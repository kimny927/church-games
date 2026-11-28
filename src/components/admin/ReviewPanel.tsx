"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/app/admin/admins/actions";
import { approveGame, rejectGame, revertGame, saveNotes } from "@/app/admin/moderation/actions";
import AlertDialog from "@/components/ui/AlertDialog";
import SubmitButton from "@/components/ui/SubmitButton";
import type { ModerationGame } from "@/lib/types";
import ActionMessage from "./ActionMessage";

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

// 심의 세부 페이지의 승인·거절·대기로 되돌리기·메모. 성공하면 서버가 목록으로 보내고(redirect), 실패하면 여기 머물며 팝업으로 알린다
export default function ReviewPanel({ game }: { game: ModerationGame }) {
  const [failure, setFailure] = useState<string | null>(null);
  const report = (action: Action): Action => async (prev, form) => {
    const result = await action(prev, form);
    if (result && !result.ok) setFailure(result.message);
    return result;
  };
  const [, approveAction, approving] = useActionState(report(approveGame), null);
  const [, rejectAction, rejecting] = useActionState(report(rejectGame), null);
  const [, revertAction, reverting] = useActionState(report(revertGame), null);
  const [notesState, notesAction] = useActionState(saveNotes, null);
  const deciding = approving || rejecting || reverting;
  // 자동 수집 게임은 원본 확인 체크 전에는 승인 버튼을 끈다 (서버 액션에서도 다시 확인)
  const [sourceChecked, setSourceChecked] = useState(false);
  const needsCheck = game.autoScraped && !sourceChecked;

  const confirmSubmit = (msg: string) => (e: React.FormEvent) => {
    if (!confirm(msg)) e.preventDefault();
  };

  // 폼마다 '화면을 본 시점의 상태'를 같이 보내서, 그 사이 다른 관리자가 처리했으면 서버가 거절한다
  const hidden = (
    <>
      <input type="hidden" name="id" value={game.id} />
      <input type="hidden" name="from" value={game.status} />
    </>
  );

  return (
    <section className="space-y-4">
      <div className="space-y-2 text-sm">
        {game.status !== "approved" && (
          <form action={approveAction} className="space-y-2">
            {hidden}
            {game.autoScraped && (
              <label className="flex items-center gap-2 rounded bg-amber-50 px-3 py-2 text-amber-800">
                <input
                  type="checkbox"
                  name="sourceChecked"
                  checked={sourceChecked}
                  onChange={(e) => setSourceChecked(e.target.checked)}
                  className="size-4"
                />
                원본 글을 직접 확인했어요
              </label>
            )}
            <SubmitButton
              disabled={deciding || needsCheck}
              pendingText="승인 중…"
              className="w-full rounded bg-blue-600 py-2 font-semibold text-white"
            >
              {game.status === "pending" ? "승인" : "다시 승인"}
            </SubmitButton>
          </form>
        )}
        {game.status !== "rejected" && (
          <form
            action={rejectAction}
            onSubmit={game.status === "approved" ? confirmSubmit(`'${game.name}'을(를) 사용자 페이지에서 내릴까요?`) : undefined}
            className="flex gap-2"
          >
            {hidden}
            <input
              name="reason"
              required
              maxLength={500}
              placeholder={game.status === "approved" ? "내리는 사유 (필수)" : "거절 사유 (필수)"}
              className="min-w-0 flex-1 rounded border px-3 py-2"
            />
            <SubmitButton disabled={deciding} className="rounded border border-red-300 px-3 py-2 text-red-600">
              {game.status === "approved" ? "내리기" : "거절"}
            </SubmitButton>
          </form>
        )}
        {game.status === "approved" && (
          <form
            action={revertAction}
            onSubmit={confirmSubmit(
              `'${game.name}'을(를) 대기로 되돌릴까요?\n사용자 페이지에서 바로 사라지고, 다시 승인해야 보여요.`,
            )}
            className="flex gap-2"
          >
            {hidden}
            <input
              name="reason"
              required
              maxLength={500}
              placeholder="대기로 되돌리는 사유 (필수, 메모에 남아요)"
              className="min-w-0 flex-1 rounded border px-3 py-2"
            />
            <SubmitButton
              disabled={deciding}
              pendingText="되돌리는 중…"
              className="whitespace-nowrap rounded border border-gray-400 px-3 py-2 text-gray-700"
            >
              대기로 되돌리기
            </SubmitButton>
          </form>
        )}
      </div>

      <form action={notesAction} className="space-y-2 text-sm">
        <input type="hidden" name="id" value={game.id} />
        <textarea
          name="notes"
          defaultValue={game.adminNotes ?? ""}
          maxLength={2000}
          rows={3}
          placeholder="관리자 메모 (사용자에게 안 보여요)"
          className="w-full rounded border px-3 py-2"
        />
        <SubmitButton pendingText="저장 중…" className="rounded border px-3 py-1">메모 저장</SubmitButton>
        <ActionMessage state={notesState} />
      </form>

      {failure && <AlertDialog title="실패했습니다" message={failure} onClose={() => setFailure(null)} />}
    </section>
  );
}
