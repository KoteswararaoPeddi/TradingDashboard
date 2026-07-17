# UI Rules

How Trade Journal's UI should look, behave, and read. Pairs with ui-tokens.md (colors/typography)
and ui-registry.md (built components). Keep every panel visually consistent — shared tokens and
primitives, one set of conventions, one dark theme with the green-up / red-down P&L language.

---

## How we build UI (non-negotiable)

- **Style with Tailwind utility classes + the design tokens.** No hand-written CSS files or CSS
  modules for component styling. Sanctioned inline-`style` exceptions (via `var(--color-*)`):
  multi-stop panel/brand gradients, the app background wash, and **P&L-proportional widths** (asset
  leaderboard bars, calendar heatmap intensity) that must be computed at runtime.
- **Use shadcn/ui primitives — never hand-roll what shadcn provides.** Button, Card, Dialog, Input,
  Select, Checkbox, Tabs, Dropdown, Tooltip, Table, etc. Add them with the CLI
  (`npx shadcn@latest add ...`) into `src/shared/components/ui`. Only build by hand for genuine
  composites the design needs (`Panel`, `StatCard`, `MarketTile`, `SideBadge`, `ResultBadge`,
  `CalendarHeatmap`, the seven chart wrappers) — composed **from** shadcn primitives + tokens.
- **All content text goes through `Typography`** (`@components/ui/typography`) via its
  `variant`/`weight` props — not raw `text-*` size classes in feature/page code. Color and layout
  stay on `className`. Numeric displays use the heavy weights (see ui-tokens.md); never arbitrary
  `text-[Npx]`. (Interactive controls — buttons, nav links, chips — keep their utility classes.)
- **Charts use recharts**, `"use client"` + dynamically imported, `ssr: false`. Chart colors come
  from the token values (green-up / red-down for signed data; brand/blue for series) — read them from
  CSS vars, never hardcode a second copy of the palette.
- Use `cn` from `@lib/utils` for conditional/merged classes — never hand-concatenate class strings.

---

## Layout

- **Two layout contexts.** (There is no `(auth)` group — the app has no login.)
  - **`/`** — redirects straight to `/dashboard`; no chrome of its own.
  - **`(app)`** — the cockpit: a **persistent left sidebar** (`286px`, brand + main nav + account
    card) beside a scrolling `main` with comfortable padding, rendered unguarded by `DashboardShell`.
  - A **centered card on the dark background, no app chrome** remains the shape for any standalone
    page (404, a simple confirmation) — see ui-registry.md → Centered page shell.
- **The cockpit is four pages, not one long page.** The sidebar navigates by **route**, and the
  active link is the current pathname (`aria-current="page"`). Destinations live in
  `shared/config/app-nav.config.ts`, which drives the sidebar **and** the topbar title/subline so the
  two can never disagree:

  | Route        | Page      | Job |
  | ------------ | --------- | --- |
  | `/dashboard` | Dashboard | **The glance.** Where the account stands right now: the balance hero, its support strip, recent activity. |
  | `/analytics` | Analytics | **The deep dive.** The 27 stat cards, the seven charts, insights + leaderboard. |
  | `/trades`    | Trades    | The trade ledger: filterable table with running balance and result. |
  | `/calendar`  | Calendar  | The monthly P&L heatmap. |

- **Filters is a control, never a destination.** It scopes every view rather than being a place you
  go, so it renders on the pages it narrows (Analytics, Trades, Calendar) and is absent from the nav.
  The filter store is global (Zustand) precisely because the control outlives any one page.
- **The Dashboard is the 30-second check.** A trader glances after a session and needs one answer:
  where the account stands and which way it moved. Exactly one figure on that page carries display
  size — everything else is support. Detail is a route away, not a scroll away.
- Build **responsive**: below ~1180px the sidebar drops to a horizontal nav strip and the account
  card hides; overview/analysis grids collapse to one column; below ~780px the topbar stacks, strips
  and market tiles go single-column, and tables/charts scroll or shrink. Verify mobile/tablet/desktop.

---

## Panels & Surfaces

- **Panel** is the core container: `bg-surface` (with the subtle white-overlay gradient) +
  `border border-border` + `rounded-lg` (8px) + `shadow-panel`, `overflow-hidden`. Header row
  (`panel-header`: title `text-h3`/`h4` + muted sub `text-body-sm`) over a `panel-body` (18px pad).
- **Nested tiles** (market tiles, stat cards, insight/asset cards) sit on `bg-surface-raised` /
  `rgba(7,11,17,.72)` with a hairline border; several carry a 3px left accent bar (`primary` /
  signed color). Deepest wells (account-strip, table body) use `rgba(0,0,0,.16–.22)`.
