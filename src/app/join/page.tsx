import type { Metadata } from "next";
import { upcomingEvents } from "@/lib/data";
import PhotoImg from "@/components/PhotoImg";
import SignupForm from "@/components/join/SignupForm";

export const metadata: Metadata = {
  title: "加入我们 · 活动报名 · Reshine 义工团",
  description: "报名参加 Reshine 义工团即将开展的公益活动，一起用行动温暖城市。",
};

export default function JoinPage() {
  return (
    <div className="mx-auto w-[min(94%,68rem)] pb-24 pt-32">
      <div className="text-center">
        <h1 className="font-display text-4xl font-black md:text-5xl">
          加入<span className="text-gradient">下一次出发</span>
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          下面是即将开展的活动，选一个，填好信息就报名成功——名额有限，先到先得
        </p>
      </div>

      <div className="mt-12 space-y-12">
        {upcomingEvents.map((e, i) => (
          <div
            key={e.id}
            className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}
          >
            {/* 活动信息 + 封面 */}
            <div>
              <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-white/10">
                <PhotoImg seed={e.cover} alt={e.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <div className="flex flex-wrap gap-2">
                    {e.tags.map((t) => (
                      <span key={t} className="rounded-full bg-leaf/25 px-3 py-1 text-xs font-semibold text-mint">
                        {t}
                      </span>
                    ))}
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-bold text-white">{e.title}</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {e.date} · {e.location}
                  </p>
                </div>
              </div>
              <p className="mt-4 leading-relaxed text-slate-300">{e.summary}</p>
            </div>

            {/* 报名表单 */}
            <SignupForm eventId={e.id} slots={e.slots} />
          </div>
        ))}
      </div>
    </div>
  );
}
