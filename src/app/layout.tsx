import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YX HotSpot · 全网热点聚合",
  description: "聚合知乎、微博、百度、抖音等平台实时热榜，一览全网热点",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Outfit:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="noise">
        {children}
      </body>
    </html>
  );
}
