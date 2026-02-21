"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createScheduleEntry } from "~/server/actions/schedule";

type AddActivityFormProps = {
  weekday: number;
};

export function AddActivityForm({ weekday }: AddActivityFormProps) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [activity, setActivity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const disabled = !startTime || !endTime || !activity || pending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await createScheduleEntry(weekday, startTime, endTime, activity);
    setPending(false);
    if (result.success) {
      setStartTime("");
      setEndTime("");
      setActivity("");
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
          onChange={(e) => setStartTime(e.target.value)}
          className="flex-1"
          aria-label="Start time"
        />
        <Input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
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
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
