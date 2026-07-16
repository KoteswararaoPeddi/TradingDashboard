# Progress Tracker

Update this file after every completed feature/slice. Any AI agent reading this should immediately
know what is done, what is in progress, and what is next.

---

## Current Status

**Phase 0 — Foundation: done.** Both apps are scaffolded, the database is seeded and served by the
API, and the dark theme tokens are in. The dashboard cockpit itself is not built yet.

**Trade Journal** is an open, single-user trading-journal analytics dashboard (no auth). The
reference build is `context/designs/website.index.html` — a dark analytics cockpit: sidebar + topbar
shell, overview strip, advanced filters, ~27 stat cards, seven recharts charts, insights + asset
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
- **Dark theme** — `theme.css` is layered palette → semantic → utilities: an `@theme` **palette**
  holds every literal colour (ink ramp, slate text, accent hues, up/down, chip fills, alphas,
  `--shadow-panel`); `:root` is **`var()` references only**; `@theme inline` bridges to Tailwind
  utilities. Accent themes (`body[data-accent]`) swap only the accent trio. Inter is the only font.
  All 8 legacy palettes are gone. The background grid lives in `globals.css`, token-driven.
- **Verified** — frontend `tsc` + `next build` green (routes `/`, `/dashboard`, `/_not-found`);
  backend `tsc --noEmit` green; `prisma generate` green.

- **Data spine (`features/dashboard`)** — types, services, and the pure logic the whole cockpit reads:
  - `lib/metrics.ts` — `enrichTrades()` + `calculateMetrics()` + `drawdownRecovery()`.
  - `lib/filters.ts` — `filterTrades()` / `presetFilters()` / `tradeDateRange()` / `tradeSymbols()`.
  - `stores/filters.store.ts` — Zustand; patching a control clears the active preset chip.
  - `api/{accounts,trades}.service.ts` — typed, envelope-unwrapping services.
  - **Verified:** `npx tsx scripts/verify-metrics.ts` → **43 checks green**, incl. $1,166.40 /
    50.00% / 1.53, every bucket (weekday, hour, daily, asset, direction) reconciling to net 166.40,
    and the equity curve terminating at the running balance. Real readouts: max drawdown 17.99%,
    best hour 19:00 (+159.45), best weekday Wed (+325.80), longs +181.09 vs shorts −14.69.

- **Cockpit shell (D1)** — `DashboardShell` (286px sidebar + scrolling main), `BrandBlock`,
  `SectionNav` (in-page anchors + IntersectionObserver active state), `AccountCard`, `AccentSwitcher`,
  `Topbar`, and the `Panel` section container. `dashboard.store` loads the account + trades once and
  both the shell and the panels read it. The `(app)` layout renders the shell; `/dashboard` composes
  `DashboardPage`, currently six placeholder Panels holding the section anchors.
  **Verified in a real browser** against the design: balance $1,166.40 in green, net $166.40, growth
  16.64%, win rate 50.00%, 18 trades, zero console errors.

- **Overview panel (D2)** — `Overview` + `AccountStrip` + `MarketBoard`, rendered through `Panel`'s
  two-column `aside` layout. `useCockpit()` is the single derivation point: raw trades + filters in,
  active view + metrics out, so no panel can disagree with another. **Verified in a browser:**
  balance $1,166.40, net $166.40, max drawdown 17.99% (red), profit factor 1.53 (blue), win rate
  50.00%, avg trade $9.24, best $91.54, worst −$75.66; zero console errors.

- **Stats grid (D3)** — all **27** core performance cards (`components/stats/Stats.tsx`, rows in
  `lib/stat-rows.ts`), on the shared `Tile` (`components/Tile.tsx`) that `MarketBoard` now also uses.
  `DashboardPage` renders sections strictly in the design's order, placeholders included, so anchors
  stay reachable. **Verified in a browser:** 27/27 cards, values matching the metric bundle, tones
  correct; zero console errors.

**Not done yet:**

- The backend is **read-only**: there are no POST/PATCH/DELETE endpoints. Trades enter the system
  through `npm run seed` only. Trade CRUD and CSV import remain later phases.
- No `features/` slices exist on the frontend; the whole dashboard cockpit is unbuilt. `/dashboard`
  is still the placeholder page — it now renders on the dark theme, but shows no trade data.

