"use server";

import { revalidatePath } from "next/cache";
import { getRequiredUserId } from "~/lib/auth";
import { prisma } from "~/lib/prisma";

type ActionResult<T = undefined> =
  | (T extends undefined ? { success: true } : { success: true; data: T })
  | { success: false; error: string };

export async function createScheduleEntry(
  weekday: number,
  startTime: string,
  endTime: string,
  activity: string,
): Promise<ActionResult> {
  try {
    const userId = await getRequiredUserId();
    await prisma.scheduleEntry.create({
      data: { userId, weekday, startTime, endTime, activity },
    });
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function getScheduleEntries() {
  const userId = await getRequiredUserId();
  return prisma.scheduleEntry.findMany({
    where: { userId },
    orderBy: { startTime: "asc" },
  });
}

export async function deleteScheduleEntry(id: string): Promise<ActionResult> {
  try {
    const userId = await getRequiredUserId();
    const entry = await prisma.scheduleEntry.findFirst({
      where: { id, userId },
    });
    if (!entry) {
      return { success: false, error: "Entry not found" };
    }
    await prisma.scheduleEntry.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
