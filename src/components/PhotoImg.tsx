"use client";

import { useEffect, useState } from "react";
import { photoURL } from "@/lib/placeholder";

/**
 * 照片组件：优先使用真实 src（接 CDN 后），否则用运行时生成的占位图。
 * 自带懒加载。
 */
export default function PhotoImg({
  seed,
  src,
  alt,
  className,
}: {
  seed: number;
  src?: string;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(src ?? null);

  useEffect(() => {
    if (!src) setUrl(photoURL(seed));
  }, [seed, src]);

  if (!url) return <div className={`${className ?? ""} animate-pulse bg-sand`} aria-label={alt} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} loading="lazy" className={className} draggable={false} />;
}
