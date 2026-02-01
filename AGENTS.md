# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Production code. Must be maintainable.   

Codebase outlives you. Shortcuts → someone else's burden. Hack → technical debt that slows the whole team down.
The patterns you establish will be copied. The corners you cut will be cut again Fight entropy. Leave the codebase better than you found it.

## Commands

```bash
pnpm dev          # Dev server (Turbo)
pnpm build        # Prod build
pnpm check        # Lint + typecheck
pnpm lint:fix     # Lint autofix
pnpm format:write # Format fix
```

## Architecture

T3 Stack: Next.js 15 (App Router) + React 19 + Tailwind 4 + TS.

- `src/app/` — pages/layouts
- `src/env.js` — env validation (Zod)
- `~/` → `./src/`

## Plan Mode

Make the plan extremely concise. Sacrifice grammar for the sake of concision.         
At the end of each plan, give me a list of unresolved questions to answer, if any.