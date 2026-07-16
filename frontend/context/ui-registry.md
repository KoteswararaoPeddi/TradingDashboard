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

> **Trade Journal pivot:** this registry is being repointed from the old hospital scaffold to the
> **trading-journal dashboard** in `context/designs/website.index.html`. The old landing/hospital
> composites are removed from the registry; the **dashboard composites below are the target patterns
> from the design** and are logged as "built" only once their code lands. The shadcn primitives and
> the auth form/card patterns carry over (they are domain-agnostic). Theme is now **dark** with the
> green-up / red-down P&L language — class names using semantic tokens (`bg-surface`,
> `text-foreground`, `text-up`/`text-down`, `border-border`) are correct once the tokens are
> repointed in `theme.css`.

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
| Input | `ui/input.tsx` | Dark input: `bg-input border-border`, focus ring blue (`--ring`). RHF `register()` ref flows through via React 19 ref-as-prop. Used by filters, add-trade, settings, auth. |
| Select | `ui/select.tsx` | **shadcn** (base-ui). Filter selects (asset/direction/result/sort). Controlled via `value`/`onValueChange`; with RHF use a `Controller`. Dark popover surface. |
| Field | `ui/field.tsx` | Wrapper: `Label` + control + `error` (`text-body-sm text-down`); `flex flex-col gap-1.5`; optional muted `hint`. Use for every form field. |
| Label | `ui/label.tsx` | `<label>`, `text-body-sm font-medium text-foreground select-none`. |
| PasswordInput | `ui/password-input.tsx` | **Composite**: `Input` + eye/eye-off toggle. Used by Login/Signup. |
| InputOTP | `ui/input-otp.tsx` | shadcn `input-otp` — 6 slots. Signup step 2 (email OTP). Wire via RHF `Controller`. |
| Typography | `ui/typography/` | Polymorphic text component. **All content text goes through it** (variant + weight props); color/layout via `className`. Numeric displays use the heavy weights. |
| Dialog | `ui/dialog.tsx` | **shadcn** (base-ui). Add-trade / edit-trade / confirm dialogs. Controlled via `open`/`onOpenChange`; built-in ✕ (`showCloseButton={false}` to hide). |
| Table | `ui/table.tsx` | **shadcn**, CLI-installed when the trades table lands. Sticky `th`, hover rows, `overflow-x-auto` wrapper (the table `min-width` forces horizontal scroll on mobile). |
| DropdownMenu | `ui/dropdown-menu.tsx` | **shadcn** (base-ui). User menu / row actions. |
| Skeleton | `ui/skeleton.tsx` | **shadcn** (`animate-pulse rounded-md bg-muted`). **Use for all loading placeholders** — pass geometry via `className`. Never hand-roll `animate-pulse` divs. |
| Toaster | sonner (in `GlobalHosts`) | sonner `<Toaster position="top-right" richColors />` mounted once in root `layout.tsx`. Call `toast.loading/success/error` anywhere. |

---

## Dashboard composites (target — from `designs/website.index.html`)

The trading cockpit's custom composites (no shadcn equivalent). Build each on `Card` + tokens; log as
**built** with its file path once the code lands. All live under `features/dashboard/components/*`
(the metrics come from `features/dashboard/lib/metrics.ts`).

