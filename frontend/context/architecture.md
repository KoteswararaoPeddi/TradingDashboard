# Architecture

Trade Journal is a **full-stack, single-user** application in two deployables. The frontend renders
the UI and talks **only** to our own REST API; the backend owns validation and persistence. There is
**no authentication** anywhere in the system.

```
frontend/   → Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui + recharts
backend/    → NestJS + Prisma + PostgreSQL  (open REST API under /api, no auth)
```

The browser never sees the database or any secret/API key. All analytics are computed from your own
trade data — there is **no AI, no ML, and no third-party market data** in the product.

---

## Stack

### Frontend

| Layer        | Tool                                   | Purpose                                                       |
| ------------ | -------------------------------------- | ------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router)                | Routing, rendering, route groups                              |
| UI runtime   | React 19                               | Component model                                               |
| Language     | TypeScript (strict)                    | Throughout                                                    |
| Styling      | Tailwind CSS v4 + tw-animate-css       | Utility styling and animation (no hand-written CSS files)     |
| Components   | shadcn/ui (Radix + Base UI)            | Accessible UI primitives in `src/shared/components/ui`        |
| Charts       | **recharts**                           | Equity curve, P&L bars, donut. SVG, so charts read colour tokens directly |
| Icons        | lucide-react                           | Icon set                                                      |
| Fonts        | `next/font/google` — Inter             | Inter base (`--font-inter`); no display/serif font           |
| HTTP         | axios (shared instance)                | All API calls; a minimal 403/5xx logger in the interceptor    |
| Forms        | React Hook Form + Zod                  | Add/edit trade, account settings, filters                     |
| Client state | Zustand                                | Cross-cutting client state (active-account, filters, accent)  |

### Backend

| Layer        | Tool                                   | Purpose                                                       |
| ------------ | -------------------------------------- | ------------------------------------------------------------- |
| Framework    | NestJS                                 | Modular REST API; controllers thin, services hold logic       |
| ORM          | Prisma                                 | Typed DB access + migrations                                  |
| Database     | PostgreSQL                             | Trading accounts, trades                                      |
| Auth         | **none**                               | No auth library, no sessions, no user identity                |
| Validation   | class-validator / class-transformer    | Request DTO validation + boot-time env validation             |
| API docs     | `@nestjs/swagger`                      | Interactive OpenAPI docs at `/api/docs` — how endpoints get tested by hand |
| Security     | helmet + `@nestjs/throttler`           | Security headers; basic rate limiting                         |
| Logging      | nestjs-pino (pino)                     | Structured request logging via a `LoggingInterceptor`         |

> **No AI in this product.** There is no AI provider, no market-data feed, and no order execution.
> The dashboard's numbers are derived from your own trade log.

---

## Single-user, no auth

Trade Journal is a **personal, single-user** app. There is **no authentication, no user identity, and
no ownership scoping** — no login, signup, email OTP, JWT, or cookies. The data is simply "my accounts
and my trades"; queries scope by **`accountId`** where a read belongs to one account, and by nothing
else.

> **Security note:** because the API is unauthenticated, anyone who can reach it can read and write
> every trade. Trade Journal is intended for **local/personal use** and is **not safe to expose
> publicly as-is**. Putting it on the internet would require adding an auth layer first.

---

## Domain Model (Prisma / PostgreSQL)

Two models. There is no user identity in the system.

```
TradingAccount  id, label, accountNumber (unique), startingBalance, currency,
                createdAt, updatedAt, trades[]
Trade           id, accountId, symbol, side (TradeSide), size,
                entryPrice, exitPrice, grossPnl, netPnl, fees,
                openedAt, closedAt, ticket, status (TradeStatus),
                createdAt, account
                @@unique([accountId, ticket])   @@index([accountId, closedAt])
```

- `TradeSide` = `LONG | SHORT | LIQUIDATION`; `TradeStatus` = `OPEN | CLOSED` (enums).
- `@@unique([accountId, ticket])` keeps a broker-CSV re-import **idempotent**;
  `@@index([accountId, closedAt])` serves the per-account equity curve ordered by close time.
- `Trade` cascades from its `TradingAccount` — deleting an account removes its trades.
- **Analytics are derived, not stored.** Running balance, equity curve, drawdown, profit factor,
  streaks, and the per-asset / weekday / hour aggregates are **computed** from the trade set — the DB
  stores raw trades only. See "Analytics computation" below.

