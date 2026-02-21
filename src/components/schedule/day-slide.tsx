"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import {
  createScheduleEntry,
  deleteScheduleEntry,
} from "~/server/actions/schedule";
import { ActivityRow } from "./activity-row";
import { AddActivityForm } from "./add-activity-form";

type Entry = {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
};

type DaySlideProps = {
  day: string;
  weekday: number;
  entries: Entry[];
};

export function DaySlide({ day, weekday, entries }: DaySlideProps) {
  const [, startTransition] = useTransition();
  const [optimisticEntries, dispatch] = useOptimistic<
    Entry[],
    { type: "add"; entry: Entry } | { type: "delete"; id: string }
  >(entries, (state, action) => {
    if (action.type === "add") {
      return [...state, action.entry].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );
    }
    return state.filter((e) => e.id !== action.id);
  });

  function handleAdd(
    startTime: string,
    endTime: string,
    activity: string,
  ): Promise<{ success: true } | { success: false; error: string }> {
    return new Promise((resolve) => {
      const tempEntry: Entry = {
        id: `temp-${Date.now()}`,
        startTime,
        endTime,
        activity,
      };
      startTransition(async () => {
        dispatch({ type: "add", entry: tempEntry });
        const result = await createScheduleEntry(
          weekday,
          startTime,
          endTime,
          activity,
        );
        resolve(result);
      });
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      dispatch({ type: "delete", id });
      const result = await deleteScheduleEntry(id);
      if (!result.success) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <h2 className="px-4 py-3 text-lg font-semibold">{day}</h2>
      <div className="flex-1 divide-y overflow-y-auto">
        {optimisticEntries.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No activities yet
          </p>
        ) : (
          optimisticEntries.map((entry) => (
            <ActivityRow
              key={entry.id}
              id={entry.id}
              startTime={entry.startTime}
              endTime={entry.endTime}
              activity={entry.activity}
              onDeleteAction={handleDelete}
            />
          ))
        )}
      </div>
      <AddActivityForm entries={optimisticEntries} onAddAction={handleAdd} />
    </div>
  );
}
