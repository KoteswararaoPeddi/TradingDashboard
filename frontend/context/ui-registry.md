# UI Registry

Living document. Updated after every shared component is built. **Read this before building
any new component** — match an existing pattern before inventing a new one.

## How to Use

Before building a component:

1. Check if a similar component already exists here (or in `src/shared/components/ui`).
2. If yes — reuse it; match its props/classes.
3. If no — build it on shadcn/ui primitives following ui-rules.md + ui-tokens.md, then add a
   row below.

After building or promoting a shared component, add it here with its file path and a short
note. Feature composites are logged here as they are built.

---

> **Status:** the dark theme tokens are live in `theme.css`, and the **shell** and **overview**
> composites are built and imprinted. Sections still marked **target** are patterns read from the
> design (`context/designs/website.index.html`) whose code has not landed yet. Every component is
> written against the semantic tokens (`bg-surface`, `text-foreground`, `text-up`/`text-down`,
> `border-border`) — never a raw Tailwind colour class and never a hex.

---

## UI Typos / Known Issues

Record UI copy typos and other UI issues here: location (page/component + file), current
(wrong) text, correct text, status.

| # | Location (component / file) | Current text | Correct text | Status |
| - | --------------------------- | ------------ | ------------ | ------ |
| 1 | (none currently)            | —            | —            | —      |

---

## Primitives (`src/shared/components/ui`)

Token-styled shadcn/ui primitives. Add more (`select`, `table`, `tabs`, `dialog`, `tooltip`,
`dropdown-menu`, …) via the shadcn CLI when a panel needs them. On the dark theme, style them with the
dark semantic tokens (`bg-surface`, `border-border`, `text-foreground`, ring `--ring`).

| Component | File | Notes |
| --------- | ---- | ----- |
| Button | `ui/button.tsx` | cva. Variants: default/outline/secondary/ghost/destructive/link; sizes xs–lg + icon. Default = brand: `bg-primary text-primary-fg`; primary CTA uses the green→blue gradient (Export CSV). Outline/ghost for secondary (Copy Summary, Reset). |
| Card / Panel | `ui/card.tsx` | Base surface: `rounded-lg border border-border bg-surface shadow-panel overflow-hidden`. The dashboard **Panel** composite (below) wraps this with the header/body structure. `bg-card` resolves to `--surface`. |
| Badge | `ui/badge.tsx` | cva chip, `rounded-full`. The trading **SideBadge** / **ResultBadge** (below) are the semantic variants — LONG green / SHORT blue / LIQUIDATION red; Profit green / Loss red / Breakeven grey. |
| Separator | `ui/separator.tsx` | Token `bg-border` rule; `h-px w-full` / `w-px h-full`. |
| Input | `ui/input.tsx` | Dark input: `bg-input border-border`, focus ring blue (`--ring`). RHF `register()` ref flows through via React 19 ref-as-prop. Used by filters, add-trade, settings. |
| Select | `ui/select.tsx` | **shadcn** (base-ui). Filter selects (asset/direction/result/sort). Controlled via `value`/`onValueChange`; with RHF use a `Controller`. Dark popover surface. |
| Field | `ui/field.tsx` | Wrapper: `Label` + control + `error` (`text-body-sm text-down`); `flex flex-col gap-1.5`; optional muted `hint`. Use for every form field. |
| Label | `ui/label.tsx` | `<label>`, `text-body-sm font-medium text-foreground select-none`. |
| Typography | `ui/typography/` | Polymorphic text component. **All content text goes through it** (variant + weight props); color/layout via `className`. Weights: normal → extrabold, plus **`black` (900)** added for the cockpit's numerics (balances, stat values, the page title), which the design sets at 900. Variants emit `font-heading`/`font-body`; both are aliases of Inter in `theme.css` (without those tokens the classes would resolve to nothing). |
| Dialog | `ui/dialog.tsx` | **shadcn** (base-ui). Add-trade / edit-trade / confirm dialogs. Controlled via `open`/`onOpenChange`; built-in ✕ (`showCloseButton={false}` to hide). |
| Table | `ui/table.tsx` | **shadcn**, CLI-installed. Ships its own `overflow-x-auto` container, so a `min-w-*` on the `<Table>` forces horizontal scroll on mobile rather than squashing columns. Used by `RecentTrades` (`min-w-160`); the full ledger will reuse it. Header cells are `font-medium text-muted-foreground`, **not** uppercase-black. |
| DropdownMenu | `ui/dropdown-menu.tsx` | **shadcn** (base-ui). Row actions / overflow menus. (The user menu it also served is gone — no auth.) |
| Pagination | `ui/pagination.tsx` | **shadcn**, CLI-installed *(2026-07-17)*. Use its `Pagination`/`PaginationContent`/`PaginationItem` wrappers (`nav` > `ul` > `li`) for any pager. **Its `PaginationLink` renders an `<a>`** for URL-driven paging — for client-side state put a `Button` in the `PaginationItem` instead; an anchor with no `href` is unreachable by keyboard. See `TradesPagination`. |
| Skeleton | `ui/skeleton.tsx` | **shadcn** (`animate-pulse rounded-md bg-muted`). **Use for all loading placeholders** — pass geometry via `className`. Never hand-roll `animate-pulse` divs. |
| Toaster | sonner (in `GlobalHosts`) | sonner `<Toaster position="top-right" richColors />` mounted once in root `layout.tsx`. Call `toast.loading/success/error` anywhere. |

---

## One component per file — enforced *(2026-07-17)*

`code-standards.md` says **one component per file**, and a review found **9 hand-written files**
breaching it (worst: `CalendarHeatmap.tsx` at 405 lines / 6 components). All 9 are now split; every
hand-written `.tsx` in `features/` and `shared/components/` declares exactly one component.

| Was | Now |
| --- | --- |
| `CalendarHeatmap.tsx` (405 lines, 6 comps + a hook + a pure fn) | `CalendarHeatmap` (128) · `MonthNav` · `WeekRow` · `WeekCell` · `DayCell` · `hooks/useTodayKey.ts` · `shared/components/EmptyState` |
| `TradesTable.tsx` (2) | `TradesTable` · `TradeRow` · `TradesPagination` |
| `FilterChips.tsx` (3) | `FilterChips` · `FilterGroup` · `FilterChip` |
| `Charts.tsx` (3) | `Charts` · `ChartsSkeleton` |
| `Overview.tsx` · `Stats.tsx` (2 each) | + `OverviewSkeleton` · `StatsSkeleton` |
| `MainNav.tsx` (2) | `MainNav` · `NavLink` |
| `AccountCard.tsx` (2) | `AccountCard` · `AccountMini` |

**Pattern notes:**

- **Skeletons get their own file** (`XSkeleton.tsx`) beside the component they mirror. They are a
  second component by any definition, and they are the most common way this rule quietly breaks.
