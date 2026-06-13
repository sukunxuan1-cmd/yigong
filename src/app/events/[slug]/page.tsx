import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { events, membersOfEvent } from "@/lib/data";
import { getEventBySlug } from "@/lib/serverPhotos";
import EventDetailClient from "@/components/event/EventDetailClient";

export function generateStaticParams() {
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  return { title: event ? `${event.title} · Reshine 义工团` : "活动详情" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) notFound();
  return <EventDetailClient event={event} members={membersOfEvent(slug)} />;
}
