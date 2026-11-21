"use client";

import { useEffect, useState } from "react";
import type { ActionState } from "@/app/admin/admins/actions";
import type { ModerationGame } from "@/lib/types";
import ActionMessage from "./ActionMessage";
import ModerationCard from "./ModerationCard";

// 승인·거절 결과는 카드가 아니라 목록에서 보여 준다.
// 처리한 카드는 다른 탭으로 옮겨 가서 사라지므로(먼저 처리된 경우도 새 목록에서 빠짐), 카드 안에 두면 메시지도 같이 사라진다
export default function ModerationList({ games, emptyText }: { games: ModerationGame[]; emptyText: string }) {
  const [notice, setNotice] = useState<ActionState>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <>
      {games.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {games.map((g) => (
            <ModerationCard key={g.id} game={g} onResult={setNotice} />
          ))}
        </ul>
      )}
      {/* 휴대폰에서 목록 아래쪽을 보고 있어도 보이도록 화면 아래에 고정. 누르면 닫힌다 */}
      {notice && (
        <div onClick={() => setNotice(null)} className="fixed inset-x-4 bottom-4 mx-auto max-w-md rounded shadow-lg">
          <ActionMessage state={notice} />
        </div>
      )}
    </>
  );
}