- **The `ui/` primitives are exempt.** shadcn ships multi-component files (`dropdown-menu.tsx` has 15)
  and `code-standards.md` *mandates* the CLI, so the two rules collide. The CLI output wins — never
  hand-split a vendored primitive, it would be overwritten on the next `shadcn add`.
- **A `dynamic()` `loading` arrow is not a component** — `const loading = () => <Skeleton/>` is an
  option object's field, and lifting it to its own file would obscure that.

---

## Trade table columns — one source *(imprinted 2026-07-16)*

File: `components/trades/trade-columns.tsx` — rendered by **both** `trades/TradesTable` (the full
ledger) and `overview/RecentTrades` (the dashboard glance).

| Export | Purpose |
| ------ | ------- |
| `TradeHeadCells({ withActions })` | The 9 header cells, + an sr-only Actions head when `withActions` |
| `TradeRowCells({ trade, withActions })` | One trade's 9 cells; the caller appends its own actions cell |
| `TRADE_TABLE_MIN_WIDTH` | `min-w-220` — below this the table scrolls rather than crushing 9 columns. **Both** tables use it; there is no narrow variant |

**Columns, in order:** Open / close · Symbol · Type · Entry · Exit · **Pips** · Size · P&L · Balance.

| Property | Class |
| -------- | ----- |
| Head cell | `text-label-sm font-semibold tracking-wider text-subtle-foreground uppercase` |
| Open / close | two lines: `closedAt` via `formatDate` (DD-MM-YYYY) over `open → close · holdTime` in `text-subtle-foreground` |
| Type | `font-semibold` + `SIDE_CLASS` — LONG `text-up` / SHORT `text-info` / LIQUIDATION `text-down` |
| Entry / Exit / Pips / Size | `text-right text-muted-foreground tabular-nums`, `—` when null. Pips + Size come from `lib/trade-fields.ts` |
| P&L | `text-right font-bold tabular-nums` + signed `text-up`/`text-down`, explicit `+` prefix |
| Balance | `text-right text-muted-foreground tabular-nums` |
| Row | `border-border hover:bg-surface-wash` (ledger adds `group` for hover actions) |

**Pattern notes:**

- **Never hand-write trade columns.** The two tables drifted exactly this way once: the glance was
  missing **Entry** and **Exit** and used different labels (`Closed`/`Asset`/`Direction`) because each
  owned a copy. Add a column here and both tables get it.
- **`withActions` moves the trailing padding.** Without an actions column, Balance takes `pr-4.5` so
  the last column never sits flush.
- **`tabular-nums` on every numeric cell** so digits align down the column.
- **Entry/Exit are prices, not money** — rendered raw with `—` when null, so a missing fill never
  reads as a real `$0.00` trade.
- **Size shows the filled half only** *(2026-07-17)*. The raw field is a broker `"requested/filled"`
  pair (`"0.25/0.25"`); `filledSize()` renders `0.25`. Only the filled figure is real — on a partial
  fill the two differ, and the requested one describes an intention, not a position. It is also the
  size the row's **P&L is computed from**, so showing the pair (or the requested half) would print a
  number the money on the row disagrees with. Tolerates a plain `"1"` from hand-entered trades.
- **Pips is a raw distance: unscaled, unsigned, untinted** *(2026-07-17)*. `Math.abs(exit - entry)`
  from `lib/trade-fields.ts`, to 1dp via `formatPips`. **No pip-size conversion and no currency**, so the
  figure ties back to the Entry and Exit columns by plain subtraction and a reader can check it by
  eye. **No `+`/`-` and no colour**: it is a distance, and Type and P&L either side already say which
  way it went and what it earned — a sign here would only restate them. Dropping the sign also means
  direction never enters the maths, so a `LIQUIDATION` (whose side records no direction) still gets a
  real number. `—` when either fill is missing — null, never `0.0`, because an unrecorded fill did
  not travel zero pips.
- The glance carries **no actions**: editing belongs on `/trades`, where you went to manage trades.

---

## Data flow — read this before wiring any panel

| Piece | File | Role |
| ----- | ---- | ---- |
| `loadDashboard()` | `api/dashboard.loader.ts` | **Server** fetch (account → trades). Never throws; returns `{ account, trades, error }`. |
| `DashboardProvider` | `components/DashboardProvider.tsx` | Client provider. Enriches trades, exposes `{ status, error, account, trades }` via Context. |
| `useDashboardData()` | same file | The raw server data. Throws outside the provider, by design. |
| `useCockpit()` | `hooks/use-cockpit.ts` | **What panels call.** Applies filters and returns `{ metrics, filtered, … }`. |

- **A panel never fetches.** It calls `useCockpit()` and renders. The data is loaded once, on the
  server, by `(app)/layout.tsx` — the browser makes zero API calls.
- **Never put server-loaded data in a zustand store.** `useSyncExternalStore`'s server snapshot misses
  a same-render mutation, so the HTML renders empty. Context is what survives the server render;
  zustand is for client-only state (filters).
- **There is no loading state for the trade set** — it ships with the HTML, so panels handle `error`
  only. Skeletons remain for `ssr:false` charts, which genuinely cannot server-render.

---

## Dashboard composites

The trading cockpit's custom composites (no shadcn equivalent). All live under
`features/dashboard/components/*`; the numbers come from `features/dashboard/lib/metrics.ts`.
Rows marked **target** are patterns from `designs/website.index.html` that are not built yet.

### Built — the shell *(imprinted 2026-07-16; re-imprinted after the multi-page redesign)*

| Composite | File |
| --------- | ---- |
| DashboardShell | `components/shell/DashboardShell.tsx` |
| BrandBlock | `components/shell/BrandBlock.tsx` |
| MainNav | `components/shell/MainNav.tsx` |
| AccountCard | `components/shell/AccountCard.tsx` |
| AccentSwitcher | `components/shell/AccentSwitcher.tsx` |
| Topbar | `components/shell/Topbar.tsx` |
| Panel | `components/Panel.tsx` |
| SectionPlaceholder | `components/SectionPlaceholder.tsx` |

**Removed in the redesign:** `SectionNav.tsx` and `constants/sections.ts` (the single-page cockpit's
anchor nav + its section list) — replaced by `MainNav` reading `shared/config/app-nav.config.ts`.

