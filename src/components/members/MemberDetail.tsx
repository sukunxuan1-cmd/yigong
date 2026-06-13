"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { members, type Member, type VolunteerEvent } from "@/lib/data";
import PhotoImg from "@/components/PhotoImg";

function initial(name: string) {
  return name.slice(0, 1);
}

export default function MemberDetail({
  member,
  events,
}: {
  member: Member;
  events: VolunteerEvent[];
}) {
  const idx = members.findIndex((m) => m.id === member.id);
  const prev = members[(idx - 1 + members.length) % members.length];
  const next = members[(idx + 1) % members.length];

  const stats = [
    { label: "参与活动", value: `${member.activities} 次` },
    { label: "加入时间", value: member.joined },
    { label: "所属部门", value: member.department },
  ];

  return (
    <div className="mx-auto w-[min(94%,60rem)] pb-24 pt-32">
      <Link href="/members" className="text-sm text-slate-400 transition-colors hover:text-mint">
        ← 返回义工团
      </Link>

      <div className="mt-6 grid items-start gap-8 md:grid-cols-[18rem_1fr]">
        {/* 头像 + 速览 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass glow-ring rounded-3xl p-6 text-center md:sticky md:top-28"
        >
          <div
            className="mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-full text-6xl font-black text-white"
            style={{ background: `linear-gradient(135deg, ${member.palette[0]}, ${member.palette[1]})` }}
          >
            {member.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
            ) : (
              initial(member.name)
            )}
          </div>
          <h1 className="mt-5 font-display text-3xl font-black text-white">{member.name}</h1>
          <span
            className="mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-bold text-ink"
            style={{ background: `linear-gradient(135deg, ${member.palette[0]}, ${member.palette[1]})` }}
          >
            {member.role}
          </span>
          <p className="mt-3 text-sm text-slate-400">{member.department}</p>
        </motion.div>

        {/* 简介正文 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
        >
          <p className="font-display text-2xl font-bold text-gradient">“{member.motto}”</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4 text-center">
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="mt-1 text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="font-display text-lg font-bold text-white">关于 TA</h2>
            <p className="mt-3 leading-loose text-slate-300">{member.bio}</p>
          </div>

          {/* TA 参与过的活动 */}
          <div className="mt-8">
            <h2 className="font-display text-lg font-bold text-white">
              TA 参与过的活动
              <span className="ml-2 text-sm font-normal text-slate-400">{events.length} 场</span>
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {events.map((e) => (
                <Link
                  key={e.slug}
                  href={`/events/${e.slug}`}
                  className="group flex gap-3 overflow-hidden rounded-2xl border border-white/8 bg-haze p-2.5 transition-transform hover:-translate-y-0.5"
                >
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl">
                    <PhotoImg
                      seed={e.cover}
                      src={e.coverSrc}
                      alt={e.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white group-hover:text-gradient">
                      {e.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{e.date}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{e.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <Link
              href="/members"
              className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-slate-300 transition-colors hover:border-leaf/60 hover:text-white"
            >
              返回 3D 星环
            </Link>
          </div>
        </motion.div>
      </div>

      {/* 上一位 / 下一位 */}
      <div className="mt-16 grid grid-cols-2 gap-4 border-t border-white/8 pt-8">
        <Link
          href={`/members/${prev.id}`}
          className="group flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-white/5"
        >
          <span className="text-slate-500 group-hover:text-mint">←</span>
          <Avatar m={prev} />
          <span className="min-w-0">
            <span className="block text-xs text-slate-500">上一位</span>
            <span className="block truncate font-semibold text-white">{prev.name}</span>
          </span>
        </Link>
        <Link
          href={`/members/${next.id}`}
          className="group flex items-center justify-end gap-3 rounded-2xl p-3 text-right transition-colors hover:bg-white/5"
        >
          <span className="min-w-0">
            <span className="block text-xs text-slate-500">下一位</span>
            <span className="block truncate font-semibold text-white">{next.name}</span>
          </span>
          <Avatar m={next} />
          <span className="text-slate-500 group-hover:text-mint">→</span>
        </Link>
      </div>
    </div>
  );
}

function Avatar({ m }: { m: Member }) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white"
      style={{ background: `linear-gradient(135deg, ${m.palette[0]}, ${m.palette[1]})` }}
    >
      {m.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
      ) : (
        m.name.slice(0, 1)
      )}
    </span>
  );
}
