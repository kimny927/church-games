"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const MIN_LENGTH = 12; // src/lib/auth.ts 의 minPasswordLength 와 같게

export default function PasswordForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const currentPassword = String(form.get("currentPassword"));
    const newPassword = String(form.get("newPassword"));
    if (newPassword !== form.get("confirmPassword")) return setError("새 비밀번호 두 칸이 서로 달라요.");
    if (newPassword === currentPassword) return setError("지금 비밀번호와 다른 비밀번호를 써 주세요.");

    setPending(true);
    setError("");
    // 다른 기기의 로그인은 모두 끊는다 (임시 비밀번호가 새어 나갔을 경우 대비)
    const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    if (error) {
      setError(
        error.status === 429
          ? "시도가 너무 많아요. 1분 뒤에 다시 해 주세요."
          : error.code === "INVALID_PASSWORD"
            ? "지금 비밀번호가 맞지 않아요."
            : "비밀번호를 바꾸지 못했어요. 다시 시도해 주세요.",
      );
      setPending(false);
      return;
    }
    window.location.assign("/admin");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input name="currentPassword" type="password" required autoComplete="current-password" placeholder="지금 비밀번호" className="w-full rounded border px-3 py-2" />
      <input name="newPassword" type="password" required minLength={MIN_LENGTH} autoComplete="new-password" placeholder={`새 비밀번호 (${MIN_LENGTH}자 이상)`} className="w-full rounded border px-3 py-2" />
      <input name="confirmPassword" type="password" required minLength={MIN_LENGTH} autoComplete="new-password" placeholder="새 비밀번호 확인" className="w-full rounded border px-3 py-2" />
      <button disabled={pending} className="w-full rounded bg-blue-600 py-2 font-semibold text-white disabled:opacity-50">
        {pending ? "바꾸는 중…" : "비밀번호 바꾸기"}
      </button>
    </form>
  );
}