| Property | Class |
| -------- | ----- |
| Shell grid | `min-h-screen min-[1181px]:grid min-[1181px]:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]` — **block flow below 1181px, not a stacked grid** (see notes) |
| Sidebar | `sticky top-0 z-30 bg-surface/88 backdrop-blur-lg px-4.5 py-5.5 border-b border-border` → `min-[1181px]:h-screen min-[1181px]:border-r min-[1181px]:border-b-0` |
| Main | `min-w-0 p-4 md:p-6.5` |
| Panel container | `overflow-hidden rounded-lg border border-border bg-linear-to-b from-surface-wash to-surface-wash-soft shadow-panel scroll-mt-6` |
| Panel header | `flex items-start justify-between gap-3.5 p-4.5 pb-0`; title `Typography variant="h3" weight="black"`; sub `variant="body-sm" text-muted-foreground mt-1.5` |
| Panel body | `p-4.5` (`padded={false}` when the child owns its padding) |
| Raised well | `rounded-lg border border-border-soft bg-surface-well p-2.5` |
| Empty state | `rounded-lg border border-dashed border-border bg-surface-wash-soft p-9 text-center` |
| Card surface | `bg-linear-to-b from-surface-wash to-surface-wash-soft` + `border border-border` + `shadow-panel` |
| Sidebar order | brand → `Menu` label → nav → account card *(2026-07-17)*. **Not** `mt-auto` on the card (see notes) |
| Nav item | `group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-body-base font-semibold transition-colors` |
| Nav item (active) | `bg-primary/10 text-foreground` + `aria-current="page"` |
| Nav item (idle) | `text-muted-foreground hover:bg-surface-wash hover:text-foreground` |
| Nav icon | `size-4.5 shrink-0`; `text-primary` active, `text-subtle-foreground group-hover:text-muted-foreground` idle |
| Nav active dot | `ml-auto size-1.5 shrink-0 rounded-full bg-primary` |
| Nav separator *(2026-07-17)* | `my-1 h-px bg-border max-[1180px]:hidden` — divides the four destinations from **Settings** |
| Section label | `variant="label-sm" weight="semibold"` + `mb-2 block px-3 tracking-wider text-subtle-foreground uppercase` |
| Page title (topbar) | `Typography as="h1" variant="h2" weight="black" className="text-foreground"` |
| Page subline | `variant="body-sm" className="mt-1 max-w-3xl text-muted-foreground"` |
| Brand mark | `grid size-10.5 place-items-center rounded-lg bg-linear-to-br from-primary to-info text-primary-fg` + brand-tinted glow via `color-mix` |
| Micro-label | `Typography variant="label-sm\|label-base" weight="extrabold" className="text-muted-foreground uppercase"` |
| Big numeric | `Typography variant="h1\|display-*" weight="black"` + signed colour |
| Signed value | `text-up` when `>= 0`, `text-down` when `< 0` — never any other colour |
| Hairline | `border-border`; inner wells `border-border-soft`; tiles `border-border-tile` |
| Shadow | `shadow-panel` (panels, account card) |

**Pattern notes:**

- **`Panel` is the only section container.** Every cockpit section renders through it, so the header
  rhythm and surface are defined once. It takes `id` and `scroll-mt-6` keeps a linked section clear of
  the top edge. Pass `padded={false}` for tables/charts/strips that supply their own padding.
- **The sidebar reads the full trade set, the pages read the filtered set.** `AccountCard` is fed
  metrics over *all* trades on purpose: the account's standing must not move when a filter narrows
  the page beside it.
- **Signed colour is mechanical**, never decorative: `>= 0 → text-up`, `< 0 → text-down`. Win Rate and
  Trades take no tone because they are unsigned. **A balance takes no tone either** — see
  ui-rules.md → Color & Type Usage.
- **`MainNav` is route nav, not anchor nav.** Active state is `usePathname() === item.href` and marks
  itself `aria-current="page"`. The old `SectionNav`'s `IntersectionObserver` is **gone**: it existed
  only to track which section had scrolled into view, and there are no in-page sections to track.
- **Settings is separated, not a fifth destination** *(2026-07-17)*. `APP_NAV`'s four entries are
  analytical views of one trade set — places you jump between while working. Settings is configuration
  you visit rarely, so it lives in `SETTINGS_NAV` and renders under a hairline rule. It is **not**
  pinned with `mt-auto`: that is exactly what left a screen-tall void mid-sidebar when the account card
  was pinned. `navItemFor()` searches `[...APP_NAV, SETTINGS_NAV]` so the topbar still finds its title.
  The rule is `max-[1180px]:hidden` — below 1181px the nav is a horizontal scroller, where a rule would
  take a whole column slot and read as an empty tab.
- **One `NavLink` component for both groups.** Settings must *be* the same control as the four
  destinations, not a lookalike that drifts out of sync when the active treatment changes.
- **Icons, not `01`/`02` markers.** Numbering four destinations implies a sequence you work through,
  which is false — they are places you jump between. An icon is also recognised without being read,
  which is the whole job of nav at a glance. Icons live in the nav config as `LucideIcon` refs.
- **The active row is marked three ways** — tinted surface, accent icon, and the trailing dot. That
  redundancy is deliberate: colour alone leaves the state invisible to anyone who cannot separate the
  accent from muted grey.
- **The shell drops out of grid layout below 1181px, and that is what makes the nav stick.** A grid
  item's sticky containing block is its own **grid area**. Stacked (`grid-cols-1`), the sidebar is row
  1 and that row is exactly as tall as the sidebar — so `sticky top-0` has zero room to travel and
  silently does nothing, with no error and no visual clue. Using block flow on mobile makes the page
  the containing block, so it sticks. Above 1181px the grid returns and the sidebar sticks inside its
  full-height column. **If a `sticky` element ever refuses to stick, check whether a grid or flex
  parent has boxed it into an area its own size.**
- **Sidebar is `z-30`,** above panels and the `backdrop-blur-lg` wash, so scrolled table rows pass
  under it rather than through it.
- **The account card sits below the nav, and never `mt-auto` to the bottom** *(moved 2026-07-17;
  previously under the brand)*. The load-bearing half of this rule is the `mt-auto` ban, not the
  position: **pinned**, the card left a screen-tall void between it and the nav that read as a broken
  layout. In normal flow it closes up under the nav and the sidebar ends where its content ends —
  which is why "below the nav" and "pinned to the bottom" are not the same instruction. Reading order
  is now: who this is → where to go → how it's doing.
- **One config drives nav and titles.** `shared/config/app-nav.config.ts` holds `{ href, label,
  marker, subline }` per destination; `MainNav` renders it and `Topbar` looks up the current pathname
  in it via `navItemFor()`. A page therefore cannot be called one thing in the sidebar and another at
  the top of its own page. Route paths themselves live in `shared/constants/routes.ts` (constants hold
  authoritative values; config composes them for rendering).
- **`AccentSwitcher` reads `localStorage` in an effect, never during render.** The server renders
  `DEFAULT_ACCENT`; reading storage while rendering would desync hydration. It only writes
  `document.body.dataset.accent` — no component knows which hue is active.
- **Never use a raw Tailwind colour class** (`bg-white/6`, `bg-black/22`, `border-white/8`). Every
  translucent surface has a token: `surface-wash` / `surface-wash-soft` (panel wash, nav hover),
  `surface-tile` (market/stat tiles), `surface-well` / `surface-well-soft` (minis, account strip),
  `border-soft` / `border-tile`. Panels use `bg-linear-to-b from-surface-wash to-surface-wash-soft`
  (Tailwind v4 syntax), matching the design's `rgba(255,255,255,.058) → .025` wash.
