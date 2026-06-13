"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { AnimatePresence, motion } from "framer-motion";
import { members, type Member } from "@/lib/data";
import { avatarCanvas } from "@/lib/placeholder";

const RADIUS = 5.2;
const TWO_PI = Math.PI * 2;

/** 把成员卡片画成贴图（避免外部字体依赖）。传入 img 时用真实头像，否则用首字占位 */
function drawCard(m: Member, img?: HTMLImageElement, target?: HTMLCanvasElement): HTMLCanvasElement {
  const w = 512;
  const h = 680;
  const c = target ?? document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);

  // 玻璃底
  const round = (r: number) => {
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, h - 16, r);
  };
  ctx.fillStyle = "rgba(12,20,16,0.94)";
  round(36);
  ctx.fill();
  const edge = ctx.createLinearGradient(0, 0, w, h);
  edge.addColorStop(0, m.palette[0]);
  edge.addColorStop(1, m.palette[1]);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 4;
  round(36);
  ctx.stroke();

  // 头像：圆形裁切
  const cx = w / 2;
  const cy = 180;
  const r = 110;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img) {
    const ir = img.width / img.height;
    let dw = r * 2;
    let dh = r * 2;
    if (ir > 1) dw = dh * ir;
    else dh = dw / ir;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    ctx.drawImage(avatarCanvas(m.name, m.palette, 256), cx - r, cy - r, r * 2, r * 2);
  }
  ctx.restore();
  // 头像描边
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px system-ui, sans-serif";
  ctx.fillText(m.name, w / 2, 380);

  // 角色徽章
  ctx.font = "bold 28px system-ui, sans-serif";
  const tw = ctx.measureText(m.role).width + 48;
  ctx.fillStyle = edge;
  ctx.beginPath();
  ctx.roundRect(w / 2 - tw / 2, 408, tw, 48, 24);
  ctx.fill();
  ctx.fillStyle = "#0c0e1a";
  ctx.fillText(m.role, w / 2, 442);

  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillText(m.department, w / 2, 510);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "22px system-ui, sans-serif";
  ctx.fillText(`参与活动 ${m.activities} 次 · ${m.joined} 加入`, w / 2, 556);

  ctx.fillStyle = m.palette[1];
  ctx.font = "italic 24px system-ui, sans-serif";
  ctx.fillText(`“${m.motto}”`, w / 2, 616);
  return c;
}

