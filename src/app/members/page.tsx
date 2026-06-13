import type { Metadata } from "next";
import MembersClient from "@/components/members/MembersClient";

export const metadata: Metadata = { title: "义工团成员 · Reshine 义工团" };

export default function MembersPage() {
  return <MembersClient />;
}
