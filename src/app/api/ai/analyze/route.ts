import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredUserId } from "~/lib/auth";
import { prisma } from "~/lib/prisma";

const bodySchema = z.object({
  mode: z.enum(["full", "incremental"]),
});

const analysisSchema = z.object({
  recommended: z.array(z.object({ dish: z.string(), reason: z.string() })),
  notRecommended: z.array(z.object({ dish: z.string(), reason: z.string() })),
  avoidProducts: z.array(z.object({ product: z.string(), reason: z.string() })),
});

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await getRequiredUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as unknown;
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const { mode } = parsed.data;

  const { entries, previousAnalysis } = await (async (): Promise<{
    entries: Awaited<ReturnType<typeof prisma.foodEntry.findMany>>;
    previousAnalysis: string | null;
  }> => {
    if (mode === "full") {
      return {
        entries: await prisma.foodEntry.findMany({
          where: { userId },
          orderBy: { date: "asc" },
        }),
        previousAnalysis: null,
      };
    }

    const existing = await prisma.aiAnalysis.findUnique({
      where: { userId },
    });

    if (existing) {
      return {
        entries: await prisma.foodEntry.findMany({
          where: { userId, date: { gt: existing.lastEntryDate } },
          orderBy: { date: "asc" },
        }),
        previousAnalysis: JSON.stringify({
          recommended: existing.recommended,
          notRecommended: existing.notRecommended,
          avoidProducts: existing.avoidProducts,
        }),
      };
    }

    return {
      entries: await prisma.foodEntry.findMany({
        where: { userId },
        orderBy: { date: "asc" },
      }),
      previousAnalysis: null,
    };
  })();

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "No entries to analyze" },
      { status: 400 },
    );
  }

  const entriesText = entries
    .map(
      (e) =>
        `Date: ${e.date.toISOString().slice(0, 10)}, Meal: ${e.mealType}, Description: ${e.description}${e.feelings ? `, Feelings after: ${e.feelings}` : ""}`,
    )
    .join("\n");

  let userPrompt = `Food diary entries:\n${entriesText}`;
  if (mode === "incremental" && previousAnalysis) {
    userPrompt = `Previous analysis:\n${previousAnalysis}\n\nNew food entries since last analysis:\n${entriesText}\n\nPlease update your analysis incorporating the new entries.`;
  }

  const { object } = await generateObject({
    model: "anthropic/claude-sonnet-4.5",
    system:
      "You are a professional nutrition and wellness analyst. Analyze the user's food diary and correlate what they eat with how they feel after meals. Identify patterns between specific foods/meals and reported emotional or physical states. Provide personalized dietary recommendations based on these patterns.",
    prompt: userPrompt,
    schema: analysisSchema,
  });

  const newestEntry = entries[entries.length - 1]!;

  await prisma.aiAnalysis.upsert({
    where: { userId },
    create: {
      userId,
      recommended: object.recommended,
      notRecommended: object.notRecommended,
      avoidProducts: object.avoidProducts,
      lastEntryDate: newestEntry.date,
    },
    update: {
      recommended: object.recommended,
      notRecommended: object.notRecommended,
      avoidProducts: object.avoidProducts,
      lastEntryDate: newestEntry.date,
    },
  });

  return NextResponse.json({ success: true });
}
