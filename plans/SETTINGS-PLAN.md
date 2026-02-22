# Settings Feature — Implementation Plan

> 8 PRD items, 6 files changed/created. Implement in order; each step is independently verifiable.

---

## Item 1 — Database: `visibleRoutes` field

**PRD:** Add `visibleRoutes Json?` to User Prisma model.

**File:** `prisma/schema.prisma`

```prisma
model User {
  id              String          @id
  email           String          @unique
  name            String?
  visibleRoutes   Json?           // string[] | null; null → DEFAULT_ROUTES
  scheduleEntries ScheduleEntry[]
  foodEntries     FoodEntry[]
  aiAnalysis      AiAnalysis?
}
```

**Commands:**
```bash
pnpm prisma migrate dev --name add_user_visible_routes
```

**Verify:**
- `prisma/migrations/*/migration.sql` contains `ALTER TABLE "User" ADD COLUMN "visibleRoutes" JSONB`
- `pnpm prisma migrate dev` exits 0
- Prisma client regenerates without errors

---

## Item 2 — Server: `getVisibleRoutes()`

**PRD:** Returns stored routes or `DEFAULT_ROUTES=['/']` when null.

**File:** `src/server/actions/settings.ts` (new)

```ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '~/lib/prisma';
import { revalidatePath } from 'next/cache';

export const DEFAULT_ROUTES = ['/'] as const;
export const KNOWN_ROUTES = ['/', '/food-diary', '/ai-overview'] as const;

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
  if (!user || user.visibleRoutes === null) return [...DEFAULT_ROUTES];
  return user.visibleRoutes as string[];
}
```

**Notes:**
- Does NOT use `getRequiredUserId()` — unauthenticated callers silently get defaults (TabBarServer calls this before checking auth)
- Returns a mutable copy with spread to avoid readonly issues

**Verify:**
- Call with no user → returns `['/']`
- Call with user whose `visibleRoutes` is null → returns `['/']`
- Call with user whose `visibleRoutes` is `['/food-diary']` → returns `['/food-diary']`

---

## Item 3 — Server: `updateVisibleRoutes()`

**PRD:** Validates subset of KNOWN_ROUTES, updates DB, revalidates layout.

**File:** `src/server/actions/settings.ts` (same file as Item 2)

```ts
export async function updateVisibleRoutes(routes: string[]): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Not authenticated' };

    const invalid = routes.filter(r => !(KNOWN_ROUTES as readonly string[]).includes(r));
    if (invalid.length > 0) {
      return { success: false, error: `Unknown routes: ${invalid.join(', ')}` };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { visibleRoutes: routes },
    });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
```

**Notes:**
- `revalidatePath('/', 'layout')` invalidates root layout cache for ALL routes — ensures TabBarServer refetches on next request
- Empty array `[]` is valid (hides all 3 main tabs; only Settings remains)
- `ActionResult` type is redeclared locally — same pattern as `src/server/actions/schedule.ts:7`

**Verify:**
- `updateVisibleRoutes(['/unknown'])` → `{ success: false, error: 'Unknown routes: /unknown' }`
- `updateVisibleRoutes(['/food-diary'])` → DB updated, returns `{ success: true }`
- `updateVisibleRoutes([])` → DB updated with `[]`, returns `{ success: true }`

---

## Item 4 — Settings Page

**PRD:** `/settings` renders `<UserButton showName />` + `<RouteToggleForm>`.

**File:** `src/app/settings/page.tsx` (new)

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { getVisibleRoutes } from '~/server/actions/settings';
import { RouteToggleForm } from '~/components/settings/route-toggle-form';

const SettingsPage = async () => {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

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
```

**Notes:**
- Server component — no `'use client'`
- Auth guard: redirect to `/sign-in` (matches Clerk sign-in route in `src/app/sign-in`)
- `pb-20` matches other pages (clears the fixed TabBar)

**Verify:**
- GET `/settings` while signed out → redirects to `/sign-in`
- GET `/settings` while signed in → page renders with UserButton + form
- `pnpm build` succeeds (no static generation error — page is dynamic via `auth()`)

---

## Item 5 — RouteToggleForm Component

**PRD:** 3 checkboxes (Schedule/FoodDiary/AIOverview), success toast, inline error, disabled while pending.

**File:** `src/components/settings/route-toggle-form.tsx` (new)

```tsx
'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateVisibleRoutes, KNOWN_ROUTES } from '~/server/actions/settings';
import { Button } from '~/components/ui/button';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Schedule',
  '/food-diary': 'Food Diary',
  '/ai-overview': 'AI Overview',
};

interface Props {
  initialRoutes: string[];
}

