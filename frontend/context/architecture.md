# Architecture

Trade Journal is a **full-stack, single-user-owned** application in two deployables. The frontend
renders the UI and talks **only** to our own REST API; the backend owns authentication, per-user data
ownership, and persistence.

```
frontend/   → Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui + Chart.js
backend/    → NestJS + Prisma + PostgreSQL  (REST API under /api, JWT auth, per-user ownership)
```

The browser never sees the database or any secret/API key. All analytics are computed from the
user's own trade data — there is **no AI, no ML, and no third-party market data** in the product.

> **Migration note:** the `frontend/` started as a copied scaffold from a hospital-management SaaS.
> That domain is being removed; the trading-journal domain replaces it. Retained scaffolding (auth,
> app shell, shared UI, NestJS bootstrap) is rebranded. The backend domain model below is the
> **target** for Trade Journal.

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
| HTTP         | axios (shared instance)                | All API calls; JWT + 401-refresh handled by the interceptor  |
| Forms        | React Hook Form + Zod                  | Add/edit trade, account settings, filters, auth              |
| Client state | Zustand                                | Cross-cutting client state (`auth.store`, active-account, filters) |

### Backend

| Layer        | Tool                                   | Purpose                                                       |
| ------------ | -------------------------------------- | ------------------------------------------------------------- |
| Framework    | NestJS                                 | Modular REST API; controllers thin, services hold logic       |
| ORM          | Prisma                                 | Typed DB access + migrations                                  |
| Database     | PostgreSQL                             | Users, trading accounts, trades                               |
| Auth         | Passport JWT + bcryptjs                | JWT sessions (HTTP-only cookies); password hashing            |
| Validation   | class-validator / class-transformer    | Request DTO validation + boot-time env validation             |
| Security     | helmet + `@nestjs/throttler`           | Security headers; rate limiting (esp. `/auth`)               |
| Logging      | nestjs-pino (pino)                     | Structured request logging via a `LoggingInterceptor`         |
| Mail         | nodemailer (Gmail SMTP)                | Sign-up email OTP delivery                                    |

> **No AI in this product.** There is no AI provider, no market-data feed, and no order execution.
> The dashboard's numbers are derived from the user's own trade log.

---

## Data ownership (per user)

Trade Journal is **single-user-owned**, not multi-tenant. Every user owns their own trading accounts
and trades, and **every data-bearing query is scoped to the authenticated `userId`** (and `accountId`
for account-scoped reads). The `userId` is derived from the verified JWT/session on the server —
**never trusted from the client**. No query may read or write another user's data.

---

## Domain Model (Prisma / PostgreSQL) — target

```
User            id, email (unique), passwordHash, name, createdAt
TradingAccount  id, userId, label, accountNumber (unique per user),
                startingBalance, currency, createdAt                      ← owned by a user
Trade           id, userId, accountId, symbol, side (TradeSide),
                size, entryPrice, exitPrice, grossPnl, netPnl, fees,
                openedAt, closedAt, ticket, status (TradeStatus), createdAt
```

- `TradeSide` = `LONG | SHORT | LIQUIDATION`; `TradeStatus` = `OPEN | CLOSED` (enums).
- **Never select or return `passwordHash`.** Every `Trade`/`TradingAccount` row is scoped to `userId`
  (+ `accountId` where account-owned). A user's trades are never visible to another user.
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
    ├── app.module.ts    → root: config + infra + all feature modules
    ├── config/          → typed, boot-validated configuration (app refuses to boot on bad env)
    ├── common/          → cross-cutting, domain-agnostic (decorators, filters, interceptors, guards). Imports NOTHING from modules/.
    ├── prisma/          → PrismaService + PrismaModule (@Global)
    └── modules/         → one folder per domain
        ├── auth/         → signup (email OTP) / login / refresh / logout, JwtStrategy, guard
        ├── accounts/     → trading accounts (per user): CRUD, active account
        ├── trades/       → trades (per user, account-scoped): CRUD + CSV import
        ├── mail/         → OTP email delivery (nodemailer)
        └── health/       → health check
