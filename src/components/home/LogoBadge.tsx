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

/**
 * 勋章正面贴图：不透明奶油底 + 居中放置真实 logo（public/logo.png）。
 * 未提供 logo.png 时仅显示浅灰“LOGO”占位字样，不绘制任何标识。
 */
function makeFaceTexture() {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;

  const drawBase = () => {
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = "#fffaf2";
    ctx.fillRect(0, 0, S, S);
    // 内圈细描边
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S * 0.45, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(59,178,115,0.35)";
    ctx.stroke();
  };

  drawBase();
  ctx.fillStyle = "rgba(74,56,46,0.28)";
  ctx.font = "600 40px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LOGO", S / 2, S / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.center.set(0.5, 0.5);
  tex.rotation = Math.PI; // 圆柱顶面 UV 方向修正，使 logo 正立朝向镜头

  const img = new Image();
  img.onload = () => {
    drawBase();
    const inner = S * 0.78;
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
const R = 3.0; // 勋章半径
const TH = 0.55; // 勋章厚度

type Heart = { active: boolean; x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number };

export default function LogoBadge({
  narrFrac,
  position = [0, -0.35, -33],
}: {
  narrFrac: number;
  position?: [number, number, number];
}) {
  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);
  const matsRef = useRef<THREE.MeshBasicMaterial[]>([]);
  const heartRefs = useRef<THREE.Sprite[]>([]);
  const hearts = useRef<Heart[]>(Array.from({ length: HEART_POOL }, () => ({ active: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0 })));

  const faceTex = useMemo(makeFaceTexture, []);
  const heartTexes = useMemo(() => HEART_COLORS.map(makeHeartTexture), []);
  const hover = useRef(false);
  const spinTarget = useRef(0);
  const pop = useRef(1);
  const baseY = position[1] + TH / 2; // 勋章躺在桌面上

  useEffect(() => () => faceTex.dispose(), [faceTex]);

  const burst = () => {
    let n = 0;
    for (const h of hearts.current) {
      if (h.active) continue;
      const a = Math.random() * Math.PI * 2;
      const sp = 0.5 + Math.random() * 0.7;
      h.active = true;
      h.x = 0;
      h.y = 0.3;
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
      pop.current = THREE.MathUtils.lerp(pop.current, hover.current ? 1.1 : 1, 0.15);
      g.scale.setScalar(appear * pop.current);
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, spinTarget.current, 0.12);
      spinTarget.current += dt * 0.45; // 缓慢自转
      g.position.y = baseY + Math.sin(state.clock.elapsedTime * 1.5) * 0.05 + (hover.current ? 0.3 : 0);
    }
    for (const m of matsRef.current) if (m) m.opacity = appear;
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
      sp.position.set(position[0] + h.x, baseY + 0.3 + h.y, position[2] + h.z);
      const grow = Math.min(1, (1 - h.life) * 4);
      sp.scale.setScalar(0.05 + 0.45 * grow);
      (sp.material as THREE.SpriteMaterial).opacity = Math.min(1, h.life * 1.6);
    });
  });

  return (
    <>
      <group ref={groupRef} position={[position[0], baseY, position[2]]} visible={false}>
        {/* 3D 圆柱勋章：木色边 + 正面 logo */}
        <mesh
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
            pop.current = 1.28;
            burst();
          }}
        >
          <cylinderGeometry args={[R, R, TH, 72]} />
          {/* 0=侧面(木色) 1=顶面(logo) 2=底面 */}
          <meshBasicMaterial
            attach="material-0"
            color="#cda36f"
            transparent
            ref={(el) => el && (matsRef.current[0] = el)}
          />
          <meshBasicMaterial
            attach="material-1"
            map={faceTex}
            toneMapped={false}
            transparent
            ref={(el) => el && (matsRef.current[1] = el)}
          />
          <meshBasicMaterial
            attach="material-2"
            color="#b88a55"
            transparent
            ref={(el) => el && (matsRef.current[2] = el)}
          />
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
