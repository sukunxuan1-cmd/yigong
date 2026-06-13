"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import type { Photo } from "@/lib/data";
import { photoCanvas } from "@/lib/placeholder";

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uProgress;
  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    float t = uProgress;
    float n = noise(vUv * 7.0 + uTime * 0.15);
    // 每个像素的揭示阈值：横向扫过 + 噪声扰动
    float r = vUv.x * 0.7 + n * 0.3;
    float m = smoothstep(r - 0.15, r + 0.15, t * 1.6 - 0.3);
    // 转场前沿的扭曲强度
    float front = m * (1.0 - m) * 4.0;
    vec2 warp = (n - 0.5) * front * 0.22 * vec2(1.0, 0.7);
    vec2 uvA = vUv + warp;
    vec2 uvB = vUv - warp;

    // 前沿轻微 RGB 分离
    vec4 a = vec4(
      texture2D(uTexA, uvA + vec2(front * 0.008, 0.0)).r,
      texture2D(uTexA, uvA).g,
      texture2D(uTexA, uvA - vec2(front * 0.008, 0.0)).b,
      1.0
    );
    vec4 b = vec4(
      texture2D(uTexB, uvB + vec2(front * 0.008, 0.0)).r,
      texture2D(uTexB, uvB).g,
      texture2D(uTexB, uvB - vec2(front * 0.008, 0.0)).b,
      1.0
    );
    vec4 col = mix(a, b, m);
    // 前沿发光
    col.rgb += vec3(0.45, 1.0, 0.65) * front * 0.12;
    gl_FragColor = col;
  }
`;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function loadTexture(photo: Photo): THREE.Texture {
  if (photo.src) {
    const t = new THREE.TextureLoader().load(photo.src);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const t = new THREE.CanvasTexture(photoCanvas(photo.seed));
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function StagePlane({
  photos,
  index,
  prevIndex,
}: {
  photos: Photo[];
  index: number;
  prevIndex: React.MutableRefObject<number>;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  const textures = useMemo(() => photos.map(loadTexture), [photos]);

  const uniforms = useMemo(
    () => ({
      uTexA: { value: textures[0] },
      uTexB: { value: textures[0] },
      uProgress: { value: 0 },
      uTime: { value: 0 },
    }),
    [textures]
  );

  useEffect(() => {
    // R3F 会克隆 uniforms prop，必须操作材质实例上的 uniforms
    const u = mat.current?.uniforms;
    if (!u) return;
    if (index === prevIndex.current) {
      u.uTexA.value = textures[index];
      return;
    }
    u.uTexA.value = textures[prevIndex.current];
    u.uTexB.value = textures[index];
    u.uProgress.value = 0;
    const tween = gsap.to(u.uProgress, {
      value: 1,
      duration: 1.1,
      ease: "power2.inOut",
      onComplete: () => {
        u.uTexA.value = textures[index];
        u.uProgress.value = 0;
      },
    });
    prevIndex.current = index;
    return () => void tween.kill();
  }, [index, textures, prevIndex]);

  useFrame((_, delta) => {
    if (mat.current) mat.current.uniforms.uTime.value += delta;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={mat} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
    </mesh>
  );
}

/** WebGL 照片舞台：扭曲溶解转场，支持左右滑动手势 */
export default function PhotoStage({
  photos,
  index,
  onSwipe,
}: {
  photos: Photo[];
  index: number;
  onSwipe: (dir: 1 | -1) => void;
}) {
  const prevIndex = useRef(index);
  const touchX = useRef<number | null>(null);

  return (
    <div
      className="absolute inset-0"
      onPointerDown={(e) => (touchX.current = e.clientX)}
      onPointerUp={(e) => {
        if (touchX.current === null) return;
        const dx = e.clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 60) onSwipe(dx < 0 ? 1 : -1);
      }}
    >
      <Canvas orthographic camera={{ zoom: 1, position: [0, 0, 5] }} dpr={[1, 2]}>
        <StagePlane photos={photos} index={index} prevIndex={prevIndex} />
      </Canvas>
    </div>
  );
}
