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
| Table | `ui/table.tsx` | **shadcn**, CLI-installed when the trades table lands. Sticky `th`, hover rows, `overflow-x-auto` wrapper (the table `min-width` forces horizontal scroll on mobile). |
| DropdownMenu | `ui/dropdown-menu.tsx` | **shadcn** (base-ui). Row actions / overflow menus. (The user menu it also served is gone — no auth.) |
| Skeleton | `ui/skeleton.tsx` | **shadcn** (`animate-pulse rounded-md bg-muted`). **Use for all loading placeholders** — pass geometry via `className`. Never hand-roll `animate-pulse` divs. |
| Toaster | sonner (in `GlobalHosts`) | sonner `<Toaster position="top-right" richColors />` mounted once in root `layout.tsx`. Call `toast.loading/success/error` anywhere. |

---

## Dashboard composites

The trading cockpit's custom composites (no shadcn equivalent). All live under
`features/dashboard/components/*`; the numbers come from `features/dashboard/lib/metrics.ts`.
Rows marked **target** are patterns from `designs/website.index.html` that are not built yet.

### Built — the shell *(imprinted 2026-07-16)*

| Composite | File |
| --------- | ---- |
| DashboardShell | `components/shell/DashboardShell.tsx` |
| BrandBlock | `components/shell/BrandBlock.tsx` |
| SectionNav | `components/shell/SectionNav.tsx` |
| AccountCard | `components/shell/AccountCard.tsx` |
| AccentSwitcher | `components/shell/AccentSwitcher.tsx` |
| Topbar | `components/shell/Topbar.tsx` |
| Panel | `components/Panel.tsx` |

| Property | Class |
| -------- | ----- |
| Shell grid | `grid min-h-screen grid-cols-1 min-[1181px]:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]` |
| Sidebar | `bg-surface/88 backdrop-blur-lg px-4.5 py-5.5 border-b border-border` → `min-[1181px]:sticky min-[1181px]:top-0 min-[1181px]:h-screen min-[1181px]:border-r min-[1181px]:border-b-0` |
| Main | `min-w-0 p-4 md:p-6.5` |
| Panel container | `overflow-hidden rounded-lg border border-border bg-linear-to-b from-surface-wash to-surface-wash-soft shadow-panel scroll-mt-6` |
| Panel header | `flex items-start justify-between gap-3.5 p-4.5 pb-0`; title `Typography variant="h3" weight="black"`; sub `variant="body-sm" text-muted-foreground mt-1.5` |
| Panel body | `p-4.5` (`padded={false}` when the child owns its padding) |
| Raised well | `rounded-lg border border-border-soft bg-surface-well p-2.5` |
| Empty state | `rounded-lg border border-dashed border-border bg-surface-wash-soft p-9 text-center` |
| Card surface | `bg-linear-to-b from-surface-wash to-surface-wash-soft` + `border border-border` + `shadow-panel` |
| Nav item | `flex min-h-10.5 items-center gap-2.5 rounded-lg border border-transparent px-3 text-body-sm font-bold` |
| Nav item (active) | `border-border bg-surface-wash text-foreground` |
| Nav item (idle) | `text-muted-foreground hover:border-border hover:bg-surface-wash hover:text-foreground` |
| Nav marker | `grid size-5.5 place-items-center rounded-md bg-surface-wash text-label-sm font-black text-primary` |
| Brand mark | `grid size-10.5 place-items-center rounded-lg bg-linear-to-br from-primary to-info text-primary-fg` + brand-tinted glow via `color-mix` |
| Micro-label | `Typography variant="label-sm\|label-base" weight="extrabold" className="text-muted-foreground uppercase"` |
| Big numeric | `Typography variant="h1\|display-*" weight="black"` + signed colour |
| Signed value | `text-up` when `>= 0`, `text-down` when `< 0` — never any other colour |
| Hairline | `border-border`; inner wells `border-border-soft`; tiles `border-border-tile` |
| Shadow | `shadow-panel` (panels, account card) |

**Pattern notes:**

- **`Panel` is the only section container.** Every cockpit section renders through it, so the header
  rhythm and surface are defined once. It takes `id` (the sidebar's anchor target) and `scroll-mt-6`
  keeps an anchored section clear of the top edge. Pass `padded={false}` for tables/charts/strips
  that supply their own padding.
- **The sidebar reads the full trade set, the panels read the filtered set.** `AccountCard` is fed
  metrics over *all* trades on purpose: the account's standing must not move when a filter narrows
  the panels beside it.
- **Signed colour is mechanical**, never decorative: `>= 0 → text-up`, `< 0 → text-down`. Win Rate and
  Trades take no tone because they are unsigned.
- **`SectionNav` uses `IntersectionObserver`, not a scroll handler** — it only fires on boundary
  crossings instead of running work every scroll frame. When several sections are visible the topmost
  wins, so the highlight tracks reading position rather than flickering.
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

### Built — Tile, the shared figure card *(imprinted 2026-07-16)*

File: `components/Tile.tsx` — used by the market board **and** the stats grid.

| Property | Class |
| -------- | ----- |
| Container | `relative min-h-30 overflow-hidden rounded-lg border border-border-tile bg-surface-tile p-4` |
| Accent bar | `before:absolute before:top-0 before:left-0 before:h-full before:w-0.75 before:bg-info before:content-['']` |
| Interactive | `transition-all hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-raised/92` |
| Label | `Typography variant="label-base" weight="extrabold"` + `block text-muted-foreground uppercase` |
| Value | `variant="h2" weight="black"` + `mt-2.5 block leading-none wrap-anywhere` + tone |
| Note | `variant="body-sm"` + `mt-2.5 text-muted-foreground` |

**Tone map** (`Tone` is exported from `Tile.tsx` — the one source for figure colour):

| Tone | Class | Meaning |
| ---- | ----- | ------- |
| `up` | `text-up` | profit / good |
| `down` | `text-down` | loss / bad |
| `info` | `text-info` | a ratio — no direction to colour |
| `warning` | `text-warning` | below par but not a loss (win rate < 50%) |
| `neutral` | `text-purple` | reference count, neither good nor bad |

**Pattern notes:**

- **Build every figure card on `Tile`.** The design shares one base between `.market-tile` and
  `.stat-card`; duplicating it would let the two drift. `interactive` adds the hover lift (stats grid
  uses it, the market board does not).
- **`wrap-anywhere` on the value** so a long money string breaks instead of widening its grid track.
- **`neutral` reads the palette's `text-purple` directly.** Fixed, non-themeable hues (`purple`,
  `short`, `flat`) have no role the accent themes could change, so they skip the semantic layer.
  Anything with a *role* (surfaces, borders, accents, P&L) must still go palette → semantic → utility.

