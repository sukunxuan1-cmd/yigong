"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Danmaku = {
  id: string;
  photoId: string;
  text: string;
  color: string;
  createdAt: number;
};

export type CommentItem = {
  id: string;
  photoId: string;
  author: string;
  text: string;
  replyTo: string | null;
  createdAt: number;
};

export type Signup = {
  id: string;
  eventId: string;
  name: string;
  dept: string;
  contact: string;
  note?: string;
  createdAt: number;
};

export interface InteractionStore {
  getLikes(photoId: string): Promise<number>;
  addLikes(photoId: string, n: number): Promise<void>;
  getDanmaku(photoId: string): Promise<Danmaku[]>;
  sendDanmaku(photoId: string, text: string, color: string): Promise<Danmaku>;
  getComments(photoId: string): Promise<CommentItem[]>;
  addComment(photoId: string, author: string, text: string, replyTo?: string | null): Promise<CommentItem>;
  getSignups(eventId: string): Promise<Signup[]>;
  addSignup(eventId: string, data: { name: string; dept: string; contact: string; note?: string }): Promise<Signup>;
  /** 实时订阅：返回取消函数 */
  onDanmaku(photoId: string, cb: (d: Danmaku) => void): () => void;
  onComment(photoId: string, cb: (c: CommentItem) => void): () => void;
  onLikes(photoId: string, cb: (total: number) => void): () => void;
  onSignup(eventId: string, cb: (s: Signup) => void): () => void;
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/* ---------------- Supabase 实现（配置了环境变量时启用） ---------------- */

class SupabaseStore implements InteractionStore {
  constructor(private sb: SupabaseClient) {}

  async getLikes(photoId: string) {
    const { count } = await this.sb
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("photo_id", photoId);
    return count ?? 0;
  }

  async addLikes(photoId: string, n: number) {
    const rows = Array.from({ length: n }, () => ({ photo_id: photoId }));
    await this.sb.from("likes").insert(rows);
  }

  async getDanmaku(photoId: string) {
    const { data } = await this.sb
      .from("danmaku")
      .select("*")
      .eq("photo_id", photoId)
      .order("created_at", { ascending: true })
      .limit(200);
    return (data ?? []).map(rowToDanmaku);
  }

  async sendDanmaku(photoId: string, text: string, color: string) {
    const { data } = await this.sb
      .from("danmaku")
      .insert({ photo_id: photoId, text, color })
      .select()
      .single();
    return rowToDanmaku(data);
  }

  async getComments(photoId: string) {
    const { data } = await this.sb
      .from("comments")
      .select("*")
      .eq("photo_id", photoId)
      .order("created_at", { ascending: true });
    return (data ?? []).map(rowToComment);
  }

  async addComment(photoId: string, author: string, text: string, replyTo: string | null = null) {
    const { data } = await this.sb
      .from("comments")
      .insert({ photo_id: photoId, author, text, reply_to: replyTo })
      .select()
      .single();
    return rowToComment(data);
  }

  onDanmaku(photoId: string, cb: (d: Danmaku) => void) {
    const ch = this.sb
      .channel(`danmaku-${photoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "danmaku", filter: `photo_id=eq.${photoId}` },
        (payload) => cb(rowToDanmaku(payload.new))
      )
      .subscribe();
    return () => void this.sb.removeChannel(ch);
  }

  onComment(photoId: string, cb: (c: CommentItem) => void) {
    const ch = this.sb
      .channel(`comments-${photoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `photo_id=eq.${photoId}` },
        (payload) => cb(rowToComment(payload.new))
      )
      .subscribe();
    return () => void this.sb.removeChannel(ch);
  }

