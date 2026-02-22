"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateVisibleRoutes, KNOWN_ROUTES } from "~/server/actions/settings";
import { Button } from "~/components/ui/button";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Schedule",
  "/food-diary": "Food Diary",
  "/ai-overview": "AI Overview",
};

interface Props {
  initialRoutes: string[];
}

export const RouteToggleForm = ({ initialRoutes }: Props) => {
  const [selected, setSelected] = useState<string[]>(initialRoutes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = (route: string) =>
    setSelected((prev) =>
      prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route],
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateVisibleRoutes(selected);
      if (result.success) {
        toast.success("Settings saved");
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-medium">Visible tabs</p>
      {KNOWN_ROUTES.map((route) => (
        <label key={route} className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selected.includes(route)}
            onChange={() => toggle(route)}
            disabled={isPending}
            className="size-4"
          />
          <span className="text-sm">{ROUTE_LABELS[route]}</span>
        </label>
      ))}
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
};
