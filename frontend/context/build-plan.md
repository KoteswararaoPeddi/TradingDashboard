# Build Plan

A plan for **Trade Journal** — a single-user trading-journal analytics dashboard. Two deployables:
`frontend/` (Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + recharts) and `backend/` (NestJS +
Prisma + PostgreSQL). Mark items `[x]` as they land and keep progress-tracker.md in sync.

The reference build is `context/designs/website.index.html`.

## Core Principle

Build **vertical slices, back to front**. For each feature: define the Prisma model + NestJS module +
DTOs, expose the endpoint, then build the frontend service + UI against it and verify the whole slice
end to end. **Trading Accounts is the first real slice** — every other slice hangs off an account.
Analytics are **derived on the client** from the raw trade set (`lib/metrics.ts`) — the API returns
raw trades, not computed metrics.

> **No auth.** There is no login/signup/OTP/JWT phase and no user identity: this is an open,
> single-user personal app for local use (see architecture.md → Single-user, no auth). Data is scoped
> by `accountId` only.

The API is the source of truth; no mock data layer stands in for it. Where UI must render before its
endpoint exists, stub the service behind a typed interface and replace it when the endpoint lands.

Items are only ticked when the code actually lands.

---

## Phase 0 — Foundation (current)

- [x] **Frontend app scaffolded** — Next.js 16 + React 19 + TypeScript (strict), App Router with an
      `(app)` route group; `/` redirects to `/dashboard`; shadcn/ui primitives in
      `src/shared/components/ui`; Tailwind v4 with `theme.css` imported by `globals.css`.
- [x] **App shell** — `src/shared/components/AppShell.tsx` renders the chrome (brand + nav) around
      the `(app)` pages; `shared/config/app-nav.ts` drives the nav.
- [x] **Backend scaffolded** — NestJS bootstrap (`main.ts`: helmet, `ValidationPipe`, filter ordering,
      CORS, `api` prefix, shutdown hooks), boot-validated config, global `ThrottlerGuard` +
      `ResponseInterceptor`, `PrismaService`/`PrismaModule`, and a `health` module.
- [x] **Swagger / OpenAPI docs** — `@nestjs/swagger` wired in `main.ts`; interactive UI at
      `/api/docs`, spec at `/api/docs-json`. The docs path is exempt from helmet's CSP so the UI can
      boot. Every endpoint built from here on is documented as it lands (see library-docs.md).
- [x] **Prisma schema defined** — `TradingAccount` + `Trade` (+ `TradeSide`/`TradeStatus` enums) with
      `@@unique([accountId, ticket])` and `@@index([accountId, closedAt])`.
- [x] Both apps typecheck clean (`tsc --noEmit`); `prisma generate` clean.
- [x] **Dark theme tokens** — `theme.css` rebuilt in three layers: an `@theme` **palette** holding
      every literal colour (ink ramp, slate text ramp, accent hues, up/down, chip fills, ink-on-fill
      shades, alphas, `--shadow-panel`), a `:root` **semantic layer** of `var()` references only
      (`--primary`/`--info`/`--tertiary`, `--up`/`--down`, surfaces, borders, 8px `--radius`,
      `--sidebar-width`), and `@theme inline` bridging to utilities. Accent themes
      (`body[data-accent="violet"|"gold"]`) swap only the accent trio. All 8 legacy palettes removed.
      The app background grid lives in `globals.css`, also token-driven.
- [x] **Fonts → Inter only** — `next/font/google` wired to `--font-sans` (weights 400-900 for the
      heavy numerics); no display or serif font.
- [x] **`<html class="dark">`** — static, not a toggle. `:root` already holds the dark values; the
      class exists solely so the shadcn primitives' built-in `dark:` utilities match. Without it they
      render their light styling on a dark background.

---

## Phase 1 — Trading Accounts (the first real slice)

- [x] **Database + init migration** — a dedicated `trade_journal` PostgreSQL database, with
      `backend/.env` pointing at it; migration `20260716091717_init` applied, creating
      `trading_accounts` + `trades`, the `TradeSide`/`TradeStatus` enums, and both indexes
      (`@@unique([accountId, ticket])`, `@@index([accountId, closedAt])`).
- [x] **Seed from the reference design** — `prisma/seed-data.ts` (generated verbatim from
      `designs/website.index.html`) + `prisma/seed.ts`, run with `npm run seed`. Inserts the
      `Live Account #110920` ($1,000 / USD) and its **18 BTCUSD trades**. Idempotent via
      `@@unique([accountId, ticket])` — verified by re-running (still 1 account / 18 trades).
      Verified in psql: `SUM(netPnl) = 166.40`, 9 wins / 9 losses.
- [x] **Backend `accounts` module** — `GET /api/accounts` (oldest first), `GET /api/accounts/:id`
      (404 on unknown id). Swagger-documented with wrapped-envelope examples.
- [x] **Backend `trades` module** — `GET /api/trades?accountId=&order=asc|desc`, returning **raw**
      trades ordered by `closedAt` (chronological by default, since running balance is cumulative).
      An unknown `accountId` returns **404** rather than an empty list. Swagger-documented.
- [x] **Frontend cockpit shell** — `DashboardShell` (286px sidebar + scrolling main), `BrandBlock`,
      `SectionNav` (in-page anchors, IntersectionObserver active state), `AccountCard`,
      `AccentSwitcher`, `Topbar`, and the `Panel` section container. `dashboard.store` fetches the
      active account + trades **once**; the sidebar card renders full-set metrics.
      **Verified in a real browser:** balance $1,166.40 (green), net $166.40, growth 16.64%,
      win rate 50.00%, 18 trades; zero console errors; sidebar 286px; h1 900/56px; Inter;
      `--up`/`--down` resolve and paint. *(No settings page — out of scope for the read-only design.)*

