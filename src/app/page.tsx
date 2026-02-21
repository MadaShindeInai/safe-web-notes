import { getScheduleEntries } from "~/server/actions/schedule";
import { WeekCarousel } from "~/components/schedule/week-carousel";

export default async function Home() {
  const entries = await getScheduleEntries();
  return <WeekCarousel entries={entries} />;
}
