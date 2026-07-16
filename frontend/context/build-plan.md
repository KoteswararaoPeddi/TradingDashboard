# Build Plan

A plan for **Trade Journal** — a single-user trading-journal analytics dashboard. Two deployables:
`frontend/` (Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + Chart.js) and `backend/` (NestJS +
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
- [ ] **Repoint `theme.css` to the dark trading tokens** — dark surface ramp (`#05070b`/`#0b1018`/…),
      green/teal `primary` (switchable green/violet/gold via `data-accent`), blue/gold/purple accents,
      **green-up / red-down** P&L tokens, 8px radius, `shadow-panel`, the app background grid.
- [ ] **Fonts → Inter only** — Inter via `next/font/google` wired to `--font-sans`; no display or
      serif font.

---

## Phase 1 — Trading Accounts (the first real slice)

- [x] **Database + init migration** — a dedicated `trade_journal` PostgreSQL database, with
      `backend/.env` pointing at it; migration `20260716091717_init` applied, creating
      `trading_accounts` + `trades`, the `TradeSide`/`TradeStatus` enums, and both indexes
      (`@@unique([accountId, ticket])`, `@@index([accountId, closedAt])`).
- [ ] Backend `accounts` module: CRUD over `TradingAccount`; active account.
- [ ] Frontend `accounts` slice + `settings` page: create/edit account (label, account number,
      starting balance, currency); active-account store; sidebar account card wired to the active one.

---

## Phase 2 — Trades

- [ ] Backend `trades` module (account-scoped): CRUD; **CSV import** (validate rows, dedupe on
      `ticket` via `@@unique([accountId, ticket])`, idempotent).
- [ ] Frontend `trades.service` + add/edit/delete trade forms (RHF + Zod) + CSV import; confirm-before-delete.

---

## Phase 3 — Metrics, Overview & Stats

- [ ] `features/dashboard/lib/metrics.ts` — pure metric bundle from the trade set (running balance,
      equity curve, win rate, gross/net, profit factor, best/worst, long/short splits, streaks, max
      drawdown, weekday/hour/daily aggregates, per-asset rollups, best/worst hour & weekday).
- [ ] Overview cockpit: sidebar account card + account-strip (balance/net/drawdown/profit factor) +
      market board (win rate/avg trade/best/worst).
- [ ] Core stats grid (~27 stat cards), colored by sign / metric family.

---

## Phase 4 — Charts (Chart.js)

- [ ] `shared/config/chart-theme.ts` (token-driven defaults) + registration module.
- [ ] Seven charts (dynamic-imported, `ssr:false`): equity curve, daily P&L, weekday, hourly, asset,
      long-vs-short, win/loss doughnut — colors read from tokens (green-up/red-down, brand/blue series).

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
| 0 — Foundation                          | Scaffold + schema done; theme.css/fonts repoint pending |
| 1 — Trading Accounts                    | DB + init migration done; `accounts` module + UI not started |
| 2 — Trades                              | Not started   |
| 3 — Metrics, Overview & Stats           | Not started   |
| 4 — Charts (Chart.js)                   | Not started   |
| 5 — Filters, Insights, Calendar, Table  | Not started   |
| 6 — Export, Summary & Accent Theme      | Not started   |
| 7 — Polish                              | Not started   |