```

> `analytics/` may be added later only if server-side aggregation is needed. The legacy scaffold's
> `demo/` (lead-capture) module may be kept for a public "contact/waitlist" form or removed — it is
> not part of the trading domain.

### Discipline (what keeps it production-grade)

- `common/` and `prisma/` **never import from `modules/`**. A module **never imports another
  module's internals** — only its **exported service** through the Nest module system.
- **Controllers are thin** — HTTP only: route, `@CurrentUser()`, call service, return.
- **Services own logic and persistence** — scope every query to `userId` (+ `accountId`), throw Nest
  exceptions; never return raw DB errors.
- **DTOs are the input contract** — every body is a validated class; `ValidationPipe({ whitelist:
  true })` strips undeclared properties.
- **Entities are the output contract** — class-transformer `@Exclude()`/`@Expose()` so `passwordHash`
  can never serialize out.

---

## Frontend Folder Structure

Feature-based. Routing lives in `src/app` (thin route entries using route groups), feature UI lives
in `src/features/*`, cross-cutting UI/utilities live in `src/shared`.

```
frontend/src/
├── app/
│   ├── layout.tsx          → Root layout: metadata, Inter font, dark theme, GlobalHosts
│   ├── globals.css         → Tailwind entry + imports theme.css + the app background grid
│   ├── page.tsx            → "/" → landing (or redirect to /dashboard when authed)
│   ├── (auth)/             → login + signup (centered, no app chrome)
│   └── (app)/              → authenticated app shell (sidebar + main)
│       ├── layout.tsx      → guards session; renders the AppShell (sidebar + topbar)
│       ├── dashboard/page.tsx   → the trading-journal cockpit (the design)
│       └── settings/page.tsx    → account + preferences (starting balance, currency, accent)
│
├── features/               → one vertical slice per domain
│   ├── auth/               → login/signup forms, auth service, store
│   ├── dashboard/          → the cockpit: overview, filters, stats, charts, insights,
│   │                         leaderboard, calendar heatmap, trades table + lib/metrics.ts
│   ├── accounts/           → account CRUD + active-account store
│   └── settings/           → account settings + accent preference
│       each slice may carry: components/ · lib/ · constants.ts · stores/ · schemas/ · api/ · types/
│
└── shared/
    ├── components/ui/      → shadcn/ui primitives
    ├── components/         → shared composites (AppShell/Sidebar/Topbar) + GlobalHosts (Toaster + ConfirmDialog)
    ├── config/             → sidebar navigation config, chart theme defaults
    ├── constants/          → route paths, enum labels (sides, statuses, presets)
    ├── lib/                → axios.config.ts, utils.ts (cn), format (currency/date), csv
    ├── stores/             → auth.store, confirm.store, theme-accent store (Zustand)
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
- **All authenticated reads/writes go through the shared axios instance** (`@lib/axios.config`) to
  feature **services** (`features/*/api/*.service.ts`). The interceptor owns 401-refresh, 403, 5xx.
- **Auth** rides on HTTP-only cookies; axios uses `withCredentials: true`; on 401 it single-flights a
  refresh and replays, redirecting to `/login` on failure.
- **Metrics are derived client-side** from the fetched trade set via `features/dashboard/lib/metrics.ts`;
  filters/sort live in a store or local state and drive a single `renderDashboard`-equivalent recompute.

---

## Invariants

- The **frontend never** holds secrets or talks to the database directly.
- **Per-user ownership:** every data-bearing route is scoped to the authenticated `userId` (derived
  from the verified session, never client-supplied) — no cross-user access. Account-scoped reads also
  filter by `accountId`, verified to belong to the user.
- **Never select, return, or log `passwordHash`.** Hash with bcryptjs; compare on login.
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
  code. **Secure by default** — global `JwtAuthGuard`; only `@Public()` routes are open.
- **Dark theme**, **green/teal brand** (switchable green/violet/gold), **Inter** font, **green-up /
  red-down** P&L color — every surface uses semantic tokens. No hardcoded hex or raw Tailwind color
  classes in components.