### Built — the overview *(imprinted 2026-07-16)*

| Composite | File |
| --------- | ---- |
| Overview | `components/overview/Overview.tsx` |
| AccountStrip | `components/overview/AccountStrip.tsx` |
| MarketBoard | `components/overview/MarketBoard.tsx` (renders `Tile`) |

| Property | Class |
| -------- | ----- |
| Strip container | `grid grid-cols-1 border-y border-border bg-surface-well-soft min-[781px]:grid-cols-4` |
| Strip cell | `@container min-h-28 border-b border-border p-4.5 last:border-b-0 min-[781px]:border-r min-[781px]:border-b-0 min-[781px]:last:border-r-0` |
| Strip label | `Typography variant="label-base" weight="extrabold"` + `text-muted-foreground uppercase` |
| Strip value | `variant="display-lg" weight="black"` + `text-[clamp(1.375rem,19cqi,2.125rem)] leading-none whitespace-nowrap` + tone |
| Strip note | `variant="body-sm" text-muted-foreground mt-2.5` |
| Market board | `grid h-full grid-cols-1 gap-3 sm:grid-cols-2` |
| Market tile | `relative min-h-30 overflow-hidden rounded-lg border border-border-tile bg-surface-tile p-4` |
| Tile accent bar | `before:absolute before:top-0 before:left-0 before:h-full before:w-[3px] before:bg-info before:content-['']` |
| Tile value | `variant="h2" weight="black" mt-2.5 leading-none` + tone |

**Pattern notes:**

- **Tone rules beyond plain sign.** Max Drawdown is **always `text-down`** (a drawdown is a loss
  figure even when small); Profit Factor is **`text-info`** (a ratio has no direction to colour); Win
  Rate is **`text-warning`** below 50% rather than red (a coin flip is not a loss). Everything else
  follows `>= 0 → up`, `< 0 → down`.
- **The tile's 3px left bar uses `bg-info`, not the P&L colour** — it is the design's tile signature
  and follows the accent theme.
- **Strip values size with `cqi`, not `vw`.** The design uses `clamp(22px, 3vw, 34px)`, but `3vw`
  tracks the viewport while the value sits in a cell an eighth as wide: at 1440 its own `$1,166.40`
  renders 169px inside a 133px cell and collides with the neighbour. Each cell is a `@container` and
  the value clamps on `19cqi`, so it still reaches the design's 34px cap on wide screens (verified:
  25px @1440, 34px @1920, zero overflow at both).
- **The strip stays 4-across down to 780px**, even though the overview itself stacks at 1180px.
  Avoid mixing named breakpoints with arbitrary `min-[]` ones on the same property — Tailwind's sort
  order between them is not intuitive, and `md:grid-cols-2` silently beat `min-[1181px]:grid-cols-4`.
- Panel gets the two-column layout via its **`aside`** prop (header + strip left, market board right);
  `children` render unpadded in that mode because the strip is full-bleed.

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

### Target — not built yet
| **InsightCard / AssetCard** | label + big value + note; AssetCard adds a **proportional bar** (`asset-bar` track + fill width `--w:${pct}%` and `--bar` = up/down color via inline `style`). |
| **SideBadge** | LONG → `up`/green, SHORT → blue (`#9dbbff` token), LIQUIDATION → `down`/red. `rounded-full` pill, `text-caption font-black uppercase`. |
| **ResultBadge** | Profit → green (`bg-up`), Loss → red (`bg-down`), Breakeven → neutral grey. Same pill shape. |
| **CalendarHeatmap** | 7-col weekday grid; leading empty cells for the first weekday; each day tinted by P&L intensity (`profit`/`loss` bg + border alpha scaled by `--strength`); date + compact P&L (signed color). `overflow-x-auto`, `min-w-[780px]`. |
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

## Form pattern (RHF + Zod + Field + toast)

The project's **one form shape** — the target for **add-trade**, **edit-trade**, and
**account-settings**. Build every new form to match.

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
| Page background | `bg-background` (`#05070b`) + the global grid |
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
