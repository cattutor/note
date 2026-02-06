import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoicePrint Note — 화자 식별 & 실시간 통역",
  description:
    "회의 중 영어 발화를 실시간으로 인식하고, 화자를 식별하며, 맥락 인식 번역을 제공하는 스마트 노트 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className="antialiased bg-zinc-950">
        {children}
      </body>
    </html>
  );
}