- Design fidelity: sidebar padding is 22px/18px (`py-5.5 px-4.5`), the account balance is 30px
  (`variant="h1"`, **not** `display-lg` which runs 34px), nav items are 42px (`min-h-10.5`), and the
  brand mark is 42px (`size-10.5`).
- **Not built yet in the topbar:** Copy Summary + Export CSV. They depend on the filtered set and land
  with the export slice.

### Built — Tile, the shared figure card *(re-imprinted 2026-07-16, redesigned against the reference builds)*

File: `components/Tile.tsx` — used by the overview's `KpiRow` **and** the stats grid.

| Property | Class |
| -------- | ----- |
| Container | `flex flex-col rounded-xl border border-border-tile bg-surface-tile p-5` |
| Height | `min-h-45` with an icon, `min-h-30` without |
| Icon plate | `mb-5 grid size-11 shrink-0 place-items-center rounded-xl` + `TONE_PLATE_CLASS[tone]` |
| Interactive | `transition-colors hover:border-border-strong hover:bg-surface-raised/92` |
| Label | `Typography variant="label-sm" weight="semibold"` + `block tracking-wider text-muted-foreground uppercase` |
| Value | `variant="h1"` with an icon / `"h2"` without, `weight="black"` + `mt-2 block leading-none wrap-anywhere` + `TONE_CLASS[tone]` |
| Note | `variant="body-sm"` + `mt-auto pt-3 text-subtle-foreground` |

**Icon plate tint** (`TONE_PLATE_CLASS`, private to `Tile.tsx`): a 10% wash of the tone's own hue
behind the glyph — `bg-up/10 text-up`, `bg-down/10 text-down`, `bg-info/10 text-info`,
`bg-warning/10 text-warning`, `bg-purple/10 text-purple`. It categorises the card at a glance without
introducing a sixth colour, and it reads at arm's length where a text colour alone does not.

**Tone map** (`Tone` **and `TONE_CLASS`** are exported from `Tile.tsx` — the one source for figure
colour. Figure surfaces that aren't tiles, like the overview's support strip, import `TONE_CLASS`
rather than keeping a second copy):

| Tone | Class | Meaning |
| ---- | ----- | ------- |
| `up` | `text-up` | profit / good |
| `down` | `text-down` | loss / bad |
| `info` | `text-info` | a ratio — no direction to colour |
| `warning` | `text-warning` | below par but not a loss (win rate < 50%) |
| `neutral` | `text-purple` | reference count, neither good nor bad |

**Pattern notes:**

- **No accent bar.** The reference cockpit put a 3px `info` bar on every tile as its signature, but
  the stats grid renders **27** of them: 27 identical bars carrying no information is texture
  competing with the only thing on the card worth reading. Removed.
- **The icon is optional, and that is the hierarchy.** The four KPI cards on `/dashboard` take an
  icon and render their value at `h1`; the 27 stat cards take none and render at `h2`. Same
  component, two weights of importance. **Don't give the stats grid icons** — 27 glyphs is the accent
  bar problem again, in a new costume.
- **Build every figure card on `Tile`.** One base for the KPI row and the stats grid; duplicating it
  would let the two drift. `interactive` adds the hover response (stats grid uses it, the KPI row
  does not).
- **`wrap-anywhere` on the value** so a long money string breaks instead of widening its grid track.
- **`neutral` reads the palette's `text-purple` directly.** Fixed, non-themeable hues (`purple`,
  `short`, `flat`) have no role the accent themes could change, so they skip the semantic layer.
  Anything with a *role* (surfaces, borders, accents, P&L) must still go palette → semantic → utility.

### Built — the overview *(re-imprinted 2026-07-16, redesigned for the glance)*

| Composite | File |
| --------- | ---- |
| Overview | `components/overview/Overview.tsx` |
| AccountHero | `components/overview/AccountHero.tsx` (balance + delta + `EquitySpark`) |
| EquitySpark | `components/overview/EquitySpark.tsx` (recharts, `"use client"`, dynamic) |
| KpiRow | `components/overview/KpiRow.tsx` (4 × `Tile` with icons) |
| RecentTrades | `components/overview/RecentTrades.tsx` (shadcn `Table`) |

**Removed in the redesign:** `MarketBoard.tsx`, then `AccountStrip.tsx` — the hairline six-cell strip
was replaced by `KpiRow`'s four icon cards. Best/Worst Trade dropped from the glance entirely: they
answer "what was my luckiest day", not "how am I doing", and already live in the stats grid.

| Property | Class |
| -------- | ----- |
| Hero container | `grid gap-6 px-4.5 pt-4 pb-5 min-[861px]:grid-cols-[minmax(0,auto)_minmax(0,1fr)] min-[861px]:items-center min-[861px]:gap-10` |
| Hero label | `Typography variant="label-base" weight="medium"` + `block text-muted-foreground` |
| Hero row | `mt-2.5 flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5` |
| Hero balance | `variant="display-2xl" weight="black"` + `leading-none whitespace-nowrap text-foreground` (**never** toned) |
| Hero delta | `variant="h3" weight="black"` + `leading-none whitespace-nowrap` + `text-up`/`text-down` |
| Hero note | `variant="body-sm" className="mt-2.5 text-subtle-foreground"` |
| Spark box | `h-22 w-full` (fixed — `ResponsiveContainer` collapses to zero in an auto-height box) |
| Spark caption | `variant="body-sm" className="mt-1 block text-right text-subtle-foreground"` |
| KPI grid | `grid grid-cols-1 gap-4 min-[601px]:grid-cols-2 min-[1181px]:grid-cols-4` |

**Pattern notes:**

- **One figure wins the page.** The balance is the only `display-2xl` in the cockpit; everything else
  on `/dashboard` is support. The panel previously showed eight figures at near-equal weight (4 strip
  cells + 4 tiles), which gave the eye no entry point — fatal for a 30-second check. If a new figure
  "deserves" display size, it doesn't: put it in the KPI row.
- **The number and its shape travel together.** `AccountHero` pairs the balance with `EquitySpark`
  because the figure alone answers "am I up" but not "am I climbing or bleeding back" — $1,166 reads
  identically at the top of a rally and halfway down a drawdown. Both questions, one look.
- **`EquitySpark` is chrome-free on purpose** — no axes, grid, tooltip or dots. It is not the
  Analytics equity curve in miniature; at 88px tall any furniture is noise. The full curve with axes
  and tooltips lives on `/analytics`.
- **The spark's YAxis is `domain={["auto","auto"]}`, and this is load-bearing.** recharts defaults a
  `YAxis` to `[0, dataMax]`, which renders a $900–$1,200 history as a dead flat line pinned to the top
  edge — the exact opposite of what a sparkline is for. The axis is hidden but still governs shape.
  **The `/analytics` equity curve still has this bug** (see build-plan.md → Phase 4).
- **Six support figures became four.** Best and Worst Trade are trivia on a glance. Four cards also
  divide a 12-column grid cleanly where six never did.
