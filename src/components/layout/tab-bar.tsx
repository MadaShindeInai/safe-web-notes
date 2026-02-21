"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, BookOpen, Sparkles } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "~/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: CalendarDays, label: "Schedule" },
  { href: "/food-diary", icon: BookOpen, label: "Food Diary" },
  { href: "/ai-overview", icon: Sparkles, label: "AI Overview" },
] as const;

export const TabBar = () => {
  const pathname = usePathname();

  return (
    <nav className="border-border bg-background fixed right-0 bottom-0 left-0 z-50 border-t px-2">
      <div className="mx-auto flex w-full max-w-sm items-stretch">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
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

        <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-5",
                userButtonTrigger: "focus:shadow-none",
              },
            }}
          />
          <span>Settings</span>
        </div>
      </div>
    </nav>
  );
};
