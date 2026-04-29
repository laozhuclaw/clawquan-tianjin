import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";

export const metadata: Metadata = {
  title: "天津产业服务平台 — 产业经纪人与社会组织运营平台",
  description:
    "通过社会组织科学运营促进产业高质量发展，服务区域经济、服务会员企业，建设产业协同发展综合服务平台。",
  icons: {
    icon: "/tianjin/logo-nav.png",
    shortcut: "/tianjin/logo-nav.png",
    apple: "/tianjin/logo-nav.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#10452C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col bg-ink-50">
        <Navbar />
        <main
          className="flex-1 lg:pb-0"
          style={{ paddingBottom: "calc(var(--safe-bottom) + 76px)" }}
        >
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
