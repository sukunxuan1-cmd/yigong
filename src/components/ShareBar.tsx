"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "qrcode";

/**
 * 分享栏：复制链接、二维码（微信扫码分享）、可选下载当前图片。
 * downloadUrl 传入时显示“下载原图”。
 */
export default function ShareBar({
  title,
  downloadUrl,
  downloadName,
}: {
  title?: string;
  downloadUrl?: string;
  downloadName?: string;
}) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qr, setQr] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (showQR && url) {
      QRCode.toDataURL(url, { width: 220, margin: 1, color: { dark: "#0a120e", light: "#ffffff" } })
        .then(setQr)
        .catch(() => {});
    }
  }, [showQR, url]);

  // 点击外部关闭二维码
  useEffect(() => {
    if (!showQR) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowQR(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [showQR]);

  const copy = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: title ?? document.title, url });
        return;
      }
    } catch {
      /* 用户取消，继续走复制 */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 忽略 */
    }
  };

  const btn =
    "flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-leaf/50 hover:text-white";

  return (
    <div ref={wrapRef} className="relative flex flex-wrap items-center gap-2">
      <button onClick={copy} className={btn}>
        {copied ? "✓ 已复制链接" : "🔗 分享"}
      </button>
      <button onClick={() => setShowQR((v) => !v)} className={btn}>
        ▦ 二维码
      </button>
      {downloadUrl && (
        <a href={downloadUrl} download={downloadName ?? true} className={btn}>
          ⬇ 下载原图
        </a>
      )}

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="glass glow-ring absolute left-0 top-full z-30 mt-2 rounded-2xl p-4 text-center"
          >
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="二维码" className="h-40 w-40 rounded-lg" />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center text-xs text-slate-500">生成中…</div>
            )}
            <p className="mt-2 text-xs text-slate-400">微信扫码 · 分享给同事</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
