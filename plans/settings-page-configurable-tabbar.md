# Settings Page + Configurable TabBar

## Context
Settings is currently a UserButton in the TabBar with no page route. Need: a real `/settings` page with Clerk UserButton + per-route checkboxes. Visibility prefs stored in `User.visibleRoutes` (DB). TabBar must render correct tabs on first SSR paint — no CLS.

**User answers:**
- All 3 routes (Schedule, FoodDiary, AIOverview) are toggleable
- Disabling all is allowed (only Settings tab remains)
- Default for new users: only Schedule (`['/']`)

---

## Schema Change

`prisma/schema.prisma` — add one nullable field to `User`:

```prisma
model User {
  ...
  visibleRoutes   Json?   // string[] | null; null treated as DEFAULT_ROUTES
}
```

`null` = brand-new user → interpret as `['/']` in code (constant `DEFAULT_ROUTES`).
Migration: `pnpm prisma migrate dev --name add_user_visible_routes`

---

## Files to Create / Modify

### 1. `src/server/actions/settings.ts` (new)
```ts
'use server'
getVisibleRoutes(): Promise<string[]>          // returns stored or DEFAULT_ROUTES
updateVisibleRoutes(routes: string[]): Promise<ActionResult>
  - validate: routes must be subset of KNOWN_ROUTES = ['/', '/food-diary', '/ai-overview']
  - prisma.user.update({ visibleRoutes: routes })
  - revalidatePath('/', 'layout')              // busts root layout cache for all pages
```

### 2. `prisma/schema.prisma`
Add `visibleRoutes Json?` to `User`.

### 3. `src/app/settings/page.tsx` (new, server component)
- Calls `getVisibleRoutes()`
- Renders `<UserButton showName />` at top
- Renders `<RouteToggleForm initialRoutes={routes} />`
- Standard `p-4 pb-20` wrapper

### 4. `src/components/settings/route-toggle-form.tsx` (new, client)
- Controlled checkboxes for each route label (Schedule, Food Diary, AI Overview)
- Submit calls `updateVisibleRoutes(selected)` — no optimistic UI needed (low-freq action)
- `toast.success("Settings saved")` on success, inline error on failure
- Save button disabled while pending (`useTransition`)

### 5. `src/components/layout/tab-bar.tsx` (modify)
- Add prop: `visibleRoutes: string[] | null`
- `const enabled = visibleRoutes ?? DEFAULT_ROUTES`
- Filter `NAV_ITEMS` to only items where `enabled.includes(href)`
- Replace UserButton div with a proper `<Link href="/settings">` using `Settings` icon (lucide)
- Active state: `pathname === '/settings'`
- Settings tab always rendered (not filtered)

### 6. `src/app/layout.tsx` (modify)
- Add an async server component `TabBarServer` that:
  - Calls `auth()` → if no userId, passes `null`
  - If userId: `prisma.user.findUnique({ where: { id: userId }, select: { visibleRoutes: true } })`
  - Renders `<TabBar visibleRoutes={...} />`
- Replace `<TabBar />` in layout with `<TabBarServer />`

---

## CLS Prevention Detail

```
Request → layout.tsx (server) → TabBarServer (server, async)
                                  └─ auth() + prisma query
                                  └─ <TabBar visibleRoutes={[...]} />
```

SSR response includes correct tab count from the start. React hydration reuses same DOM → zero layout shift. No client-side fetch for visibility state.

---

## Edge Cases

| Scenario | Handling |
|---|---|
| New user (null visibleRoutes) | `DEFAULT_ROUTES = ['/']` constant; only Schedule + Settings visible |
| User disables all routes | Empty array stored; only Settings tab rendered |
| Navigate to hidden page directly | Page works fine; tab just not shown in bar |
| Sign-in/sign-up pages (no userId) | `TabBarServer` returns `null` visibleRoutes → DEFAULT_ROUTES used |
| `/settings` active state | `pathname === '/settings'` → Settings icon shows active style |
| Concurrent saves | `useTransition` disables Save during flight |

---

## Verification

1. `pnpm check` — zero lint/type errors
2. Manual: new user flow → only Schedule tab visible
3. Settings page: enable Food Diary → save → navigate to `/` → Food Diary tab present, no flicker
4. Settings page: disable Schedule → only Settings in bar → navigate to `/` still works
5. DevTools: paint/hydration shows correct tab count from first frame (no CLS)
6. `pnpm build` clean (no static generation errors on `/settings`)
