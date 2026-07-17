# Progress Tracker

Update this file after every completed feature/slice. Any AI agent reading this should immediately
know what is done, what is in progress, and what is next.

---

## Current Status

> **The list below this paragraph is stale in places** (it still describes `/dashboard` as a
> placeholder and an `AppShell.tsx` that no longer exists). **Trust "## Progress" and build-plan.md
> over it.** Rewriting it is an open task.

**Where it actually stands** *(2026-07-17)*: the cockpit is built and running across four routes.
Done: the shell, Overview, the 27 stat cards, all seven charts, the trades ledger with CRUD, the
Settings page, filter chips, and the **performance calendar**. Open: the full filter bar (search /
selects / P&L window / sort), insights + asset leaderboard, CSV import, Export CSV + Copy Summary,
the type-scale and elevation token rebuild, and three chart defects. See build-plan.md.

**Trade Journal** is an open, single-user trading-journal analytics dashboard (no auth): a dark
analytics cockpit — sidebar + topbar shell, overview hero, filters, ~27 stat cards, seven recharts
charts, insights + asset leaderboard, calendar heatmap, and a filterable trades table.

> **There is no HTML reference build any more.** `context/designs/website.index.html` is cited all
> over these docs but is **not in the repo**; what survives is three `app.tradefxbook.com_*.png`
> reference screens (dashboard, trades, analysis — **no calendar, no settings**). Treat every
> `website.index.html` reference in these docs as pointing at something that no longer exists.

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
- **API endpoints** — reads: `GET /api/accounts`, `GET /api/accounts/:id`,
  `GET /api/trades?accountId=&order=asc|desc`, `GET /api/health`. Trades come back **raw**, ordered by
  `closedAt`; the client derives every metric. Verified live end to end: 18 trades →
  **closing balance $1,166.40, win rate 50.00%, profit factor 1.53**; unknown `accountId` → 404;
  bad `order` → 400; unknown query params stripped by the whitelist.
- **Write endpoints** — `POST/PATCH/DELETE /api/trades` (add/edit/delete) and `PATCH /api/accounts/:id`
  (Settings). There is **no `POST /api/accounts`**: the account is a singleton created on boot, not a
  resource the user authors. Verified live: trade created with **no `accountId`** (server resolved the
  singleton), `"solusd"` normalised to `SOLUSD`, `grossPnl` derived as `netPnl + fees`, junk payload →
  400, unknown account → 404, injected props stripped, `PATCH` preserved untouched columns, delete →
  404 on re-delete. End to end through the UI: adding +100 moved the dashboard 1,166.40 → **1,266.40**,
  and deleting restored it.
- **Schema** — `TradingAccount` + `Trade` (+ `TradeSide` / `TradeStatus` enums), with
  `@@unique([accountId, ticket])` for idempotent CSV re-import and `@@index([accountId, closedAt])`.
- **Database** — a dedicated **`trade_journal`** PostgreSQL database on `localhost:5432`, with
  `backend/.env` pointing at it. Migration `20260716091717_init` is applied: `trading_accounts` +
  `trades` exist with both enums and both indexes, verified in psql.
- **Dark theme** — `theme.css` is layered palette → semantic → utilities: an `@theme` **palette**
  holds every literal colour (ink ramp, slate text, accent hues, up/down, chip fills, alphas,
  `--shadow-panel`); `:root` is **`var()` references only**; `@theme inline` bridges to Tailwind
  utilities. Accent themes (`body[data-accent]`) swap only the accent trio. Inter is the only font.
  All 8 legacy palettes are gone. The background wash lives in `globals.css`, token-driven (its 42px
  grid was removed 2026-07-17 — see ui-tokens.md).
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

- **Charts (D4)** — all **seven** recharts charts are built and render: equity curve (`AreaChart` +
  gradient), daily / weekday / hourly P&L, asset performance (horizontal), long-vs-short, and the
  win/loss donut, each `"use client"` + dynamically imported into a fixed-height `ChartPanel`.
  Defaults live in `shared/config/chart-theme.ts`, colours read `var(--color-*)`.
  **Verified in a browser:** 10 recharts surfaces, zero console errors, values reconciling to the
  metric bundle. **Three defects are open** — see build-plan.md → Phase 4.

