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
      The app background wash lives in `globals.css`, also token-driven (its 42px grid was removed
      2026-07-17).
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
      `--up`/`--down` resolve and paint. *(Superseded in Phase 2: a settings page now exists, because
      the seed became opt-in and the starting balance needs a home in the UI.)*

---

## Phase 2 — Trades

- [~] Backend `trades` module (account-scoped): **CRUD done** — `POST/PATCH/DELETE /api/trades`,
      `CreateTradeDto`/`UpdateTradeDto` (class-validator), P2002 → 409 and unknown account → 404 via
      the existing filters. `accountId` is **optional**: the service resolves the singleton account,
      so the client never handles an id. **CSV import not started** (validate rows, dedupe on
      `ticket` via `@@unique([accountId, ticket])`, idempotent).
- [~] Frontend `trades.service` + **add/edit/delete trade forms done** (`TradeFormDialog`, RHF + Zod
      mirroring the DTO) + confirm-before-delete via the `confirm()` store; two empty states
      (no trades at all vs. no filter matches). **CSV import not started.**
- [x] Settings page (`/settings`) — edits `startingBalance`/`currency` via `PATCH /api/accounts/:id`.
      Added beyond the original plan: the seed is now opt-in, so the starting balance the equity curve
      is measured from needs a home in the UI. Supersedes the "no settings page" note in Phase 1.
- [x] Seed made **opt-in** — `prisma.seed` hook removed from `backend/package.json`; `npm run seed`
      still loads the reference dataset on demand.

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

- [x] `shared/config/chart-theme.ts` — token-driven defaults (grid stroke, tick fill, tooltip
      surface, money formatter) so all seven charts read one source.
- [x] Seven charts, each `"use client"` + dynamic-imported (`ssr:false`) inside a fixed-height Panel
      body (`ResponsiveContainer` collapses to zero in an auto-height box): equity curve
      (`AreaChart` + gradient), daily / weekday / hourly P&L (`BarChart` + per-bar `<Cell>` for signed
      colour), asset performance (`BarChart layout="vertical"`), long-vs-short (`BarChart`), win/loss
      (`PieChart` + `innerRadius` donut). Colours are `var(--color-*)` — no JS palette copy.
      **Verified in a browser:** all seven render, 10 recharts surfaces, zero console errors.
