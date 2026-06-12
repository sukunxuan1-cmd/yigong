"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { getStore } from "@/lib/store";

type Heart = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  life: number;
  color: string;
};

const HEART_COLORS = ["#ff5e8a", "#ff8ab0", "#ffc861", "#7c6cff", "#43e8d8"];

function drawHeart(ctx: CanvasRenderingContext2D, size: number) {
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.6);
  ctx.bezierCurveTo(-s * 1.4, -s * 0.5, -s * 0.6, -s * 1.4, 0, -s * 0.4);
  ctx.bezierCurveTo(s * 0.6, -s * 1.4, s * 1.4, -s * 0.5, 0, s * 0.6);
  ctx.closePath();
  ctx.fill();
}

/** 点赞按钮：爱心粒子爆炸 + 连击放大 + 乐观更新（合并写库） */
export default function LikeButton({ photoId }: { photoId: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartsRef = useRef<Heart[]>([]);
  const pendingRef = useRef(0);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controls = useAnimationControls();

  useEffect(() => {
    const store = getStore();
    let alive = true;
    setCount(null);
    store.getLikes(photoId).then((n) => alive && setCount(n));
    const off = store.onLikes(photoId, (n) => alive && setCount(n));
    return () => {
      alive = false;
      off();
    };
  }, [photoId]);

  // 粒子渲染循环
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 320 * dpr;
    canvas.height = 320 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      ctx.clearRect(0, 0, 320, 320);
      for (const h of heartsRef.current) {
        h.life -= dt;
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        h.vy += 160 * dt; // 重力
        h.rot += h.vr * dt;
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rot);
        ctx.globalAlpha = Math.max(0, Math.min(1, h.life * 1.6));
        ctx.fillStyle = h.color;
        drawHeart(ctx, h.size);
        ctx.restore();
      }
      heartsRef.current = heartsRef.current.filter((h) => h.life > 0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const burst = (intensity: number) => {
    const n = 8 + Math.min(intensity * 3, 22);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const speed = 120 + Math.random() * 220 * Math.min(1 + intensity * 0.15, 2);
      heartsRef.current.push({
        x: 160,
        y: 230,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        rot: (Math.random() - 0.5) * 1.2,
        vr: (Math.random() - 0.5) * 6,
        size: 10 + Math.random() * 14 + Math.min(intensity, 10),
        life: 0.9 + Math.random() * 0.7,
        color: HEART_COLORS[(Math.random() * HEART_COLORS.length) | 0],
      });
    }
  };

  const handleLike = () => {
    const nextCombo = combo + 1;
    setCombo(nextCombo);
    setCount((c) => (c === null ? c : c + 1)); // 乐观更新
    pendingRef.current += 1;
    burst(nextCombo);

    // 连击放大动画
    controls.start({
      scale: [1, 1.25 + Math.min(nextCombo * 0.04, 0.45), 1],
      transition: { duration: 0.35, ease: "easeOut" },
    });

    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => setCombo(0), 900);

    // 合并写库，连点只发一次
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => {
      const n = pendingRef.current;
      pendingRef.current = 0;
      if (n > 0) getStore().addLikes(photoId, n);
    }, 600);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-[72%]"
        aria-hidden
      />
      {combo > 1 && (
        <motion.span
          key={combo}
          initial={{ scale: 0.6, opacity: 0, y: 6 }}
          animate={{ scale: 1 + Math.min(combo * 0.05, 0.6), opacity: 1, y: 0 }}
          className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-lg font-black text-rose drop-shadow-[0_0_8px_rgba(255,94,138,0.8)]"
        >
          x{combo}
        </motion.span>
      )}
      <motion.button
        animate={controls}
        onClick={handleLike}
        className="glass glow-ring relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
        aria-label="点赞"
      >
        <span className="text-rose">❤</span>
        <span>{count === null ? "…" : count.toLocaleString()}</span>
      </motion.button>
    </div>
  );
}
