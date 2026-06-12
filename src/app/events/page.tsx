import type { Metadata } from "next";
import Timeline from "@/components/events/Timeline";

export const metadata: Metadata = { title: "活动档案 · 微光义工团" };

export default function EventsPage() {
  return <Timeline />;
}
