"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { photoCanvas } from "@/lib/placeholder";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type HeroSlide = { seed: number; src?: string; title: string; date: string };

const GRID_W = 180;
const GRID_H = 120;
const COUNT = GRID_W * GRID_H;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** 把每张照片在网格分辨率下的像素颜色采出来（cover 裁切，支持真实照片） */
async function samplePhotos(slides: HeroSlide[]): Promise<Float32Array[]> {
  const off = document.createElement("canvas");
  off.width = GRID_W;
  off.height = GRID_H;
  const ctx = off.getContext("2d", { willReadFrequently: true })!;

  const sources = await Promise.all(
    slides.map(async (s) => {
      if (s.src) {
        try {
          return await loadImage(s.src);
        } catch {
          /* 加载失败回退占位图 */
        }
      }
      return photoCanvas(s.seed);
    })
  );

  return sources.map((source) => {
    const sw = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const sh = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
    // cover 裁切到网格比例
    const scale = Math.max(GRID_W / sw, GRID_H / sh);
    const cw = GRID_W / scale;
    const chh = GRID_H / scale;
    ctx.clearRect(0, 0, GRID_W, GRID_H);
    ctx.drawImage(source, (sw - cw) / 2, (sh - chh) / 2, cw, chh, 0, 0, GRID_W, GRID_H);
    const px = ctx.getImageData(0, 0, GRID_W, GRID_H).data;
    const colors = new Float32Array(COUNT * 3);
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        // 画布 y 向下，粒子平面 y 向上，翻转一次
        const src = ((GRID_H - 1 - y) * GRID_W + x) * 4;
        const dst = (y * GRID_W + x) * 3;
        colors[dst] = px[src] / 255;
        colors[dst + 1] = px[src + 1] / 255;
        colors[dst + 2] = px[src + 2] / 255;
      }
    }
    return colors;
  });
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMix;        // 0..1 两张照片之间的进度
  uniform float uIntro;      // 1 → 0 入场
  uniform vec3 uMouse;       // 世界坐标
  uniform float uMouseForce;
  uniform float uPointSize;
  attribute vec3 aColorA;
  attribute vec3 aColorB;
  attribute vec3 aScatter;
  attribute float aRand;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float t = uMix;
    // 转场强度：两端为 0，中段为 1，叠加每粒子随机相位形成波浪式打散
    float burst = sin(clamp(t * (1.15 + aRand * 0.5) - aRand * 0.15, 0.0, 1.0) * 3.14159265);

    vec3 grid = position;
    // 待机呼吸波
    grid.z += sin(uTime * 0.7 + position.x * 1.4 + position.y * 2.1) * 0.05
            + cos(uTime * 0.5 + position.y * 1.7) * 0.04;

    // 转场时飞向各自的散点目标，并绕中心旋转
    vec3 pos = mix(grid, aScatter, burst);
    float ang = burst * (0.6 + aRand) * 2.2;
    float ca = cos(ang), sa = sin(ang);
    pos.xz = mat2(ca, -sa, sa, ca) * pos.xz;

    // 入场：从散点聚合
    pos = mix(pos, aScatter * 2.4, uIntro);

    // 鼠标流体扰动
    vec2 d = pos.xy - uMouse.xy;
    float dist = length(d);
    float force = exp(-dist * dist * 2.6) * uMouseForce;
    vec2 dir = normalize(d + vec2(0.0001));
    // 切向分量制造涡旋感
    vec2 tangent = vec2(-dir.y, dir.x);
    pos.xy += (dir * 0.7 + tangent * 0.5) * force;
    pos.z += force * (0.6 + 0.4 * sin(uTime * 3.0 + aRand * 6.28));

    vColor = mix(aColorA, aColorB, smoothstep(0.25, 0.75, t)) * 1.2;
    float bright = dot(vColor, vec3(0.299, 0.587, 0.114));
    vAlpha = (0.55 + bright * 0.45) * (1.0 - uIntro * 0.6);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uPointSize * (0.75 + bright * 0.5 + burst * 0.9) * (9.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    float soft = smoothstep(0.5, 0.1, r);
    gl_FragColor = vec4(vColor, vAlpha * soft);
  }
