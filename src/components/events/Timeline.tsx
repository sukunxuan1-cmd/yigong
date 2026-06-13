"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { VolunteerEvent } from "@/lib/data";
import PhotoImg from "@/components/PhotoImg";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Timeline({ events }: { events: VolunteerEvent[] }) {
  const root = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 中轴线随滚动生长
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top 60%",
            end: "bottom 80%",
            scrub: 0.6,
          },
        }
      );

      // 每个章节左右交替入场 + 视差
      gsap.utils.toArray<HTMLElement>(".tl-item").forEach((item, i) => {
        const fromLeft = i % 2 === 0;
        gsap.fromTo(
          item,
          { opacity: 0, x: fromLeft ? -120 : 120, rotateY: fromLeft ? 18 : -18 },
          {
            opacity: 1,
            x: 0,
            rotateY: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: item, start: "top 82%" },
          }
        );
        const img = item.querySelector(".tl-photo");
        if (img) {
          gsap.fromTo(
            img,
            { yPercent: -8 },
            {
              yPercent: 8,
              ease: "none",
              scrollTrigger: { trigger: item, start: "top bottom", end: "bottom top", scrub: true },
            }
          );
        }
      });
    }, root);
    // 列表变化（筛选/搜索）时重建滚动动画
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [events]);

  return (
    <div ref={root} className="mx-auto w-[min(94%,72rem)] pb-28 pt-10" style={{ perspective: 1200 }}>
      <div className="relative mt-8">
        {/* 中轴线 */}
        <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-white/8 md:block">
          <div
            ref={lineRef}
            className="h-full w-full origin-top bg-gradient-to-b from-leaf via-mint to-gold"
          />
        </div>

        <div className="space-y-24 md:space-y-36">
          {events.map((e, i) => {
            const left = i % 2 === 0;
            return (
              <div
                key={e.slug}
                className={`tl-item relative flex flex-col gap-6 md:w-[46%] ${
                  left ? "md:mr-auto" : "md:ml-auto"
                }`}
              >
                {/* 节点 */}
                <div
                  className={`absolute top-2 hidden h-4 w-4 rounded-full bg-gradient-to-br from-leaf to-mint shadow-[0_0_18px_rgba(31,164,92,0.9)] md:block ${
                    left ? "-right-[calc(8.7%+8px)]" : "-left-[calc(8.7%+8px)]"
                  }`}
                />
                <Link href={`/events/${e.slug}`} className="group block">
                  <div className="overflow-hidden rounded-3xl border border-white/8">
                    <div className="tl-photo relative aspect-[16/9] scale-110 overflow-hidden">
                      <PhotoImg
                        seed={e.cover}
                        src={e.coverSrc}
                        alt={e.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                    </div>
                  </div>
                  <div className="mt-5">
                    <p className="text-xs font-semibold tracking-widest text-mint">
                      {e.date} · {e.location}
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-bold text-white transition-colors group-hover:text-gradient">
                      {e.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{e.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      {e.tags.map((t) => (
                        <span key={t} className="rounded-full border border-white/10 px-3 py-1 text-slate-300">
                          {t}
                        </span>
                      ))}
                      <span className="text-slate-500">
                        {e.participants} 人参与 · {e.photos.length} 张照片
                      </span>
                    </div>
                    <p className="mt-4 inline-block text-sm font-semibold text-leaf group-hover:underline">
                      进入活动现场，发弹幕 →
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