- **The balance is uncoloured; the delta carries the sign.** A balance is a *level*, the delta is the
  *judgement*. See ui-rules.md → Color & Type Usage. `AccountCard` follows the same rule.
- **Baseline alignment, not centre.** `items-baseline` sits the delta on the balance's baseline; with
  `items-center` it floats against the cap height and reads as a detached chip.
- **One column, never two.** The old layout used Panel's `aside` prop for a `1.25fr/0.75fr` grid whose
  columns could not agree on height, leaving a permanent void under the shorter one. Stacking hero
  over strip removes the void *by construction*. `Panel`'s `aside` prop still exists but the overview
  no longer uses it.
- **Tone rules beyond plain sign.** Max Drawdown is **always `text-down`** (a drawdown is a loss
  figure even when small); Profit Factor is **`text-info`** (a ratio has no direction to colour); Win
  Rate is **`text-warning`** below 50% rather than red (a coin flip is not a loss). Everything else
  follows `>= 0 → up`, `< 0 → down`.
- **The strip reads `TONE_CLASS` imported from `Tile.tsx`** rather than keeping its own tone→colour
  map. One vocabulary, one source; a second copy would drift.
- **Never mix named breakpoints with arbitrary `min-[]` ones on the same property.** Tailwind's sort
  order between the two families is not intuitive: `md:grid-cols-3` silently beat
  `min-[1181px]:grid-cols-6` and the strip rendered 3×2 at 1440. All three column counts now use
  `min-[]`. (This bit the account strip once before with `md:grid-cols-2` vs `min-[1181px]:grid-cols-4`
  — it is the single most repeated trap in this codebase.)
- **Verified in a browser at 1440 / 900 / 600:** 6 / 3 / 2 columns, hero holds, zero console errors.

### Built — the stats grid *(imprinted 2026-07-16)*

Files: `components/stats/Stats.tsx` · rows from `lib/stat-rows.ts`

| Property | Class |
| -------- | ----- |
| Grid | `grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3` |
| Card | `Tile` with `interactive` |
| Loading | 12 × `Skeleton h-30 rounded-lg border border-border` in the same grid |

**Pattern notes:**

- **27 rows live in `lib/stat-rows.ts`, not the component.** It is pure presentation — every number is
  read off the metric bundle, so the panel cannot compute (or disagree) on its own.
- **`statTone()` ports the design's `colorClass`, and order matters:** the *family* check runs before
  the *sign* check, so "Max Drawdown" stays red at +17.99% and "Max Loss Streak 5" is red while
  "Max Win Streak 5" is purple. Families: `NEGATIVE_LABELS` → down · `RATIO_LABELS` → info ·
  `NEUTRAL_LABELS` → neutral · else up. A value containing `-` is down.
- **`auto-fit` sizes the grid, not breakpoints** — it reflows on its own (5 columns at 1440).

### Built — FilterChips, the scope control *(imprinted 2026-07-16)*

File: `components/filters/FilterChips.tsx` · pure helpers in `lib/filters.ts`

