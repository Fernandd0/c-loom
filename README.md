# c-loom

A visual task board: every task is a circle that grows the longer it waits. Higher priority starts bigger, tasks due within 24 hours turn urgent, and double-clicking a circle completes it.

Use it as a guest (data stays in your browser) or sign in with Google to sync through Supabase.

Live: https://c-loom.vercel.app

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, framer-motion, Supabase (Postgres + Auth via `@supabase/ssr`). Package manager: **pnpm**.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in the Supabase values
pnpm dev                     # http://localhost:3000
```

| Variable | Used by |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The app (browser and server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only, `/api/stats` |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_AUTH_EXTERNAL_GOOGLE_*` | Supabase CLI only, never the app |

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | Quality |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:integration` | Tests against the Supabase project in `.env` |
| `pnpm test:e2e` | Browser tests (Playwright) |
| `pnpm check` | Typecheck + lint + unit tests + build |
| `pnpm db:push` | Apply `supabase/migrations` to the linked project |
| `pnpm db:types` | Regenerate `src/lib/supabase/database.types.ts` |

## Tests

- **Unit** (`tests/unit`): dates and time zones, recurrence, circle size and collisions, data mappers, guest storage. No network.
- **Integration** (`tests/integration`): row level security, the Supabase data source and guest import, against the project in `.env`. Creates throwaway users and deletes them.
- **End to end** (`e2e`): the app in a real browser, as a guest and signed in. Builds and starts the app on port 3123. Locally it uses your installed Chrome.

Tests that need Supabase skip themselves unless `SUPABASE_SERVICE_ROLE_KEY` is set. CI always runs unit and guest browser tests; to also run the Supabase ones, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` as repository secrets.

## Database

The schema lives in `supabase/migrations` and is the only way it changes. Every table has row level security: users only see their own workspaces, categories and tasks. Signing up creates the profile, a first workspace and default categories through a database trigger.

Auth settings (Google provider, redirect URLs) live in `supabase/config.toml`. Review with `supabase config diff` before `supabase config push`. The CLI reads its credentials from the environment, so load `.env` first:

```bash
set -a; . ./.env; set +a
pnpm exec supabase link --project-ref <project-ref>
pnpm db:push && pnpm db:types
```

## Project layout

```
src/
  app/                 routes, page, app-level components and hooks
    components/task-form/   shared inputs for creating and editing tasks
    lib/task.ts        task size, urgency, priority levels
  lib/
    dates.ts           deadline parsing/formatting (stored UTC, shown local)
    env.ts             validated environment variables
    supabase/          browser, server, admin and proxy clients + generated types
  features/board/data/ useBoardData hook + data sources (localStorage for guests, Supabase when signed in)
  proxy.ts             refreshes the Supabase session on each request
supabase/              config.toml and migrations
```
