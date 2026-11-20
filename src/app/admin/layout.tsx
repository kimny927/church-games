import type { Metadata } from "next";

// 관리자 화면은 검색엔진에 노출하지 않는다
export const metadata: Metadata = {
  title: "관리자 | 교회 수련회 게임 모음",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="mx-auto max-w-md">{children}</div>;
}
