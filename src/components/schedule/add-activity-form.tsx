"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

type Entry = {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
};

type AddActivityFormProps = {
  entries: Entry[];
  onAddAction: (
    startTime: string,
    endTime: string,
    activity: string,
  ) => Promise<{ success: true } | { success: false; error: string }>;
};

function timeToMinutes(time: string): number {
  const parts = time.split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  return h * 60 + m;
}

function findOverlap(
  start: string,
  end: string,
  entries: Entry[],
): Entry | undefined {
  const newStart = timeToMinutes(start);
  const newEnd = timeToMinutes(end);
  return entries.find((e) => {
    const eStart = timeToMinutes(e.startTime);
    const eEnd = timeToMinutes(e.endTime);
    return newStart < eEnd && newEnd > eStart;
  });
}

export function AddActivityForm({ entries, onAddAction }: AddActivityFormProps) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [activity, setActivity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const disabled = !startTime || !endTime || !activity || pending;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await onAddAction(startTime, endTime, activity);
    setPending(false);
    if (result.success) {
      setStartTime("");
      setEndTime("");
      setActivity("");
      setOverlapWarning(null);
      toast.success("Activity added");
    } else {
      setError(result.error);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 space-y-2 border-t bg-background p-3"
    >
      <div className="flex gap-2">
        <Input
          type="time"
          value={startTime}
          onChange={(e) => {
            const val = e.target.value;
            setStartTime(val);
            if (val && endTime) {
              const overlap = findOverlap(val, endTime, entries);
              setOverlapWarning(
                overlap ? `Overlaps with "${overlap.activity}"` : null,
              );
            }
          }}
          className="flex-1"
          aria-label="Start time"
        />
        <Input
          type="time"
          value={endTime}
          onChange={(e) => {
            const val = e.target.value;
            setEndTime(val);
            if (startTime && val) {
              const overlap = findOverlap(startTime, val, entries);
              setOverlapWarning(
                overlap ? `Overlaps with "${overlap.activity}"` : null,
              );
            }
          }}
          className="flex-1"
          aria-label="End time"
        />
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="Activity"
          className="flex-1"
        />
        <Button type="submit" disabled={disabled} size="sm">
          Add
        </Button>
      </div>
      {overlapWarning && (
        <p className="text-sm text-yellow-600">{overlapWarning}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
