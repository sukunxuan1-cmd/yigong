"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { asset } from "@/lib/asset";

const links = [
  { href: "/", label: "首页" },
  { href: "/members", label: "义工团" },
  { href: "/events", label: "活动档案" },
  { href: "/impact", label: "数据" },
  { href: "/join", label: "报名" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 路由变化时收起移动菜单
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="glass mx-auto mt-4 flex w-[min(92%,64rem)] items-center justify-between rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3">
        <Link href="/" className="flex items-center gap-2 font-display text-base font-bold tracking-wide sm:text-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("/logo.png")}
            alt=""
            className="h-7 w-auto sm:h-8"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <span className="whitespace-nowrap">
            <span className="text-gradient">Reshine</span>
            <span className="ml-1.5 text-cocoa/80">义工团</span>
          </span>
        </Link>

        {/* 桌面：内联链接 */}
        <nav className="hidden items-center gap-0.5 text-sm md:flex">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative rounded-xl px-3 py-2 transition-colors ${
                  active ? "text-cocoa" : "text-mocha hover:text-cocoa"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-cocoa/5 glow-ring"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 移动：汉堡按钮 */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-cocoa transition-colors hover:bg-cocoa/5 md:hidden"
          aria-label="菜单"
          aria-expanded={open}
        >
          <div className="space-y-1.5">
            <span className={`block h-0.5 w-5 rounded bg-cocoa transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 rounded bg-cocoa transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 rounded bg-cocoa transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </div>
        </button>
      </div>

      {/* 移动：下拉菜单 */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass mx-auto mt-2 flex w-[min(92%,64rem)] flex-col gap-1 rounded-2xl p-2 md:hidden"
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive(l.href) ? "bg-cocoa/5 text-cocoa" : "text-mocha hover:bg-cocoa/5 hover:text-cocoa"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
