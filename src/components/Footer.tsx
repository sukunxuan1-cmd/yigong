"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  // 首页是全屏固定的 3D 叙事画布，收尾信息已在画布内，隐藏全局页脚
  if (pathname === "/") return null;
  return (
    <footer className="border-t border-white/5 py-10 text-center text-sm text-slate-500">
      <p>
        <span className="text-gradient font-semibold">Reshine 义工团</span> · 记录每一次出发
      </p>
      <p className="mt-2">用善意点亮城市 · {new Date().getFullYear()}</p>
    </footer>
  );
}
