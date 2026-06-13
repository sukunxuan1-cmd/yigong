"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ScrollControls, Scroll, useScroll } from "@react-three/drei";
import HomeSections from "@/components/home/HomeSections";
import { photoCanvas } from "@/lib/placeholder";
import type { VolunteerEvent } from "@/lib/data";

/* ------------------------------------------------------------------ *
 * 滚动驱动的连续 3D 叙事首页（共用一个 Canvas，四幕无缝过渡）
 *   第〇幕 0~15%   光影开场：SpotLight 点亮 logo
 *   第一幕 15~30%  Hero：全屏照片 + 水波纹 shader + HTML 大标题
 *   第二幕 30~75%  雾中长廊：镜头穿过纵深排列的照片
 *   第三幕 75~100% 照片堆叠：俯视桌面，卡片逐张飞出
 * ------------------------------------------------------------------ */

const TOTAL_PAGES = 6;
// 3D 叙事占滚动的前 78%，图文板块在末尾（第三幕画面转暗后）升起，避免提前露出
const NARR_FRAC = 0.78;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// 复用的颜色常量（避免每帧 new）
const C_FOG_A = new THREE.Color("#fff1e0");
const C_FOG_B = new THREE.Color("#ffe6cf");
const C_BG_A = new THREE.Color("#fff7ec");
const C_BG_B = new THREE.Color("#ffeede");
const C_AMB_A = new THREE.Color("#fff4e6");
const C_AMB_B = new THREE.Color("#ffe7c8");

/* ---------------------------- 纹理工具 ---------------------------- */

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const ir = img.width / img.height;
  const r = w / h;
  let dw: number, dh: number;
  if (ir > r) {
    dh = h;
    dw = h * ir;
  } else {
    dw = w;
    dh = w / ir;
  }
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

type Overlay = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/** 圆角白边相框（拍立得感）：透明背景 + 白卡 + 圆角裁切照片 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function makePhotoTexture(
  seed: number,
  src: string | undefined,
  w: number,
  h: number,
  overlay?: Overlay,
  frame?: boolean
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  const paint = (source: HTMLImageElement | HTMLCanvasElement) => {
    ctx.clearRect(0, 0, w, h);
    if (frame) {
      // 白色相框卡片 + 柔和投影
      const m = Math.round(w * 0.035); // 外边距
      const pad = Math.round(w * 0.03); // 白边宽度
      const rad = Math.round(w * 0.05);
      ctx.save();
      ctx.shadowColor = "rgba(120,80,50,0.28)";
      ctx.shadowBlur = w * 0.05;
      ctx.shadowOffsetY = h * 0.02;
      ctx.fillStyle = "#fffaf2";
      roundRect(ctx, m, m, w - m * 2, h - m * 2, rad);
      ctx.fill();
      ctx.restore();
      // 内部照片
      const ix = m + pad;
      const iy = m + pad;
      const iw = w - (m + pad) * 2;
      const ih = h - (m + pad) * 2;
      ctx.save();
      roundRect(ctx, ix, iy, iw, ih, rad * 0.6);
      ctx.clip();
      const sw = source instanceof HTMLImageElement ? source.naturalWidth || source.width : source.width;
      const sh = source instanceof HTMLImageElement ? source.naturalHeight || source.height : source.height;
      const scale = Math.max(iw / sw, ih / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      ctx.drawImage(source, ix + (iw - dw) / 2, iy + (ih - dh) / 2, dw, dh);
      ctx.restore();
    } else {
      drawCover(ctx, source as HTMLImageElement, w, h);
    }
    overlay?.(ctx, w, h);
  };

  paint(photoCanvas(seed));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (src) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      paint(img);
      tex.needsUpdate = true;
    };
    img.src = src;
  }
  return tex;
}

function makeLabelTexture(year: string, title: string) {
  const w = 768;
  const h = 160;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#3bb273";
  ctx.font = "bold 64px system-ui, sans-serif";
  ctx.fillText(year, 8, h / 2);
  const yw = ctx.measureText(year).width;
  ctx.fillStyle = "rgba(74,56,46,0.92)";
  ctx.font = "44px system-ui, sans-serif";
  ctx.fillText(title, 8 + yw + 28, h / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeLogoTexture() {
  const w = 1024;
  const h = 420;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(255,159,126,0.45)";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "#4a382e";
  ctx.font = "bold 200px system-ui, sans-serif";
  ctx.fillText("义工团", w / 2, h * 0.42);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(59,178,115,0.95)";
  ctx.font = "600 52px system-ui, sans-serif";
  ctx.fillText("R E S H I N E   V O L U N T E E R", w / 2, h * 0.82);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------------------------- Hero shader ---------------------------- */

