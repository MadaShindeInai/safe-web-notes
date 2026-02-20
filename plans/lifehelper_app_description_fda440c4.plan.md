---
name: LifeHelper App Description
overview: Detailed product description for LifeHelper -- a PWA for daily schedule management, food journaling with feelings tracking, and AI-powered food-to-feel correlation analysis.
todos:
  - id: create-prd
    content: Create the PRD file based on this approved app description
    status: pending
isProject: false
---

# LifeHelper - Detailed App Description

## Overview

LifeHelper is a mobile-first Progressive Web App for personal daily routine and nutrition management. Users maintain a weekly schedule template, log meals with associated feelings, and receive AI-powered insights that correlate food intake with emotional/physical states. The app is installable on mobile devices with a native-like bottom tab navigation.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Clerk (Google sign-in only)
- **AI:** Vercel AI SDK (multi-provider)
- **Carousel:** Embla Carousel (via shadcn carousel component)
- **PWA:** Minimal -- installable with app shell caching; no offline data sync
- **Deploy:** Vercel

## Visual Direction

- Minimal, clean light theme
- Mobile-first; don't break on desktop (basic `max-width` constraint, centered)
- Native-app feel: bottom tab bar, smooth carousel transitions, touch-optimized inputs
- No custom voice input -- users rely on native phone keyboard speech-to-text

---

## Navigation

Fixed bottom tab bar with 4 items:

- **Tab 1 -- Schedule** (Calendar/Clock icon) -> `/`
- **Tab 2 -- Food Diary** (Utensils/Book icon) -> `/food-diary`
- **Tab 3 -- AI Overview** (Sparkles/Brain icon) -> `/ai-overview`
- **Tab 4 -- Settings** (User/Gear icon) -> Opens Clerk `<UserButton />` modal (no route)

Active tab indicated visually. Settings tab does not navigate -- it triggers Clerk's built-in user profile/account management modal.

---

## Route 1: Day Schedule (`/`)

### Purpose

A full-screen swipeable weekly planner showing the user's repeating weekly schedule template.

### Layout

- Full-screen horizontal carousel, 7 slides (Monday through Sunday). Week starts on Monday.
- Carousel wraps around infinitely (Sunday swipes to Monday and vice versa).
- On load, auto-scrolls to the current weekday.
- Each slide: day name header, then a list of scheduled activities sorted ascending by start time.
- Empty day: placeholder text "No activities yet" with the add form below.

### Activity Display

Each activity row shows:

- Time range in 24h format (e.g. "09:00 - 10:30")
- Activity name
- **Delete:** long-press on the activity row reveals a delete option. Deletes individual activity.

### Inline Form (bottom of each slide)

Sticky/fixed at the bottom of each day slide. 3 fields:

1. **Start time** -- time picker input (24h format)
2. **End time** -- time picker input (24h format)
3. **Activity** -- text input

Submit button creates the activity for that weekday. Form clears on success. Optimistic UI update.

**Overlap validation:** if a new entry overlaps with an existing time range, show a visual warning (inline, next to the form) but allow the user to save anyway.

### Data Model

```
ScheduleEntry {
  id        String   @id @default(cuid())
  userId    String
  weekday   Int      // 0=Monday, 6=Sunday
  startTime String   // "HH:mm" 24h format
  endTime   String   // "HH:mm" 24h format
  activity  String
  createdAt DateTime @default(now())
}
```

### Operations (Server Actions)

- **Create:** Add a new activity to a specific weekday
- **Read:** Fetch all activities for the authenticated user, grouped by weekday
- **Delete:** Remove a single activity by ID
- No update/edit -- delete and re-create if needed

---

## Route 2: Food Diary (`/food-diary`)

### Purpose

Log meals for the current day with food descriptions and associated feelings. Track what you eat and how it makes you feel for later AI analysis.

### Layout

- Current date displayed at the top (read-only -- always today)
- 5 meal type sections in vertical scroll: **Breakfast, Lunch, Dinner, Supper, Party**
- "Party" represents social eating events (restaurants, gatherings, celebrations)
- One entry per meal type per day (max 5 entries/day). No multiple party entries.
- Each section is a collapsed accordion.

### Accordion States

**Empty (no record exists):** accordion expands to show:

- Food description textarea + "Save" button
- Feelings textarea is disabled/hidden until description is saved

**Description saved (record exists, no feelings yet):** accordion expands to show:

- Food description in read-only mode
- Feelings textarea + "Save" button (now enabled)

**Both saved:** accordion expands to show:

- Food description in read-only mode
- Feelings in read-only mode

**No delete.** Once submitted, entries are locked for the day.

