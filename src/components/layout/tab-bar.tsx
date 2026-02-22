"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, BookOpen, Sparkles, Settings } from "lucide-react";
import { cn } from "~/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: CalendarDays, label: "Schedule" },
  { href: "/food-diary", icon: BookOpen, label: "Food Diary" },
  { href: "/ai-overview", icon: Sparkles, label: "AI Overview" },
] as const;

interface TabBarProps {
  visibleRoutes: string[];
}

export const TabBar = ({ visibleRoutes }: TabBarProps) => {
  const pathname = usePathname();
  const visibleNavItems = NAV_ITEMS.filter((item) =>
    visibleRoutes.includes(item.href),
  );

  return (
    <nav className="border-border bg-background fixed right-0 bottom-0 left-0 z-50 border-t px-2 py-2">
      <div className="mx-auto flex w-full max-w-sm items-stretch">
        {visibleNavItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" strokeWidth={isActive ? 2.5 : 1.75} />
              <span>{label}</span>
            </Link>
          );
        })}

        <Link
          href="/settings"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
            pathname === "/settings"
              ? "text-primary font-semibold"
              : "text-muted-foreground",
          )}
        >
          <Settings
            className="size-5"
            strokeWidth={pathname === "/settings" ? 2.5 : 1.75}
          />
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
};
