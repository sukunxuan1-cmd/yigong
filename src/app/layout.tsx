import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Reshine 义工团 · 义工活动记录",
    template: "%s",
  },
  description: "记录每一次出发——Reshine 义工团的成员、活动与影像档案。",
  openGraph: {
    title: "Reshine 义工团 · 义工活动记录",
    description: "记录每一次出发——Reshine 义工团的成员、活动与影像档案。",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
