# Reshine 义工团 · 公司义工活动记录网站

记录公司义工团的成员、每一次义工活动与现场影像。前卫视觉 + 3D 动画 + 实时互动。

> 📖 **不会编程的同事请看：[网站使用教程.md](./网站使用教程.md)** —— 上传照片、新增活动全部在 GitHub 网页上点鼠标完成。

## 功能

| 页面 | 亮点 |
| --- | --- |
| **首页** | WebGL 粒子照片墙（自定义 shader）：上万粒子组成活动照片，鼠标划过产生流体涡旋扰动，滚动时粒子打散、旋转、重组为下一张照片 |
| **义工团成员** `/members` | 3D 环形画廊：成员卡片悬浮成星环，可拖拽旋转、缓慢自转，点击卡片镜头对正并翻转展示详情（姓名 / 部门 / 参与次数 / 宣言） |
| **活动时间轴** `/events` | GSAP ScrollTrigger 驱动的垂直 3D 时间线，章节左右交替入场，照片视差滚动，中轴光线随滚动生长 |
| **活动详情** `/events/[slug]` | 核心互动区：照片大图 WebGL 扭曲溶解转场（支持滑动手势）＋ 三层互动叠加 |

每张照片自带：

- **弹幕**：Canvas 渲染，轨道分配 + 追尾碰撞检测，历史弹幕错峰入场；接入 Supabase Realtime 后所有在线用户实时可见，自己发的弹幕带描边高亮
- **点赞**：爱心粒子爆炸 + 连击放大（xN combo），乐观更新，连点合并后一次写库
- **评论**：支持回复的评论区，实时推送新评论

## 技术栈

- **Next.js 15**（App Router）— 内容页全部静态生成（SSG），互动数据客户端实时拉取
- **React Three Fiber + drei + Three.js** — 粒子系统、环形画廊、照片转场均为自定义 GLSL shader
- **GSAP ScrollTrigger** — 滚动驱动 3D 场景与时间轴动画
- **Framer Motion** — UI 过渡、卡片翻转、入场动画
- **Supabase** — 点赞 / 弹幕 / 评论存储 + Realtime websocket 推送

## 快速开始

```bash
npm install
npm run dev        # http://localhost:3000
```

不配置任何环境变量也能完整体验：互动数据自动降级为**本地演示模式**（localStorage 持久化 + BroadcastChannel 跨标签页实时，开两个标签页互发弹幕即可看到效果）。

## 接入 Supabase（真实多人实时）

1. 创建 Supabase 项目，在 SQL Editor 执行 `supabase/schema.sql`
2. 复制 `.env.example` 为 `.env.local`，填入项目的 URL 和 anon key
3. 重启后弹幕 / 点赞 / 评论即走 Realtime，所有在线用户实时同步

> 国内部署可将数据层换成腾讯云 CloudBase 或自建 Node + Socket.io——所有互动逻辑都收敛在 `src/lib/store.ts` 的 `InteractionStore` 接口里，实现该接口即可无侵入替换。

## 放真实照片（零代码）

把照片放进 `public/photos/<活动slug>/` 文件夹即可，构建时自动接管该活动的全部照片：

- 文件名格式 `01-照片说明.jpg`，序号控制顺序，说明文字自动成为照片标题
- 第一张自动成为活动封面（首页粒子墙、时间轴同步生效）
- 示例见 `public/photos/riverside-cleanup-2024/`，详细步骤见《网站使用教程.md》

照片量大后可改走 OSS/COS + CDN：在 `src/lib/data.ts` 的 `Photo.src` 直接填 CDN 地址即可。
成员、活动的文案数据集中在 `src/lib/data.ts`，直接编辑即可。

## 目录结构

```
src/
  app/                    # 路由（首页 / members / events / events/[slug]）
  components/
    home/ParticleHero.tsx # 粒子照片墙（GLSL shader）
    members/MemberRing.tsx# 3D 环形成员画廊
    events/Timeline.tsx   # ScrollTrigger 时间轴
    event/PhotoStage.tsx  # WebGL 照片转场舞台
    event/DanmakuLayer.tsx# Canvas 弹幕引擎
    event/LikeButton.tsx  # 爱心粒子点赞
    event/Comments.tsx    # 评论区
  lib/
    data.ts               # 成员 / 活动 / 照片数据
    store.ts              # 互动数据层（Supabase / 本地双实现）
    placeholder.ts        # 占位照片生成器
supabase/schema.sql       # 数据库建表 + Realtime + RLS
scripts/verify.mjs        # Playwright 端到端冒烟验证
```