| Property | Class |
| -------- | ----- |
| Bar | `flex flex-wrap items-center gap-x-6 gap-y-3`, wrapped by the page in `border-b border-border pb-4.5` |
| Group label | `Typography variant="label-sm" weight="semibold"` + `mr-1 tracking-wider text-subtle-foreground uppercase` |
| Chip | `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-body-sm font-semibold transition-colors` |
| Chip (active) | `bg-primary text-primary-fg` + `aria-pressed="true"` |
| Chip (idle) | `bg-surface-wash text-muted-foreground hover:bg-surface-raised hover:text-foreground` |
| Chip focus | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` |

**Pattern notes:**

- **Two independent axes, not one preset list.** Time period writes only `from`/`to`; result writes
  only `result`/`direction`. The old `presetFilters` rebuilt *every* field from a clean slate, so
  picking "Last 7 days" silently discarded "Winners" — you could never ask "how did my winners do this
  week", which is the question a journal exists to answer. **Verified:** 18 → Winners 9 → +7 days 4,
  with both chips still lit.
- **`presetFilters` still exists** for the six legacy preset chips and is still covered by
  `scripts/verify-metrics.ts`. `periodRange` / `activePeriod` / `activeResult` are the new orthogonal
  path. Don't route chips back through `presetFilters`.
- **Windows clamp to the account's own history** — a 30-day window over 8 days of trades is just "all
  time". `activePeriod` therefore tests `all` **before** the fixed windows, so the honest label wins;
  reporting "30 days" would imply a boundary the data doesn't have.
- **Active state is `aria-pressed`, not colour alone.** A toggle whose only "chosen" signal is a fill
  says nothing to a screen reader.
- **Chips render on the pages they scope** (Analytics, Trades, Calendar) and never in the nav —
  Filters is a control, not a destination.

### Built — the trades ledger *(imprinted 2026-07-16)*

File: `components/trades/TradesTable.tsx` · `components/overview/RecentTrades.tsx`

| Property | Class |
| -------- | ----- |
| Table | shadcn `Table` + `min-w-200` (ledger) / `min-w-160` (recent). The primitive owns the `overflow-x-auto` container |
| `th` | `text-label-sm font-semibold tracking-wider text-subtle-foreground uppercase` |
| Row | `border-border hover:bg-surface-wash` |
| Numeric cell | `text-right tabular-nums` — **always** `tabular-nums` so digits align column-wise |
| P&L cell | `text-right font-bold tabular-nums` + `text-up`/`text-down` by sign, with an explicit `+` |
| Side cell | `font-semibold` + LONG `text-up` · SHORT `text-info` · LIQUIDATION `text-down` |
| Empty state | **`shared/components/EmptyState`** — `icon` + `message` + `action`; the caller positions it (`className="m-4.5"`) |
| Row actions cell *(2026-07-17)* | `flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100`; `Button variant="ghost" size="icon"`; delete adds `text-subtle-foreground hover:text-down`. Row gains `group`; `th` is `<span className="sr-only">Actions</span>` |
| Footer / pager *(2026-07-17)* | `TradesPagination` — `flex flex-wrap items-center justify-between gap-4 border-t border-border p-4.5`; `Showing {from}–{to} of {total}` + shadcn `Pagination`. Page buttons `Button variant="default"` when current (+ `aria-current="page"`), `ghost` otherwise |

**Pattern notes:**

- **`tabular-nums` on every numeric column.** Inter's proportional digits make `1` narrower than `8`,
  so a column of money jitters and can't be scanned vertically. This is the whole reason a ledger
  reads as a ledger.
- **Empty states carry the way out.** With filters applied, "no trades" is nearly always a filter
  problem, so the fix (`Clear filters` → `reset()`) sits where the user hits the wall. A dead-end
  empty state makes the user hunt for the control that trapped them.
- **Two empty states, because they have two different exits** *(2026-07-17)*. `allTrades.length === 0`
  is an untouched journal → `Receipt` icon + **Add trade**. `filtered.length === 0` with trades present
  is a filter problem → `SlidersHorizontal` + **Clear filters**. Offering "Clear filters" to someone
  who has never added a trade sends them hunting for a control that was never the obstacle. Check
  `allTrades` **first** — it is the more specific case.
- **Hover-revealed row actions must still be reachable without hover** *(2026-07-17)*. `group-hover`
  alone hides them from keyboard and touch entirely; `focus-within:opacity-100` brings them back while
  tabbing and `max-md:opacity-100` keeps them permanent on touch. Each button carries an
  `aria-label` naming the trade ("Delete BTCUSD trade from 2026-07-15") — nine identical "Delete"
  buttons are useless in a screen-reader's element list.
- **One dialog per table, not per row.** `TradesTable` holds `editing: EnrichedTrade | undefined` and
  mounts a single `TradeFormDialog`; a dialog inside `Row` would mount one per visible row.
- **Deleting is confirmed** via the imperative `confirm()` store, and the copy states the real
  consequence — the running balance of every later trade shifts, because `balanceAfter` is cumulative.
- **Pagination is 50 rows a page** *(2026-07-17, replaced `Load more`)*. Maths lives in the pure
  `lib/pagination.ts` (`PAGE_SIZE`, `pageSlice`, `pageWindow`), not the component. **`pageSlice`
  clamps the page** rather than trusting it: a filter can shrink the set under someone on page 9, and
  an unclamped slice returns `[]` — a blank table that reads as "no results" when the truth is "that
  page stopped existing". **The page resets to 1 on a filter change, adjusted during render, not in an
  effect** — an effect would paint the wrong rows for a frame first (and `react-hooks/set-state-in-effect`
  rejects it). `pageWindow` keeps first + last always visible with `…` gaps, so 26 pages never render
  26 buttons. Controls hide at a single page; the `Showing x–y of N` count never does.
  - **Note:** with **19 trades** the ledger is one page, so no page buttons render. The previous
    `Load more` (STEP 24) had the same blind spot and was never seen either. Verified against a
    120-trade mock API: 3 pages, `Showing 101–120 of 120`, partial last page, next disabled at the end.
- **The old `Load more`** revealed 24 at a time; the footer always stated `Showing N of M`, so paging never
  hides how much is left.
- **`RecentTrades` is the glance's 6 rows, `TradesTable` is the ledger.** Both read `useCockpit()`, so
  they cannot disagree about the active view.

### Built — the performance calendar *(built 2026-07-17; redesigned same day against the TradeFXBook "Monthly P&L" reference)*

Files *(split one-per-file 2026-07-17)*: `components/calendar/` — `CalendarHeatmap.tsx` (the panel) ·
`MonthNav.tsx` · `WeekRow.tsx` · `WeekCell.tsx` · `DayCell.tsx` (owns the tint constants + `cellTitle`).
Pure builder in `lib/calendar.ts`; the hydration-safe clock in `hooks/useTodayKey.ts`.

**Structure: month → weeks → days.** Not a flat day list. The week is a real row object carrying its
own net and traded-day count, because the weekly column cannot be derived at render time from cells
that do not know which row they are in.

| Property | Class |
| -------- | ----- |
| Scroller | `overflow-x-auto p-4.5 pt-3` wrapping `min-w-215` (860px) — below that eight columns crush |
| Grid | `grid gap-1.5` + `grid-cols-[repeat(7,minmax(0,1fr))_minmax(0,0.8fr)]` — 7 days + the week column, which is narrower because it is support, not a day |
| Weekday head | `Typography variant="label-sm" weight="semibold"` + `pb-1 text-center tracking-wider text-subtle-foreground uppercase`, `aria-hidden`. **Mon→Sun** from `WEEKDAY_LABELS` |
| Day cell | `flex min-h-17 flex-col rounded-lg border p-1.5` — 68px, the floor for three lines (date / figure / count) without clipping |
| Day (signed) | inline `color-mix` bg + border on `--color-up`/`--color-down`; `border-transparent` |
| Day (breakeven) | `border-border-soft bg-surface-well`, figure `text-muted-foreground` |
| Day (no trades) | `border-border-tile bg-surface-well-soft`, date `text-subtle-foreground`, no figure |
| Day (out of window) | `opacity-35` |
| Day (today) | `ring-1 ring-primary/70` + date `text-primary` + a `size-1 rounded-full bg-primary` dot |
| Padding slot | `<div aria-hidden />` — **no box at all** outside the month |
| Date number | `variant="label-base" weight="semibold"` + `tabular-nums` |
| Day figure | `variant="body-sm" weight="black"` + `truncate tabular-nums` + signed colour, `formatCompactMoney` |
| Day count | `variant="caption"` + `truncate text-subtle-foreground` (`N trades`) |
| Week cell | `flex min-h-17 flex-col justify-center gap-0.5 rounded-lg border border-border-soft bg-surface-well px-2 py-1.5 text-center`; dead week adds `opacity-45` |
| Month nav | Panel `action`: signed month net (`variant="h4" weight="black"`) + traded-day count over `‹ label ›` ghost icon buttons, `min-w-30` label box |

**Tint scale** (`FILL` 10→52%, `EDGE` 24→74%, via `tintPercent(strength, floor, ceiling)`):
`strength = |day P&L| / max |day P&L|` across the **whole view**, linear.

**Pattern notes:**

- **The week runs Monday→Sunday.** A trading week is Mon-Fri; a Sunday-first grid splits the weekend
  across both ends of the row and puts the quietest days either side of the week it is meant to frame.
  `mondayIndex()` = `(getUTCDay() + 6) % 7`. **`DAY_NAMES` in `metrics.ts` stays Sunday-based** — it
  indexes `weekdayPnl` off `getUTCDay()` and must not be reordered; `WEEKDAY_LABELS` in `calendar.ts`
  is the display-order list. Two lists, two jobs.
- **Weekday heads are written out (`Mon`), not single letters.** The reference's `M T W T F S S` has
  two `T`s and two `S`s, so its own header can only be read by counting columns.
- **The nav pages, it does not scope.** The arrows only move between months the filter already
  selected, so the nav can never show a month the chips excluded — `FilterChips` stays the page's
  single source of scope (ui-rules.md → Layout). Both arrows disable on a single-month range.
- **The nav pins the month *key*, not an index.** A filter change rebuilds the range, and an index
  would silently point at a different month; a key that no longer exists falls back to the newest,
  which is the month a trader wants anyway.
- **Today comes from `useSyncExternalStore` with a `null` server snapshot**, never `new Date()` in
  render (hydration desyncs when a render straddles UTC midnight) and never `setState` in an effect
  (double render, and `react-hooks/set-state-in-effect` rejects it). `useTodayKey()` declares what the
  server should see instead of patching it afterwards. `subscribe` must live at **module scope** or
  React re-subscribes every render; the snapshot may return a fresh **string** (compared by
  `Object.is`) but never a fresh object, which would loop forever. **This is the pattern for any
  client-only value** — prefer it to the `AccentSwitcher`'s older effect-based `localStorage` read.
- **Padding slots render nothing.** A bordered empty cell reads as a day that exists and did nothing;
  and padding with the neighbouring month's dates invites reading their P&L into this month's total.
- **One tint scale across the whole view**, never per-month. Per-month scales would paint a $12 day in
  a quiet month the same green as a $140 day in a loud one, which is the exact comparison the tint
  exists to make.
- **The alpha floor is load-bearing.** A $2 day scaled linearly against a $140 day lands near 0% and
  renders as an untraded cell — the quietest traded day would silently claim the trader took the day
  off. `FILL.floor` buys that distinction back.
- **Four states, because they are four different facts:** outside the filter window (dimmed), no
  trades (plain), traded flat ($0.00, neutral), traded up/down (tinted). A breakeven day and a day off
  are not the same thing, and merging them misreports one as the other.
- **The trade count is on the cell, not just the tooltip.** One bad trade is variance, six is a bad
  day; `-$76` alone cannot tell them apart and the tint certainly cannot.
- **`min-h-17` (68px) is the floor, not a preference** *(shortened 2026-07-17)*. Day and week cells
  must carry three lines — date, figure, count — and the grid is 5-6 rows, so the panel is ~6× the
  cell height: every 4px on a cell costs ~24px of page. Cut below 68px and the count clips. Both cells
  share the value because a grid row sizes to its tallest child; changing one alone does nothing.
- **Not `role="grid"`.** ARIA grid semantics need a row structure this CSS grid does not have, and a
  half-declared grid reads *worse* than none. Each cell carries a `title` naming its date, trade count
  and exact P&L — the tint and the compact figure are both approximations, so the precise number lives
  there.
- **P&L reads `metrics.dailyPnl`**, not a second grouping of the trade set. A second source of the same
  number is free to drift from the charts by a rounding step. Only the per-day trade *count* (for the
  cell and its title) is derived from `filtered`.
- **With `Winners` lit the calendar tints winners only** — days holding only losers fall back to
  untraded cells. That is the filtered set doing its job ("how did my winners land across the month"),
  consistent with every other panel, not a bug.
- **Verified:** `npx tsx scripts/verify-calendar.ts` — 26 checks incl. calendar total == net ==
  `166.40`, every week's net == the days above it, every cell's column against an independently
  derived `(getUTCDay()+6)%7`, and no day rendered twice. Browser at 1440/900/600: July 2026 starts
  under **Wed** with 2 leading blanks, week rows read `+$46.1 (3 days)` / `+$120.3 (2 days)`, 7 days →
  month `+$36.57` and that week flips to `-$83.7`, zero console errors.
- **The nav is verified against a real multi-month range** *(2026-07-17)*. A hand-added trade on
  2026-05-18 stretched the dev journal to May→July, so the paging was finally exercisable: opens on
  July (newest, `3 of 3`, next disabled) → prev → **June `+$0.00`** (an empty month inside the range,
  rendered rather than skipped) → prev → **May `+$36.00`** (prev disabled at the first month). The
  key-not-index fallback holds: pinned on May, clicking **7 days** collapses the range to July alone
  and the view falls back to July instead of blanking. May's `$36` day also renders visibly fainter
  than July's `$196` — the shared tint scale working across months, which a per-month scale would
  have flattened to identical greens.

### Target — not built yet
| **InsightCard / AssetCard** | label + big value + note; AssetCard adds a **proportional bar** (`asset-bar` track + fill width `--w:${pct}%` and `--bar` = up/down color via inline `style`). |
| **SideBadge** | LONG → `up`/green, SHORT → blue (`#9dbbff` token), LIQUIDATION → `down`/red. `rounded-full` pill, `text-caption font-black uppercase`. |
| **ResultBadge** | Profit → green (`bg-up`), Loss → red (`bg-down`), Breakeven → neutral grey. Same pill shape. |
| **TradesTable** | shadcn `Table` in an `overflow-x-auto` wrapper (`min-w-[880px]`): sticky `th` (uppercase muted), hover rows, `SideBadge`/`ResultBadge` cells, signed P&L + running-balance coloring, **Load More** (24-row step) + live count. |
| **FilterBar** | `filters` grid (search + 4 selects + from/to date + min/max P&L + sort) + preset **chips** row. `"use client"`; changing any control recomputes the dashboard and clears active chips; Reset restores defaults. |
| **Chart wrappers** | seven recharts charts (see below), each `"use client"` + dynamically imported (`ssr:false`) inside a Panel `chart-body`. The fixed height is required: `ResponsiveContainer` collapses to zero inside an auto-height box. |

