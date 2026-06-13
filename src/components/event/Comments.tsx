"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getStore, type CommentItem } from "@/lib/store";

function timeAgo(ts: number) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "刚刚";
  if (s < 3600) return `${Math.floor(s / 60)} 分钟前`;
  if (s < 86400) return `${Math.floor(s / 3600)} 小时前`;
  return new Date(ts).toLocaleDateString("zh-CN");
}

export default function Comments({ photoId }: { photoId: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setAuthor(localStorage.getItem("yigong-name") ?? "");
  }, []);

  useEffect(() => {
    const store = getStore();
    let alive = true;
    setComments([]);
    setReplyTo(null);
    store.getComments(photoId).then((list) => alive && setComments(list));
    const off = store.onComment(photoId, (c) =>
      setComments((prev) => (prev.some((p) => p.id === c.id) ? prev : [...prev, c]))
    );
    return () => {
      alive = false;
      off();
    };
  }, [photoId]);

  const tree = useMemo(() => {
    const roots = comments.filter((c) => !c.replyTo);
    const children = (id: string) => comments.filter((c) => c.replyTo === id);
    return { roots, children };
  }, [comments]);

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    const name = author.trim() || "匿名义工";
    localStorage.setItem("yigong-name", name);
    setText("");
    const c = await getStore().addComment(photoId, name, t, replyTo?.id ?? null);
    setComments((prev) => (prev.some((p) => p.id === c.id) ? prev : [...prev, c]));
    setReplyTo(null);
  };

  const Item = ({ c, depth }: { c: CommentItem; depth: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={depth ? "ml-10 border-l border-white/8 pl-4" : ""}
    >
      <div className="flex items-start gap-3 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-leaf/70 to-mint/70 text-sm font-bold text-white">
          {c.author.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-semibold text-white">{c.author}</span>
            <span className="ml-2 text-xs text-slate-500">{timeAgo(c.createdAt)}</span>
          </p>
          <p className="mt-1 break-words text-sm leading-relaxed text-slate-300">{c.text}</p>
          {depth === 0 && (
            <button
              onClick={() => {
                setReplyTo(c);
                inputRef.current?.focus();
              }}
              className="mt-1 text-xs text-slate-500 transition-colors hover:text-mint"
            >
              回复
            </button>
          )}
        </div>
      </div>
      {tree.children(c.id).map((ch) => (
        <Item key={ch.id} c={ch} depth={depth + 1} />
      ))}
    </motion.div>
  );

  return (
    <section className="glass rounded-3xl p-6">
      <h3 className="font-display text-lg font-bold text-white">
        评论 <span className="text-sm font-normal text-slate-400">({comments.length})</span>
      </h3>

      <div className="mt-4">
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-2 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-400">
                <span className="truncate">
                  回复 <span className="text-mint">@{replyTo.author}</span>：{replyTo.text}
                </span>
                <button onClick={() => setReplyTo(null)} className="ml-3 shrink-0 hover:text-white">
                  取消 ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="你的名字"
            maxLength={16}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-leaf/60 focus:outline-none sm:w-36"
          />
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            maxLength={500}
            placeholder="写下你的感受…（Enter 发送）"
            className="min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-leaf/60 focus:outline-none"
          />
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="rounded-xl bg-gradient-to-r from-leaf to-mint px-5 py-2 text-sm font-bold text-ink disabled:opacity-40"
          >
            发布
          </button>
        </div>
      </div>

      <div className="mt-4 divide-y divide-white/5">
        {tree.roots.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">还没有评论，来抢沙发～</p>
        )}
        {tree.roots.map((c) => (
          <Item key={c.id} c={c} depth={0} />
        ))}
      </div>
    </section>
  );
}
