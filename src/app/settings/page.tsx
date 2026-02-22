import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getVisibleRoutes } from "~/server/actions/settings";
import { RouteToggleForm } from "~/components/settings/route-toggle-form";

const SettingsPage = async () => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const visibleRoutes = await getVisibleRoutes();

  return (
    <div className="p-4 pb-20">
      <h1 className="mb-6 text-xl font-semibold">Settings</h1>
      <div className="mb-6">
        <UserButton showName />
      </div>
      <RouteToggleForm initialRoutes={visibleRoutes} />
    </div>
  );
};

export default SettingsPage;
