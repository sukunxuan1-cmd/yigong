/**
 * 运行时生成的艺术化占位照片。
 * 真实部署时把 Photo.src 换成 OSS/COS + CDN 地址即可，
 * 所有组件会优先使用真实 src。
 */

const canvasCache = new Map<string, HTMLCanvasElement>();
const urlCache = new Map<string, string>();

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTES: [string, string, string][] = [
  ["#0d3b24", "#7edca4", "#1fa45c"],
  ["#1d3a2a", "#b9e6cb", "#36b06d"],
  ["#13301f", "#4cc98a", "#9fc97a"],
  ["#27381e", "#a8d97a", "#2a7d4f"],
  ["#3a2e17", "#e6b85c", "#7aa05a"],
  ["#16352f", "#6ecfb0", "#2fb874"],
];

export function photoCanvas(seed: number, w = 1024, h = 683): HTMLCanvasElement {
  const key = `${seed}-${w}x${h}`;
  const cached = canvasCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const rnd = mulberry32(seed * 7919 + 13);
  const [base, c1, c2] = PALETTES[seed % PALETTES.length];

  // 底层斜向渐变
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, base);
  g.addColorStop(0.55, shade(base, 1.6));
  g.addColorStop(1, base);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // 远景光团
  for (let i = 0; i < 7; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = (0.15 + rnd() * 0.4) * w;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    const col = rnd() > 0.5 ? c1 : c2;
    rg.addColorStop(0, hexA(col, 0.5 * rnd() + 0.18));
    rg.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);
  }

  // 中景：起伏的「山形 / 人群」剪影层
  for (let layer = 0; layer < 3; layer++) {
    ctx.beginPath();
    const baseY = h * (0.55 + layer * 0.14);
    ctx.moveTo(0, h);
    ctx.lineTo(0, baseY);
    const bumps = 5 + Math.floor(rnd() * 5);
    for (let b = 0; b <= bumps; b++) {
      const x = (b / bumps) * w;
      const y = baseY - (rnd() - 0.3) * h * 0.18;
      ctx.quadraticCurveTo(x - w / bumps / 2, baseY - (rnd() - 0.3) * h * 0.22, x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = hexA(shade(base, 0.5 + layer * 0.25), 0.55);
    ctx.fill();
  }

  // 前景：发光的小圆点（像人群中的灯光）
  const dots = 24 + Math.floor(rnd() * 30);
  for (let i = 0; i < dots; i++) {
    const x = rnd() * w;
    const y = h * 0.5 + rnd() * h * 0.5;
    const r = 1 + rnd() * 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = hexA(rnd() > 0.5 ? c1 : "#ffffff", 0.35 + rnd() * 0.5);
    ctx.fill();
  }

  // 颗粒感
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 18;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);

  // 暗角
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  canvasCache.set(key, canvas);
  return canvas;
}

export function photoURL(seed: number, w = 1024, h = 683): string {
  const key = `${seed}-${w}x${h}`;
  const cached = urlCache.get(key);
  if (cached) return cached;
  const url = photoCanvas(seed, w, h).toDataURL("image/jpeg", 0.85);
  urlCache.set(key, url);
  return url;
}

/** 头像：基于成员配色的发光渐变 + 首字 */
export function avatarCanvas(name: string, palette: [string, string], size = 512): HTMLCanvasElement {
  const key = `av-${name}-${size}`;
  const cached = canvasCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, palette[0]);
  g.addColorStop(1, palette[1]);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `bold ${size * 0.34}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name.slice(0, 1), size / 2, size / 2 + size * 0.02);
  canvasCache.set(key, canvas);
  return canvas;
}

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) * f);
  const g = Math.min(255, ((n >> 8) & 255) * f);
  const b = Math.min(255, (n & 255) * f);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function hexA(hex: string, a: number): string {
  if (hex.startsWith("rgb")) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
