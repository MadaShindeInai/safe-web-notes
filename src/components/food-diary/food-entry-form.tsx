"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { createFoodEntry } from "~/server/actions/food-diary";

type Props = {
  mealType: string;
};

export function FoodEntryForm({ mealType }: Props) {
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setError(null);
    setPending(true);
    const result = await createFoodEntry(mealType, description.trim());
    setPending(false);
    if (result.success) {
      setDescription("");
      toast.success("Saved");
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What did you eat?"
        rows={3}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        size="sm"
        disabled={!description.trim() || pending}
      >
        Save
      </Button>
    </form>
  );
}
