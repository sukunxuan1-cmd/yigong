import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-[min(92%,40rem)] flex-col items-center justify-center pt-32 text-center">
      <p className="font-display text-7xl font-black text-gradient">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-cocoa">这一页走丢了 🌱</h1>
      <p className="mt-2 text-mocha">页面可能被挪走了，但善意一直都在。</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-2xl bg-gradient-to-r from-leaf to-mint px-6 py-3 text-sm font-bold text-ink transition-transform hover:scale-105"
        >
          回到首页
        </Link>
        <Link
          href="/events"
          className="glass glow-ring rounded-2xl px-6 py-3 text-sm font-semibold text-cocoa transition-transform hover:scale-105"
        >
          看看活动档案
        </Link>
      </div>
    </div>
  );
}
