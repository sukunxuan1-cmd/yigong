"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** 圆形 LOGO 徽章贴图：优先用 public/logo.png，否则画一个暖绿占位徽章 */
function makeBadgeTexture() {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;

  const drawBase = () => {
    ctx.clearRect(0, 0, S, S);
    // 柔和投影 + 白色圆盘
    ctx.save();
    ctx.shadowColor = "rgba(120,80,50,0.35)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 10;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S * 0.46, 0, Math.PI * 2);
    ctx.fillStyle = "#fffaf2";
    ctx.fill();
    ctx.restore();
    // 双层绿环
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S * 0.46, 0, Math.PI * 2);
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#3bb273";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S * 0.405, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(59,178,115,0.4)";
    ctx.stroke();
  };

  const drawFallback = () => {
    // 友好的螺旋叶片标记
    ctx.save();
    ctx.translate(S / 2, S * 0.43);
    ctx.strokeStyle = "#2f9e63";
    ctx.lineCap = "round";
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      const r = 92 - k * 26;
      ctx.lineWidth = 16 - k * 3;
      ctx.arc(0, 0, r, Math.PI * 0.15 + k * 0.2, Math.PI * 1.55 + k * 0.2);
      ctx.stroke();
    }
    // 叶尖圆点
    ctx.beginPath();
    ctx.fillStyle = "#ff9f7e";
    ctx.arc(92, 8, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.textAlign = "center";
    ctx.fillStyle = "#4a382e";
    ctx.font = "bold 58px system-ui, sans-serif";
    ctx.fillText("Reshine", S / 2, S * 0.74);
    ctx.fillStyle = "#3bb273";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText("义工团 · WOOD INDUSTRY", S / 2, S * 0.83);
  };

  drawBase();
  drawFallback();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  // 尝试加载真实 logo
  const img = new Image();
  img.onload = () => {
    drawBase();
    // 在内圈内等比绘制 logo
    const inner = S * 0.72;
    const ir = img.width / img.height;
    let dw = inner;
    let dh = inner;
    if (ir > 1) dh = inner / ir;
    else dw = inner * ir;
    ctx.drawImage(img, (S - dw) / 2, (S - dh) / 2, dw, dh);
    tex.needsUpdate = true;
  };
  img.onerror = () => {};
  img.src = "/logo.png";

  return tex;
}

function makeHeartTexture(color: string) {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.translate(S / 2, S / 2);
  ctx.scale(S / 2.6, S / 2.6);
  ctx.beginPath();
  ctx.moveTo(0, 0.5);
  ctx.bezierCurveTo(-1.1, -0.5, -0.5, -1.2, 0, -0.55);
  ctx.bezierCurveTo(0.5, -1.2, 1.1, -0.5, 0, 0.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const HEART_COLORS = ["#ff7a8a", "#ff9f7e", "#3bb273", "#ffc35b", "#86dcae"];
const HEART_POOL = 16;

type Heart = { active: boolean; x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number };

export default function LogoBadge({
  narrFrac,
  position = [0, -0.28, -33],
}: {
  narrFrac: number;
  position?: [number, number, number];
}) {
  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);
  const discRef = useRef<THREE.Mesh>(null);
  const heartRefs = useRef<THREE.Sprite[]>([]);
  const hearts = useRef<Heart[]>(Array.from({ length: HEART_POOL }, () => ({ active: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0 })));

  const badgeTex = useMemo(makeBadgeTexture, []);
  const heartTexes = useMemo(() => HEART_COLORS.map(makeHeartTexture), []);
  const hover = useRef(false);
  const spinTarget = useRef(0);
  const pop = useRef(1);
  const baseY = position[1];

  useEffect(() => () => badgeTex.dispose(), [badgeTex]);

  const burst = () => {
    let n = 0;
    for (const h of hearts.current) {
      if (h.active) continue;
      const a = Math.random() * Math.PI * 2;
      const sp = 0.5 + Math.random() * 0.7;
      h.active = true;
      h.x = 0;
      h.y = 0.15;
      h.z = 0;
      h.vx = Math.cos(a) * sp;
      h.vz = Math.sin(a) * sp;
      h.vy = 1.8 + Math.random() * 1.0;
      h.life = 1;
      if (++n >= 11) break;
    }
  };

  useFrame((state, dt) => {
    const p = clamp01(scroll.offset / narrFrac);
    const appear = smooth(0.88, 0.96, p);
    const g = groupRef.current;
    if (g) {
      g.visible = appear > 0.02;
      // 悬停抬起 + 点击弹跳 + 缓慢自转 + 轻轻浮动
      pop.current = THREE.MathUtils.lerp(pop.current, hover.current ? 1.12 : 1, 0.15);
      const s = appear * pop.current;
      g.scale.setScalar(s);
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, spinTarget.current, 0.12) + 0; // 朝目标转
      spinTarget.current += dt * 0.5; // 持续缓慢自转
      g.position.y = baseY + Math.sin(state.clock.elapsedTime * 1.5) * 0.05 + (hover.current ? 0.25 : 0);
    }
    if (discRef.current) {
      (discRef.current.material as THREE.MeshBasicMaterial).opacity = appear;
    }
    // 爱心粒子
    hearts.current.forEach((h, i) => {
      const sp = heartRefs.current[i];
      if (!sp) return;
      if (!h.active) {
        sp.visible = false;
        return;
      }
      h.life -= dt * 0.85;
      if (h.life <= 0) {
        h.active = false;
        sp.visible = false;
        return;
      }
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.z += h.vz * dt;
      h.vy -= dt * 0.6;
      sp.visible = true;
      sp.position.set(position[0] + h.x, baseY + 0.15 + h.y, position[2] + h.z);
      const grow = Math.min(1, (1 - h.life) * 4);
      sp.scale.setScalar(0.05 + 0.45 * grow);
      (sp.material as THREE.SpriteMaterial).opacity = Math.min(1, h.life * 1.6);
    });
  });

  return (
    <>
      <group ref={groupRef} position={position} visible={false}>
        <mesh
          ref={discRef}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerOver={(e) => {
            e.stopPropagation();
            hover.current = true;
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            hover.current = false;
            document.body.style.cursor = "auto";
          }}
          onClick={(e) => {
            e.stopPropagation();
            spinTarget.current += Math.PI * 2;
            pop.current = 1.3;
            burst();
          }}
        >
          <circleGeometry args={[3.2, 64]} />
          <meshBasicMaterial map={badgeTex} transparent toneMapped={false} />
        </mesh>
      </group>

      {hearts.current.map((_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            if (el) heartRefs.current[i] = el;
          }}
          visible={false}
        >
          <spriteMaterial map={heartTexes[i % heartTexes.length]} transparent depthWrite={false} />
        </sprite>
      ))}
    </>
  );
}
