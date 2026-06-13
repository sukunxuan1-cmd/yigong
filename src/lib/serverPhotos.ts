import fs from "fs";
import path from "path";
import { events as baseEvents, type Photo, type VolunteerEvent } from "./data";

const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

/**
 * 构建时扫描 public/photos/<活动slug>/ 文件夹。
 * 文件夹里有照片时，整组替换该活动的占位图：
 *   - 按文件名排序（数字前缀控制顺序，如 01-xxx.jpg）
 *   - 文件名去掉序号和扩展名后作为照片说明
 * 没有对应文件夹则继续使用占位图。
 */
export function getEvents(): VolunteerEvent[] {
  return baseEvents.map((e) => {
    const dir = path.join(process.cwd(), "public", "photos", e.slug);
    let files: string[];
    try {
      files = fs
        .readdirSync(dir)
        .filter((f) => EXTS.has(path.extname(f).toLowerCase()));
    } catch {
      return e;
    }
    if (files.length === 0) return e;

    files.sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }));
    const photos: Photo[] = files.map((f, i) => {
      const name = f.replace(/\.[^.]+$/, "");
      const caption = name.replace(/^\d+\s*[-_.、\s]\s*/, "").trim() || `照片 ${i + 1}`;
      return {
        id: `${e.slug}/${f}`,
        seed: e.cover + i,
        caption,
        src: `/photos/${encodeURIComponent(e.slug)}/${encodeURIComponent(f)}`,
      };
    });
    return { ...e, photos, coverSrc: photos[0].src };
  });
}

export function getEventBySlug(slug: string): VolunteerEvent | undefined {
  return getEvents().find((e) => e.slug === slug);
}