export const RouteToggleForm = ({ initialRoutes }: Props) => {
  const [selected, setSelected] = useState<string[]>(initialRoutes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = (route: string) =>
    setSelected(prev =>
      prev.includes(route) ? prev.filter(r => r !== route) : [...prev, route],
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateVisibleRoutes(selected);
      if (result.success) {
        toast.success('Settings saved');
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-medium">Visible tabs</p>
      {KNOWN_ROUTES.map(route => (
        <label key={route} className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selected.includes(route)}
            onChange={() => toggle(route)}
            disabled={isPending}
            className="size-4"
          />
          <span className="text-sm">{ROUTE_LABELS[route]}</span>
        </label>
      ))}
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
};
```

**Notes:**
- `useTransition` for pending state — consistent with React 19 patterns (aligns with existing `food-diary` form intent)
- `KNOWN_ROUTES` imported from server action to keep route list in one place
- Error rendered inline (not toast) per PRD
- Checkboxes + Save button all disabled while `isPending`

**Verify:**
- All 3 checkboxes render with correct labels
- Uncheck "Food Diary" → Save → success toast → navigate to `/` → Food Diary tab gone (no flicker)
- Save with network error → error text appears below checkboxes, no toast
- During save: all inputs + button disabled

---

## Item 6 — Navigation: Settings tab as `<Link>`

**PRD:** Settings tab is `<Link href='/settings'>` with Settings (gear) icon; active on `/settings`.

**File:** `src/components/layout/tab-bar.tsx`

Replace the `UserButton` div block (lines 40–50) with:

```tsx
import { Settings } from 'lucide-react';
// Add to NAV_ITEMS or render separately — Settings is always visible

// At the end of the nav items loop, add:
<Link
  href="/settings"
  className={cn(
    'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors',
    pathname === '/settings'
      ? 'text-primary font-semibold'
      : 'text-muted-foreground',
  )}
>
  <Settings className="size-5" strokeWidth={pathname === '/settings' ? 2.5 : 1.75} />
  <span>Settings</span>
</Link>
```

**Remove:** `UserButton` import from `@clerk/nextjs` (no longer used in TabBar).

**Verify:**
- Settings tab links to `/settings` (not a button/modal)
- On `/settings` route: Settings icon is `text-primary font-semibold`, strokeWidth 2.5
- On any other route: Settings icon is `text-muted-foreground`, strokeWidth 1.75

---

## Item 7 — Navigation: TabBar filters by `visibleRoutes` prop

**PRD:** TabBar accepts `visibleRoutes: string[]`; Schedule/FoodDiary/AIOverview filtered; Settings always shown.

**File:** `src/components/layout/tab-bar.tsx`

Full updated signature + filtering:

```tsx
interface TabBarProps {
  visibleRoutes: string[];
}

export const TabBar = ({ visibleRoutes }: TabBarProps) => {
  const pathname = usePathname();
  const visibleNavItems = NAV_ITEMS.filter(item => visibleRoutes.includes(item.href));

  return (
    <nav className="border-border bg-background fixed right-0 bottom-0 left-0 z-50 border-t px-2 py-2">
      <div className="mx-auto flex w-full max-w-sm items-stretch">
        {visibleNavItems.map(({ href, icon: Icon, label }) => { /* existing render */ })}
        {/* Settings link — always rendered, never filtered */}
        <Link href="/settings" ...>...</Link>
      </div>
    </nav>
  );
};
```

**Verify:**
- `<TabBar visibleRoutes={[]} />` renders only Settings tab
- `<TabBar visibleRoutes={['/']} />` renders Schedule + Settings
- `<TabBar visibleRoutes={['/', '/food-diary', '/ai-overview']} />` renders all 4 tabs

---

## Item 8 — Layout: `TabBarServer` async server component

**PRD:** Async server component does auth() + prisma query → passes visibleRoutes to TabBar; zero CLS.

**File:** `src/app/layout.tsx`

Add `TabBarServer` inline (or in `src/components/layout/tab-bar-server.tsx` for clarity — prefer separate file to keep layout.tsx clean):

**New file:** `src/components/layout/tab-bar-server.tsx`

```tsx
import { auth } from '@clerk/nextjs/server';
import { prisma } from '~/lib/prisma';
import { TabBar } from './tab-bar';
import { DEFAULT_ROUTES } from '~/server/actions/settings';

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
```

**Update `src/app/layout.tsx`:**
- Remove: `import { TabBar } from '~/components/layout/tab-bar'`
- Add: `import { TabBarServer } from '~/components/layout/tab-bar-server'`
- Replace: `<TabBar />` → `<TabBarServer />`

**CLS rationale:** TabBarServer is an async server component. The `auth()` + prisma query resolves on the server before HTML is sent. React streams the resolved tab list in the initial HTML payload. No client-side fetch → no layout shift.

**Verify:**
- First paint (DevTools → Performance → screenshots) shows correct tab count immediately
- Signed-out user sees only Settings tab (DEFAULT_ROUTES = `['/']` includes Schedule)
- After `updateVisibleRoutes(['/food-diary'])` + hard reload → Food Diary tab visible from first frame

---

## Execution Order

1. Item 1 — schema + migration
2. Item 2 + 3 — `settings.ts` server actions (both in one file)
3. Item 4 + 5 — settings page + RouteToggleForm (new files)
4. Item 6 + 7 — refactor TabBar (one edit, replace UserButton + add prop)
5. Item 8 — TabBarServer + layout.tsx swap

**Final check:** `pnpm check` (lint + typecheck) must pass clean.

---

## Unresolved Questions

None — all decisions resolved by prior plan session.
