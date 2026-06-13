"use client";

import dynamic from "next/dynamic";
import type { VolunteerEvent } from "@/lib/data";

const HeroJourney = dynamic(() => import("@/components/home/HeroJourney"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <p className="animate-pulse text-sm tracking-[0.4em] text-slate-500">点亮中…</p>
    </div>
  ),
});

export default function HomeClient({ events }: { events: VolunteerEvent[] }) {
  return <HeroJourney events={events} />;
}
