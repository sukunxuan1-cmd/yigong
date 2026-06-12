import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { events, getEvent } from "@/lib/data";
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
  const event = getEvent(slug);
  return { title: event ? `${event.title} · 微光义工团` : "活动详情" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();
  return <EventDetailClient event={event} />;
}