- **Multi-page redesign (D5)** — the cockpit is now **four routes**, not one anchored page:
  `/dashboard` (the glance), `/analytics` (stats + charts), `/trades`, `/calendar`.
  `shared/config/app-nav.config.ts` drives the sidebar **and** the topbar title. The Overview was
  redesigned around the 30-second check: `AccountHero` (balance at `display-2xl`, uncoloured, with a
  signed delta on its baseline) over a six-cell `AccountStrip`. **Verified in a browser** at 1440 /
  900 / 600 and by clicking every nav link: all four routes resolve, `aria-current` tracks the
  pathname, zero console errors.

- **Reference-led redesign (D6)** — the cockpit was redesigned against real reference builds
  (`context/designs/app.tradefxbook.com_*.png`) rather than the original wireframe:
  - **Nav:** lucide icons + a tinted active pill with an indicator dot, replacing the `01`/`02`
    markers. A `Menu` section label sits above it.
  - **Sidebar order:** brand → account card → menu → nav. The card was `mt-auto`-pinned to the
    bottom, leaving a screen-tall void mid-sidebar.
  - **`Tile` rebuilt:** optional tinted icon plate (`bg-<tone>/10`), `rounded-xl`, `p-5`, quiet
    uppercase label at `semibold` with tracking. The 3px `info` accent bar is **gone** — 27 of them
    was texture competing with the figures.
  - **`KpiRow`** (4 icon cards) replaces `AccountStrip` (6 hairline cells).
  - **`AccountHero`** now pairs the balance with **`EquitySpark`**, a chrome-free recharts area.
  - **`RecentTrades`** puts the last 6 trades on the glance via the shadcn `Table` primitive.
  - **`--radius` 8px → 12px**, moving the whole derived family (sm 8 / md 10 / lg 12 / xl 16).
  **Verified in a browser:** typecheck clean, all four routes navigate, zero console errors.

- **Reference pass on Analytics + Trades (D7)** — the remaining two reference screens:
  - **`FilterChips`** — time period (Today / 7 days / 30 days / All time) × result (All trades /
    Winners / Losers / Liquidations) as **two orthogonal axes**, on Analytics, Trades and Calendar.
    New pure helpers `periodRange` / `activePeriod` / `activeResult`.
  - **`AnalyticsKpis`** — four icon cards leading `/analytics`, so the 27-card grid reads as detail.
  - **`TradesTable`** — the full ledger: 8 columns, `tabular-nums`, Load more (24-row step), live
    count, and an empty state carrying `Clear filters`.
  **Verified in a browser:** 18 → Winners 9 → Winners + 7 days 4 with both chips lit; typecheck
  clean; zero console errors; `verify-metrics.ts` still green (43 checks).

**Not done yet:**

- **CSV import is not started.** Trades are entered one at a time through the add-trade dialog; the
  `@@unique([accountId, ticket])` constraint that would make a re-import idempotent is in place and
  unused.
- **The add/edit dialog has not been driven in a browser.** Its submit path is typechecked and the
  API beneath it is verified live, but the dialog opening, validating and submitting was never
  clicked through — no browser automation was available in the session that built it.
- **The calendar heatmap and insights + leaderboard are still placeholders.**
- **The filter bar is only chips.** Search, asset/direction selects, date inputs, min/max P&L and sort
  have no UI yet — `filterTrades` and the store already support every one of them.
- **No `SideBadge`/`ResultBadge`** — the ledger renders side as coloured text, not the design's pills.
- **The token rebuild is only partial.** `--radius` landed; the **type scale and elevation did not
  persist** and `theme.css` still holds the original 52/48/35/29 scale (with unusable steps) and the
  single `0 18px 45px` shadow on everything. See build-plan.md → Phase 4.5.
- **`/analytics` has not had the reference pass.** The 27-card wall still renders every metric at
  equal weight with no hierarchy.
- **The three chart defects are still open** (zero-anchored equity axis, duplicate `$1.1K` ticks,
  degenerate single-symbol charts). Note `EquitySpark` fixes the axis *for itself* with
  `domain={["auto","auto"]}`; the `/analytics` curve still needs it.

