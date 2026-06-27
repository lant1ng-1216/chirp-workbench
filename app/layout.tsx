import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "鸣 Ming — 你的品牌，永远在线",
  description: "AI 品牌营销自动驾驶平台。输入你的产品链接，鸣替你每天说话。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;600&family=Space+Mono:wght@400;700&family=Noto+Sans+SC:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
