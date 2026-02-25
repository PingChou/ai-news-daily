import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI News Daily - 每日 AI 新闻与知识",
  description: "每日精选 AI 行业动态与前沿技术，面向开发者和普通读者",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
