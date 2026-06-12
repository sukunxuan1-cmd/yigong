// 用法：npm i -D playwright && npx playwright install chromium
// 先 `npm run build && npm run start`，再 `node scripts/verify.mjs`
import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const shots = [
  { path: "/", name: "home-hero", scroll: 0 },
  { path: "/", name: "home-hero-mid", scroll: 2200 },
  { path: "/members", name: "members", scroll: 0 },
  { path: "/events", name: "events-timeline", scroll: 900 },
  { path: "/events/riverside-cleanup-2024", name: "event-detail", scroll: 300 },
];

const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(`[${page.url()}] ${m.text()}`));
page.on("pageerror", (e) => errors.push(`[${page.url()}] PAGEERROR: ${e.message}`));

for (const s of shots) {
  await page.goto(BASE + s.path, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  if (s.scroll) {
    await page.evaluate((y) => window.scrollTo({ top: y }), s.scroll);
    await page.waitForTimeout(1800);
  }
  await page.screenshot({ path: `/tmp/shot-${s.name}.png` });
  console.log(`shot: ${s.name}`);
}

// 交互测试：详情页发弹幕 + 点赞 + 评论
await page.goto(BASE + "/events/riverside-cleanup-2024", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.fill('input[placeholder*="弹幕"]', "自动化测试弹幕");
await page.click('button:has-text("发射")');
await page.waitForTimeout(800);
const likeBtn = page.locator('button[aria-label="点赞"]');
for (let i = 0; i < 5; i++) { await likeBtn.click(); await page.waitForTimeout(120); }
await page.fill('input[placeholder="你的名字"]', "测试员");
await page.fill('textarea', "这是一条测试评论");
await page.click('button:has-text("发布")');
await page.waitForTimeout(1000);
await page.screenshot({ path: "/tmp/shot-interactions.png" });
const likeText = await likeBtn.textContent();
const commentVisible = await page.locator('text=这是一条测试评论').count();
console.log(`like button: ${likeText?.trim()} | comment rendered: ${commentVisible > 0}`);

// 切换照片测试 shader 转场
await page.click('button[aria-label="下一张"]');
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/shot-transition.png" });

await browser.close();
console.log(errors.length ? `\nCONSOLE ERRORS:\n${errors.join("\n")}` : "\nNO console errors ✓");
