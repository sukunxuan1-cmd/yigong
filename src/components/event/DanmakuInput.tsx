"use client";

import { useState } from "react";
import { getStore } from "@/lib/store";

const COLORS = ["#ffffff", "#7edca4", "#1fa45c", "#e6b85c", "#ffb3c7", "#9ad7ff"];

export default function DanmakuInput({
  photoId,
  selfMarkRef,
}: {
  photoId: string;
  selfMarkRef: React.MutableRefObject<string | null>;
}) {
  const [text, setText] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [sending, setSending] = useState(false);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    selfMarkRef.current = t;
    try {
      await getStore().sendDanmaku(photoId, t.slice(0, 60), color);
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass flex items-center gap-2 rounded-2xl p-2 pl-4">
      <div className="flex gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`h-5 w-5 rounded-full transition-transform ${
              color === c ? "scale-125 ring-2 ring-white/70" : "opacity-60 hover:opacity-100"
            }`}
            style={{ background: c }}
            aria-label={`弹幕颜色 ${c}`}
          />
        ))}
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        maxLength={60}
        placeholder="发条友善的弹幕，所有人实时可见…"
        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
      />
      <button
        onClick={send}
        disabled={!text.trim() || sending}
        className="rounded-xl bg-gradient-to-r from-leaf to-mint px-5 py-2 text-sm font-bold text-ink transition-opacity disabled:opacity-40"
      >
        发射 ➤
      </button>
    </div>
  );
}
