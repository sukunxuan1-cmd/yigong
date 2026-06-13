import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { members, getMember, type VolunteerEvent } from "@/lib/data";
import { getEvents } from "@/lib/serverPhotos";
import MemberDetail from "@/components/members/MemberDetail";

export function generateStaticParams() {
  return members.map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const m = getMember(id);
  return { title: m ? `${m.name} · 义工团成员 · Reshine 义工团` : "成员介绍" };
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = getMember(id);
  if (!member) notFound();
  // 关联活动（带封面照片），按时间倒序
  const all = getEvents();
  const joined: VolunteerEvent[] = member.events
    .map((slug) => all.find((e) => e.slug === slug))
    .filter((e): e is VolunteerEvent => Boolean(e))
    .sort((a, b) => b.date.localeCompare(a.date));
  return <MemberDetail member={member} events={joined} />;
}