---

## Phase 2 — Trades

- [ ] Backend `trades` module (account-scoped): CRUD; **CSV import** (validate rows, dedupe on
      `ticket` via `@@unique([accountId, ticket])`, idempotent).
- [ ] Frontend `trades.service` + add/edit/delete trade forms (RHF + Zod) + CSV import; confirm-before-delete.

---

## Phase 3 — Metrics, Overview & Stats

- [x] **`features/dashboard/lib/metrics.ts`** — the pure metric bundle: `enrichTrades()` (chronological
      sort + account-wide `index` / `balanceAfter` / UTC hour/weekday/dayKey / hold time) and
      `calculateMetrics()` (equity curve, win rate, gross/net, profit factor, best/worst, avg win/loss,
      R:R, long/short splits, streaks, max drawdown, weekday/hour/daily aggregates, per-asset rollups,
      best/worst hour & weekday) + `drawdownRecovery()`. **Verified** by `scripts/verify-metrics.ts`
      (`npx tsx`): 43 checks green, incl. the design's $1,166.40 / 50.00% / 1.53 and every bucket
      reconciling to net 166.40.
- [x] **`lib/filters.ts` + `stores/filters.store.ts`** — pure `filterTrades()` / `presetFilters()` /
      `tradeDateRange()` / `tradeSymbols()`, plus the Zustand store (patching a control clears the
      active chip; presets always rebuild from a clean slate). Covered by the same verification script.
- [x] **`api/{accounts,trades}.service.ts`** — typed services over the shared axios instance,
      unwrapping the `{ success, message, data }` envelope. `getActiveAccount()` returns the first
      account (the design has no switcher).
- [x] **Overview cockpit** — `Overview` panel (via `Panel`'s two-column `aside` layout):
      `AccountStrip` (Current Balance / Net Profit / Max Drawdown / Profit Factor) + `MarketBoard`
      (Win Rate / Average Trade / Best / Worst). Fed by `useCockpit()`, which derives the filtered set
      and its metrics once for every panel. **Verified in a browser:** $1,166.40 · $166.40 · 17.99% ·
      1.53 · $9.24 · $91.54 · −$75.66, zero console errors.
- [x] **Core stats grid** — all **27** cards (`components/stats/Stats.tsx` + `lib/stat-rows.ts`),
      coloured by sign / metric family via `statTone()` (the design's `colorClass`, ported).
      Built on the shared `Tile` (`components/Tile.tsx`), which `MarketBoard` was refactored onto so
      the two tile styles cannot drift. **Verified in a browser:** 27/27 cards, every value matching
      the metric bundle and every tone correct (drawdown red at +17.99%, streaks purple vs red,
      ratios blue); zero console errors.

---

## Phase 4 — Charts (recharts)

- [ ] `shared/config/chart-theme.ts` — token-driven defaults (grid stroke, tick fill, tooltip
      surface, money formatter) so all seven charts read one source.
- [ ] Seven charts, each `"use client"` + dynamic-imported (`ssr:false`) inside a fixed-height Panel
      body (`ResponsiveContainer` collapses to zero in an auto-height box): equity curve
      (`AreaChart` + gradient), daily / weekday / hourly P&L (`BarChart` + per-bar `<Cell>` for signed
      colour), asset performance (`BarChart layout="vertical"`), long-vs-short (`BarChart`), win/loss
      (`PieChart` + `innerRadius` donut). Colours are `var(--color-*)` — no JS palette copy.

---

## Phase 5 — Filters, Insights, Leaderboard, Calendar & Trades Table

- [ ] Filter bar (search + asset/direction/result selects + date range + min/max P&L + sort) + quick
      presets (All / Today / Last 7 Days / Winners / Losses / Liquidations); every panel recomputes off
      the filtered set.
- [ ] Risk & edge insight cards + per-symbol asset leaderboard (proportional bars).
- [ ] Monthly calendar heatmap (P&L intensity).
- [ ] Trades table (shadcn `Table`): sticky header, side/result badges, signed P&L + running balance,
      Load More paging, live count, horizontal scroll on mobile.

---

## Phase 6 — Export, Summary & Accent Theme

- [ ] Export CSV of the filtered set (client-side `Blob` download).
- [ ] Copy Summary (plain-text performance summary of the active view) via clipboard + toast.
- [ ] Accent-theme switcher (green/violet/gold) writing `body[data-accent]`, persisted.

---

## Phase 7 — Polish

- [ ] Responsive pass across mobile, tablet, desktop (sidebar collapse, grid reflow, table/chart scroll).
- [ ] Loading / empty / error states for each panel (see ui-rules.md → States).
- [ ] Toasts for add/save/delete/import/export; confirm-before-delete everywhere.
- [ ] Accessibility pass: labels, focus states, keyboard nav, reduced-motion.
- [ ] Metadata / favicon / OG; final visual consistency pass against the design.

---

## Phase Summary

| Phase                                   | Status        |
| --------------------------------------- | ------------- |
| 0 — Foundation                          | **Done** — scaffold, schema, Swagger, dark theme tokens + Inter |
| 1 — Trading Accounts                    | DB, seed, and the `accounts` + `trades` GET endpoints done; frontend slice not started |
| 2 — Trades                              | Not started   |
| 3 — Metrics, Overview & Stats           | Not started   |
| 4 — Charts (recharts)                   | Not started   |
| 5 — Filters, Insights, Calendar, Table  | Not started   |
| 6 — Export, Summary & Accent Theme      | Not started   |
| 7 — Polish                              | Not started   |