**Next:**

- Rebuild the token system (colour ramp, type scale, spacing, elevation), then roll it across the
  shell, stats grid and charts; fix the three open chart defects; build Filters as a persistent
  control; then the trades table, calendar and insights.

---

## Progress

See build-plan.md for the full per-phase breakdown.

- [x] Phase 0 — Foundation (scaffold, schema, Swagger, dark theme tokens + Inter)
- [x] Phase 1 — Trading Accounts (DB, seed, `accounts` + `trades` GET endpoints, cockpit shell)
- [ ] Phase 2 — Trades (backend still read-only; no CRUD, no CSV import)
- [x] Phase 3 — Metrics, Overview & Stats (metrics module, filters + store, services, Overview, 27 cards)
- [~] Phase 4 — Charts (all seven build and render; three defects open — see build-plan.md)
- [~] Phase 4.5 — Multi-page redesign (routes + nav + Overview done; token rebuild and Filters open)
- [~] Phase 5 — Filters, Insights, Calendar, Trades table (trades table + calendar heatmap done; filter
      chips partial; insights + leaderboard not started)
- [ ] Phase 6 — Export & Copy Summary (the accent switcher exists; the two export actions do not)
- [ ] Phase 7 — Polish

---

## Decisions Made During Build

- **Trade table columns live in one file, rendered by both tables.** The dashboard's Recent activity
  and the `/trades` ledger had drifted: the glance was missing **Entry** and **Exit** and used
  different headers (`Closed`/`Asset`/`Direction` vs `Open / close`/`Symbol`/`Type`), because each
  owned its own copy of the markup. `components/trades/trade-columns.tsx` is now the single source;
  the ledger passes `withActions` to append its edit/delete cell. The data never needed a fetch
  change — `entryPrice`/`exitPrice` were already on `EnrichedTrade`; the glance simply wasn't
  rendering them.

- **The cockpit's data is fetched on the server, not in a client effect.**
  `(app)/layout.tsx` awaits `api/dashboard.loader.ts` and hands the payload to `DashboardProvider`.
  Measured before: the first API request left the browser at **+605ms** (after JS download +
  hydration), data landed at ~740ms, and the server HTML contained **no numbers at all**. After:
  **0 browser API calls**, and `$1,166.40` ships **in the HTML**. Fetching in the layout rather than
  per page loads it once for the whole route group.
- **Server data travels by React Context; a module store cannot carry it.** Seeding a zustand
  singleton during render *looked* right and typechecked, but the server HTML still rendered
  "No account": `useSyncExternalStore`'s server snapshot does not observe a mutation made in the same
  render pass. `DashboardProvider` replaced `dashboard.store` entirely. Context also avoids
  module-singleton-on-the-server state sharing. **Filters remain in zustand** — client-only state,
  never server-rendered, so the problem does not arise there.

- **The real reference is `designs/app.tradefxbook.com_*.png`, not `website.index.html`.** Three
  screenshots of a shipping trading journal (dashboard, trades, analysis) are the visual target. What
  we took: the tinted-icon-plate KPI card, real nav icons with a tinted active pill, a larger radius,
  generous card padding, 4-up instead of 5-up, quiet uppercase labels, and pill filter chips. What we
  did **not** take: their blue primary (our brand is the switchable green/violet/gold accent trio),
  and their per-metric icon on every card (fine for 4 KPIs, noise across our 27 stat cards).
- **The reference design is now a wireframe, not the source of truth.** The UI/UX is designed
  deliberately against the product's job rather than transcribed from
  `designs/website.index.html`. Tokens are open to redesign; **dark-only, Inter-only, and the
  green-up / red-down P&L language stay**, and the palette → semantic → utility spine stays because
  it is what makes the accent themes work. project-overview.md's "the UI matches the design" success
  criterion is retired.
- **The cockpit is four pages, not one long anchored page.** `/dashboard` answers the 30-second check;
  `/analytics` holds the 27 cards and seven charts; `/trades` and `/calendar` are their own jobs.
  **Trade-off:** the `IntersectionObserver` active-state and `constants/sections.ts` are gone, and the
  nav is now `usePathname`-driven. **Why:** the sidebar was never navigation — it was a table of
  contents for one page — and "Overview / Stats / Charts" are depth levels of one task, not places.
