import HomeClient from "@/components/home/HomeClient";
import { getEvents } from "@/lib/serverPhotos";

export default function HomePage() {
  return <HomeClient events={getEvents()} />;
}
