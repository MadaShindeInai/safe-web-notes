"use server";

import { revalidatePath } from "next/cache";
import { getRequiredUserId } from "~/lib/auth";
import { prisma } from "~/lib/prisma";

type ActionResult<T = undefined> =
  | (T extends undefined ? { success: true } : { success: true; data: T })
  | { success: false; error: string };

function todayUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export async function getTodayFoodEntries() {
  const userId = await getRequiredUserId();
  const start = todayUTC();
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return prisma.foodEntry.findMany({
    where: {
      userId,
      date: { gte: start, lt: end },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createFoodEntry(
  mealType: string,
  description: string,
): Promise<ActionResult> {
  try {
    const userId = await getRequiredUserId();
    await prisma.foodEntry.create({
      data: {
        userId,
        date: todayUTC(),
        mealType,
        description,
        feelings: null,
      },
    });
    revalidatePath("/food-diary");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function updateFoodEntryFeelings(
  id: string,
  feelings: string,
): Promise<ActionResult> {
  try {
    const userId = await getRequiredUserId();
    const entry = await prisma.foodEntry.findFirst({
      where: { id, userId },
    });
    if (!entry) {
      return { success: false, error: "Entry not found" };
    }
    await prisma.foodEntry.update({
      where: { id },
      data: { feelings },
    });
    revalidatePath("/food-diary");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
