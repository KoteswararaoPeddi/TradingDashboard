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
- **Swagger** — `@nestjs/swagger` serves interactive docs at **`/api/docs`** (spec at
  `/api/docs-json`); every endpoint is documented with `@ApiTags`/`@ApiOperation` and
  wrapped-envelope response examples. This is how endpoints get tested by hand.
- **Seeded data** — `npm run seed` loads the reference design's dataset: `Live Account #110920`
  ($1,000 / USD) + **18 BTCUSD trades** (2026-07-08 → 2026-07-15). Source rows are generated verbatim
  into `prisma/seed-data.ts`; `prisma/seed.ts` maps and upserts them. Idempotent — re-running leaves
  1 account / 18 trades.
- **API endpoints (read-only)** — `GET /api/accounts`, `GET /api/accounts/:id`,
  `GET /api/trades?accountId=&order=asc|desc`, `GET /api/health`. Trades come back **raw**, ordered by
  `closedAt`; the client derives every metric. Verified live end to end: 18 trades →
  **closing balance $1,166.40, win rate 50.00%, profit factor 1.53**; unknown `accountId` → 404;
  bad `order` → 400; unknown query params stripped by the whitelist.
- **Schema** — `TradingAccount` + `Trade` (+ `TradeSide` / `TradeStatus` enums), with
  `@@unique([accountId, ticket])` for idempotent CSV re-import and `@@index([accountId, closedAt])`.
- **Database** — a dedicated **`trade_journal`** PostgreSQL database on `localhost:5432`, with
  `backend/.env` pointing at it. Migration `20260716091717_init` is applied: `trading_accounts` +
  `trades` exist with both enums and both indexes, verified in psql.
- **Verified** — frontend + backend `tsc --noEmit` green; `prisma generate` green.

**Not done yet:**

- `theme.css` does not yet hold the dark trading tokens, and Inter is not yet the only font — so the
  placeholder pages do not match the design. This is the remaining Phase 0 task.
- The backend is **read-only**: there are no POST/PATCH/DELETE endpoints. Trades enter the system
  through `npm run seed` only. Trade CRUD and CSV import remain later phases.
- No `features/` slices exist on the frontend; the whole dashboard cockpit is unbuilt.

**Next:**

- Repoint `theme.css` + fonts to the dark design (finishes Phase 0), then build the `accounts` slice
  (Phase 1) and the `trades` slice (Phase 2) against the migrated database, then the dashboard cockpit
  (metrics → overview/stats → charts → filters/insights/calendar/table → export/theme).

---

## Progress

See build-plan.md for the full per-phase breakdown.

- [~] Phase 0 — Foundation (scaffold + schema done; theme.css/fonts repoint pending)
- [~] Phase 1 — Trading Accounts (DB, seed, and the `accounts` + `trades` GET endpoints done; frontend slice not started)
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
- **Trade timestamps are anchored to UTC.** The reference dataset carries wall-clock strings with no
  zone (`"2026-07-15 18:01:35"`). The seed appends `Z` so the stored instant reads back as the same
  wall clock everywhere, and the frontend reads it with UTC accessors. The dashboard buckets trades by
  **hour-of-day and weekday**, so parsing in the seeding machine's local zone would shift those
  buckets for any viewer in another timezone — the same trade would land in a different hour.
- **The API returns raw trades; an unknown `accountId` is a 404.** Returning an empty list would be
  indistinguishable from "this account has no trades yet", which hides typos and bad ids.
- **Dedicated database:** the app owns its own `trade_journal` PostgreSQL database rather than sharing
  a database with any other project on the same server. One project per database keeps migrations,
  resets, and `prisma migrate` drift detection scoped to this app alone — a `migrate reset` here can
  never touch another project's data.
- **Stack:** Frontend — Next.js 16 + React 19 + TypeScript (strict) + Tailwind v4 + shadcn/ui +
  **Chart.js** (`react-chartjs-2`). Backend — NestJS + Prisma + PostgreSQL. The frontend talks only to
  the NestJS REST API.
- **Theme:** **dark** (no light theme), **green/teal `primary`** switchable green/violet/gold via
  `data-accent`, **green-up / red-down** P&L color language, 8px radius.
- **Fonts:** **Inter** only.
- **Analytics:** derived **client-side** from the raw trade set via `features/dashboard/lib/metrics.ts`
  (the API returns raw trades). A backend analytics endpoint is an optional, approval-gated
  optimization only if client compute is ever too slow.
- **Swagger over a REST client:** `@nestjs/swagger` generates the API docs from the DTOs and
  controller decorators, so the docs can't drift from the code the way a hand-kept Postman collection
  does. Cost: every endpoint carries `@Api*` decorators. Response examples must show the **wrapped**
  `{ success, message, data }` envelope, since the global interceptor wraps what handlers return.
- **helmet CSP is scoped, not disabled:** Swagger UI needs inline scripts that helmet's default CSP
  blocks. Rather than turning CSP off app-wide, `/api/docs` is exempted and every other path keeps the
  strict policy — the API serves only JSON, so the docs page is the sole HTML surface.
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
