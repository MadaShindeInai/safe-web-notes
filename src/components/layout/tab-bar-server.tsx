import { auth } from "@clerk/nextjs/server";
import { prisma } from "~/lib/prisma";
import { TabBar } from "./tab-bar";
import { DEFAULT_ROUTES } from "~/lib/settings-constants";

export const TabBarServer = async () => {
  const { userId } = await auth();
  let visibleRoutes: string[] = [...DEFAULT_ROUTES];

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { visibleRoutes: true },
    });
    if (user?.visibleRoutes) {
      visibleRoutes = user.visibleRoutes as string[];
    }
  }

  return <TabBar visibleRoutes={visibleRoutes} />;
};
