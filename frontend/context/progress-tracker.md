# Progress Tracker

Update this file after every completed feature/slice. Any AI agent reading this should immediately
know what is done, what is in progress, and what is next.

---

## Current Status

**Phase 0 — Foundation.** The scaffold for both apps is in place and the Prisma schema is defined.
The dashboard cockpit itself is not built yet.

**Trade Journal** is an open, single-user trading-journal analytics dashboard (no auth). The
reference build is `context/designs/website.index.html` — a dark analytics cockpit: sidebar + topbar
shell, overview strip, advanced filters, ~27 stat cards, seven Chart.js charts, insights + asset
leaderboard, calendar heatmap, and a filterable trades table.

**In place:**

- **Frontend** — Next.js 16 + React 19 + TypeScript (strict), App Router with an `(app)` route group;
  `/` redirects to `/dashboard`; `/dashboard` is a placeholder page. `AppShell`
  (`src/shared/components/AppShell.tsx`) renders the chrome (brand + nav from
  `shared/config/app-nav.ts`). shadcn/ui primitives live in `src/shared/components/ui`; shared
  `lib/` (axios instance, `cn`, `get-error-message`), `stores/confirm.store`, `GlobalHosts` (sonner
  Toaster + ConfirmDialog), and `styles/theme.css` are wired.
- **Backend** — NestJS bootstrap (`main.ts`: helmet, `ValidationPipe`, Prisma-then-generic filter
  ordering, CORS, global `api` prefix, shutdown hooks); `app.module.ts` with boot-validated config,
  global `ThrottlerGuard` + `ResponseInterceptor`; `PrismaService`/`PrismaModule`; a `health` module.
  Env is `NODE_ENV` / `DATABASE_URL` / `CORS_ORIGIN` / `PORT`.
- **Schema** — `TradingAccount` + `Trade` (+ `TradeSide` / `TradeStatus` enums), with
  `@@unique([accountId, ticket])` for idempotent CSV re-import and `@@index([accountId, closedAt])`.
- **Verified** — frontend + backend `tsc --noEmit` green; `prisma generate` green.

**Not done yet:**

- `theme.css` does not yet hold the dark trading tokens, and Inter is not yet the only font — so the
  placeholder pages do not match the design. This is the remaining Phase 0 task.
- **No DB migration has run.** Run `npx prisma migrate dev --name init` (needs a reachable
  `DATABASE_URL`) to create the `trading_accounts` / `trades` tables.
- `health` is the only backend feature module — `accounts` and `trades` are not built.
- No `features/` slices exist on the frontend; the whole dashboard cockpit is unbuilt.

**Next:**

- Repoint `theme.css` + fonts to the dark design (finishes Phase 0), run the init migration, then
  build the `accounts` slice (Phase 1) and the `trades` slice (Phase 2), then the dashboard cockpit
  (metrics → overview/stats → charts → filters/insights/calendar/table → export/theme).

---

## Progress

See build-plan.md for the full per-phase breakdown.

- [~] Phase 0 — Foundation (scaffold + schema done; theme.css/fonts repoint pending)
- [ ] Phase 1 — Trading Accounts (not started; `prisma migrate dev --name init` still to run)
- [ ] Phases 2–6 — Trades, Metrics/Overview/Stats, Charts, Filters/Insights/Calendar/Table, Export/Theme
- [ ] Phase 7 — Polish

---

## Decisions Made During Build

- **No auth — open, single-user personal app.** No login, signup, email OTP, JWT, or cookies, and no
  user identity: the data is just "my accounts / my trades", scoped by `accountId` where relevant.
  **Trade-off:** the API is unauthenticated, so the app is for **local/personal use** and is not safe
  to expose publicly as-is.
- **Schema:** two models — `TradingAccount` + `Trade` (+ `TradeSide`/`TradeStatus` enums), with
  `@@unique([accountId, ticket])` so re-importing a broker CSV is idempotent.
- **Stack:** Frontend — Next.js 16 + React 19 + TypeScript (strict) + Tailwind v4 + shadcn/ui +
  **Chart.js** (`react-chartjs-2`). Backend — NestJS + Prisma + PostgreSQL. The frontend talks only to
  the NestJS REST API.
- **Theme:** **dark** (no light theme), **green/teal `primary`** switchable green/violet/gold via
  `data-accent`, **green-up / red-down** P&L color language, 8px radius.
- **Fonts:** **Inter** only.
- **Analytics:** derived **client-side** from the raw trade set via `features/dashboard/lib/metrics.ts`
  (the API returns raw trades). A backend analytics endpoint is an optional, approval-gated
  optimization only if client compute is ever too slow.
- **No AI / no market feed / no execution** — this is a journal, not a terminal.

---

## Notes

- **tailwind-merge / custom type scale:** `cn()` in `src/shared/lib/utils.ts` registers the custom
  `text-*` size tokens with `extendTailwindMerge` so size classes (`text-h2`) aren't conflated with
  color classes and dropped. Any new `text-size` token added to `theme.css` must be added there too.
- **Chart colors read from tokens** — never hardcode a second palette copy in chart code, so the
  accent-theme switch stays in sync.
- **Dev-server tip:** deleting files while `next dev` is running can corrupt the Turbopack `.next`
  cache. If a fatal "out of memory" / "can't resolve" appears, stop dev servers, `rm -rf .next`, and
  start a single `npm run dev`.
