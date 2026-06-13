import type { Metadata } from "next";
import { impactStats } from "@/lib/data";
import ImpactDashboard from "@/components/impact/ImpactDashboard";

export const metadata: Metadata = {
  title: "公益足迹 · 数据看板 · Reshine 义工团",
  description: "Reshine 义工团历年公益活动的累计数据：志愿时长、参与人次、活动分类一览。",
};

export default function ImpactPage() {
  return <ImpactDashboard stats={impactStats()} />;
}
