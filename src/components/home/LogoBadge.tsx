"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { asset } from "@/lib/asset";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

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
// 木牌尺寸（贴合 logo 约 2:1 的横版比例）
const W = 6.4; // 宽
const TH = 0.55; // 厚
const D = 3.1; // 深

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
  const mats = useRef<THREE.Material[]>([]);
  const heartRefs = useRef<THREE.Sprite[]>([]);
  const hearts = useRef<Heart[]>(Array.from({ length: HEART_POOL }, () => ({ active: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0 })));

  // 真实 logo 贴图（public/logo.png）
  const logoTex = useMemo(() => {
    const t = new THREE.TextureLoader().load(asset("/logo.png"));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.center.set(0.5, 0.5);
    return t;
  }, []);
  const heartTexes = useMemo(() => HEART_COLORS.map(makeHeartTexture), []);

  const hover = useRef(false);
  const spinTarget = useRef(0);
  const pop = useRef(1);
  const baseY = position[1] + TH / 2;

  useEffect(() => () => logoTex.dispose(), [logoTex]);

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
    const t = state.clock.elapsedTime;
    const p = clamp01(scroll.offset / narrFrac);
    const appear = smooth(0.88, 0.96, p);
    const g = groupRef.current;
    if (g) {
      g.visible = appear > 0.02;
      pop.current = THREE.MathUtils.lerp(pop.current, hover.current ? 1.08 : 1, 0.15);
      g.scale.setScalar(appear * pop.current);
      // 待机：轻轻左右摇摆（保持 logo 可读）；点击后叠加整圈旋转
      const rock = Math.sin(t * 0.7) * 0.18;
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, spinTarget.current + rock, 0.12);
      g.position.y = baseY + Math.sin(t * 1.5) * 0.05 + (hover.current ? 0.3 : 0);
    }
    for (const m of mats.current) if (m) (m as THREE.MeshBasicMaterial).opacity = appear;
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

  // BoxGeometry 材质顺序：0:+x 1:-x 2:+y(顶,logo) 3:-y 4:+z 5:-z
  const setMat = (i: number) => (el: THREE.Material | null) => {
    if (el) mats.current[i] = el;
  };

  return (
    <>
      <group ref={groupRef} position={[position[0], baseY, position[2]]} visible={false}>
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
            pop.current = 1.22;
            burst();
          }}
        >
          <boxGeometry args={[W, TH, D]} />
          <meshStandardMaterial attach="material-0" color="#c8975a" roughness={0.7} transparent ref={setMat(0)} />
          <meshStandardMaterial attach="material-1" color="#c8975a" roughness={0.7} transparent ref={setMat(1)} />
          <meshBasicMaterial attach="material-2" map={logoTex} toneMapped={false} transparent ref={setMat(2)} />
          <meshStandardMaterial attach="material-3" color="#a8743f" roughness={0.8} transparent ref={setMat(3)} />
          <meshStandardMaterial attach="material-4" color="#c8975a" roughness={0.7} transparent ref={setMat(4)} />
          <meshStandardMaterial attach="material-5" color="#c8975a" roughness={0.7} transparent ref={setMat(5)} />
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
