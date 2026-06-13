"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

type Stats = ReturnType<typeof import("@/lib/data").impactStats>;

/** 数字滚动动画 */
function CountUp({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);
  return (
    <span ref={ref}>
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function ImpactDashboard({ stats }: { stats: Stats }) {
  const bigStats = [
    { label: "公益活动", value: stats.totalEvents, suffix: " 场" },
    { label: "累计志愿时长", value: stats.totalHours, suffix: " 小时" },
    { label: "累计参与人次", value: stats.totalParticipants, suffix: " 人次" },
    { label: "影像记录", value: stats.totalPhotos, suffix: " 张" },
  ];
  const maxHours = Math.max(...stats.byYear.map((y) => y.hours), 1);
  const maxTag = Math.max(...stats.byTag.map((t) => t.count), 1);

  return (
    <div className="mx-auto w-[min(94%,68rem)] pb-24 pt-32">
      <div className="text-center">
        <h1 className="font-display text-4xl font-black md:text-5xl">
          我们的<span className="text-gradient">公益足迹</span>
        </h1>
        <p className="mt-3 text-sm text-slate-400">每一个数字背后，都是一次真实的出发与陪伴</p>
      </div>

      {/* 关键数字 */}
      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {bigStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="glass glow-ring rounded-3xl p-6 text-center"
          >
            <p className="font-display text-3xl font-black text-gradient md:text-4xl">
              <CountUp value={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm text-slate-400">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* 逐年志愿时长 */}
        <div className="glass rounded-3xl p-6">
          <h2 className="font-display text-lg font-bold text-white">逐年志愿时长</h2>
          <div className="mt-6 space-y-4">
            {stats.byYear.map((y) => (
              <div key={y.year}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{y.year} 年</span>
                  <span className="text-slate-400">
                    {y.hours.toLocaleString()} 小时 · {y.events} 场
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(y.hours / maxHours) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-leaf to-mint"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 活动分类 */}
        <div className="glass rounded-3xl p-6">
          <h2 className="font-display text-lg font-bold text-white">公益领域分布</h2>
          <div className="mt-6 space-y-4">
            {stats.byTag.map((t) => (
              <div key={t.tag}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{t.tag}</span>
                  <span className="text-slate-400">{t.count} 场</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(t.count / maxTag) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-mint to-gold"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-4">
        <Link
          href="/events"
          className="glass glow-ring rounded-2xl px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
        >
          浏览活动档案 →
        </Link>
        <Link
          href="/join"
          className="rounded-2xl bg-gradient-to-r from-leaf to-mint px-6 py-3 text-sm font-bold text-ink transition-transform hover:scale-105"
        >
          报名加入下一次
        </Link>
      </div>
    </div>
  );
}
