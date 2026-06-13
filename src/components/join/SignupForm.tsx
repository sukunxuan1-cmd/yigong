"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getStore } from "@/lib/store";

export default function SignupForm({
  eventId,
  slots,
}: {
  eventId: string;
  slots: number;
}) {
  const [count, setCount] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const store = getStore();
    let alive = true;
    store.getSignups(eventId).then((l) => alive && setCount(l.length));
    const off = store.onSignup(eventId, () =>
      store.getSignups(eventId).then((l) => alive && setCount(l.length))
    );
    // 预填上次填写的信息
    setName(localStorage.getItem("yigong-name") ?? "");
    setDept(localStorage.getItem("yigong-dept") ?? "");
    setContact(localStorage.getItem("yigong-contact") ?? "");
    return () => {
      alive = false;
      off();
    };
  }, [eventId]);

  const remaining = count === null ? null : Math.max(0, slots - count);
  const full = remaining === 0;

  const submit = async () => {
    if (!name.trim() || !contact.trim() || sending || full) return;
    setSending(true);
    localStorage.setItem("yigong-name", name.trim());
    localStorage.setItem("yigong-dept", dept.trim());
    localStorage.setItem("yigong-contact", contact.trim());
    try {
      await getStore().addSignup(eventId, {
        name: name.trim(),
        dept: dept.trim(),
        contact: contact.trim(),
        note: note.trim() || undefined,
      });
      setCount((c) => (c === null ? 1 : c + 1));
      setDone(true);
    } finally {
      setSending(false);
    }
  };

  const field =
    "w-full rounded-xl border border-cocoa/10 bg-cocoa/5 px-3 py-2.5 text-sm text-cocoa placeholder:text-mocha/70 focus:border-leaf/60 focus:outline-none";

  return (
    <div className="glass glow-ring rounded-3xl p-6">
      {/* 名额进度 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-cocoa/80">报名进度</span>
          <span className="text-mint">
            {count === null ? "…" : `${count} / ${slots} 人`}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-cocoa/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-leaf to-mint transition-all duration-500"
            style={{ width: `${count === null ? 0 : Math.min(100, (count / slots) * 100)}%` }}
          />
        </div>
        {remaining !== null && (
          <p className="mt-1.5 text-xs text-mocha/70">
            {full ? "名额已满，可留言候补～" : `还剩 ${remaining} 个名额`}
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-leaf/15 p-6 text-center"
          >
            <p className="text-3xl">🎉</p>
            <p className="mt-2 font-semibold text-cocoa">报名成功！</p>
            <p className="mt-1 text-sm text-cocoa/80">我们会通过你留下的联系方式通知集合详情，感谢加入！</p>
            <button
              onClick={() => setDone(false)}
              className="mt-4 text-xs text-mint hover:underline"
            >
              再帮同事报一个
            </button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input className={field} placeholder="姓名 *" value={name} maxLength={16} onChange={(e) => setName(e.target.value)} />
              <input className={field} placeholder="部门" value={dept} maxLength={20} onChange={(e) => setDept(e.target.value)} />
            </div>
            <input className={field} placeholder="联系方式（手机 / 微信）*" value={contact} maxLength={40} onChange={(e) => setContact(e.target.value)} />
            <textarea className={`${field} resize-none`} rows={2} placeholder="留言（可选：饮食忌口、能否自驾等）" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
            <button
              onClick={submit}
              disabled={!name.trim() || !contact.trim() || sending || full}
              className="w-full rounded-xl bg-gradient-to-r from-leaf to-mint py-3 text-sm font-bold text-ink transition-opacity disabled:opacity-40"
            >
              {full ? "名额已满" : sending ? "提交中…" : "我要报名 →"}
            </button>
            <p className="text-center text-xs text-mocha/70">信息仅用于本次活动联络，不对外公开</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