  onLikes(photoId: string, cb: (total: number) => void) {
    const ch = this.sb
      .channel(`likes-${photoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "likes", filter: `photo_id=eq.${photoId}` },
        () => this.getLikes(photoId).then(cb)
      )
      .subscribe();
    return () => void this.sb.removeChannel(ch);
  }

  async getSignups(eventId: string) {
    const { data } = await this.sb
      .from("signups")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });
    return (data ?? []).map(rowToSignup);
  }

  async addSignup(eventId: string, d: { name: string; dept: string; contact: string; note?: string }) {
    const { data } = await this.sb
      .from("signups")
      .insert({ event_id: eventId, name: d.name, dept: d.dept, contact: d.contact, note: d.note ?? null })
      .select()
      .single();
    return rowToSignup(data);
  }

  onSignup(eventId: string, cb: (s: Signup) => void) {
    const ch = this.sb
      .channel(`signups-${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "signups", filter: `event_id=eq.${eventId}` },
        (payload) => cb(rowToSignup(payload.new))
      )
      .subscribe();
    return () => void this.sb.removeChannel(ch);
  }
}

function rowToSignup(r: any): Signup {
  return {
    id: String(r.id),
    eventId: r.event_id,
    name: r.name,
    dept: r.dept,
    contact: r.contact,
    note: r.note ?? undefined,
    createdAt: new Date(r.created_at).getTime(),
  };
}

function rowToDanmaku(r: any): Danmaku {
  return { id: String(r.id), photoId: r.photo_id, text: r.text, color: r.color ?? "#ffffff", createdAt: new Date(r.created_at).getTime() };
}
function rowToComment(r: any): CommentItem {
  return { id: String(r.id), photoId: r.photo_id, author: r.author, text: r.text, replyTo: r.reply_to ?? null, createdAt: new Date(r.created_at).getTime() };
}

/* ------------- 本地实现（无后端时的演示模式，跨标签页实时） ------------- */

const SEED_DANMAKU = ["太有爱了！", "为义工团点赞 👍", "这一幕好感动", "我也想参加下次活动！", "辛苦啦各位", "正能量满满", "泪目了", "好样的！"];
const SEED_COLORS = ["#ffffff", "#7edca4", "#e6b85c", "#ffb3c7", "#b9e6cb"];

class LocalStore implements InteractionStore {
  private channel: BroadcastChannel | null = null;
  private listeners = new Map<string, Set<(payload: any) => void>>();

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel("yigong-rt");
      this.channel.onmessage = (e) => this.emit(e.data.key, e.data.payload, false);
    }
  }

  private read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private write(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  private emit(key: string, payload: any, broadcast = true) {
    this.listeners.get(key)?.forEach((cb) => cb(payload));
    if (broadcast) this.channel?.postMessage({ key, payload });
  }

  private listen(key: string, cb: (payload: any) => void) {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(cb);
    return () => this.listeners.get(key)?.delete(cb);
  }

  private seedFor(photoId: string): Danmaku[] {
    let h = 0;
    for (const c of photoId) h = (h * 31 + c.charCodeAt(0)) | 0;
    const n = 3 + (Math.abs(h) % 4);
    return Array.from({ length: n }, (_, i) => ({
      id: `seed-${photoId}-${i}`,
      photoId,
      text: SEED_DANMAKU[Math.abs(h + i * 7) % SEED_DANMAKU.length],
      color: SEED_COLORS[Math.abs(h + i * 3) % SEED_COLORS.length],
      createdAt: Date.now() - i * 60000,
    }));
  }

  async getLikes(photoId: string) {
    let h = 0;
    for (const c of photoId) h = (h * 31 + c.charCodeAt(0)) | 0;
    const base = 20 + (Math.abs(h) % 180);
    return base + this.read<number>(`likes:${photoId}`, 0);
  }

  async addLikes(photoId: string, n: number) {
    const cur = this.read<number>(`likes:${photoId}`, 0) + n;
    this.write(`likes:${photoId}`, cur);
    this.emit(`likes:${photoId}`, await this.getLikes(photoId));
  }

  async getDanmaku(photoId: string) {
    return [...this.seedFor(photoId), ...this.read<Danmaku[]>(`danmaku:${photoId}`, [])];
  }

  async sendDanmaku(photoId: string, text: string, color: string) {
    const d: Danmaku = { id: uid(), photoId, text, color, createdAt: Date.now() };
    const list = this.read<Danmaku[]>(`danmaku:${photoId}`, []);
    list.push(d);
    this.write(`danmaku:${photoId}`, list.slice(-200));
    this.emit(`danmaku:${photoId}`, d);
    return d;
  }

  async getComments(photoId: string) {
    return this.read<CommentItem[]>(`comments:${photoId}`, []);
  }

  async addComment(photoId: string, author: string, text: string, replyTo: string | null = null) {
    const c: CommentItem = { id: uid(), photoId, author, text, replyTo, createdAt: Date.now() };
    const list = this.read<CommentItem[]>(`comments:${photoId}`, []);
    list.push(c);
    this.write(`comments:${photoId}`, list);
    this.emit(`comments:${photoId}`, c);
    return c;
  }

  async getSignups(eventId: string) {
    return this.read<Signup[]>(`signups:${eventId}`, []);
  }

  async addSignup(eventId: string, d: { name: string; dept: string; contact: string; note?: string }) {
    const s: Signup = { id: uid(), eventId, name: d.name, dept: d.dept, contact: d.contact, note: d.note, createdAt: Date.now() };
    const list = this.read<Signup[]>(`signups:${eventId}`, []);
    list.push(s);
    this.write(`signups:${eventId}`, list);
    this.emit(`signups:${eventId}`, s);
    return s;
  }

  onDanmaku(photoId: string, cb: (d: Danmaku) => void) {
    return this.listen(`danmaku:${photoId}`, cb);
  }
  onComment(photoId: string, cb: (c: CommentItem) => void) {
    return this.listen(`comments:${photoId}`, cb);
  }
  onLikes(photoId: string, cb: (total: number) => void) {
    return this.listen(`likes:${photoId}`, cb);
  }
  onSignup(eventId: string, cb: (s: Signup) => void) {
    return this.listen(`signups:${eventId}`, cb);
  }
}

/* ---------------------------- 入口 ---------------------------- */

let store: InteractionStore | null = null;

export function getStore(): InteractionStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    store = new SupabaseStore(createClient(url, key));
  } else {
    store = new LocalStore();
  }
  return store;
}

export const isLiveBackend = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