- [~] **Known chart defects, not yet fixed:**
  - Equity curve Y axis anchors at `0` (recharts' `YAxis` default is `[0, dataMax]`), so a
    $900–$1,200 history renders as a flat line in the top fifth of the panel. The reference design's
    Chart.js scale auto-fits; ours does not. Needs `domain={["auto","auto"]}`.
  - The compact money formatter renders **two identical `$1.1K` ticks** (1,050 and 1,100 both round
    to one significant decimal). Axis ticks must be distinct.
  - Asset Performance degenerates to one giant block on a single-symbol account; Long vs Short
    reserves an empty Liquidation category; the Win/Loss donut legend lists Breakeven at zero.

---

## Phase 4.5 — Multi-page redesign *(inserted; not in the original plan)*

The cockpit moved from **one long anchored page** to **four routes**, and the Overview was redesigned
around the daily 30-second check. See "Beyond-plan work" below for the full record.

- [x] `shared/constants/routes.ts` + `shared/config/app-nav.config.ts` — one source for destinations,
      driving the sidebar nav **and** the topbar title/subline.
- [x] `MainNav` (route nav, `usePathname`, `aria-current="page"`) replaces `SectionNav`; the
      `IntersectionObserver` and `constants/sections.ts` are deleted.
- [x] Routes `/dashboard`, `/analytics`, `/trades`, `/calendar` + their thin page entries.
- [x] Overview redesigned: `AccountHero` (balance + signed delta) over a 6-cell `AccountStrip`;
      `MarketBoard` removed; the panel's two-column void removed by construction.
- [x] Topbar title demoted from a 56px account name to a page label at `h2`.
- [x] **Redesigned against the reference builds** (`context/designs/app.tradefxbook.com_*.png`):
      lucide icons + tinted active pill in the nav (replacing `01`/`02` markers); `Tile` rebuilt with
      an optional tinted icon plate and the accent bar removed; `AccountStrip`'s six hairline cells
      replaced by `KpiRow`'s four icon cards; `EquitySpark` beside the balance; `RecentTrades` on the
      glance (shadcn `Table`); account card moved from the sidebar's bottom to under the brand.
- [~] **Token rebuild — partial.** `--radius` 8px → 12px landed (whole derived family moved with it).
      **The type-scale and elevation edits did not persist** — `theme.css` still holds the original
      52/48/35/29 scale and the single `0 18px 45px` shadow. Both remain open:
  - Type scale has unusable steps: `display-xl` (48) sits 4px under `display-2xl` (52), and
    `h5`/`label-lg`/`body-base` are all 14px.
  - One shadow serves panels, cards, dialogs and toasts alike, so a resting panel and a modal claim
    the same elevation.
- [x] **Filters as a persistent control** — `FilterChips` (time period × result, two orthogonal axes)
      renders on Analytics, Trades and Calendar. New pure helpers `periodRange` / `activePeriod` /
      `activeResult` in `lib/filters.ts`. **Verified in a browser:** 18 → Winners 9 → +7 days 4, both
      chips still active; `verify-metrics.ts` still green.
- [x] **`/analytics` reference pass** — `AnalyticsKpis` (4 icon cards: Total P&L, Win Rate, Profit
      Factor, Expectancy) leads the page so the 27-card grid reads as detail rather than 27 equal
      facts. Page order is scope → headline → detail.
- [x] **`/trades` reference pass** — `TradesTable`: 8 columns (Open/close, Symbol, Type, Entry, Exit,
      Size, P&L, Balance), `tabular-nums`, hover rows, signed P&L + running balance, **Load more**
      (24-row step), live count, and an empty state carrying `Clear filters`.
- [~] Roll the reference language across the calendar heatmap and insights + leaderboard. **Calendar
      done, and now has a real reference**: the user supplied the TradeFXBook "Monthly P&L" screen
      *(2026-07-17)*, which the redesign follows (Monday-first, weekly column, month nav, today
      marker) and deliberately departs from where it is weaker (written-out weekday heads, P&L
      intensity, trade counts). Note `designs/website.index.html` — the wireframe every doc cites — is
      **no longer in the repo**, and the three saved `app.tradefxbook.com_*.png` builds cover only
      dashboard / trades / analysis. Insights + leaderboard remain.

---

## Phase 5 — Filters, Insights, Leaderboard, Calendar & Trades Table

- [~] **Filters — chips done, full bar not.** `FilterChips` (time period × result) ships and every
      panel recomputes off the filtered set. **Still missing:** search, asset/direction selects,
      explicit from/to date inputs, min/max P&L, and sort. The store and `filterTrades` already
      support all of them; only the UI is absent.
- [ ] Risk & edge insight cards + per-symbol asset leaderboard (proportional bars).
- [x] **Calendar heatmap** — `CalendarHeatmap` + pure `lib/calendar.ts`, built then **redesigned the
      same day** against the TradeFXBook "Monthly P&L" reference the user supplied (the first calendar
      reference this project has had). Month → weeks → days, **Monday-first**, with a **weekly totals
      column**, a **month nav that pages within the filtered range** (the chips still own scope), a
      today marker, and day cells carrying P&L + trade count. Four day states (no trades / breakeven /
      out-of-window / signed), tint alpha linear on `|day P&L| / max |day P&L|` via `color-mix` on the
      up/down tokens, `overflow-x-auto` + `min-w-215`.
      **Verified:** `scripts/verify-calendar.ts` (26 checks) + browser at 1440/900/600 — July 2026
      starts under Wed with 2 leading blanks, weeks read `+$46.1 (3 days)` / `+$120.3 (2 days)`,
      Winners re-tints to `+$481.89`, 7 days nets `+$36.57` and flips that week to `-$83.7`, zero
      console errors.
- [x] **Trades table** (shadcn `Table`): hover rows, signed P&L + running balance, **pagination at 50
      rows/page**, live count, horizontal scroll on mobile, empty state with `Clear filters`.
      **Not yet:** `SideBadge`/`ResultBadge` pills — side renders as coloured text for now.
  - [x] **Pagination, 50/page** *(2026-07-17, replaced `Load more`)* — shadcn `pagination` primitive
        CLI-installed; maths in the pure `lib/pagination.ts` (`pageSlice` clamps, `pageWindow` gives
        `1 … 12 13 14 … 26`). Client-side by decision: the backend stays calculation-free, which a
        benchmark supports (0.4ms per recompute at 19 trades, 22.7ms at 10k, 117ms at 50k).
        **Verified:** 24 logic checks + a 120-trade mock API driven in a browser — 3 pages,
        `Showing 101–120 of 120`, partial last page, next disabled at the end, and a filter change
        returning to page 1. **On the real 19-trade journal it is a single page, so no page buttons
        render** (as `Load more` never did at STEP 24).
  - [x] **Pips column** *(2026-07-17, beyond plan)* — added after Exit in the shared
        `trade-columns.tsx`, so **both** tables carry it. Raw `|exit - entry|` from
        `lib/trade-fields.ts`: unscaled, unsigned, untinted, `—` on a missing fill. Table min-width
        `min-w-200` → `min-w-220` for the 9th column.
  - [x] **Size shows one value** *(2026-07-17, beyond plan)* — `filledSize()` renders the filled half
        of the broker's `"requested/filled"` pair (`0.25/0.25` → `0.25`), which is the size P&L is
        computed from.
  - **Verified (both):** `scripts/verify-pips.ts` — 25 checks, incl. the identity
        `pips x filledSize == |netPnl|` across all 18 seed rows (fees are zero, so it must hold and
        breaks instantly on any inversion or scaling) — plus every rendered row re-derived from the
        DOM's own Entry/Exit text, and no `/` left in any Size cell.

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
| 1 — Trading Accounts                    | **Done** — DB, seed, `accounts` + `trades` GET endpoints, cockpit shell |
| 2 — Trades                              | **Partial** — trade CRUD (API + UI) and the Settings page are done; **CSV import not started** |
| 3 — Metrics, Overview & Stats           | **Done** — metrics module, filters/store, services, Overview, 27 stat cards |
| 4 — Charts (recharts)                   | **Built** — all seven render; three known defects open (see Phase 4) |
| 4.5 — Multi-page redesign               | **In progress** — routes + nav + Overview done; token rebuild and Filters open |
| 5 — Filters, Insights, Calendar, Table  | **Partial** — trades table + calendar heatmap done; filter chips partial; insights + leaderboard not started |
| 6 — Export, Summary & Accent Theme      | Not started — `AccentSwitcher` exists; Export CSV / Copy Summary do not |
| 7 — Polish                              | Not started   |

---

## Beyond-plan work

- **[x] Server-side analytics migration** *(2026-07-17)* — moved all metrics + filtering + pagination
  from the client to the backend (`GET /analytics`, paginated `GET /trades`). Frontend is now a pure
  display layer: `metrics.ts` and the data-crunching half of `filters.ts` deleted; `useCockpit`/
  `useTrades` fetch from the API. Backend calculator is a verbatim port of the old `metrics.ts`, pinned
  by `backend/test/analytics-oracle.ts` (43 checks, green live). Supersedes Phase 3's "metrics module"
  (client) and the architecture note that a server analytics endpoint was "optional".
- **[~] Money Float→Decimal** — Prisma client is `Decimal`, `schema.prisma` still `Float`; coerced at
  the DB boundary (`common/money.ts`). **Open:** reconcile schema vs client (owner decision).
