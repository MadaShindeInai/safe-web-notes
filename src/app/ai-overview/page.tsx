import { auth } from "@clerk/nextjs/server";
import { AnalysisActions } from "~/components/ai/analysis-actions";
import { AnalysisCard } from "~/components/ai/analysis-card";
import { prisma } from "~/lib/prisma";

export default async function AiOverviewPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const [analysis, entryCount] = await Promise.all([
    prisma.aiAnalysis.findUnique({ where: { userId } }),
    prisma.foodEntry.count({ where: { userId } }),
  ]);

  if (!analysis) {
    return (
      <div className="space-y-4 p-4 pb-20">
        <h1 className="text-xl font-semibold">AI Overview</h1>
        <p className="text-sm text-muted-foreground">
          Your personal nutrition analyst. Once you've logged enough meals,
          Ralph will analyze your food diary and correlate what you eat with how
          you feel — generating personalized recommendations.
        </p>
        <AnalysisActions hasAnalysis={false} entryCount={entryCount} />
      </div>
    );
  }

  const recommended = analysis.recommended as {
    dish: string;
    reason: string;
  }[];
  const notRecommended = analysis.notRecommended as {
    dish: string;
    reason: string;
  }[];
  const avoidProducts = analysis.avoidProducts as {
    product: string;
    reason: string;
  }[];

  const lastUpdated = analysis.updatedAt.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4 p-4 pb-20">
      <div>
        <h1 className="text-xl font-semibold">AI Overview</h1>
        <p className="text-xs text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
      </div>
      <AnalysisCard
        title="Recommended Dishes"
        items={recommended.map((i) => ({ name: i.dish, reason: i.reason }))}
      />
      <AnalysisCard
        title="Strictly Not Recommended"
        items={notRecommended.map((i) => ({ name: i.dish, reason: i.reason }))}
      />
      <AnalysisCard
        title="Products/Ingredients to Avoid"
        items={avoidProducts.map((i) => ({
          name: i.product,
          reason: i.reason,
        }))}
      />
      <AnalysisActions hasAnalysis={true} entryCount={entryCount} />
    </div>
  );
}
