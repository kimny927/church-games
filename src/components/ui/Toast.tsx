"use client";

import { useEffect, useState } from "react";

// 화면 아래에 잠깐 떴다 사라지는 알림. 누르면 바로 닫힌다.
// clearParam: 알림을 띄운 주소 파라미터(예: ?done=approved)를 지워서 새로 고침해도 다시 뜨지 않게 한다
export default function Toast({ message, clearParam }: { message?: string; clearParam?: string }) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    if (clearParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete(clearParam);
      window.history.replaceState(window.history.state, "", url);
    }
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [message, clearParam]);

  if (!message || !visible) return null;
  return (
    <div
      role="status"
      onClick={() => setVisible(false)}
      className="fixed inset-x-4 bottom-4 mx-auto max-w-md rounded bg-gray-900 px-4 py-3 text-center text-sm text-white shadow-lg"
    >
      {message}
    </div>
  );
}