const heroVert = /* glsl */ `
  uniform float uTime;
  uniform vec2  uMouse;     // 平面 uv 空间 0..1
  uniform float uActive;    // 鼠标活跃度 0..1
  varying vec2  vUv;
  varying float vDisp;
  void main() {
    vUv = uv;
    vec3 p = position;
    // 缓慢轻微波动
    float wave = sin(uv.x * 6.0 + uTime * 0.9) * 0.035
               + cos(uv.y * 5.0 + uTime * 0.7) * 0.03;
    // 鼠标处扩散水波纹
    float d = distance(uv, uMouse);
    float ring = sin(d * 34.0 - uTime * 4.5) * exp(-d * 7.0) * 0.16 * uActive;
    float disp = wave + ring;
    p.z += disp;
    vDisp = disp;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const heroFrag = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uOpacity;
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uActive;
  varying vec2  vUv;
  varying float vDisp;
  void main() {
    // 依位移做轻微折射位移
    vec2 uv = vUv + vDisp * 0.25;
    vec3 col = texture2D(uTex, uv).rgb;
    // 水波高光
    col += vec3(1.0, 0.85, 0.6) * max(vDisp, 0.0) * 1.0 * (0.4 + uActive);
    // 暗角
    float vig = smoothstep(1.1, 0.5, distance(vUv, vec2(0.5)));
    col *= 0.88 + 0.12 * vig;
    gl_FragColor = vec4(col, uOpacity);
  }
`;

/* ---------------------------- 数据装配 ---------------------------- */

type Shot = { seed: number; src?: string; title: string; date: string };

