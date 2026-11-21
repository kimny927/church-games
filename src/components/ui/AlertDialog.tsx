"use client";

import { useEffect, useRef } from "react";

// 확인 버튼 하나짜리 팝업. 브라우저 기본 <dialog>를 써서 배경 클릭 막기·Esc 닫기·포커스 이동을 직접 만들지 않는다
export default function AlertDialog({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg p-5 shadow-xl backdrop:bg-black/40"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm text-gray-700">{message}</p>
      <form method="dialog" className="mt-4 text-right">
        <button autoFocus className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white">확인</button>
      </form>
    </dialog>
  );
}
