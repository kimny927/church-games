"use client";

import Link, { useLinkStatus } from "next/link";
import Spinner from "./Spinner";

// 화면 이동 링크. 다음 화면을 서버에서 받는 동안 링크 옆에 스피너를 보여 준다.
// 관리자 화면은 loading.tsx를 두면 로그인 확인 redirect가 307이 아니게 되어(응답을 먼저 보내므로) 이것을 쓴다
function PendingIndicator() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner className="ml-2 size-3.5 align-middle" /> : null;
}

export default function NavLink({ children, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <PendingIndicator />
    </Link>
  );
}
