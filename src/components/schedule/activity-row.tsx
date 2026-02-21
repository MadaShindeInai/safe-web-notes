type ActivityRowProps = {
  startTime: string;
  endTime: string;
  activity: string;
};

export function ActivityRow({ startTime, endTime, activity }: ActivityRowProps) {
  return (
    <div className="flex items-baseline gap-2 px-4 py-3">
      <span className="shrink-0 tabular-nums text-sm text-muted-foreground">
        {startTime} – {endTime}
      </span>
      <span className="text-sm">· {activity}</span>
    </div>
  );
}