- **Filters is a control, not a destination.** As a page you would set filters, navigate away to see
  their effect, and navigate back. It scopes every view, so it renders on the pages it narrows and
  stays out of the nav. The filter store was already global, which is exactly the right shape.
- **Filter chips are two orthogonal axes, not one preset list.** Time period writes only `from`/`to`;
  result writes only `result`/`direction`. `presetFilters` rebuilds *every* field from a clean slate,
  so under it "Last 7 days" silently discarded "Winners" — the combination "how did my winners do this
  week" was unreachable, and that is the question a trading journal exists to answer. **Rule:** if two
  filters answer different questions, they must compose; a preset that resets unrelated fields is a
  preset that hides answers.
- **`activePeriod` tests `all` before the fixed windows, and the order is load-bearing.** Windows clamp
  to the account's own history, so on 8 days of trades the 30-day window *is* the full range and two
  chips match identical dates. When a window covers everything there is, "All time" is the honest
  label; "30 days" would imply a boundary the data does not have.
- **Numeric table columns are `tabular-nums`, always.** Inter's proportional digits make `1` narrower
  than `8`, so a money column jitters and cannot be scanned vertically. This single utility is most of
  what makes a ledger read as a ledger.
- **Empty states carry the way out.** With filters applied, "no trades" is nearly always a filter
  problem, so `Clear filters` sits inside the empty state rather than back up in a control the user
  must go hunting for.
- **One config drives the nav *and* the page titles** (`shared/config/app-nav.config.ts`), so a page
  cannot be called "Analytics" in the sidebar and something else at the top of its own page. Route
  paths stay in `shared/constants/routes.ts` — constants hold authoritative values, config composes
  them for rendering.
- **Exactly one figure per page may carry display size.** The Overview previously showed eight figures
  at near-equal weight, so the eye had no entry point — fatal for a glance. The balance is now the
  only `display-2xl`; the other six dropped to one quiet weight. **Rule:** if a new figure seems to
  deserve display size, it doesn't. Put it in the strip.
- **A balance is a level, not a signed value — it is uncoloured.** The delta beside it carries the
  green/red. Colouring both says the same thing twice, and if everything is green when you are up,
  nothing is. This is a deliberate **deviation from the original ui-rules**, applied to both
  `AccountHero` and the sidebar `AccountCard`. The trades table's *running* balance is a genuine
  per-row signed comparison and stays coloured.
- **The page title is a label, not the headline.** It rendered the account name at up to 56px, which
  made the loudest thing on the page a caption for what you were already looking at, and put it in
  direct competition with the balance. It is now the page name at 29px; the account identity lives in
  the sidebar brand block, where it already was.
- **The overview's void was structural, not cosmetic.** Panel's `aside` prop built a `1.25fr/0.75fr`
  grid whose columns could never agree on height, so the shorter one always trailed empty space.
  Stacking hero over strip removes the void by construction rather than propping a column up with
  filler. **Rule:** when two columns must match height but hold unrelated content, they will not.
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
- **"Today" means the wall-clock day, not the latest traded day** *(reversed 2026-07-17)*. It used to
  resolve to `range.to` so the historical seed never showed an empty screen — but that made the chip
  lie: it read "Today" while showing whenever the account last traded (the 15th when today is the
  17th). Now "Today"/"7 days"/"30 days" anchor on `useTodayKey`; an empty today shows an empty view,
  which is the honest answer. The clock is null on the server, so `periodRange`/`activePeriod` take it
  as an argument and fall back to `range.to`; the default filter is "all", so that fallback is never
  the visible state on load.
- **Swagger over a REST client:** `@nestjs/swagger` generates the API docs from the DTOs and
  controller decorators, so the docs can't drift from the code the way a hand-kept Postman collection
  does. Cost: every endpoint carries `@Api*` decorators. Response examples must show the **wrapped**
  `{ success, message, data }` envelope, since the global interceptor wraps what handlers return.
