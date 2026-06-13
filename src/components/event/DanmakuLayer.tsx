"use client";

import { useEffect, useRef } from "react";
import { getStore, type Danmaku } from "@/lib/store";

type Bullet = {
  text: string;
  color: string;
  x: number;
  lane: number;
  speed: number;
  width: number;
  self: boolean;
};

const LANE_HEIGHT = 36;
const FONT = "bold 20px system-ui, sans-serif";

/**
 * Canvas 弹幕层：轨道分配 + 追尾碰撞检测，
 * 历史弹幕错峰入场，新弹幕(本地或 Realtime)即时飘入。
 */
export default function DanmakuLayer({
  photoId,
  visible,
  selfMarkRef,
}: {
  photoId: string;
  visible: boolean;
  /** 父组件发送弹幕后写入文本，用于高亮自己的弹幕 */
  selfMarkRef?: React.MutableRefObject<string | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bulletsRef = useRef<Bullet[]>([]);
  const queueRef = useRef<Danmaku[]>([]);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const store = getStore();
    let raf = 0;
    let alive = true;
    let lastT = performance.now();
    bulletsRef.current = [];
    queueRef.current = [];

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = FONT;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const cw = () => canvas.width / dpr;
    const ch = () => canvas.height / dpr;

    const laneCount = () => Math.max(1, Math.floor((ch() * 0.82) / LANE_HEIGHT));

    /** 找一条不会追尾的轨道 */
    const pickLane = (width: number): number | null => {
      const lanes = laneCount();
      const tails = new Array(lanes).fill(-Infinity);
      for (const b of bulletsRef.current) {
        tails[b.lane] = Math.max(tails[b.lane], b.x + b.width);
      }
      for (let l = 0; l < lanes; l++) {
        if (tails[l] < cw() - 24) return l;
      }
      return null;
    };

    const spawn = (d: Danmaku, self = false) => {
      ctx.font = FONT;
      const width = ctx.measureText(d.text).width;
      const lane = pickLane(width);
      if (lane === null) {
        queueRef.current.push(d); // 轨道满，排队
        return;
      }
      bulletsRef.current.push({
        text: d.text,
        color: d.color,
        x: cw(),
        lane,
        speed: 70 + Math.min(d.text.length * 4, 60) + Math.random() * 30,
        width,
        self,
      });
    };

    // 历史弹幕错峰入场
    store.getDanmaku(photoId).then((list) => {
      if (!alive) return;
      list.forEach((d, i) => {
        setTimeout(() => alive && spawn(d), 500 + i * 900 + Math.random() * 600);
      });
    });

    // 实时新弹幕
    const off = store.onDanmaku(photoId, (d) => {
      const self = selfMarkRef?.current === d.text;
      if (self && selfMarkRef) selfMarkRef.current = null;
      spawn(d, self);
    });

    const tick = (t: number) => {
      if (!alive) return;
      const dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;
      ctx.clearRect(0, 0, cw(), ch());

      if (visibleRef.current) {
        // 排队的弹幕尝试补位
        if (queueRef.current.length) {
          const d = queueRef.current[0];
          ctx.font = FONT;
          const lane = pickLane(ctx.measureText(d.text).width);
          if (lane !== null) spawn(queueRef.current.shift()!);
        }

        ctx.font = FONT;
        ctx.textBaseline = "middle";
        for (const b of bulletsRef.current) {
          b.x -= b.speed * dt;
          const y = ch() * 0.06 + b.lane * LANE_HEIGHT + LANE_HEIGHT / 2;
          ctx.shadowColor = "rgba(0,0,0,0.85)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 1;
          if (b.self) {
            // 自己的弹幕加描边框
            ctx.strokeStyle = b.color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(b.x - 8, y - 15, b.width + 16, 30);
          }
          ctx.fillStyle = b.color;
          ctx.fillText(b.text, b.x, y);
        }
        ctx.shadowBlur = 0;
        bulletsRef.current = bulletsRef.current.filter((b) => b.x + b.width > -20);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      off();
    };
  }, [photoId, selfMarkRef]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
