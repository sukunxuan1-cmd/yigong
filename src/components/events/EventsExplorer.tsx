"use client";

import { useMemo, useState } from "react";
import { allTags, allYears, type VolunteerEvent } from "@/lib/data";
import Timeline from "@/components/events/Timeline";

export default function EventsExplorer({ events }: { events: VolunteerEvent[] }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return events.filter((e) => {
      if (tag && !e.tags.includes(tag)) return false;
      if (year && !e.date.startsWith(year)) return false;
      if (kw) {
        const hay = `${e.title} ${e.summary} ${e.location} ${e.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [events, q, tag, year]);

  const active = q.trim() || tag || year;
  const chip = (on: boolean) =>
    `rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
      on ? "bg-gradient-to-r from-leaf to-mint text-ink" : "border border-cocoa/12 text-cocoa/80 hover:border-leaf/50"
    }`;

  return (
    <>
      <div className="pt-32 text-center">
        <h1 className="font-display text-4xl font-black md:text-5xl">
          活动<span className="text-gradient">时间轴</span>
        </h1>
        <p className="mt-3 text-sm text-mocha">沿着时间向下滚动，穿越我们走过的每一站</p>
      </div>

      {/* 筛选 / 搜索栏 */}
      <div className="mx-auto mt-8 w-[min(94%,72rem)]">
        <div className="glass rounded-3xl p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mocha/70">🔍</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索活动名称、地点、关键词…"
                className="w-full rounded-2xl border border-cocoa/10 bg-cocoa/5 py-2.5 pl-11 pr-4 text-sm text-cocoa placeholder:text-mocha/70 focus:border-leaf/60 focus:outline-none"
              />
            </div>
            {active && (
              <button
                onClick={() => {
                  setQ("");
                  setTag(null);
                  setYear(null);
                }}
                className="shrink-0 rounded-2xl border border-cocoa/10 px-4 py-2.5 text-xs text-cocoa/80 hover:text-cocoa"
              >
                清除筛选 ✕
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-mocha/70">领域</span>
            {allTags.map((t) => (
              <button key={t} className={chip(tag === t)} onClick={() => setTag(tag === t ? null : t)}>
                {t}
              </button>
            ))}
            <span className="ml-3 text-xs text-mocha/70">年份</span>
            {allYears.map((y) => (
              <button key={y} className={chip(year === y)} onClick={() => setYear(year === y ? null : y)}>
                {y}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 px-2 text-sm text-mocha">
          共 {filtered.length} 场活动{active ? "（已筛选）" : ""}
        </p>
      </div>

      {filtered.length > 0 ? (
        <Timeline key={filtered.map((e) => e.slug).join(",")} events={filtered} />
      ) : (
        <div className="py-32 text-center text-mocha/70">没有匹配的活动，换个关键词试试～</div>
      )}
    </>
  );
}