---

## Analytics computation (where the metrics come from)

**All metrics are computed server-side** *(2026-07-17 — moved from the client)*. The pure,
framework-free calculator lives in the backend (`modules/analytics/analytics.calculator.ts` +
`modules/trades/trades.logic.ts`); it takes the filtered, enriched trade set and returns the full
bundle (totals, win rate, gross/net, profit factor, best/worst, long/short splits, streaks, max
drawdown, equity curve, weekday/hour/daily **and monthly** aggregates, per-asset rollups, best/worst
hour & weekday). Per-row derivations belong to the server too: each trade row carries `pips`
(`|exit − entry|`) and `filledSize` (the filled half of the broker's `"req/fill"` pair), derived in
`trades.logic.enrichTrades`. `GET /api/analytics?<filters>` returns the bundle ready-to-render; the
frontend performs **no domain calculation**.

- **The client/server line is "must be correct everywhere" vs "only helps render."** Every P&L total
  and per-row figure is server-computed; the two things left on the client are *presentation only*: the
  calendar heatmap **tint** (maps a raw `value` → colour/alpha) and the calendar's per-row **"Week"
  subtotal** (a Monday-start, month-clipped grid row is a layout artifact, not a domain week, so its
  sum is a display rollup of already-fetched `dailyPnl`). The API never ships colours/opacities/widths.
  See engineering/backend.md → "Draw the client/server line…".

- **Filtering + sorting happen server-side**, driven by the same filter query params on both
  `GET /analytics` and `GET /trades`. The client only translates filter chips → query params
  (`features/dashboard/api/params.ts`) and renders what returns.
- The trades table is **server-paginated** (`GET /trades?page&limit&<filters>`), each row carrying its
  global `index` and running `balanceAfter` (computed over the whole account). Analytics is computed
  over the *whole* filtered set (not a page).
- **First paint** is server-rendered (loader fetches the unfiltered bundle + first page); each filter
  change triggers a client refetch, previous numbers dimmed until the new ones arrive.
- Correctness is pinned by the backend oracle `backend/test/analytics-oracle.ts` (~55 checks against
  the reference design — $1,166.40 / 50% / 1.53, plus the monthly rollup, pips, filled size and the
  `pips × size == |netPnl|` identity). `tsc`/`build` cannot catch a wrong formula; this can.

---

## Backend Folder Structure (production-grade, four layers)

A **modular monolith**: one deployable, strict module boundaries. Four top-level layers — `config/`,
`common/`, `prisma/`, and `modules/`. Feature modules live under `src/modules/`.

```
backend/
├── prisma/  (schema.prisma, migrations/, seed.ts)
└── src/
    ├── main.ts          → bootstrap: pipes, filters, interceptors, helmet, CORS, shutdown hooks
    ├── app.module.ts    → root: config + infra + all feature modules; global ThrottlerGuard only
    ├── config/          → typed, boot-validated configuration (app refuses to boot on bad env)
    ├── common/          → cross-cutting, domain-agnostic (filters, interceptors). Imports NOTHING from modules/.
    ├── prisma/          → PrismaService + PrismaModule (@Global)
    └── modules/         → one folder per domain
        ├── accounts/     → the journal's account: list, get one, settings PATCH   ← built
        ├── trades/       → trades: filtered + paginated list, full CRUD, logic    ← built
        ├── analytics/    → GET /analytics: the server-computed metric bundle      ← built
        └── health/       → health check                                           ← built
```

**All four feature modules exist** (plus `prisma`, `config`, and the `common` filters + response
interceptor). Trades are **user-entered**: `POST/PATCH/DELETE /api/trades` back the add/edit/delete
UI. `analytics` depends on `accounts` for the starting balance and reads trades via Prisma; its heavy
lifting is the pure `analytics.calculator` / `trades.logic` (framework-free, oracle-pinned).
`prisma/seed.ts` (`npm run seed`) still loads the reference dataset, but it is **opt-in** — the
`prisma.seed` hook was removed from `package.json`, so `migrate dev`/`reset` no longer auto-populate
a journal the user is about to fill themselves. CSV import remains a later phase.

**The account is a singleton, not a resource the user creates.** There is deliberately **no
`POST /api/accounts`**: this journal is single-user, so `AccountsService.onApplicationBootstrap`
guarantees exactly one account exists (balance `0`, `USD`). It exists only to carry the starting
balance the equity curve is measured from — the one number trades cannot supply. The only write is
`PATCH /api/accounts/:id`, which backs the **Settings** page. Consequently `accountId` is **optional**
on `POST /api/trades`: with one account, making the client pass an id would be ceremony that can only
be got wrong, so the service resolves it.

The only global guard is **`ThrottlerGuard`** (basic rate limiting), and every route is open.

> `analytics/` may be added later only if server-side aggregation is needed.

### Discipline (what keeps it production-grade)

- `common/` and `prisma/` **never import from `modules/`**. A module **never imports another
  module's internals** — only its **exported service** through the Nest module system.
- **Controllers are thin** — HTTP only: route, call service, return.
- **Services own logic and persistence** — scope account-owned queries by `accountId`, throw Nest
  exceptions; never return raw DB errors.
- **DTOs are the input contract** — every body is a validated class; `ValidationPipe({ whitelist:
  true })` strips undeclared properties. With no auth layer, DTO validation is the **only** guard on
  what enters the system — treat it as load-bearing.
- **Entities are the output contract** — class-transformer `@Exclude()`/`@Expose()` shapes responses.

---

## Frontend Folder Structure

Feature-based. Routing lives in `src/app` (thin route entries using route groups), feature UI lives
in `src/features/*`, cross-cutting UI/utilities live in `src/shared`.

```
frontend/src/
├── app/
│   ├── layout.tsx          → Root layout: metadata, Inter font, dark theme, GlobalHosts
│   ├── globals.css         → Tailwind entry + imports theme.css + the app background wash
│   ├── page.tsx            → "/" → redirects to /dashboard
│   └── (app)/              → the app shell (sidebar + main); no guard
│       ├── layout.tsx      → renders DashboardShell (sidebar + topbar) — no session guard
│       ├── dashboard/page.tsx   → the glance: balance hero + support strip + recent activity
│       ├── analytics/page.tsx   → the deep dive: 27 stat cards + seven charts + insights
│       ├── trades/page.tsx      → the trade ledger (filters + table)
│       └── calendar/page.tsx    → the monthly P&L heatmap
│                                  (settings is not built — see ui-registry.md)
│
├── features/               → one vertical slice per domain
│   └── dashboard/          → the cockpit: shell, overview, stats, charts, and (to come)
│                             filters, insights, leaderboard, heatmap, table + lib/metrics.ts
│       each slice may carry: components/ · lib/ · constants.ts · stores/ · schemas/ · api/ · types/
│
└── shared/
    ├── components/ui/      → shadcn/ui primitives
    ├── components/         → GlobalHosts (Toaster + ConfirmDialog), ConfirmDialog
    ├── config/             → app-nav.config.ts (destinations), chart-theme.ts
    ├── constants/          → routes.ts (route paths), enum labels (sides, statuses, presets)
    ├── lib/                → axios.config.ts, utils.ts (cn), format (currency/date), csv
    ├── stores/             → confirm.store, filter, theme-accent store (Zustand)
    ├── types/
    └── styles/theme.css    → design tokens (see ui-tokens.md)
```

> **The cockpit chrome lives in `features/dashboard/components/shell/`, not `shared/`.** It reads
> `dashboard.store` and `lib/metrics.ts` to render the account card, and `shared` may never import
> from `features`. The `(app)` layout renders it as the one client shell around server pages.

### Routing

Four pages, one shell. `shared/config/app-nav.config.ts` is the single source for destinations and
drives both the sidebar nav and the topbar title/subline.

| Route        | Job |
| ------------ | --- |
| `/dashboard` | The 30-second glance: where the account stands. |
| `/analytics` | The deep dive: every metric and chart. |
| `/trades`    | The trade ledger. |
| `/calendar`  | The monthly P&L heatmap. |

**Filters is a control, not a route.** It scopes each page's view and lives in the global filter
store, so it renders on Analytics / Trades / Calendar and appears nowhere in the nav.

### Import aliases (`frontend/tsconfig.json`)

```jsonc
"@/*": ["./src/*"]  ·  "@app/*"  ·  "@features/*"  ·  "@shared/*"  ·  "@components/*": ["./src/shared/components/*"]  ·  "@lib/*": ["./src/shared/lib/*"]
```

Use these — never deep relative imports. `cn` from `@lib/utils`; primitives from `@components/ui/*`;
the shared axios instance from `@lib/axios.config`.

---

## Rendering & Data Flow

- **Server Components by default.** A component becomes a Client Component (`"use client"`) only when
  it needs interactivity — forms, filters, anything reading a Zustand store, and **every recharts
  chart** (charts are client-only). Push the boundary as low as possible: each page is a Server
  component composing panels; the interactive filter bar, the charts, the table controls, the nav
  (it reads `usePathname`), and the accent switcher are the client leaves.
- **Charts are dynamically imported** (`next/dynamic`, `ssr: false`) — recharts is heavy
  and canvas needs the browser. Keep them out of first paint.
- **All reads/writes go through the shared axios instance** (`@lib/axios.config`) to feature
  **services** (`features/*/api/*.service.ts`). The instance is now plain — `baseURL` plus a minimal
  403/5xx logger. There is **no 401-refresh flow, no `withCredentials`, and no login redirect**.
- **The cockpit's data is fetched on the server.** `(app)/layout.tsx` awaits
  `features/dashboard/api/dashboard.loader.ts` and passes the payload to `DashboardProvider`, so the
  account + trade set arrive **with the HTML** and the browser makes **zero** API calls. Loading it in
  a client effect instead cost ~605ms of dead time before the first request even left the browser,
  with a skeleton on screen throughout. Fetching in the layout (not per page) loads it once for the
  whole route group.
  - The loader's two calls are **sequential on purpose**: trades are fetched by `accountId`, so the
    account must resolve first. That is the genuine data dependency Layer 4 sanctions — and
    server-side it costs local round trips rather than the user's network latency twice.
- **The server payload travels by React Context, not a module store.** `DashboardProvider` is the one
  source; `useCockpit()` reads it. A module-level zustand store **cannot** carry server-rendered data:
  `useSyncExternalStore`'s server snapshot does not observe a mutation made during the same render, so
  the HTML rendered empty ("No account") even with the payload present. Context also gives each
  request its own value, with no shared mutable state. **Filters stay in zustand** — client-only state
  that is never server-rendered.
- **Metrics are computed server-side** *(2026-07-17)* and fetched ready-to-render from `GET /analytics`
  via `useCockpit()`; the table is fetched server-paginated via `useTrades()`. Filters/sort live in a
  zustand store and drive a client refetch. The frontend performs no analytics of its own.

---

## Invariants

- The **frontend never** holds secrets or talks to the database directly.
- **No auth, no user identity.** Routes are open; account-owned reads/writes filter by `accountId`.
  Don't add an auth concept (user, session, guard, ownership check) without a deliberate decision —
  the open API is a **local/personal-use** trade-off, not an oversight.
- Frontend: `src/app/*` holds route entries only — compose feature components; no business logic in
  pages/layouts. A feature never imports another feature's internals; `shared` never imports from
  `features`/`app`.
- All cross-cutting frontend HTTP goes through the shared axios instance and feature services — never
  a bare `fetch`/`axios()` in a component.
- **UI is built with Tailwind utilities + tokens + shadcn primitives** — no hand-written CSS files, no
  hand-rolled components shadcn provides (panel/tile/badge composites and recharts charts are the
  legitimate custom builds; gradients/bar-widths via inline `style` with `var(--color-*)` are allowed).
- **Metrics come from one pure module** (`lib/metrics.ts`); every panel is a pure function of the
  metric bundle so the whole dashboard stays consistent with the active filter.
- Backend: one **module per domain** under `src/modules/`; controllers thin, services hold logic;
  every request body is a validated DTO. `common/`/`prisma/` never import from `modules/`.
- **Config is validated at boot**; read config via `ConfigService`, not `process.env`, in feature
  code. Backend env is only `NODE_ENV`, `DATABASE_URL`, `CORS_ORIGIN`, `PORT`; the frontend's is only
  `NEXT_PUBLIC_API_URL`. The single global guard is `ThrottlerGuard`.
- **Dark theme**, **green/teal brand** (switchable green/violet/gold), **Inter** font, **green-up /
  red-down** P&L color — every surface uses semantic tokens. No hardcoded hex or raw Tailwind color
  classes in components.