function Card({
  member,
  angle,
  groupRot,
  onPick,
}: {
  member: Member;
  angle: number;
  groupRot: React.MutableRefObject<number>;
  onPick: (m: Member, angle: number) => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const canvas = useMemo(() => drawCard(member), [member]);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);

  // 异步加载真实头像，加载完重绘卡片纹理
  useEffect(() => {
    if (!member.photo) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      drawCard(member, img, canvas);
      texture.needsUpdate = true;
    };
    img.src = member.photo;
  }, [member, canvas, texture]);

  useFrame(() => {
    if (!mesh.current) return;
    // 朝向正前方(世界 +z)的卡片轻微放大
    const facing = Math.cos(angle + groupRot.current);
    const s = 1 + Math.max(0, facing) * 0.16;
    mesh.current.scale.setScalar(THREE.MathUtils.lerp(mesh.current.scale.x, s, 0.1));
  });

  return (
    <mesh
      ref={mesh}
      position={[Math.sin(angle) * RADIUS, 0, Math.cos(angle) * RADIUS]}
      rotation={[0, angle, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onPick(member, angle);
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <planeGeometry args={[1.9, 2.52]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function Ring({ onPick, focusAngle }: { onPick: (m: Member, a: number) => void; focusAngle: number | null }) {
  const group = useRef<THREE.Group>(null);
  const rot = useRef(0);
  const vel = useRef(0.0015);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const focusTween = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (focusAngle === null) return;
    // 把点中的卡片转到正前方：angle + rot ≡ 0 (取最近方向)
    let target = -focusAngle;
    while (target - rot.current > Math.PI) target -= TWO_PI;
    while (target - rot.current < -Math.PI) target += TWO_PI;
    focusTween.current?.kill();
    focusTween.current = gsap.to(rot, { current: target, duration: 1.1, ease: "power3.inOut" });
    vel.current = 0;
  }, [focusAngle]);

  useFrame(() => {
    if (!group.current) return;
    if (!dragging.current && focusAngle === null) {
      rot.current += vel.current;
      vel.current = THREE.MathUtils.lerp(vel.current, 0.0015, 0.02); // 回归慢速自转
    }
    group.current.rotation.y = rot.current;
  });

  return (
    <group
      onPointerDown={(e) => {
        if (focusAngle !== null) return;
        dragging.current = true;
        lastX.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        const dx = e.clientX - lastX.current;
        lastX.current = e.clientX;
        rot.current += dx * 0.005;
        vel.current = dx * 0.0006;
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      {/* 扩大拖拽命中区域的透明球壳 */}
      <mesh>
        <sphereGeometry args={[RADIUS + 1.4, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <group ref={group}>
        {members.map((m, i) => (
          <Card key={m.id} member={m} angle={(i / members.length) * TWO_PI} groupRot={rot} onPick={onPick} />
        ))}
        {/* 中心光核 */}
        <Float speed={2} floatIntensity={1.2}>
          <mesh>
            <icosahedronGeometry args={[0.55, 1]} />
            <meshStandardMaterial color="#1fa45c" emissive="#1fa45c" emissiveIntensity={2} wireframe />
          </mesh>
        </Float>
      </group>
    </group>
  );
}

export default function MemberRing() {
  const [active, setActive] = useState<{ member: Member; angle: number } | null>(null);

  return (
    <div className="relative h-[calc(100vh-0px)] w-full">
      <Canvas camera={{ position: [0, 0.6, 10.5], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={["#070b09"]} />
        <fog attach="fog" args={["#070b09", 9, 20]} />
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 4, 6]} intensity={30} color="#7edca4" />
        <Stars radius={60} depth={40} count={2500} factor={4} saturation={0.6} fade speed={0.6} />
        <Ring onPick={(member, angle) => setActive({ member, angle })} focusAngle={active?.angle ?? null} />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-28 text-center">
        <h1 className="font-display text-4xl font-black md:text-5xl">
          义工团<span className="text-gradient">成员</span>
        </h1>
        <p className="mt-3 text-sm text-slate-400">拖拽旋转星环 · 点击卡片认识 TA</p>
      </div>

      {/* 聚焦详情：翻转卡片 */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-ink/60 backdrop-blur-sm"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ rotateY: 90, scale: 0.85 }}
              animate={{ rotateY: 0, scale: 1 }}
              exit={{ rotateY: -90, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.45 }}
              style={{ transformPerspective: 1200 }}
              className="glass glow-ring w-[min(90%,26rem)] rounded-3xl p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full text-4xl font-black text-white"
                style={{
                  background: `linear-gradient(135deg, ${active.member.palette[0]}, ${active.member.palette[1]})`,
                }}
              >
                {active.member.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={active.member.photo} alt={active.member.name} className="h-full w-full object-cover" />
                ) : (
                  active.member.name.slice(0, 1)
                )}
              </div>
              <h2 className="mt-5 font-display text-3xl font-bold text-white">{active.member.name}</h2>
              <p className="mt-1 text-sm text-mint">
                {active.member.role} · {active.member.department}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-2xl font-bold text-gradient">{active.member.activities}</p>
                  <p className="text-slate-400">参与活动</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-2xl font-bold text-gradient">{active.member.joined}</p>
                  <p className="text-slate-400">加入时间</p>
                </div>
              </div>
              <p className="mt-5 text-sm italic text-slate-300">“{active.member.motto}”</p>
              <p className="mt-4 line-clamp-3 text-left text-sm leading-relaxed text-slate-400">
                {active.member.bio}
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                  href={`/members/${active.member.id}`}
                  className="rounded-2xl bg-gradient-to-r from-leaf to-mint px-6 py-2 text-sm font-bold text-ink transition-transform hover:scale-105"
                >
                  查看完整简介 →
                </Link>
                <button
                  className="rounded-2xl border border-white/15 px-5 py-2 text-sm text-slate-300 transition-colors hover:border-leaf/60 hover:text-white"
                  onClick={() => setActive(null)}
                >
                  返回星环
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
