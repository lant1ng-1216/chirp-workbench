import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chirp — Your AI Chief of Staff for Content",
  description: "Pip, your always-on AI content agent, remembers your style, repurposes your content for every platform, and manages your community — without you having to ask.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
