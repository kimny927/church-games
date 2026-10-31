import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "교회 수련회 게임 모음",
  description: "수련회·청년부 모임에서 쓸 수 있는 게임을 모아 소개합니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <header className="border-b border-gray-200">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-bold">⛪ 수련회 게임 모음</Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
