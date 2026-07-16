# Progress Tracker

Update this file after every completed feature/slice. Any AI agent reading this should immediately
know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** **Trade Journal pivot — Phase 0 (context docs done; code pivot pending).** The codebase is
being repurposed from a **copied hospital-management scaffold** into **Trade Journal**, a single-user
trading-journal analytics dashboard. The reference build is `context/designs/website.index.html` (a
dark analytics cockpit: sidebar + topbar shell, overview strip, advanced filters, ~27 stat cards,
seven Chart.js charts, insights + asset leaderboard, calendar heatmap, and a filterable trades table).

**Done (this pass — documentation only):**

- **All context docs rewritten to Trade Journal** — `project-overview`, `architecture`, `ui-tokens`,
  `ui-rules`, `ui-registry`, `code-standards`, `library-docs`, `build-plan`, `progress-tracker`, and
  the `engineering/*` decision logs now describe the trading-journal product, the **per-user**
  (non-multi-tenant) backend, the **dark** theme with the **green-up / red-down** P&L language,
  **Inter-only** fonts, **Chart.js** charts, and the client-side metrics module.
- **Design captured as the source of truth** — tokens (dark surface ramp, switchable green/violet/gold
  accent, 8px radius, `shadow-panel`, background grid), the sidebar/topbar shell, the panel/tile/badge
  composites, the seven-chart set, the calendar heatmap, and the trades-table pattern are all
  documented from `designs/website.index.html`.

**Not yet done (code — the important honesty note):**

- The underlying **repo code is still the hospital scaffold**: `prisma/schema.prisma` is the
  multi-tenant `Hospital`/`Patient`/... model; the auth service provisions a hospital org; `theme.css`
  still holds the old (violet/light) tokens; the frontend still has the hospital/landing UI. None of
  the trading models, modules, theme repoint, or dashboard UI is built yet.
- Concretely pending (see build-plan.md): repoint `theme.css` to the dark trading tokens, drop
  Playfair (Inter-only), remove the hospital/landing UI, strip auth to a single `User` (+
  `/auth/refresh` + `(app)` guard), then build the `accounts` and `trades` modules and the dashboard
  cockpit (metrics → overview/stats → charts → filters/insights/calendar/table → export/theme).

**Next:**

- Start Phase 0 code work: repoint `theme.css` + fonts to the design, remove the legacy hospital/
  landing UI, and get `npm run build` green. Then Phase 1 (per-user auth) and the `accounts`/`trades`
  slices.

---

## Progress

See build-plan.md for the full per-phase breakdown.

- [~] Phase 0 — Context & Theme Pivot (context docs done; theme/fonts repoint + hospital-UI removal pending)
- [~] Phase 1 — Auth & Per-user Ownership (auth scaffold exists but hospital-flavored; strip to per-user + `/auth/refresh` + guard pending)
- [ ] Phases 2–7 — Accounts, Trades, Metrics/Overview/Stats, Charts, Filters/Insights/Calendar/Table, Export/Theme (not started)
- [ ] Phase 8 — Polish

---

## Decisions Made During Build

- **Product pivot:** copied hospital-management scaffold → **Trade Journal** (single-user trading
  journal). Hospital domain to be removed; trading domain is the target (see architecture.md).
- **Ownership model:** **per-user**, not multi-tenant. Every account/trade is scoped to the
  authenticated `userId` (+ `accountId`). No organization/tenant, no `hospitalId`.
- **Stack:** Frontend — Next.js 16 + React 19 + TypeScript (strict) + Tailwind v4 + shadcn/ui +
  **Chart.js** (`react-chartjs-2`). Backend — NestJS + Prisma + PostgreSQL. Frontend talks only to the
  NestJS REST API.
- **Theme:** **dark** (no light theme), **green/teal `primary`** switchable green/violet/gold via
  `data-accent`, **green-up / red-down** P&L color language, 8px radius.
- **Fonts:** **Inter** only (Playfair/serif removed).
- **Charts:** **Chart.js** (matches the design), not recharts.
- **Analytics:** derived **client-side** from the raw trade set via `features/dashboard/lib/metrics.ts`
  (the API returns raw trades). A backend analytics endpoint is an optional, approval-gated
  optimization only if client compute is ever too slow.
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