**Next:**

- Repoint `theme.css` + fonts to the dark design (finishes Phase 0), then build the `accounts` slice
  (Phase 1) and the `trades` slice (Phase 2) against the migrated database, then the dashboard cockpit
  (metrics → overview/stats → charts → filters/insights/calendar/table → export/theme).

---

## Progress

See build-plan.md for the full per-phase breakdown.

- [x] Phase 0 — Foundation (scaffold, schema, Swagger, dark theme tokens + Inter)
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
  **recharts**. Backend — NestJS + Prisma + PostgreSQL. The frontend talks only to
  the NestJS REST API.
- **Theme:** **dark** (no light theme), **green/teal `primary`** switchable green/violet/gold via
  `data-accent`, **green-up / red-down** P&L color language, 8px radius.
- **Fonts:** **Inter** only.
- **Colour flows palette → semantic → utility, in that order.** `theme.css`'s `@theme` palette is the
  **only** place a literal colour may appear; the `:root` semantic layer is `var()` references only,
  and components use the generated utilities. A literal in the semantic layer (or a hex in a
  component) breaks the accent themes, because there is then a value the theme swap cannot reach.
- **Figure colour is a metric *family* rule, not just a sign test.** `statTone()` checks the family
  before the sign, so Max Drawdown stays red at **+**17.99% and "Max Loss Streak 5" is red while
  "Max Win Streak 5" is purple — same number, opposite meaning. Ratios (win rate, profit factor, R:R)
  are blue because a ratio has no direction to colour. The `Tone` union in `Tile.tsx` is the single
  source of that vocabulary.
- **The reference design overflows its own account strip; we fixed it rather than copy it.** Its
  `.strip-value` is `clamp(22px, 3vw, 34px)`, but `3vw` tracks the **viewport** while the value sits
  in a cell an eighth as wide. At 1440 the design's own `$1,166.40` renders 169px inside a 133px cell
  and collides with the next column. Each strip cell is now a `@container` and the value clamps on
  **`19cqi`**, sizing against its own cell: 25px at 1440, the design's full 34px at 1920, no overflow
  at either. **Rule:** size text against the box that constrains it, not the viewport.
- **A palette entry must never share a name with a `@theme inline` bridge entry.** `--color-up` in the
  palette plus `--color-up: var(--up)` in the bridge made `--up` reference itself; the variable
  resolved to **empty** and every green/red P&L colour silently rendered unstyled. It compiled, it
  typechecked, and the CSS looked right — only rendering it in a browser exposed it. The palette now
  names them `--color-profit` / `--color-loss`. Rule: palette names describe the **hue**, semantic
  names describe the **role**, and the two namespaces must not overlap.
- **`<html class="dark">` is static, not a toggle.** There is no light theme — `:root` is already
  dark. The class exists because the shadcn primitives ship `dark:` utilities
  (`dark:bg-input/30`, `dark:hover:bg-input/50`); without a `.dark` ancestor those never match and
  every primitive renders its light styling on a dark background.
- **Charts use recharts, not a canvas library.** recharts renders **SVG**, and SVG `fill`/`stroke`
  accept `var(--color-up)` — so charts read the same semantic tokens as the rest of the app and
  restyle with the accent themes for free. A canvas library would need literal colour strings in JS,
  i.e. a second palette that the token rules forbid.
- **Analytics:** derived **client-side** from the raw trade set via `features/dashboard/lib/metrics.ts`
  (the API returns raw trades). A backend analytics endpoint is an optional, approval-gated
  optimization only if client compute is ever too slow.
- **`index` and `balanceAfter` are account-wide, never per-filter.** `enrichTrades()` computes them
  once over the full set. A trade's position in the account's history and the balance it left behind
  do not change because a filter hides its neighbours — recomputing per filter would renumber rows
  and rewrite the running balance as the user types. Metrics, by contrast, *do* recompute per filter.
- **`profitFactor` is `number | null`, not `"INF"`.** With no losses the factor is unbounded; a null
  says so in the type instead of smuggling a string into a numeric field or rendering `Infinity`.
  The UI formats null as "INF" at the edge.
- **"Today" means the latest day with trades**, not the wall-clock date. The dataset is historical, so
  a real "today" preset would show an empty dashboard.
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
