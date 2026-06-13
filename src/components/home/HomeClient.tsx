"use client";

import dynamic from "next/dynamic";
import HomeSections from "@/components/home/HomeSections";
import type { VolunteerEvent } from "@/lib/data";

const ParticleHero = dynamic(() => import("@/components/home/ParticleHero"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <p className="animate-pulse text-sm tracking-[0.4em] text-slate-500">LOADING PARTICLES…</p>
    </div>
  ),
});

export default function HomeClient({ events }: { events: VolunteerEvent[] }) {
  const slides = events.map((e) => ({
    seed: e.cover,
    src: e.coverSrc,
    title: e.title,
    date: e.date,
  }));
  return (
    <>
      <ParticleHero slides={slides} />
      <HomeSections events={events} />
    </>
  );
}
