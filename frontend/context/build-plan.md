# Build Plan

A plan for **Trade Journal** — a single-user trading-journal analytics dashboard. Two deployables:
`frontend/` (Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + Chart.js) and `backend/` (NestJS +
Prisma + PostgreSQL). Mark items `[x]` as they land and keep progress-tracker.md in sync.

The reference build is `context/designs/website.index.html`.

## Core Principle

Build **vertical slices, back to front**. For each feature: define the Prisma model + NestJS module +
DTOs (user-scoped), expose the endpoint, then build the frontend service + UI against it and verify
the whole slice end to end. Auth + per-user ownership come first because every other slice is
per-user. Analytics are **derived on the client** from the raw trade set (`lib/metrics.ts`) — the API
returns raw trades, not computed metrics.

The API is the source of truth; no mock data layer stands in for it. Where UI must render before its
endpoint exists, stub the service behind a typed interface and replace it when the endpoint lands.

> **Honesty note:** the underlying repo code today is still the **copied hospital scaffold**
> (multi-tenant `Hospital`/`Patient`/... Prisma schema, hospital auth service). Phase 0 below rewrote
> the **context docs** to the trading domain; the code changes (theme repoint, schema strip to
> per-user, removing hospital modules/UI) are **still pending**. Items are only ticked when the code
> actually lands.

---

## Phase 0 — Context & Theme Pivot (current)

- [x] **Context docs rewritten to Trade Journal** — project-overview, architecture, ui-tokens,
      ui-rules, ui-registry, code-standards, library-docs, build-plan, progress-tracker, and the
      engineering logs now describe the trading-journal dashboard from the design.
- [ ] **Repoint `theme.css` to the dark trading tokens** — dark surface ramp (`#05070b`/`#0b1018`/…),
      green/teal `primary` (switchable green/violet/gold via `data-accent`), blue/gold/purple accents,
      **green-up / red-down** P&L tokens, 8px radius, `shadow-panel`, the app background grid.
- [ ] **Fonts → Inter only** — remove Playfair Display / any display font from the root layout + tokens.
- [ ] **Remove the legacy hospital/landing UI** (landing sections, hospital dashboard/settings
      composites) and repair the app shell so the build stays green.
- [ ] Verify `npm run build` clean on the pivoted theme + shell.

---

## Phase 1 — Authentication & Per-user Ownership (everything else depends on this)

- [~] Backend `auth` module: **2-step email-OTP signup**, login (bcryptjs), JWT issue/verify
      (httpOnly cookies), logout, `/auth/me` — **exists in the scaffold** (currently provisions a
      hospital org; strip to a single `User`).
- [ ] **Strip multi-tenancy → per-user**: signup creates a single `User` (no `Hospital`/tenant); the
      JWT payload carries only `sub` (userId); remove `hospitalId` from the schema and queries.
- [ ] Add **`POST /auth/refresh`** (refresh-token rotation) — the known missing endpoint.
- [ ] Frontend `(auth)` pages rebranded (login + signup wizard) on the dark theme.
- [ ] `(app)` layout guards the session; unauthenticated users redirect to `/login`.
- [ ] Verified: signup → OTP email → verify → `User` created → session; login/wrong-password; guard.

---

## Phase 2 — Trading Accounts

- [ ] Backend `accounts` module (user-scoped): `TradingAccount` model + migration; CRUD; active account.
- [ ] Frontend `accounts` slice + `settings` page: create/edit account (label, account number,
      starting balance, currency); active-account store; sidebar account card wired to the active one.

---

## Phase 3 — Trades

- [ ] Backend `trades` module (user + account scoped): `Trade` model + migration (`TradeSide` /
      `TradeStatus` enums); CRUD; **CSV import** (validate rows, dedupe on `ticket`, idempotent).
- [ ] Frontend `trades.service` + add/edit/delete trade forms (RHF + Zod) + CSV import; confirm-before-delete.

---

## Phase 4 — Metrics, Overview & Stats

- [ ] `features/dashboard/lib/metrics.ts` — pure metric bundle from the trade set (running balance,
      equity curve, win rate, gross/net, profit factor, best/worst, long/short splits, streaks, max
      drawdown, weekday/hour/daily aggregates, per-asset rollups, best/worst hour & weekday).
- [ ] Overview cockpit: sidebar account card + account-strip (balance/net/drawdown/profit factor) +
      market board (win rate/avg trade/best/worst).
- [ ] Core stats grid (~27 stat cards), colored by sign / metric family.

---

## Phase 5 — Charts (Chart.js)

- [ ] `shared/config/chart-theme.ts` (token-driven defaults) + registration module.
- [ ] Seven charts (dynamic-imported, `ssr:false`): equity curve, daily P&L, weekday, hourly, asset,
      long-vs-short, win/loss doughnut — colors read from tokens (green-up/red-down, brand/blue series).

---

## Phase 6 — Filters, Insights, Leaderboard, Calendar & Trades Table

- [ ] Filter bar (search + asset/direction/result selects + date range + min/max P&L + sort) + quick
      presets (All / Today / Last 7 Days / Winners / Losses / Liquidations); every panel recomputes off
      the filtered set.
- [ ] Risk & edge insight cards + per-symbol asset leaderboard (proportional bars).
- [ ] Monthly calendar heatmap (P&L intensity).
- [ ] Trades table (shadcn `Table`): sticky header, side/result badges, signed P&L + running balance,
      Load More paging, live count, horizontal scroll on mobile.

---

## Phase 7 — Export, Summary & Accent Theme

- [ ] Export CSV of the filtered set (client-side `Blob` download).
- [ ] Copy Summary (plain-text performance summary of the active view) via clipboard + toast.
- [ ] Accent-theme switcher (green/violet/gold) writing `body[data-accent]`, persisted.

---

## Phase 8 — Polish

- [ ] Responsive pass across mobile, tablet, desktop (sidebar collapse, grid reflow, table/chart scroll).
- [ ] Loading / empty / error states for each panel (see ui-rules.md → States).
- [ ] Toasts for add/save/delete/import/export; confirm-before-delete everywhere.
- [ ] Accessibility pass: labels, focus states, keyboard nav, reduced-motion.
- [ ] Metadata / favicon / OG; final visual consistency pass against the design.

---

## Phase Summary

| Phase                                   | Status        |
| --------------------------------------- | ------------- |
| 0 — Context & Theme Pivot               | Docs done; theme/fonts repoint + hospital-UI removal pending |
| 1 — Auth & Per-user Ownership           | Auth scaffold exists (hospital-flavored); strip to per-user + `/auth/refresh` + guard pending |
| 2 — Trading Accounts                    | Not started   |
| 3 — Trades                              | Not started   |
| 4 — Metrics, Overview & Stats           | Not started   |
| 5 — Charts (Chart.js)                   | Not started   |
| 6 — Filters, Insights, Calendar, Table  | Not started   |
| 7 — Export, Summary & Accent Theme      | Not started   |
| 8 — Polish                              | Not started   |
