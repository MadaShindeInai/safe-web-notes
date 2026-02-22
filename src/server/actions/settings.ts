"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "~/lib/prisma";
import { DEFAULT_ROUTES, KNOWN_ROUTES } from "~/lib/settings-constants";

type ActionResult<T = undefined> =
  | (T extends undefined ? { success: true } : { success: true; data: T })
  | { success: false; error: string };

export async function getVisibleRoutes(): Promise<string[]> {
  const { userId } = await auth();
  if (!userId) return [...DEFAULT_ROUTES];
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { visibleRoutes: true },
  });
  if (user?.visibleRoutes === null) return [...DEFAULT_ROUTES];
  return user?.visibleRoutes as string[];
}

export async function updateVisibleRoutes(
  routes: string[],
): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Not authenticated" };

    const invalid = routes.filter(
      (r) => !(KNOWN_ROUTES as readonly string[]).includes(r),
    );
    if (invalid.length > 0) {
      return { success: false, error: `Unknown routes: ${invalid.join(", ")}` };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { visibleRoutes: routes },
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
