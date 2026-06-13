import type { Metadata } from "next";
import EventsExplorer from "@/components/events/EventsExplorer";
import { getEvents } from "@/lib/serverPhotos";

export const metadata: Metadata = { title: "活动档案 · Reshine 义工团" };

export default function EventsPage() {
  return <EventsExplorer events={getEvents()} />;
}
