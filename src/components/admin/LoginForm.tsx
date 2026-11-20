"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error) {
      setError(error.status === 429 ? "시도가 너무 많아요. 1분 뒤에 다시 해 주세요." : "이메일 또는 비밀번호가 맞지 않아요.");
      setPending(false);
      return;
    }
    // 세션 쿠키를 받은 뒤 서버에서 다시 그리도록 새로 불러온다
    window.location.assign("/admin");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input name="email" type="email" required autoComplete="username" placeholder="이메일" className="w-full rounded border px-3 py-2" />
      <input name="password" type="password" required autoComplete="current-password" placeholder="비밀번호" className="w-full rounded border px-3 py-2" />
      <button disabled={pending} className="w-full rounded bg-blue-600 py-2 font-semibold text-white disabled:opacity-50">
        {pending ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}