`;

function Particles({
  slides,
  progressRef,
}: {
  slides: HeroSlide[];
  progressRef: React.MutableRefObject<number>;
}) {
  const [photos, setPhotos] = useState<Float32Array[] | null>(null);

  useEffect(() => {
    let alive = true;
    samplePhotos(slides).then((c) => alive && setPhotos(c));
    return () => {
      alive = false;
    };
  }, [slides]);

  if (!photos) return null;
  return <ParticleCloud photos={photos} progressRef={progressRef} />;
}

function ParticleCloud({
  photos,
  progressRef,
}: {
  photos: Float32Array[];
  progressRef: React.MutableRefObject<number>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const { viewport } = useThree();
  const segmentRef = useRef(0);
  const mouse = useRef(new THREE.Vector3(99, 99, 0));
  const mouseTarget = useRef(new THREE.Vector3(99, 99, 0));
  const force = useRef(0);

  // 平面尺寸自适应视口
  const planeW = Math.min(viewport.width * 0.86, 13);
  const planeH = planeW * (GRID_H / GRID_W);

  const { positions, scatter, rands } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const scatter = new Float32Array(COUNT * 3);
    const rands = new Float32Array(COUNT);
    let i = 0;
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        positions[i * 3] = (x / (GRID_W - 1) - 0.5) * planeW;
        positions[i * 3 + 1] = (y / (GRID_H - 1) - 0.5) * planeH;
        positions[i * 3 + 2] = 0;
        // 散点目标：椭球壳上随机分布
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = 4 + Math.random() * 4;
        scatter[i * 3] = Math.sin(ph) * Math.cos(th) * r * 1.4;
        scatter[i * 3 + 1] = Math.cos(ph) * r * 0.8;
        scatter[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r - 1.5;
        rands[i] = Math.random();
        i++;
      }
    }
    return { positions, scatter, rands };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planeW, planeH]);

  const colorA = useMemo(() => new Float32Array(photos[0]), [photos]);
  const colorB = useMemo(() => new Float32Array(photos[1 % photos.length]), [photos]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMix: { value: 0 },
      uIntro: { value: 1 },
      uMouse: { value: new THREE.Vector3(99, 99, 0) },
      uMouseForce: { value: 0 },
      uPointSize: { value: 8 },
    }),
    []
  );

  // 注意：R3F 会克隆 uniforms prop，动画必须写到材质实例上
  const intro = useRef({ v: 1 });
  useEffect(() => {
    intro.current.v = 1;
    const tween = gsap.to(intro.current, { v: 0, duration: 2.2, ease: "power3.out" });
    return () => void tween.kill();
  }, []);

  useFrame((state, delta) => {
    const mat = matRef.current;
    const geo = geoRef.current;
    if (!mat || !geo) return;
    mat.uniforms.uTime.value += delta;
    // 点尺寸 ≈ 网格间距，铺满成像；随屏幕与 DPR 精确换算
    const pxPerUnit = state.size.height / state.viewport.height;
    mat.uniforms.uPointSize.value =
      (planeW / GRID_W) * pxPerUnit * state.gl.getPixelRatio() * 1.45;

    // 鼠标平滑跟随，移动速度决定扰动力度
    mouseTarget.current.set(
      (state.pointer.x * viewport.width) / 2,
      (state.pointer.y * viewport.height) / 2,
      0
    );
    const speed = mouse.current.distanceTo(mouseTarget.current);
    mouse.current.lerp(mouseTarget.current, 1 - Math.pow(0.001, delta));
    // 静止时力场衰减为 0，移动越快扰动越强
    force.current = THREE.MathUtils.lerp(force.current, Math.min(speed * 2.5, 1.1), 0.08);
    mat.uniforms.uMouseForce.value = force.current;
    (mat.uniforms.uMouse.value as THREE.Vector3).copy(mouse.current);
    mat.uniforms.uIntro.value = intro.current.v;

    // 滚动进度 → 段落 + 段内 mix
    const p = THREE.MathUtils.clamp(progressRef.current, 0, photos.length - 1.001);
    const seg = Math.floor(p);
    if (seg !== segmentRef.current) {
      segmentRef.current = seg;
      colorA.set(photos[seg]);
      colorB.set(photos[Math.min(seg + 1, photos.length - 1)]);
      geo.attributes.aColorA.needsUpdate = true;
      geo.attributes.aColorB.needsUpdate = true;
    }
    mat.uniforms.uMix.value = THREE.MathUtils.lerp(mat.uniforms.uMix.value, p - seg, 0.12);
  });

  return (
    <points>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColorA" args={[colorA, 3]} />
        <bufferAttribute attach="attributes-aColorB" args={[colorB, 3]} />
        <bufferAttribute attach="attributes-aScatter" args={[scatter, 3]} />
        <bufferAttribute attach="attributes-aRand" args={[rands, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

export default function ParticleHero({ slides }: { slides: HeroSlide[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: wrapRef.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progressRef.current = self.progress * (slides.length - 1);
        setSlideIdx(Math.round(self.progress * (slides.length - 1)));
      },
    });
    return () => st.kill();
  }, [slides.length]);

  const slide = slides[slideIdx];

  return (
    <div ref={wrapRef} style={{ height: `${slides.length * 90}vh` }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <Canvas
          camera={{ position: [0, 0, 9], fov: 50 }}
          dpr={[1, 1.8]}
          gl={{ antialias: false, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#070b09"]} />
          <Particles slides={slides} progressRef={progressRef} />
        </Canvas>

        {/* HTML 叠加层 */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-24">
          <div className="mt-8 text-center">
            <h1 className="font-display text-5xl font-black tracking-tight md:text-7xl">
              <span className="text-gradient">微光成炬</span>
            </h1>
            <p className="mt-4 text-base text-slate-400 md:text-lg">
              Reshine 义工团影像档案 · 每一粒光都是一次善行
            </p>
          </div>
          <div className="glass rounded-2xl px-6 py-3 text-center">
            <p className="text-sm font-semibold text-white">{slide.title}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {slide.date} · 滚动穿越 {slides.length} 次活动
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-xs tracking-[0.3em] text-slate-500">
          SCROLL ↓
        </div>
      </div>
    </div>
  );
}
