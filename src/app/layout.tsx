// app/layout.tsx
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import { GameContextProvider } from "./contexts/GameProvider";

// 폰트 설정
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

// 메타데이터 설정
export const metadata: Metadata = {
  title: "ESG 투자 게임 🌱",
  description: "환경에 좋은 회사에 투자해서 돈도 벌고 지구도 지켜요!",
  keywords: ["ESG", "투자", "게임", "환경", "교육"],
  authors: [{ name: "ESG Education Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* PWA 및 모바일 최적화 메타태그 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ESG 투자 게임" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* 파비콘 및 아이콘 설정 */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* 프리로드 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-900`}
        suppressHydrationWarning
      >
        {/* Context Provider로 전체 앱 감싸기 */}
        <GameContextProvider>
          {children}
        </GameContextProvider>
      </body>
    </html>
  );
}