- **helmet CSP is scoped, not disabled:** Swagger UI needs inline scripts that helmet's default CSP
  blocks. Rather than turning CSP off app-wide, `/api/docs` is exempted and every other path keeps the
  strict policy — the API serves only JSON, so the docs page is the sole HTML surface.
- **No AI / no market feed / no execution** — this is a journal, not a terminal.
- **Calculation stays on the client, and this was decided with numbers** *(2026-07-17)*. The question
  was raised directly: should the backend own every calculation? It currently owns none — the only
  arithmetic in the API is `netPnl + fees`, while ~822 lines of `lib/` compute a 44-field bundle in
  the browser. **Measured before deciding:** one filter keystroke costs **0.4ms at 19 trades, 6ms at
  1k, 22.7ms at 10k, 117ms at 50k**. A personal journal reaches 10k after 2-4 years of active
  trading, so client compute is not the bottleneck the rule was guarding against, and moving it would
  trade instant filtering for a round trip per keystroke. **Decision: keep client-side**; the
  `analytics` endpoint stays the approval-gated Layer-6 option architecture.md already describes.
  Revisit past ~25k trades. (`filters.ts` claiming "microseconds" is wrong — it is sub-ms at 19,
  milliseconds at 1k.)
- **Trades pagination is client-side, 50/page** *(2026-07-17)*. Follows directly from the decision
  above: with the full set already in memory for the metrics, a server-paginated table would fetch
  everything *anyway* and add a second call. `pageSlice` clamps the page — a filter can shrink the set
  under a reader on page 9, and an unclamped slice renders a blank table that reads as "no results".
- **One component per file is now enforced** *(2026-07-17)*. A review found 9 hand-written files
  breaching `code-standards.md`, the worst being `CalendarHeatmap.tsx` at 405 lines / 6 components.
  All split. **Skeletons are the usual culprit** — they are a second component and now live in their
  own `XSkeleton.tsx`. The `ui/` primitives stay exempt: shadcn ships multi-component files and the
  standard mandates its CLI, so hand-splitting one would be undone by the next `shadcn add`.
- **The calendar's nav pages; the filter scopes** *(2026-07-17)*. The docs asked for both a "monthly
  heatmap" (ui-registry, build-plan) and "daily P&L across the selected range" (project-overview) —
  different features that only agree while the dataset spans one month. Settled: `FilterChips` decides
  which months exist and which days are in scope, and the `‹ ›` nav only pages between *those* months,
  one at a time. So the nav can never show a month the chips excluded, and the two controls cannot
  state different things — which is the failure a free-standing month nav (as in the reference) has.
  Both arrows disable on a single-month range.
- **The week is Monday-first, and `DAY_NAMES` must not be reordered to match** *(2026-07-17)*. A
  trading week is Mon-Fri, so the calendar displays Mon→Sun via `WEEKDAY_LABELS` in `lib/calendar.ts`.
  But `DAY_NAMES` in `metrics.ts` is **Sunday-based on purpose**: it indexes `weekdayPnl` straight off
  `getUTCDay()`, and rotating it would silently mislabel every weekday chart. Two lists, two jobs —
  display order is not bucket order.
- **The calendar's design reference arrived late** *(2026-07-17)*. It was first built blind (no
  calendar existed in any saved design), then redesigned against the TradeFXBook "Monthly P&L" screen
  the user supplied: Monday-first, weekly totals column, month nav, today marker. Departures from it
  are deliberate and recorded in ui-registry.md. Note `designs/website.index.html`, cited across these
  docs as *the* wireframe, is **no longer in the repo** — treat every reference to it as stale.
- **Dates display DD-MM-YYYY, but sort as ISO.** `formatDate` in `shared/lib/format.ts` reformats at
  the render edge only; `closedAt` stays a raw ISO string everywhere it is compared, grouped or
  sorted (`filters.ts`, `metrics.ts` day keys), because ISO strings order correctly under
  `localeCompare` and DD-MM-YYYY does not. `formatDate` slices the string rather than going through
  `new Date()`, which would re-project the instant into the viewer's timezone and disagree with the
  UTC day buckets the charts use.
