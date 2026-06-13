"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const links = [
  { href: "/", label: "首页" },
  { href: "/members", label: "义工团" },
  { href: "/events", label: "活动档案" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="glass mx-auto mt-4 flex w-[min(92%,64rem)] items-center justify-between rounded-2xl px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-wide">
          {/* 把公司 LOGO 放到 public/logo.png 即自动显示 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            className="h-8 w-auto"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <span>
            <span className="text-gradient">Reshine</span>
            <span className="ml-1.5 text-slate-300">义工团</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative rounded-xl px-4 py-2 transition-colors ${
                  active ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-white/10 glow-ring"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
