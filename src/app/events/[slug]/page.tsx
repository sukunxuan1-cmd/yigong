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
  if (!event) return { title: "活动详情" };
  return {
    title: `${event.title} · Reshine 义工团`,
    description: event.summary,
    openGraph: {
      title: event.title,
      description: event.summary,
      images: event.coverSrc ? [event.coverSrc] : undefined,
    },
  };
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
