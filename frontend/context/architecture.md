# Architecture

Trade Journal is a **full-stack, single-user** application in two deployables. The frontend renders
the UI and talks **only** to our own REST API; the backend owns validation and persistence. There is
**no authentication** anywhere in the system.

```
frontend/   → Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui + Chart.js
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
| Charts       | **Chart.js** (`react-chartjs-2`)       | Equity curve, P&L bars, doughnut — matches the design         |
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

The design computes every metric client-side from the trade array (`calculateMetrics`). We keep that
shape: a **pure, framework-free metrics module** (`features/dashboard/lib/metrics.ts`) takes the
active (filtered) trade set and returns the full metric bundle (totals, win rate, gross/net, profit
factor, best/worst, long/short splits, streaks, max drawdown, equity curve, weekday/hour/daily
aggregates, per-asset rollups, best/worst hour & weekday). The UI panels are pure functions of that
bundle, so overview, stats, charts, insights, leaderboard, heatmap, and the table all stay consistent.

- Filtering + sorting happen client-side over the fetched trade set (`getFilteredTrades`), then
  metrics recompute; the "active view" drives **every** panel.
- A backend `analytics` summary endpoint is **optional** (only if the trade set grows large enough
  that client compute is slow — a Layer-6 optimization to approve first, per code-standards.md). The
  default is client-side compute against `GET /api/trades`.

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
        ├── accounts/     → trading accounts: CRUD, active account      ← to build
        ├── trades/       → trades (account-scoped): CRUD + CSV import  ← to build
        └── health/       → health check                                ← built
```

**Today `health` is the only feature module** (plus `prisma`, `config`, and the `common` filters +
response interceptor). `accounts` and `trades` are **still to be built**.

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
│   ├── globals.css         → Tailwind entry + imports theme.css + the app background grid
│   ├── page.tsx            → "/" → redirects to /dashboard
│   └── (app)/              → the app shell (sidebar + main); no guard
│       ├── layout.tsx      → renders the AppShell (sidebar + topbar) — no session guard
│       ├── dashboard/page.tsx   → the trading-journal cockpit (the design)
│       └── settings/page.tsx    → account + preferences (starting balance, currency, accent)
│
├── features/               → one vertical slice per domain
│   ├── dashboard/          → the cockpit: overview, filters, stats, charts, insights,
│   │                         leaderboard, calendar heatmap, trades table + lib/metrics.ts
│   ├── accounts/           → account CRUD + active-account store
│   └── settings/           → account settings + accent preference
│       each slice may carry: components/ · lib/ · constants.ts · stores/ · schemas/ · api/ · types/
│
└── shared/
    ├── components/ui/      → shadcn/ui primitives
    ├── components/         → AppShell.tsx (sidebar + topbar; no session guard, no user menu),
    │                         Sidebar/Topbar + GlobalHosts (Toaster + ConfirmDialog)
    ├── config/             → sidebar navigation config, chart theme defaults
    ├── constants/          → route paths, enum labels (sides, statuses, presets)
    ├── lib/                → axios.config.ts, utils.ts (cn), format (currency/date), csv
    ├── stores/             → confirm.store, active-account, filter, theme-accent store (Zustand)
    ├── types/
    └── styles/theme.css    → design tokens (see ui-tokens.md)
```

### Import aliases (`frontend/tsconfig.json`)

```jsonc
"@/*": ["./src/*"]  ·  "@app/*"  ·  "@features/*"  ·  "@shared/*"  ·  "@components/*": ["./src/shared/components/*"]  ·  "@lib/*": ["./src/shared/lib/*"]
```

Use these — never deep relative imports. `cn` from `@lib/utils`; primitives from `@components/ui/*`;
the shared axios instance from `@lib/axios.config`.

---

## Rendering & Data Flow

- **Server Components by default.** A component becomes a Client Component (`"use client"`) only when
  it needs interactivity — forms, filters, anything reading a Zustand store, and **every Chart.js
  chart** (canvas + charts are client-only). Push the boundary as low as possible: the dashboard page
  is a Server shell composing panels; the interactive filter bar, the charts, the table controls, and
  the accent switcher are the client leaves.
- **Chart.js charts are dynamically imported** (`next/dynamic`, `ssr: false`) — the library is heavy
  and canvas needs the browser. Keep them out of first paint.
- **All reads/writes go through the shared axios instance** (`@lib/axios.config`) to feature
  **services** (`features/*/api/*.service.ts`). The instance is now plain — `baseURL` plus a minimal
  403/5xx logger. There is **no 401-refresh flow, no `withCredentials`, and no login redirect**.
- **Metrics are derived client-side** from the fetched trade set via `features/dashboard/lib/metrics.ts`;
  filters/sort live in a store or local state and drive a single `renderDashboard`-equivalent recompute.

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
  hand-rolled components shadcn provides (panel/tile/badge composites and Chart.js charts are the
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
