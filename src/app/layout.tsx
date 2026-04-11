import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { LabBg } from "@/components/lab-bg";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "안전몽",
  description: "실험실 안전수칙 실시간 퀴즈 플랫폼",
};

export const viewport: Viewport = {
  themeColor: "#F8F9FB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col relative bg-[#F8F9FB]">
        <LabBg />
        <div className="relative z-10 flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