**Meals not eaten:** if user didn't eat, they simply don't create a record. No "skip" button needed.

### Data Model

```
FoodEntry {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime // date only, no time component
  mealType    String   // "breakfast" | "lunch" | "dinner" | "supper" | "party"
  description String   // what was eaten
  feelings    String?  // how user felt (nullable, added later)
  createdAt   DateTime @default(now())
}
```

### Operations (Server Actions)

- **Create:** Save food description for a meal type on today's date. Creates the record with `feelings` as null.
- **Read:** Fetch all entries for the current user for today.
- **Update:** Save feelings for an existing entry (sets `feelings` field on an existing record).
- Unique constraint on `userId + date + mealType`.

---

## Route 3: AI Overview (`/ai-overview`)

### Purpose

AI-powered analysis that correlates food diary entries with reported feelings to identify patterns, recommend beneficial foods, and flag problematic ones.

### Layout

3 sections displayed as cards:

1. **Recommended Dishes** -- foods/meals that correlate with positive feelings
2. **Strictly Not Recommended** -- foods/meals that correlate with negative feelings
3. **Products/Ingredients to Avoid** -- specific ingredients or products flagged as problematic

Each section shows the AI-generated content as a formatted list. A "Last updated: [timestamp]" indicator at the top.

### Empty State (no analysis yet)

Explanation text describing what the feature does + a "Generate your first analysis" button. Button is disabled until the user has at least 14 food diary entries (roughly 2 weeks of data). Show a message like "Log at least 14 meals to unlock AI analysis (X/14 so far)."

### Action Buttons (after first analysis exists)

- **"Update based on latest data"** -- sends the previous analysis results + only food entries since `lastEntryDate` to the AI. The AI is prompted to revise/extend its existing analysis with new data. Result replaces the stored analysis.
- **"Regenerate from full data"** -- sends the complete food diary history. AI produces a fresh analysis from scratch. Result replaces the stored analysis.

Both buttons disabled if already processing. No hard rate limit, but "Last updated: [relative time]" is shown to discourage excessive regeneration.

### Processing UX

Button press -> toast notification: "Analysis in progress. Results will appear shortly -- please refresh." Processing happens as a background server-side call (API route). User can navigate away. On next visit/refresh, updated results are displayed.

### AI Behavior

- Uses Vercel AI SDK to call the configured LLM provider
- System prompt: nutrition/wellness analyst role; correlate food descriptions with reported feelings to find patterns
- **Incremental input:** previous analysis JSON + new food entries (date, mealType, description, feelings)
- **Full input:** all food entries for the user
- **Output:** structured JSON with three arrays:
  - `recommended`: `[{ dish: string, reason: string }]`
  - `notRecommended`: `[{ dish: string, reason: string }]`
  - `avoidProducts`: `[{ product: string, reason: string }]`
- Results are parsed, validated, and stored in the database

### Data Model

```
AiAnalysis {
  id              String   @id @default(cuid())
  userId          String   @unique // one active result per user
  recommended     Json     // array of { dish, reason }
  notRecommended  Json     // array of { dish, reason }
  avoidProducts   Json     // array of { product, reason }
  lastEntryDate   DateTime // date of newest food entry included in analysis
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Operations (API Route Handlers)

- **POST /api/ai/analyze** -- triggers analysis (body: `{ mode: "incremental" | "full" }`)
- **GET** -- read from DB via Server Component (no API route needed)

---

## Route 4: Settings (4th nav tab)

Not a page route. Tapping the Settings tab opens Clerk's `<UserButton />` or `<UserProfile />` modal for:

- View/edit profile
- Manage Google account connection
- Sign out

---

## Authentication

- **Provider:** Clerk
- **Sign-in method:** Google OAuth only
- **Flow:** Clerk's pre-built sign-in page/modal
- **Protection:** All routes require authentication. Unauthenticated users redirect to Clerk sign-in.
- **User ID:** Clerk's `userId` used as foreign key in all database tables

---

## PWA Configuration

- **Installable:** yes (web app manifest with app name, icons, theme color)
- **Offline:** minimal -- app shell cached for instant load; data requires network
- **No background sync or offline mutation queue**
- **Display mode:** `standalone` (hides browser chrome for native feel)
- **Orientation:** `portrait`

---

## Mutations Strategy

- **Schedule (CRD) and Food Diary (CRU):** Next.js Server Actions (form-based mutations)
- **AI Analysis:** API Route Handlers (background processing, not tied to form submission)

## Feedback Patterns

- **Success:** toast notifications (bottom of screen)
- **Errors:** inline messages next to the relevant form/field

---

## Unresolved Questions

None -- all critical decisions have been captured. Ready to proceed to PRD creation.