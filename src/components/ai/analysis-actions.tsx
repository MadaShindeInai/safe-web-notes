"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";

interface AnalysisActionsProps {
  hasAnalysis: boolean;
  entryCount: number;
}

export function AnalysisActions({
  hasAnalysis,
  entryCount,
}: AnalysisActionsProps) {
  const [loading, setLoading] = useState(false);

  const trigger = (mode: "full" | "incremental") => {
    setLoading(true);
    toast(
      "Analysis in progress. Results will appear shortly — please refresh.",
    );
    void fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
  };

  if (!hasAnalysis) {
    const ready = entryCount >= 14;
    return (
      <div className="space-y-2">
        <Button
          disabled={!ready || loading}
          onClick={() => trigger("full")}
          className="w-full"
        >
          Generate your first analysis
        </Button>
        {!ready && (
          <p className="text-muted-foreground text-center text-sm">
            Log at least 14 meals to unlock AI analysis ({entryCount}/14 so far)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        disabled={loading}
        onClick={() => trigger("incremental")}
        className="flex-1"
      >
        Update based on latest data
      </Button>
      <Button
        variant="outline"
        disabled={loading}
        onClick={() => trigger("full")}
        className="flex-1"
      >
        Regenerate from full data
      </Button>
    </div>
  );
}
