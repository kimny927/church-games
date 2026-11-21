"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/admin/admins/actions";
import { approveGame, rejectGame, saveNotes } from "@/app/admin/moderation/actions";
import NavLink from "@/components/ui/NavLink";
import SubmitButton from "@/components/ui/SubmitButton";
import type { ModerationGame } from "@/lib/types";
import ActionMessage from "./ActionMessage";

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

// 서버·브라우저 어디서 그려도 같은 문자열이 나오도록 시간대를 고정한다
const formatDate = (d: Date) =>
  new Date(d).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" });

// 휴대폰에서도 누르기 쉽게 카드로 그린다 (AdminRow와 같은 방식)
// 승인·거절 결과는 onResult로 목록에 넘긴다 (이 카드는 처리 후 사라질 수 있어서)
export default function ModerationCard({ game, onResult }: { game: ModerationGame; onResult: (s: ActionState) => void }) {
  const report = (action: Action): Action => async (prev, form) => {
    const result = await action(prev, form);
    onResult(result && { ...result, message: `${game.name}: ${result.message}` });
    return result;
  };
  const [, approveAction, approving] = useActionState(report(approveGame), null);
  const [, rejectAction, rejecting] = useActionState(report(rejectGame), null);
  const [notesState, notesAction] = useActionState(saveNotes, null);
  const deciding = approving || rejecting;

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
    <li className="space-y-3 rounded border p-3">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium break-all">{game.name}</p>
          <NavLink href={`/admin/games/${game.id}/edit`} className="shrink-0 text-sm text-blue-600">수정</NavLink>
        </div>
        <p className="text-sm text-gray-600">
          {game.sourceType ?? "소스 없음"} · 등록 {formatDate(game.createdAt)}
          {game.creator && ` · ${game.creator}`}
          {game.autoScraped && <span className="ml-1 text-amber-700">· 자동 수집</span>}
        </p>
        {game.link && (
          <a href={game.link} target="_blank" rel="noopener noreferrer" className="block text-sm break-all text-blue-600">
            원본 보기 ↗
          </a>
        )}
        {game.summary && <p className="text-sm whitespace-pre-line">{game.summary}</p>}
        {game.tags.length > 0 && <p className="text-xs text-gray-500">{game.tags.join(" · ")}</p>}
      </div>

      {game.status !== "pending" && (
        <div className="rounded bg-gray-50 p-2 text-sm text-gray-700">
          <p>
            {game.status === "approved" ? "승인" : "거절"}: {game.reviewer ?? "알 수 없음"}
            {game.reviewedAt && ` · ${formatDate(game.reviewedAt)}`}
          </p>
          {game.rejectionReason && <p className="mt-1">사유: {game.rejectionReason}</p>}
        </div>
      )}

      <div className="space-y-2 text-sm">
        {game.status !== "approved" && (
          <form action={approveAction}>
            {hidden}
            <SubmitButton disabled={deciding} pendingText="승인 중…" className="w-full rounded bg-blue-600 py-2 font-semibold text-white">
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
      </div>

      <form action={notesAction} className="space-y-2 text-sm">
        <input type="hidden" name="id" value={game.id} />
        <textarea
          name="notes"
          defaultValue={game.adminNotes ?? ""}
          maxLength={2000}
          rows={2}
          placeholder="관리자 메모 (사용자에게 안 보여요)"
          className="w-full rounded border px-3 py-2"
        />
        <SubmitButton pendingText="저장 중…" className="rounded border px-3 py-1">메모 저장</SubmitButton>
        <ActionMessage state={notesState} />
      </form>
    </li>
  );
}