- Page background is `bg-background` with a dark diagonal wash (no grid — removed 2026-07-17; see
  ui-tokens.md). Keep panel chrome quiet so the
  numbers stand out — this is a data screen.

---

## Components (use shadcn primitives + the design composites)

- Build on the primitives in `src/shared/components/ui`. Don't hand-roll equivalents. Add new
  primitives via the shadcn CLI when a panel needs one (`table`, `select`, `dialog`, `tooltip`).
- Promote a feature component to `shared/components` only once a second feature needs it.
- Buttons: `primary` (green/brand gradient) for the main action (Export CSV); a quiet outline
  variant for secondary (Copy Summary, Reset); chips for filter presets. One primary action per view.
- **Badges carry meaning by color** — LONG = `up`/green, SHORT = `info`/blue, LIQUIDATION =
  `down`/red; result Profit = green, Loss = red, Breakeven = neutral grey. Never restyle these away
  from the P&L language.
- Every form (add/edit trade, filters, account settings) uses label + control + inline error,
  driven by RHF + Zod (see code-standards.md).

---

## Color & Type Usage

- Follow ui-tokens.md. **P&L color is by sign** — profit `text-up` (green), loss `text-down` (red).
  Apply it to every signed value: P&L, net, growth, drawdown, per-day and per-asset totals, chart
  bars. Brand/active states use `primary`; links/info use `info` (blue).
- **A balance is a level, not a signed value — leave it uncoloured** (`text-foreground`). The delta
  beside it (net P&L, growth) carries the sign colour. Colouring both states the same thing twice and
  costs the green its meaning: if everything is green when you are up, nothing is. This applies to the
  balance hero (`AccountHero`) and the sidebar `AccountCard`. **Exception:** a *running* balance in
  the trades table is a per-row signed comparison against the starting balance, and stays coloured.
- Use the typography scale (`text-display-*`, `text-h1`…`text-h6`, `text-body-*`, `text-label-*`,
  `text-caption`) rather than arbitrary sizes. Big balances/stat values use `display-*`/`h1` at heavy
  weight; panel titles `text-h3`/`h4`; uppercase micro-labels `text-label-*`/`text-caption` +
  `text-muted-foreground`.
- Never hardcode hex or use raw Tailwind color classes (including `text-white`/`bg-white` — use
  `text-foreground`/`bg-surface`).

---

## Page patterns (from the design)

- **Sidebar (`DashboardShell`):** brand block (`TJ` mark + "Trade Journal" / account label), **main
  nav** (Dashboard, Analytics, Trades, Calendar) with numbered markers + active route state, and a
  pinned **account card** (balance + Net P&L / Growth / Win Rate / Trades minis). The card reads the
  **full** trade set, never the filtered one: the account's standing must not move when a filter
  narrows the page beside it.
- **Topbar:** eyebrow ("Live performance cockpit" + pulse dot), the **page** title (`h1`, 29px) and
  its subline from the nav config, plus top actions (accent theme dots, Copy Summary, Export CSV
  primary). The title is a **label, not the headline** — it names the page and must never outweigh the
  page's own hero figure.
- **Overview panel (`/dashboard`):** account command center — the **balance hero** (`display-2xl`,
  uncoloured, with a signed `+$166.40 (+16.64%)` delta on its baseline) over a **support strip** of
  six hairline-divided figures (Max Drawdown, Profit Factor, Win Rate, Average Trade, Best, Worst).
  One column, never two: the panel's old `aside` grid left a permanent void under the shorter column.
- **Filters panel:** search + asset/direction/result selects + from/to date + min/max P&L + sort, and
  a row of quick-preset chips (All / Today / Last 7 Days / Winners / Losses / Liquidations). Reset
  button in the header. Changing any control recomputes the whole dashboard and clears active chips.
- **Stats panel:** responsive grid of ~27 stat cards (`title` label, big signed value, meta line),
  each colored by sign / metric family.
- **Charts:** a 12-col grid — wide equity curve (line + gradient), then daily/weekday/hourly/asset/
  direction bars and a win/loss doughnut. Each in its own panel with a header.
- **Insights + Leaderboard:** risk/edge insight cards (best/worst asset, best/worst hour, best
  weekday, drawdown recovery) beside a per-symbol leaderboard with proportional bars.
- **Calendar heatmap:** weekday-aligned month grid, each day tinted by P&L intensity (green/red).
- **Trades table:** #, Close Time, Hold Time, Asset, Direction, Size, Entry, Exit, Result, P&L,
  Running Balance, Ticket, Status; sticky header, hover rows, signed coloring, **Load More** paging,
  and a live trade count.
