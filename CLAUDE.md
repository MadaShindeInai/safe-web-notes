# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm check        # Lint + typecheck
pnpm lint         # ESLint only
pnpm lint:fix     # ESLint with auto-fix
pnpm typecheck    # TypeScript only
pnpm format:check # Check formatting
pnpm format:write # Fix formatting
```

## Architecture

T3 Stack app: Next.js 15 (App Router) + React 19 + Tailwind CSS 4 + TypeScript.

- `src/app/` - Next.js App Router pages and layouts
- `src/env.js` - Type-safe env vars via @t3-oss/env-nextjs with Zod validation
- `~/` path alias maps to `./src/`

Environment validation runs at build/dev time. Skip with `SKIP_ENV_VALIDATION=true` for Docker builds.

## TypeScript Conventions

- Prefer `type` over `interface` for simple types
- Prefer `extends` over `&` for complex/composed types (better errors, faster type-checking)
- Use inline type imports: `import { type Foo } from ...`
- Unused vars: prefix with `_`
