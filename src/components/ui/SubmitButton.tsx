"use client";

import { useFormStatus } from "react-dom";
import Spinner from "./Spinner";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText?: string;
  pending?: boolean; // 서버 액션이 아닌 폼(브라우저에서 직접 호출)은 직접 넘긴다
};

// 폼 제출 버튼. <form action={서버 액션}> 안에서는 제출 중인지 스스로 알고, 그동안 막고 스피너를 보여 준다
export default function SubmitButton({ pendingText, pending, disabled, className = "", children, ...rest }: Props) {
  const status = useFormStatus();
  const isPending = pending || status.pending;
  return (
    <button
      {...rest}
      type="submit"
      disabled={disabled || isPending}
      aria-busy={isPending}
      className={`inline-flex items-center justify-center gap-2 disabled:opacity-50 ${className}`}
    >
      {isPending && <Spinner />}
      {isPending && pendingText ? pendingText : children}
    </button>
  );
}