function useScene(events: VolunteerEvent[]) {
  return useMemo(() => {
    const flat: Shot[] = events.flatMap((e) =>
      e.photos.map((p) => ({ seed: p.seed, src: p.src, title: e.title, date: e.date }))
    );
    const pick = (n: number) => {
      const out: Shot[] = [];
      for (let i = 0; i < n; i++) out.push(flat[Math.floor((i * flat.length) / n) % flat.length]);
      return out;
    };

    const heroTex = makePhotoTexture(events[0].cover, events[0].coverSrc, 1024, 576);

    // 第二幕：12 张交错纵深排列
    const corridorShots = pick(12);
    const corridor = corridorShots.map((s, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -2 - i * 2.25;
      const x = side * (1.7 + (i % 3) * 0.45);
      const y = Math.sin(i * 1.3) * 0.7;
      const scale = 0.9 + ((i * 7) % 5) * 0.12;
      return {
        tex: makePhotoTexture(s.seed, s.src, 870, 580, undefined, true),
        label: makeLabelTexture(s.date.slice(0, 4), s.title),
        pos: [x, y, z] as [number, number, number],
        rotY: -side * 0.22,
        scale,
      };
    });

    // 第三幕：每个活动一张卡片，平铺堆叠（带错位抖动）
    const stack = events.map((e, i) => ({
      jx: (((i * 53) % 7) - 3) * 0.11,
      jz: (((i * 29) % 5) - 2) * 0.11,
      rot0: ((((i * 37) % 20) - 10) * 0.014),
      tex: makePhotoTexture(e.cover, e.coverSrc, 1024, 672, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, h * 0.6, 0, h);
        g.addColorStop(0, "rgba(7,11,9,0)");
        g.addColorStop(1, "rgba(7,11,9,0.94)");
        ctx.fillStyle = g;
        ctx.fillRect(0, h * 0.55, w, h * 0.45);
        ctx.textAlign = "left";
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.round(h * 0.07)}px system-ui, sans-serif`;
        ctx.fillText(e.title, w * 0.06, h * 0.85);
        ctx.fillStyle = "#7edca4";
        ctx.font = `${Math.round(h * 0.05)}px system-ui, sans-serif`;
        ctx.fillText(`${e.date} · ${e.location}`, w * 0.06, h * 0.93);
      }),
      idx: i,
    }));

    // 开场：照片退到两侧/上方，让出中央的 logo
    const act0Layout: { pos: [number, number, number]; rot: number; scale: number }[] = [
      { pos: [-5.0, 1.25, -2.2], rot: 0.14, scale: 1.2 },
      { pos: [-3.7, -1.7, -2.9], rot: 0.09, scale: 1.05 },
      { pos: [5.0, 1.05, -2.2], rot: -0.14, scale: 1.2 },
      { pos: [3.7, -1.8, -2.9], rot: -0.09, scale: 1.05 },
      { pos: [0, 2.95, -3.0], rot: 0, scale: 1.0 },
    ];
    const act0 = pick(5).map((s, i) => ({
      tex: makePhotoTexture(s.seed, s.src, 600, 400, undefined, true),
      ...act0Layout[i],
    }));

    return { heroTex, corridor, stack, act0, logoTex: makeLogoTexture() };
  }, [events]);
}

/* ---------------------------- 主场景 ---------------------------- */

const CAM_KEYS: { p: number; pos: [number, number, number]; tgt: [number, number, number] }[] = [
  { p: 0.0, pos: [0, 0.3, 7.6], tgt: [0, 0.45, 0] },
  { p: 0.15, pos: [0, 0, 5.2], tgt: [0, 0, 0] },
  { p: 0.3, pos: [0, 0, 3.5], tgt: [0, 0, -2] },
  { p: 0.72, pos: [0, 0, -26.5], tgt: [0, 0, -31] },
  { p: 0.85, pos: [0, 7.5, -29.4], tgt: [0, 0.1, -33] }, // 落到桌面俯视
  { p: 1.0, pos: [0, 9, -30.4], tgt: [0, 0.1, -33] }, // 继续下压，卡片飞出
];

function Scene({
  events,
  titleRef,
}: {
  events: VolunteerEvent[];
  titleRef: React.RefObject<HTMLDivElement | null>;
}) {
  const scroll = useScroll();
  const { heroTex, corridor, stack, act0, logoTex } = useScene(events);

  // refs
  const heroMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: heroVert,
        fragmentShader: heroFrag,
        transparent: true,
        uniforms: {
          uTex: { value: heroTex },
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uActive: { value: 0 },
          uOpacity: { value: 0 },
        },
      }),
    [heroTex]
  );
  const heroRef = useRef<THREE.Mesh>(null);
  const logoRef = useRef<THREE.Mesh>(null);
  const act0Refs = useRef<THREE.Mesh[]>([]);
  const labelRefs = useRef<THREE.Mesh[]>([]);
  const corridorGroupRef = useRef<THREE.Group>(null);
  const stackRefs = useRef<THREE.Group[]>([]);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const spotTarget = useMemo(() => new THREE.Object3D(), []);
  const warmRef = useRef<THREE.PointLight>(null);
  const tableRef = useRef<THREE.PointLight>(null);
  const tableMeshRef = useRef<THREE.Mesh>(null);
  const fogRef = useRef<THREE.FogExp2>(null);
  const bgRef = useRef<THREE.Color>(null);

  const tgt = useMemo(() => new THREE.Vector3(), []);
  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const active = useRef(0);
  const lastPointer = useRef(new THREE.Vector2());

  useEffect(() => {
    spotTarget.position.set(0, 0.45, 0);
  }, [spotTarget]);

  useFrame((state, delta) => {
    const offset = scroll.offset;
    const p = clamp01(offset / NARR_FRAC); // 0..1 在叙事区间
    const t = state.clock.elapsedTime;
    const pointer = state.pointer;

    // 鼠标活跃度（用于水波纹）
    const moved = Math.hypot(pointer.x - lastPointer.current.x, pointer.y - lastPointer.current.y);
    lastPointer.current.set(pointer.x, pointer.y);
    active.current = Math.min(1, active.current + moved * 6);
    active.current *= 0.94;

    /* —— 相机：分段关键帧插值 —— */
    let k = 0;
    while (k < CAM_KEYS.length - 2 && p > CAM_KEYS[k + 1].p) k++;
    const a = CAM_KEYS[k];
    const b = CAM_KEYS[k + 1];
    const lt = smooth(a.p, b.p, p);
    tmpPos.set(
      THREE.MathUtils.lerp(a.pos[0], b.pos[0], lt),
      THREE.MathUtils.lerp(a.pos[1], b.pos[1], lt),
      THREE.MathUtils.lerp(a.pos[2], b.pos[2], lt)
    );
    tgt.set(
      THREE.MathUtils.lerp(a.tgt[0], b.tgt[0], lt),
      THREE.MathUtils.lerp(a.tgt[1], b.tgt[1], lt),
      THREE.MathUtils.lerp(a.tgt[2], b.tgt[2], lt)
    );
    // 克制的鼠标视差（2~3 度）
    const par = 0.18 * smooth(0.12, 0.3, p);
    tmpPos.x += pointer.x * par;
    tmpPos.y += pointer.y * par * 0.7;
    state.camera.position.lerp(tmpPos, 0.12);
    state.camera.lookAt(tgt);

    /* —— 灯光 / 雾 —— */
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.55 + smooth(0.04, 0.22, p) * 0.5;
      ambientRef.current.color.lerpColors(C_AMB_A, C_AMB_B, smooth(0.25, 0.7, p));
    }
    if (spotRef.current) {
      spotRef.current.intensity = (1 - smooth(0.04, 0.22, p)) * 90;
      spotRef.current.position.set(pointer.x * 2.6, 3 + pointer.y * 1.4, 4.2);
    }
    if (warmRef.current) {
      warmRef.current.intensity = smooth(0.28, 0.42, p) * 55 * (1 - smooth(0.9, 1, p) * 0.5);
      warmRef.current.position.set(
        state.camera.position.x,
        state.camera.position.y + 1.2,
        state.camera.position.z - 2.5
      );
    }
    if (tableRef.current) tableRef.current.intensity = smooth(0.8, 0.95, p) * 42;
    // 桌面只在进入第三幕俯视时淡入，避免在长廊阶段横穿照片（穿模）
    if (tableMeshRef.current) {
      const tm = tableMeshRef.current.material as THREE.MeshStandardMaterial;
      tm.opacity = smooth(0.72, 0.84, p);
      tableMeshRef.current.visible = tm.opacity > 0.01;
    }

    if (fogRef.current) {
      fogRef.current.density = smooth(0.3, 0.45, p) * 0.05 * (1 - smooth(0.92, 1, p) * 0.6);
      fogRef.current.color.lerpColors(C_FOG_A, C_FOG_B, smooth(0.3, 0.7, p));
    }
    if (bgRef.current) bgRef.current.lerpColors(C_BG_A, C_BG_B, smooth(0.3, 0.7, p));

    /* —— 第〇幕 logo + 悬浮照片 —— */
    if (logoRef.current) {
      const m = logoRef.current.material as THREE.MeshStandardMaterial;
      m.opacity = 1 - smooth(0.1, 0.2, p);
      logoRef.current.position.y = 0.45 + Math.sin(t * 0.8) * 0.06;
      logoRef.current.visible = m.opacity > 0.01;
    }
    act0Refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const m = mesh.material as THREE.MeshStandardMaterial;
      m.opacity = 1 - smooth(0.13, 0.22, p);
      mesh.visible = m.opacity > 0.01;
      mesh.position.y = act0[i].pos[1] + Math.sin(t * 0.5 + i) * 0.08;
    });

    /* —— 第一幕 hero shader + HTML 标题 —— */
    heroMat.uniforms.uTime.value = t;
    heroMat.uniforms.uActive.value = active.current;
    heroMat.uniforms.uMouse.value.set(pointer.x * 0.5 + 0.5, pointer.y * 0.5 + 0.5);
    const heroOp = smooth(0.13, 0.17, p) * (1 - smooth(0.3, 0.35, p));
    heroMat.uniforms.uOpacity.value = heroOp;
    if (heroRef.current) heroRef.current.visible = heroOp > 0.01;

    if (titleRef.current) {
      const op = smooth(0.15, 0.19, p) * (1 - smooth(0.27, 0.32, p));
      titleRef.current.style.opacity = String(op);
      titleRef.current.style.visibility = op > 0.01 ? "visible" : "hidden";
      titleRef.current.style.transform = `translateY(${(p - 0.22) * -140}px)`;
    }

    /* —— 第二幕 长廊：仅在接近/进入长廊时显示，避免开场遮挡 logo —— */
    if (corridorGroupRef.current) corridorGroupRef.current.visible = p > 0.24;

    /* —— 第二幕 标签淡入 —— */
    const reveal = smooth(0.3, 0.42, p);
    labelRefs.current.forEach((mesh) => {
      if (!mesh) return;
      (mesh.material as THREE.MeshBasicMaterial).opacity = reveal;
    });

    /* —— 第三幕 卡片逐张飞出 —— */
    const lp = smooth(0.85, 1.0, p);
    const n = stack.length;
    stackRefs.current.forEach((grp, i) => {
      if (!grp) return;
      const item = stack[i];
      const order = n - 1 - i; // 0 = 最顶层，最先飞走
      const step = 1 / n;
      const cp = clamp01((lp - order * step) / step);
      grp.position.x = item.jx + cp * (item.jx > 0 ? 3 : -3);
      grp.position.y = i * 0.045 + cp * 6.5;
      grp.position.z = -33 + item.jz + cp * 6;
      grp.rotation.x = -Math.PI / 2 + cp * 0.6;
      grp.rotation.z = item.rot0 + cp * 0.4;
      const m = (grp.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (m) m.opacity = 1 - smooth(0.6, 1, cp);
    });
  });

  return (
    <>
      <color ref={bgRef} attach="background" args={["#fff7ec"]} />
      <fogExp2 ref={fogRef} attach="fog" args={["#fff1e0", 0]} />
      <ambientLight ref={ambientRef} intensity={0.05} />
      <spotLight
        ref={spotRef}
        position={[0, 3, 4.2]}
        angle={0.5}
        penumbra={0.8}
        distance={20}
        color="#eaf6ff"
        target={spotTarget}
      />
      <pointLight ref={warmRef} color="#ffc98a" distance={26} decay={1.2} intensity={0} />
      <pointLight ref={tableRef} position={[0, 6, -31]} color="#fff0d8" distance={30} intensity={0} />

      {/* 第〇幕 logo */}
      <mesh ref={logoRef} position={[0, 0.45, 2.6]}>
        <planeGeometry args={[3.2, 1.3]} />
        <meshStandardMaterial map={logoTex} transparent emissive="#9fe6c0" emissiveIntensity={0.15} />
      </mesh>
      {act0.map((a, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) act0Refs.current[i] = el;
          }}
          position={a.pos}
          rotation={[0, a.rot, 0]}
          scale={a.scale}
        >
          <planeGeometry args={[3.0, 2.0]} />
          <meshBasicMaterial map={a.tex} transparent alphaTest={0.5} />
        </mesh>
      ))}

      {/* 第一幕 hero */}
      <mesh ref={heroRef} position={[0, 0, 0]}>
        <planeGeometry args={[8.4, 4.72, 64, 36]} />
        <primitive object={heroMat} attach="material" />
      </mesh>

      {/* 第二幕 长廊（开场/Hero 阶段整体隐藏，进入长廊才浮现） */}
      <group ref={corridorGroupRef}>
        {corridor.map((c, i) => (
          <group key={i} position={c.pos} rotation={[0, c.rotY, 0]}>
            <mesh scale={c.scale}>
              <planeGeometry args={[2.6, 1.73]} />
              <meshBasicMaterial map={c.tex} transparent alphaTest={0.5} side={THREE.DoubleSide} />
            </mesh>
            <mesh
              position={[0, -1.05 * c.scale, 0.02]}
              ref={(el) => {
                if (el) labelRefs.current[i] = el;
              }}
            >
              <planeGeometry args={[2.4, 0.5]} />
              <meshBasicMaterial map={c.label} transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 第三幕 桌面 + 卡片堆（桌面尺寸收小，且仅第三幕淡入） */}
      <mesh ref={tableMeshRef} position={[0, -0.35, -33]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#ecd6bb" roughness={1} transparent opacity={0} />
      </mesh>
      {stack.map((s, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) stackRefs.current[i] = el;
          }}
          position={[0, i * 0.05, -33]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <mesh>
            <planeGeometry args={[4.2, 2.76]} />
            <meshBasicMaterial map={s.tex} transparent side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ---------------------------- 入口 ---------------------------- */

export default function HeroJourney({ events }: { events: VolunteerEvent[] }) {
  const titleRef = useRef<HTMLDivElement>(null);
  return (
    <div className="fixed inset-0">
      <Canvas
        camera={{ position: [0, 0.3, 7.6], fov: 45 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <ScrollControls pages={TOTAL_PAGES} damping={0.28}>
          <Scene events={events} titleRef={titleRef} />
          <Scroll html style={{ width: "100%" }}>
            {/* 叙事在 offset≈0.78（≈390vh）结束，板块在 405vh 升起，仅在转暗的第三幕末尾露出 */}
            <div style={{ position: "absolute", top: "405vh", width: "100vw" }}>
              <div className="bg-gradient-to-b from-transparent via-cream/85 to-cream pt-28">
                <HomeSections events={events} embedded />
              </div>
            </div>
          </Scroll>
        </ScrollControls>
      </Canvas>

      {/* HTML 大标题层（在 WebGL 之外，固定居中，由 Scene 每帧驱动透明度与视差） */}
      <div
        ref={titleRef}
        className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-center px-6 text-center"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <div className="rounded-[2.5rem] bg-cream/55 px-10 py-8 backdrop-blur-md">
          <p className="mb-4 text-sm font-semibold tracking-[0.5em] text-leaf">RESHINE 义工团</p>
          <h1 className="font-display text-6xl font-black leading-[1.05] text-cocoa drop-shadow-[0_2px_16px_rgba(255,247,236,0.9)] md:text-8xl">
            记录每一次
            <br />
            <span className="text-gradient">微光与善行</span>
          </h1>
          <p className="mt-6 text-base text-mocha">滚动，跟随镜头穿过我们走过的每一站 🌿</p>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-xs tracking-[0.3em] text-mocha/70">
        SCROLL ↓
      </div>
    </div>
  );
}
