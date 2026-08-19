import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chirp — Canvas workbench powered by Minds",
  description: "Chirp is an infinite canvas for knowledge, assets, and multi-platform content — with Minds as the agent that plans, applies workflows, and runs grounded drafts.",
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