### Chart set (recharts)

| Chart | Type | Data (from metrics) | Color rule |
| ----- | ---- | ------------------- | ---------- |
| Equity Curve | line + gradient fill | running equity per trade | brand/blue line, green→transparent gradient |
| Daily P&L | bar | net per trading day | per-bar signed (green/red) |
| Weekday Performance | bar | P&L by weekday | per-bar signed |
| Hourly Performance | bar | P&L by hour (0–23) | per-bar signed |
| Asset Performance | horizontal bar | net per symbol | per-bar signed |
| Long vs Short | bar | Long / Short / Liquidation totals | green / blue / red |
| Win/Loss Distribution | doughnut | wins / losses / breakeven counts | green / red / grey |

Chart defaults (grid `rgba(255,255,255,.055)`, tick `--muted`, tooltip on `--surface`) live in
`shared/config/chart-theme.ts`; **read palette from token CSS vars** so the accent theme stays synced.

---

## Form pattern (RHF + Zod + Field + toast) *(built 2026-07-17 — add/edit-trade + settings)*

The project's **one form shape**. Realised by `TradeFormDialog` (add + edit) and `SettingsPage`.
Build every new form to match.

Files: `features/dashboard/components/trades/TradeFormDialog.tsx` ·
`features/dashboard/components/SettingsPage.tsx` ·
`features/dashboard/schemas/trade.schema.ts` · `features/dashboard/schemas/settings.schema.ts`

| Property | Class |
| -------- | ----- |
| Form container | `flex flex-col gap-4` |
| Field stack | `Field` primitive (label + control + error), `gap-4` between fields |
| Input | `Input` primitive (`bg-input border-border rounded-lg`, focus ring blue) |
| Field error text | `text-body-sm text-down` (via `Field` `error` prop) |
| Submit feedback | **toast** (sonner) — `toast.loading(...)` → `toast.success`/`toast.error` with the same `id` |
| Submit button | `Button` (default) `mt-2 w-full`; `disabled` while submitting |
| Submitting label | swap text to the progressive form (`Saving...`, `Importing...`) |

**Pattern notes:** every form uses **RHF + Zod** with `mode: "onBlur"`; the Zod schema in the
feature's `schemas/*.schema.ts` is the single source of truth. **Inline field errors** come from
`Field`. **Submit/API feedback goes to a toast**, not an inline banner. `noValidate` on the `<form>`;
inputs set `aria-invalid` from the field error. Numeric trade fields coerce/validate as numbers;
`side` validates against the `TradeSide` enum.

