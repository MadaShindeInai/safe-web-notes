"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";

type ActivityRowProps = {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
  onDeleteAction: (id: string) => void;
};

export function ActivityRow({
  id,
  startTime,
  endTime,
  activity,
  onDeleteAction,
}: ActivityRowProps) {
  const [showDelete, setShowDelete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDelete) return;
    function handleOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowDelete(false);
      }
    }
    document.addEventListener("click", handleOutside, { capture: true });
    return () =>
      document.removeEventListener("click", handleOutside, { capture: true });
  }, [showDelete]);

  function handlePointerDown() {
    timerRef.current = setTimeout(() => setShowDelete(true), 500);
  }

  function cancelTimer() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex items-baseline gap-2 px-4 py-3 select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={cancelTimer}
      onPointerLeave={cancelTimer}
    >
      <span className="shrink-0 tabular-nums text-sm text-muted-foreground">
        {startTime} – {endTime}
      </span>
      <span className="text-sm">· {activity}</span>
      {showDelete && (
        <div className="absolute inset-0 flex items-center justify-end bg-background/90 px-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowDelete(false);
              onDeleteAction(id);
            }}
          >
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
