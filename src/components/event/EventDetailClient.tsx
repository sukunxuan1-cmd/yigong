"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import type { VolunteerEvent, Member } from "@/lib/data";
import DanmakuLayer from "@/components/event/DanmakuLayer";
import DanmakuInput from "@/components/event/DanmakuInput";
import LikeButton from "@/components/event/LikeButton";
import Comments from "@/components/event/Comments";
import PhotoImg from "@/components/PhotoImg";
import ShareBar from "@/components/ShareBar";

const PhotoStage = dynamic(() => import("@/components/event/PhotoStage"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-haze" />,
});

export default function EventDetailClient({
  event,
  members = [],
}: {
  event: VolunteerEvent;
  members?: Member[];
}) {
  const [index, setIndex] = useState(0);
  const [danmakuOn, setDanmakuOn] = useState(true);
  const selfMarkRef = useRef<string | null>(null);
  const photo = event.photos[index];
  const total = event.photos.length;

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + total) % total);

  return (
    <div className="mx-auto w-[min(94%,68rem)] pb-24 pt-32">
      {/* 头部 */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <Link href="/events" className="text-sm text-slate-400 transition-colors hover:text-mint">
          ← 返回时间轴
        </Link>
        <h1 className="mt-3 font-display text-3xl font-black md:text-5xl">
          <span className="text-gradient">{event.title}</span>
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          {event.date} · {event.location} · {event.participants} 人参与 · 人均 {event.hours} 小时
        </p>
        <p className="mt-4 max-w-3xl leading-relaxed text-slate-300">{event.description}</p>

        {members.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-400">参与成员</span>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <Link
                  key={m.id}
                  href={`/members/${m.id}`}
                  title={`${m.name} · ${m.role}`}
                  className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 transition-colors hover:border-leaf/60"
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${m.palette[0]}, ${m.palette[1]})` }}
                  >
                    {m.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                    ) : (
                      m.name.slice(0, 1)
                    )}
                  </span>
                  <span className="text-xs text-slate-300 group-hover:text-white">{m.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* 照片互动舞台 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="glow-ring relative mt-10 aspect-[3/2] overflow-hidden rounded-3xl border border-white/10 bg-haze"
      >
        <PhotoStage photos={event.photos} index={index} onSwipe={go} />
        {danmakuOn && <DanmakuLayer photoId={photo.id} visible={danmakuOn} selfMarkRef={selfMarkRef} />}

        {/* 左右切换 */}
        <button
          onClick={() => go(-1)}
          className="group absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-ink/50 p-3 backdrop-blur transition-colors hover:bg-leaf/40"
          aria-label="上一张"
        >
          <span className="block text-white">‹</span>
        </button>
        <button
          onClick={() => go(1)}
          className="group absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-ink/50 p-3 backdrop-blur transition-colors hover:bg-leaf/40"
          aria-label="下一张"
        >
          <span className="block text-white">›</span>
        </button>

        {/* 底部信息栏 */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent p-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{photo.caption}</p>
            <p className="mt-1 text-xs text-slate-400">
              {index + 1} / {total} · 左右滑动或点按钮切换（WebGL 转场）
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={() => setDanmakuOn((v) => !v)}
              className={`rounded-full px-4 py-2.5 text-xs font-semibold backdrop-blur transition-colors ${
                danmakuOn ? "bg-mint/20 text-mint" : "bg-white/10 text-slate-400"
              }`}
            >
              弹幕 {danmakuOn ? "开" : "关"}
            </button>
            <LikeButton photoId={photo.id} />
          </div>
        </div>
      </motion.div>

      {/* 弹幕输入 + 分享 */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <DanmakuInput photoId={photo.id} selfMarkRef={selfMarkRef} />
        </div>
        <ShareBar
          title={event.title}
          downloadUrl={photo.src}
          downloadName={`${event.title}-${photo.caption}.jpg`}
        />
      </div>

      {/* 缩略图条 */}
      <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
        {event.photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setIndex(i)}
            className={`relative aspect-[3/2] w-28 shrink-0 overflow-hidden rounded-xl border transition-all ${
              i === index
                ? "border-leaf shadow-[0_0_16px_rgba(31,164,92,0.5)]"
                : "border-white/10 opacity-60 hover:opacity-100"
            }`}
            aria-label={p.caption}
          >
            <PhotoImg seed={p.seed} src={p.src} alt={p.caption} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {/* 评论区（跟随当前照片） */}
      <div className="mt-10">
        <Comments photoId={photo.id} />
      </div>
    </div>
  );
}
