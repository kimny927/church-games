"use client";

import { useState } from "react";

// 글을 클립보드에 복사하는 작은 버튼. 복사되면 잠깐 '복사됨'으로 바뀐다
export default function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button" // 폼 안에서 제출되지 않게
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
      className={`rounded border bg-white px-2 py-0.5 text-xs ${className}`}
    >
      {copied ? "복사됨" : "복사"}
    </button>
  );
}