| Composite | Pattern (design classes → tokens) |
| --------- | --------------------------------- |
| **AppShell / Sidebar** | `app-shell` grid `[286px_minmax(0,1fr)]`; sidebar sticky, `bg-surface/88 backdrop-blur border-r border-border`, `flex-col gap`. Below 1180px → horizontal nav strip, account card hidden. |
| **Sidebar brand** | brand row: `TJ` mark (`size-11 rounded-lg` green→blue gradient, `text-primary-fg font-black`) + title `text-h4 font-extrabold` over muted uppercase account label. |
| **Sidebar nav** | numbered links (`nav-icon` `size-6 rounded bg-surface-raised text-primary` + label `text-body-sm font-bold`); active = `bg-surface-raised text-foreground border border-border`. Anchors to section ids. |
| **AccountCard** | pinned card (`mt-auto`, gradient surface, `shadow-panel`): big balance (`text-display-lg font-black`, signed color) + 2×2 minis (Net P&L / Growth / Win Rate / Trades) on `bg-black/22` wells. |
| **Topbar** | eyebrow (`text-info` uppercase + pulse dot) + `h1` (clamp 32–56, `font-black`) + muted subline; top actions: accent **theme dots**, Copy Summary (outline), Export CSV (primary gradient). |
| **Panel** | the core container: header (`panel-header`: `text-h3`/`h4` title + muted `text-body-sm` sub, optional header action) + `panel-body` (18px pad). `bg-surface` gradient + `border-border` + `rounded-lg` + `shadow-panel`. |
| **AccountStrip** | 4-cell strip (`grid-cols-4`, divided by `border-border`, on `bg-black/18`): `strip-label` (uppercase muted) + `strip-value` (clamp 22–34 `font-black`, signed color) + `strip-note`. |
| **MarketTile / StatCard** | tile on `bg-surface-raised` + hairline border, 3px left accent bar; uppercase label + big value (signed/family color) + meta line. StatCard hover lifts (`-translate-y-0.5`). Stats grid `auto-fit minmax(180px,1fr)`. |
| **InsightCard / AssetCard** | label + big value + note; AssetCard adds a **proportional bar** (`asset-bar` track + fill width `--w:${pct}%` and `--bar` = up/down color via inline `style`). |
| **SideBadge** | LONG → `up`/green, SHORT → blue (`#9dbbff` token), LIQUIDATION → `down`/red. `rounded-full` pill, `text-caption font-black uppercase`. |
| **ResultBadge** | Profit → green (`bg-up`), Loss → red (`bg-down`), Breakeven → neutral grey. Same pill shape. |
| **CalendarHeatmap** | 7-col weekday grid; leading empty cells for the first weekday; each day tinted by P&L intensity (`profit`/`loss` bg + border alpha scaled by `--strength`); date + compact P&L (signed color). `overflow-x-auto`, `min-w-[780px]`. |
| **TradesTable** | shadcn `Table` in an `overflow-x-auto` wrapper (`min-w-[880px]`): sticky `th` (uppercase muted), hover rows, `SideBadge`/`ResultBadge` cells, signed P&L + running-balance coloring, **Load More** (24-row step) + live count. |
| **FilterBar** | `filters` grid (search + 4 selects + from/to date + min/max P&L + sort) + preset **chips** row. `"use client"`; changing any control recomputes the dashboard and clears active chips; Reset restores defaults. |
| **Chart wrappers** | seven `react-chartjs-2` charts (see below), each dynamically imported (`ssr:false`) inside a Panel `chart-body` (fixed height). |

### Chart set (Chart.js / `react-chartjs-2`)

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

## Auth pattern — carried over from the scaffold

The reusable form/card shapes still apply on the dark theme. **Every future form, form-card, and
full-page centered shell should match these** (token colors resolve to dark values).

### Auth form (`LoginForm`)

File: `src/features/auth/components/LoginForm.tsx`

| Property | Class |
| -------- | ----- |
| Form container | `flex flex-col gap-4` |
| Field stack | `Field` primitive (label + control + error), `gap-4` between fields |
| Input | `Input` primitive (`bg-input border-border rounded-lg`, focus ring blue) |
| Field error text | `text-body-sm text-down` (via `Field` `error` prop) |
| Submit feedback | **toast** (sonner) — `toast.loading(...)` → `toast.success`/`toast.error` with the same `id` |
| Submit button | `Button` (default) `mt-2 w-full`; `disabled` while submitting |
| Submitting label | swap text to `"...ing"` (`Signing in...`, `Creating account...`) |

**Pattern notes:** every form uses **RHF + Zod** with `mode: "onBlur"`; the Zod schema in
`schemas/*.schema.ts` is the single source of truth. **Inline field errors** come from `Field`.
**Submit/API feedback goes to a toast**, not an inline banner. `noValidate` on the `<form>`; inputs
set `aria-invalid` from the field error. Reuse this exact shape for **add-trade**, **edit-trade**,
and **account-settings** forms.

### Auth card page (`login` page)

File: `src/app/(auth)/login/page.tsx`

| Property | Class |
| -------- | ----- |
| Card | `Card` primitive `w-full max-w-sm shadow-panel` (`bg-surface border-border rounded-lg`) |
| Header | `CardHeader` `text-center` |
| Title | `CardTitle` `text-h3 text-foreground` |
| Description | `CardDescription` (`text-body-sm text-muted-foreground`) |
| Content | `CardContent` `flex flex-col gap-6` |
| Footer link row | `text-center text-body-sm text-muted-foreground`; link `text-info hover:underline` |

**Pattern notes:** a thin **Server Component** rendering the client form in a `max-w-sm` card; sets
its own `metadata.title`; cross-link below in muted text with a `text-info` link.

### Centered page shell (`(auth)` layout)

File: `src/app/(auth)/layout.tsx`

| Property | Class |
| -------- | ----- |
| Shell | `main` `flex min-h-screen items-center justify-center bg-background px-4 py-10` |

Full-height centered container on the dark grid background, no app chrome. Reuse for any standalone
centered page (auth, 404, simple confirmations).

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
