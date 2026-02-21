"use client";

import useEmblaCarousel from "embla-carousel-react";
import { DaySlide } from "./day-slide";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type Entry = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  activity: string;
};

type WeekCarouselProps = {
  entries: Entry[];
};

export function WeekCarousel({ entries }: WeekCarouselProps) {
  // JS getDay(): Sun=0, Mon=1…Sat=6 → carousel Mon=0…Sun=6
  const todayIndex = (new Date().getDay() + 6) % 7;

  const [emblaRef] = useEmblaCarousel({ loop: true, startIndex: todayIndex });

  const byWeekday: Entry[][] = Array.from({ length: 7 }, (_, i) =>
    entries.filter((e) => e.weekday === i),
  );

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {DAYS.map((day, i) => (
          <div key={day} className="min-w-0 shrink-0 grow-0 basis-full">
            <DaySlide day={day} entries={byWeekday[i] ?? []} />
          </div>
        ))}
      </div>
    </div>
  );
}
