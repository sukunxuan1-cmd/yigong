"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { members, type VolunteerEvent } from "@/lib/data";
import PhotoImg from "@/components/PhotoImg";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function HomeSections({
  events,
  embedded = false,
}: {
  events: VolunteerEvent[];
  embedded?: boolean;
}) {
  const stats = [
    { label: "义工成员", value: members.length, suffix: "位" },
    { label: "公益活动", value: events.length, suffix: "场" },
    { label: "累计人次", value: events.reduce((s, e) => s + e.participants, 0), suffix: "+" },
    { label: "志愿时长", value: events.reduce((s, e) => s + e.participants * e.hours, 0), suffix: "小时" },
  ];
  // 嵌在 drei <Scroll html> 里时，IntersectionObserver 不可靠，直接展示
  const reveal = embedded
    ? { initial: "show" as const, animate: "show" as const }
    : { initial: "hidden" as const, whileInView: "show" as const, viewport: { once: true, margin: "-60px" } };
  return (
    <div className="relative z-10 mx-auto w-[min(92%,72rem)] pb-24">
      {/* 数据统计 */}
      <section className="grid grid-cols-2 gap-4 py-20 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            custom={i}
            variants={fadeUp}
            {...reveal}
            className="glass glow-ring rounded-3xl p-6 text-center"
          >
            <p className="font-display text-4xl font-black text-gradient">
              {s.value.toLocaleString()}
              <span className="text-lg">{s.suffix}</span>
            </p>
            <p className="mt-2 text-sm text-mocha">{s.label}</p>
          </motion.div>
        ))}
      </section>

      {/* 最近活动预览 */}
      <section className="py-10">
        <motion.h2
          variants={fadeUp}
          custom={0}
          {...reveal}
          className="font-display text-3xl font-bold"
        >
          最近的<span className="text-gradient">出发</span>
        </motion.h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[...events].reverse().slice(0, 3).map((e, i) => (
            <motion.div key={e.slug} custom={i} variants={fadeUp} {...reveal}>
              <Link
                href={`/events/${e.slug}`}
                className="group block overflow-hidden rounded-3xl border border-cocoa/8 bg-sand transition-transform hover:-translate-y-1.5"
              >
                <div className="relative aspect-[3/2] overflow-hidden">
                  <PhotoImg
                    seed={e.cover}
                    src={e.coverSrc}
                    alt={e.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent" />
                  <p className="absolute bottom-3 left-4 text-xs text-mint">{e.date} · {e.location}</p>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-cocoa group-hover:text-gradient">{e.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-mocha">{e.summary}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/events"
            className="glass glow-ring rounded-2xl px-6 py-3 text-sm font-semibold text-cocoa transition-transform hover:scale-105"
          >
            进入 3D 活动时间轴 →
          </Link>
          <Link
            href="/members"
            className="rounded-2xl border border-cocoa/10 px-6 py-3 text-sm font-semibold text-cocoa/80 transition-colors hover:border-leaf/60 hover:text-cocoa"
          >
            认识义工团成员
          </Link>
        </div>
      </section>
    </div>
  );
}
