-- 义工活动网站互动数据表（在 Supabase SQL Editor 执行）

create table if not exists likes (
  id bigint generated always as identity primary key,
  photo_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists likes_photo_idx on likes (photo_id);

create table if not exists danmaku (
  id bigint generated always as identity primary key,
  photo_id text not null,
  text text not null check (char_length(text) <= 60),
  color text not null default '#ffffff',
  created_at timestamptz not null default now()
);
create index if not exists danmaku_photo_idx on danmaku (photo_id, created_at);

create table if not exists comments (
  id bigint generated always as identity primary key,
  photo_id text not null,
  author text not null default '匿名义工',
  text text not null check (char_length(text) <= 500),
  reply_to bigint references comments (id),
  created_at timestamptz not null default now()
);
create index if not exists comments_photo_idx on comments (photo_id, created_at);

create table if not exists signups (
  id bigint generated always as identity primary key,
  event_id text not null,
  name text not null,
  dept text not null default '',
  contact text not null default '',
  note text,
  created_at timestamptz not null default now()
);
create index if not exists signups_event_idx on signups (event_id, created_at);

-- 开启 Realtime（弹幕/评论/点赞/报名实时推送）
alter publication supabase_realtime add table danmaku;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table likes;
alter publication supabase_realtime add table signups;

-- 匿名读写策略（演示用；生产环境建议加限流或登录）
alter table likes enable row level security;
alter table danmaku enable row level security;
alter table comments enable row level security;
alter table signups enable row level security;

create policy "anon read likes" on likes for select using (true);
create policy "anon insert likes" on likes for insert with check (true);
create policy "anon read danmaku" on danmaku for select using (true);
create policy "anon insert danmaku" on danmaku for insert with check (true);
create policy "anon read comments" on comments for select using (true);
create policy "anon insert comments" on comments for insert with check (true);
create policy "anon read signups" on signups for select using (true);
create policy "anon insert signups" on signups for insert with check (true);
