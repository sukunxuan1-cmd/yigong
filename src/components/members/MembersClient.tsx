"use client";

import dynamic from "next/dynamic";

const MemberRing = dynamic(() => import("@/components/members/MemberRing"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <p className="animate-pulse text-sm tracking-[0.4em] text-slate-500">BUILDING THE RING…</p>
    </div>
  ),
});

export default function MembersClient() {
  return <MemberRing />;
}
