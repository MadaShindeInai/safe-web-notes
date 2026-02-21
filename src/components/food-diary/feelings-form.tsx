"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { updateFoodEntryFeelings } from "~/server/actions/food-diary";

type Props = {
  entryId: string;
};

export function FeelingsForm({ entryId }: Props) {
  const [feelings, setFeelings] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feelings.trim()) return;
    setError(null);
    setPending(true);
    const result = await updateFoodEntryFeelings(entryId, feelings.trim());
    setPending(false);
    if (result.success) {
      setFeelings("");
      toast.success("Saved");
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <p className="text-xs text-muted-foreground">How did you feel after eating?</p>
      <Textarea
        value={feelings}
        onChange={(e) => setFeelings(e.target.value)}
        placeholder="Describe your feelings…"
        rows={3}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        size="sm"
        disabled={!feelings.trim() || pending}
      >
        Save
      </Button>
    </form>
  );
}