- **Add / edit trade:** a shadcn `Dialog` holding the form (asset, direction, size, entry/exit,
  P&L, fees, open/close time, ticket) — inline errors, submitting state, toast on success.

---

## States (every data view)

Every dashboard panel reads from the API (trades) and derives its numbers — handle all states:

- **Loading:** shadcn `Skeleton` shaped like the real panel (strip cells, stat grid, chart bodies,
  table rows) while trades fetch. Charts render nothing until data + the client library are ready.
- **Empty:** when a filter (or a new account) yields no trades, show the dashed **empty-state** panel
  the design uses ("No trades match the current filters." / "No calendar data for the current
  filters.") — guide toward adding/importing trades or resetting filters.
- **Error:** a human-readable message with retry where sensible; fetch failures surface a toast via
  `getErrorMessage(error)` — never a silent fail.
- **Forms:** inline validation errors (what's wrong + how to fix), a disabled/submitting state, and a
  success confirmation (toast via sonner). Every destructive action (delete trade) confirms first.
- **Chart unavailable:** if the chart library fails to load, replace the chart body with the
  empty-state message (as the design does) — never a blank canvas.

---

## UX Writing / UI Content Standards

Good UI content tells users what to do, what happened, and what happens next. Apply everywhere;
consistency matters more than any single choice.

1. **Be clear, not clever** — ✅ "Export CSV" · "Add trade" / ❌ "Let's crunch your numbers!"
2. **Action-oriented buttons** — ✅ "Add trade" · "Import CSV" · "Save account" · "Reset filters"
3. **Keep labels short** — ✅ "Min P&L" / ❌ "Minimum profit and loss value"
4. **Errors explain the problem** — ✅ "Enter a valid exit price." / ❌ "Invalid input"
5. **Empty states guide** — ✅ "No trades yet, add or import your first one." / ❌ "No data found."
6. **Success confirms completion** — ✅ "Trade added" · "CSV exported" / ❌ "Success!"
7. **Avoid trailing periods in short UI text** (buttons, labels, toasts); periods fine in sentences.
8. **Consistency** — pick one term and use it everywhere ("Trade", "Asset", "Direction", "P&L",
   "Running Balance") — don't drift to "position"/"symbol"/"ticker" mid-app.
9. **Sentence case** — ✅ "Add trade" / ❌ "Add Trade". (Uppercase micro-labels like `WIN RATE` are a
   deliberate styling choice via `uppercase`, not written in caps.)
10. **Reduce cognitive load** — one refined thought; don't make users read more than necessary.
11. **Dates display as DD-MM-YYYY** — always via `formatDate` from `@lib/format`, never a raw
    `iso.slice(0, 10)` at the call site. Times stay 24-hour `HH:MM`. This is a *display* rule only:
    sorting, grouping and filtering keep the raw ISO string, which orders correctly as text where
    DD-MM-YYYY does not. `datetime-local` inputs render in the browser's own locale format and are
    outside this rule.

**Never use a long hyphen (em dash `—` or en dash `–`) in UI content.** Use a comma, or rewrite as a
separate sentence.

---

## Do Nots

- **Never write a custom CSS file or hand-roll a component shadcn provides.** Tailwind utilities +
  tokens + shadcn primitives only (the sanctioned inline-`style` exceptions are panel/brand gradients,
  the background wash, and P&L-proportional widths, all via `var(--color-*)`).
- **Never break the P&L color language** — profit is green (`up`), loss is red (`down`), by sign.
  LONG green / SHORT blue / LIQUIDATION red badges. Don't invent extra colors for signed data.
- **Never use a long hyphen (em dash / en dash) in UI content.**
- Never use raw Tailwind color classes for chrome (`bg-emerald-500`, `text-gray-400`, `text-white`,
  `bg-white`) — use tokens.
- Never define colors in a config file — tokens live in `theme.css` (`@theme`).
- Never add a light theme, a display font, or a serif font — dark theme, **Inter** only.
- Never use arbitrary `text-[Npx]` sizes or hardcoded `rounded-[..]` radii — use the type scale and
  `rounded-*` (8px family; `rounded-full` for badges/pills).
- Never ship a form without validation, a submitting state, and a success/error message.
- Never hardcode chart colors — read them from the token CSS vars so the accent theme stays in sync.
- Never put business logic or data fetching in a `page.tsx` — compose feature components; metrics come
  from `features/dashboard/lib/metrics.ts`.
