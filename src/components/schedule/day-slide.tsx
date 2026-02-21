import { ActivityRow } from "./activity-row";

type Entry = {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
};

type DaySlideProps = {
  day: string;
  entries: Entry[];
};

export function DaySlide({ day, entries }: DaySlideProps) {
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <h2 className="px-4 py-3 text-lg font-semibold">{day}</h2>
      <div className="flex-1 divide-y overflow-y-auto pb-20">
        {entries.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No activities yet
          </p>
        ) : (
          entries.map((entry) => (
            <ActivityRow
              key={entry.id}
              startTime={entry.startTime}
              endTime={entry.endTime}
              activity={entry.activity}
            />
          ))
        )}
      </div>
    </div>
  );
}