- **All analytics moved to the backend; the frontend is now a pure display layer** *(2026-07-17)*.
  Measured client compute (`metrics.ts` + `filters.ts`) held up to ~1000 trades but janked by ~5000
  (repeated ISO date parsing inside sort comparators, ~9.6ms at 1000). The chosen fix was not a local
  optimization but the architecture the user wanted: `GET /analytics?<filters>` returns the ready-to-
  render bundle, `GET /trades?page&limit&<filters>` returns a server-paginated page. The proven
  `metrics.ts` logic was ported verbatim to `backend/modules/analytics/analytics.calculator.ts` +
  `trades/trades.logic.ts` and pinned by `backend/test/analytics-oracle.ts` (the same 43 checks that
  guarded the frontend — all green, then re-confirmed against live Prisma rows). Frontend `metrics.ts`
  and the data-crunching half of `filters.ts` (`filterTrades`/`sortTrades`/`tradeDateRange`/
  `tradeSymbols`) were **deleted**; the chip→param helpers stayed. First paint is still server-
  rendered; filter changes refetch. See engineering/backend.md for the port and the Decimal-boundary
  decision.
- **Money is mid-migration Float→Decimal; coerced at every Prisma boundary** *(2026-07-17)*.
  `schema.prisma` on disk still says `Float`, but the generated Prisma client types money as
  `Decimal` (from a staged `money_float_to_decimal` migration), so Prisma returns `Decimal` at runtime.
  `equity += pnl` on a Decimal would silently string-concatenate. `backend/common/money.ts`'s
  `toNumber`/`toNullableNumber` normalise every money field on the way out of the DB (entities +
  analytics/trades services). **Open:** `schema.prisma` and the generated client disagree — the user
  needs to reconcile (regenerate to `Decimal @db.Decimal(18,2)` or revert the migration).
- **Closed the last client-side calculations: pips, filled size, monthly totals** *(2026-07-17)*.
  Follow-up to the analytics move. Three derivations still ran in React: the calendar's daily→monthly
  totals, per-row `pips` (`|exit − entry|`), and `filledSize` (parse `"0.25/0.25"` → `"0.25"`). Moved
  to the backend — `trades.logic.enrichTrades` now derives `pips`/`filledSize` and exposes them on
  `TradeRowEntity`; `analytics.calculator` emits `monthlyPnl[]` (`{month, value, tradedDays,
  tradeCount}`), rolled up from the already-rounded `dailyPnl` so it can't drift. Frontend
  `lib/trade-fields.ts` and `scripts/verify-pips.ts` were **deleted** (its strong `pips × size ==
  |netPnl|` identity was ported into the oracle first, so no coverage was lost); `trade-columns.tsx`
  reads `trade.pips`/`trade.filledSize`; `calendar.ts` reads month net from `monthlyPnl`. **Kept on
  the client on purpose** (a design decision, confirmed with the owner): the heatmap **tint**
  (value→colour) and the calendar's per-row **"Week" subtotal** — a Monday-start, month-clipped grid
  row is a layout artifact, not a domain week, so its sum stays a presentation rollup of already-fetched
  daily data. Rule applied: *must be correct on every client → backend; only helps render one layout →
  frontend*. Oracle extended (monthly rollup + pips/filledSize + identity) — all green, live-confirmed.
  See engineering/backend.md → "Draw the client/server line…".

- **Fixed: "Time period" chip flashed "Today" then swapped to "All time" on every load** *(2026-07-17)*.
  The zustand store starts with an empty range (`{"", ""}`); the real span is seeded a beat later in a
  `useCockpit` effect (`initRange`). On the un-seeded first frame, `periodRange` collapses every period
  to `{"", ""}`, so all of them matched the (also-empty) filters and `activePeriod`'s `.find()` returned
  the array's first entry — which was `"today"`. Once the range seeded, only `all` matched → a visible
  Today→All-time flip. Root cause was an ordering bug: `activePeriod` was documented as testing `all`
  "before the fixed windows" but the array was `["today", "all", "7d", "30d"]`. Reordered to
  `["all", "today", "7d", "30d"]` (`lib/filters.ts`) so the un-seeded frame already resolves to the chip
  it settles on — no flip. Per-click behaviour (Today / 7d / 30d) is unchanged; only the ambiguous
  all-covering and un-seeded cases now prefer "All time".

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