**As built — decisions worth keeping:**

- **The client schema mirrors the API DTO; it does not replace it.** Duplicating the rules turns a 400
  round trip into an instant inline message, but the DTO stays the real guard — the API is open, so it
  can never trust the client.
- **Money is validated on the decimal *string*, not with modulo.** `1000.1 * 100` is
  `100010.00000000001` in binary floating point, so `n * 100 % 1 === 0` rejects a valid figure.
- **Optional number inputs use `z.union([z.literal(""), money()])`.** An empty input yields `""`,
  which must mean *unset*, not `0` — coercing it to 0 would silently write a real number.
- **`values`, not `defaultValues`.** The dialog is mounted once for the whole table, so opening it on
  a different row must re-seed it; `defaultValues` would show the previous trade's numbers.
- **`datetime-local` is treated as UTC** (`new Date(\`${local}:00Z\`)`). The app reads every timestamp
  with UTC accessors so hour/weekday buckets are stable for all viewers — the same anchoring the seed
  does. Parsing in the browser's zone would shift a trade into a different hour bucket.
- **Submit is `w-full mt-2` on the settings page, but the dialog uses `DialogFooter`** (Cancel +
  Save). A full-width submit inside a footer would fight the dialog's own two-button rhythm — the
  documented deviation.
- **`toast.loading` → `toast.success`/`toast.error` reuse the same `id`**, so the pending toast is
  *replaced*, never stacked beneath its own result.

### Form card

A form that isn't inline in a panel sits in a card: `Card` primitive `w-full max-w-sm shadow-panel`
(`bg-surface border-border rounded-lg`) · `CardHeader` `text-center` · `CardTitle` `text-h3
text-foreground` · `CardDescription` (`text-body-sm text-muted-foreground`) · `CardContent`
`flex flex-col gap-6`. A thin **Server Component** renders the client form inside it and sets its own
`metadata.title`.

### Centered page shell

`main` `flex min-h-screen items-center justify-center bg-background px-4 py-10` — a full-height
centered container on the dark grid background, no app chrome. Reuse for any standalone centered page
(404, a simple confirmation, a standalone form).

---

## EmptyState — the shared "nothing to draw" panel *(promoted 2026-07-17)*

File: `shared/components/EmptyState.tsx` — `{ icon, message, action?, className? }`

`flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-wash-soft
px-6 py-12 text-center`. The caller supplies position (`className="m-4.5"`), never the chrome.

- **Promoted on its third use.** The ledger hand-repeated this markup for *both* of its empties while
  the calendar kept a fourth copy, and they had already drifted in padding and radius. This is the
  "promote on the second use" rule catching up with reality.
- **`action` is a prop, not an assumption.** "No trades" means something different on an untouched
  journal (add one) than under a filter (clear it), and the exit is what makes the difference legible.
  A dead-end empty state makes the user hunt for the control that trapped them.
- Lives in `shared/components/`, not `ui/` — it is a project composite, not a shadcn primitive.

---

## Global hosts + confirm-before-delete

Files: `shared/components/GlobalHosts.tsx` · `shared/components/ConfirmDialog.tsx` · `shared/stores/confirm.store.ts`

- **`GlobalHosts`** (client) is mounted **once** in the root `app/layout.tsx` and renders the sonner
  **`<Toaster position="top-right" richColors />`** plus the **`<ConfirmDialogHost />`**.
- **Confirm dialog** is imperative: `confirm.store.ts` (zustand) exposes `confirm(options) →
  Promise<boolean>`; a single `ConfirmDialogHost` (built on `Dialog`) reads the store. Options:
  `{ title, description?, confirmLabel?, cancelLabel?, destructive? }` (`destructive` defaults **true**
  → `Button variant="destructive"`; cancel `outline`).
- **Every delete confirms** — `const ok = await confirm({ title, description, confirmLabel: "Delete" });
  if (!ok) return` then the optimistic mutation. Wire this at every destructive action (delete trade).

---

## Loading skeletons (content-shaped)

Use the shadcn **`Skeleton`** for **every** loading placeholder. Never hand-roll `animate-pulse`
divs. **Rule: skeletons mirror the real panel's shape.** Rebuild the actual layout (same Panel, grid,
spacing) and swap each element for a `<Skeleton>` sized to it.

| View | Skeleton shape (matches the real layout) |
| ---- | ---------------------------------------- |
| Overview | 4 strip cells (label + big value) + 4 market tiles |
| Stats | ~27 stat-card blocks in the `auto-fit` grid |
| Charts | each chart body = one full-height `Skeleton` block |
| Trades table | header row + N row skeletons at the real column widths |

---

## Baseline — dark theme

The app is **dark by default** (see ui-tokens.md). Every new component matches these. Values are
token classes — never hex or raw Tailwind colors.

| Property | Correct class |
| -------- | ------------- |
| Page background | `bg-background` (`#05070b`) + the global diagonal wash (no grid — removed 2026-07-17) |
| Panel / card background | `bg-surface` / `bg-card` (`#0b1018`) with the white-overlay gradient |
| Raised tile / well | `bg-surface-raised` (`#101722`) · deepest `bg-black/16–22` |
| Panel / tile border | `border border-border` (`rgba(255,255,255,.09)`) |
| Strong border | `border-border-strong` |
| Input background | `bg-input` (`#080d14`), `border-border` |
| Active / highlight | `text-primary` / `border-primary` (brand, switchable) |
| Focus ring | `ring-ring` (blue) |
| Shadow | `shadow-panel` (`0 18px 45px rgba(0,0,0,.38)`) on raised panels, account card, dialogs, toasts |

### Radius scale

| Element type | Radius |
| ------------ | ------ |
| Panels, cards, tiles, inputs, buttons | `rounded-lg` (8px) |
| Badges / status pills, theme dots, avatar | `rounded-full` |

### Typography

| Role | Class |
| ---- | ----- |
| Page title (`h1`) | `text-display-*`/`text-h1` `font-black text-foreground` (clamp for hero) |
| Big numeric value (balance, stat) | `text-display-lg`/`text-h1` `font-black`, colored by sign |
| Panel / card title | `text-h3`/`text-h4 font-extrabold text-foreground` |
| Body / description | `text-body-sm`/`text-body-base` `text-muted-foreground` |
| Uppercase micro-label (strip, stat title, `th`) | `text-label-*`/`text-caption` `uppercase font-black text-muted-foreground` |

### Color

- Brand / active states: `text-primary` (green/teal, switchable via `data-accent`).
- Body text: `text-foreground` primary, `text-muted-foreground` secondary, `text-subtle-foreground` tertiary.
- **P&L by sign:** `text-up` (green) profit, `text-down` (red) loss — on every signed value.
- Accents: `info` (blue) links/series, `warning` (gold), `purple` for specific metric families.
