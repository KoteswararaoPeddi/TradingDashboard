# UI Tokens

Design tokens for **Trade Journal**, defined in `frontend/src/shared/styles/theme.css` (imported by
`app/globals.css`). The palette is a **dark analytics theme**: near-black backgrounds, cool slate
text, and a **green/teal brand accent** with a strong **green-up / red-down P&L color language**.
Use these exact tokens throughout; **never** hardcode hex or use raw Tailwind color classes
(`bg-emerald-500`, `text-gray-400`, `text-white`).

> Source of truth: `src/shared/styles/theme.css`. If a token changes there, update this file. The
> resolved values below come **directly from the design** (`context/designs/website.index.html`,
> `:root`). The app is **dark by default** (`color-scheme: dark`) — there is no light theme; `:root`
> holds the dark values.

---

## How It's Structured

`theme.css` uses Tailwind v4 layers (no `tailwind.config.ts` for tokens):

1. **`@theme` foundation** — raw palette scales, the typography scale, and the font family. These
   generate utilities like `bg-surface`, `text-foreground`, `text-h2`, `font-sans`. Key values:
   - `--color-brand` (green/teal, base `#16d18d`) — **primary brand accent** (`--accent-2` in design).
   - `--color-blue` (`#4f8cff`, `--accent`) — links / info / secondary chart series.
   - `--color-gold` (`#f4b15e`, `--accent-3`) and `--color-purple` (`#b28cff`) — tertiary accents.
   - `--color-up` (`#37d98b`) / `--color-down` (`#ff627c`) — the **P&L direction** colors.
   - `--color-ink-*` — the near-black surface ramp (`#05070b → #151f2e`) and slate text ramp.
   - Font family: `--font-sans` → `var(--font-inter)`. **Inter only** — no display/serif font.
2. **`:root` semantic layer** — named CSS vars pointing at the palette (`--background`, `--surface`,
   `--surface-raised`, `--foreground`, `--muted-foreground`, `--border`, `--primary`, `--ring`, …)
   plus shadcn aliases (`--card`, `--popover`, `--muted`, `--accent`, `--destructive`, `--sidebar-*`).
3. **`@theme inline`** — bridges the semantic vars into Tailwind's `--color-*` namespace so utilities
   (`bg-primary`, `text-foreground`, `border-border`, `bg-card`, …) are generated.

```tsx
// Correct — generated utility classes
className="bg-primary text-primary-fg"
className="bg-card text-foreground border-border"

// Correct — CSS variable directly when a utility doesn't fit (gradients, P&L-driven bar widths)
style={{ background: "linear-gradient(135deg, var(--color-brand), var(--color-blue))" }}

// Never — hardcoded hex / raw Tailwind colors
className="bg-[#16d18d] text-gray-400"
className="bg-emerald-500"   // raw Tailwind scale, not a project token — use bg-primary
```

For conditional/merged classes, always use `cn` from `@lib/utils`.

---

## Semantic Tokens (use these in components)

The active theme is **dark**. Values below are the resolved dark values (from the design `:root`).

| Role                    | Utility examples                              | Value (design var)               |
| ----------------------- | --------------------------------------------- | -------------------------------- |
| Primary (brand)         | `bg-primary` `text-primary` `border-primary`  | green/teal `#16d18d` (`--accent-2`) |
| On-primary text         | `text-primary-fg`                             | ink `#06100c`                    |
| Info / blue accent      | `text-info` `bg-info`                         | blue `#4f8cff` (`--accent`)      |
| Warning / gold accent   | `text-warning` `bg-warning`                   | gold `#f4b15e` (`--accent-3`)    |
| Purple accent           | `text-purple`                                 | purple `#b28cff` (`--purple`)    |
| **P&L up / profit**     | `text-up` `bg-up` (`.green`)                  | green `#37d98b` (`--green`)      |
| **P&L down / loss**     | `text-down` `bg-down` (`.red`) / `bg-destructive` | red `#ff627c` (`--red`)      |
| Page background         | `bg-background`                               | `#05070b` (`--bg`)               |
| Surface / card          | `bg-surface` / `bg-card`                      | `#0b1018` (`--surface`)          |
| Raised surface          | `bg-surface-raised`                           | `#101722` (`--surface-2`)        |
| Overlay surface         | `bg-surface-overlay`                          | `#151f2e` (`--surface-3`)        |
| Foreground text         | `text-foreground`                             | `#f4f7fb` (`--text`)             |
| Muted text              | `text-muted-foreground`                       | `#8d99aa` (`--muted`)            |
| Subtle text             | `text-subtle-foreground`                      | `#667085` (`--muted-2`)          |
| Border                  | `border-border`                               | `rgba(255,255,255,.09)`          |
| Strong border           | `border-border-strong`                        | `rgba(255,255,255,.16)`          |
| Input background        | `bg-input`                                    | `#080d14`                        |
| Focus ring              | `ring-ring`                                   | blue `#4f8cff` @ 12% + border    |

**Semantic P&L rule:** profit/positive is **`up` (green)**, loss/negative is **`down` (red)**. Every
number that carries sign meaning (P&L, net, growth, running balance, drawdown) is colored by sign
with these two tokens. Never invent a third "gain" color. White surfaces/text use `bg-surface` /
`text-foreground` — **never** `bg-white` / `text-white` literals.

---

## Accent Themes (switchable)

Three runtime accent themes, toggled by a `data-accent` attribute on `<body>` (default **green**,
plus **violet** and **gold**). Each swaps **only the accent trio**; the surface ramp and the P&L
up/down colors **never change**.

The trio maps to the design's `--accent-2` / `--accent` / `--accent-3`:

- **`--primary`** — the brand hue: brand mark + gradient start, eyebrow, pulse dot, nav icons,
  primary CTA.
- **`--info`** — the secondary accent: tile left accent bars, focus ring, chart series.
- **`--tertiary`** — the third accent.

| `data-accent`     | `--primary` (brand) | `--info` (secondary) | `--tertiary` |
| ----------------- | ------------------- | -------------------- | ------------ |
| `green` (default) | `#16d18d` brand     | `#4f8cff` blue       | `#f4b15e` gold |
| `violet`          | `#37d98b` up-green  | `#b28cff` purple     | `#6ea8ff` blue-soft |
| `gold`            | `#31d0aa` teal      | `#f4b15e` gold       | `#6ea8ff` blue-soft |

> **Careful — the theme's *name* is not always its `--primary`.** The topbar dots render green
> `#16d18d`, violet `#b28cff`, gold `#f4b15e`. For **green** that is `--primary`, but for **violet**
> and **gold** it is `--info`. The design is internally inconsistent here; we reproduce it verbatim.
> So switching to violet turns the accent **bars and focus ring** violet while the eyebrow and pulse
> stay green. That is intended, not a bug.

Wire the switcher via the theme dots in the topbar; it sets `document.body.dataset.accent`. Because
components use the **semantic** `primary`/`info` tokens (never the raw hues), they restyle for free.

---

## Typography Scale

Defined in `@theme` → generates `text-*` size utilities. The dashboard leans on **large, heavy
numeric displays** (balances, stat values) and small uppercase labels.

| Utility            | Size  |  | Utility           | Size |
| ------------------ | ----- |--| ----------------- | ---- |
| `text-display-2xl` | 56px  |  | `text-body-lg`    | 15px |
| `text-display-xl`  | 44px  |  | `text-body-base`  | 14px |
| `text-display-lg`  | 34px  |  | `text-body-sm`    | 13px |
| `text-h1`          | 30px  |  | `text-label-lg`   | 12px |
| `text-h2`          | 23px  |  | `text-label-base` | 11px |
| `text-h3`          | 17px  |  | `text-label-sm`   | 10px |
| `text-h4`          | 15px  |  | `text-caption`    | 10px |
| `text-h5`          | 13px  |  |                   |      |
| `text-h6`          | 11px  |  |                   |      |

**Weights run heavy.** The design uses `font-weight` up to `950` for balances/stat values and
`800–900` for titles and uppercase labels. Register the heavy weights (`800`/`850`/`900`/`950` via
the closest Tailwind weight utilities, e.g. `font-extrabold`/`font-black`) and use them for numeric
displays. Large hero numbers scale with `clamp()` in the design (`h1` clamp 32–56px, strip values
clamp 22–34px) — reproduce with responsive type-scale utilities, never arbitrary `text-[Npx]`.

Uppercase micro-labels (`strip-label`, stat `title`, table `th`) use `text-label-*` /
`text-caption` + `uppercase` + heavy weight + `text-muted-foreground`.

### Fonts

- **Inter** is the only font, loaded via `next/font/google` in the root layout, exposed as
  `--font-inter`, wired to `--font-sans` in `@theme`; `html`/`body` applies `font-sans`. There is
  **no display or serif font**.

If `cn()` merges a custom `text-*` size token, that token must be registered in the
`extendTailwindMerge` list in `src/shared/lib/utils.ts` (so a size class is not conflated with a
color class and dropped).

---

## Radius

`--radius: 0.5rem` (**8px**). shadcn derives `rounded-sm/md/lg/xl` from it. Panels, cards, inputs,
buttons all use the 8px family; badges/pills use `rounded-full`. Use the `rounded-*` utilities, not
arbitrary pixel radii.

---

## Surface, Shadow & Background

- **Layered surfaces:** page `--background` `#05070b`, panels `--surface` `#0b1018`, nested tiles on
  `--surface-raised` / `rgba(7,11,17,.72)`, deepest wells on `--surface-overlay`. Panels use a subtle
  top-to-bottom white overlay gradient (`rgba(255,255,255,.058) → .025`) — expressed inline via
  `var(--color-*)` when a utility doesn't fit.
- **Shadow:** `--shadow: 0 18px 45px rgba(0,0,0,.38)` for raised panels, the account card, dialogs,
  and toasts. Expose as `shadow-panel`.
- **App background grid:** the body carries a faint 42px dotted/line grid over a dark diagonal
  gradient (design `body` background) — a single global style on the app shell, not per-component.

---

## Invariants

- Never hardcode hex in components — use the token utilities (or `var(--token)` when a utility
  doesn't fit, e.g. multi-stop gradients, P&L-proportional bar widths).
- Never use raw Tailwind color classes. Never `bg-emerald-500`, `text-gray-400`, `text-white`,
  `bg-white` (use `text-foreground` / `bg-surface`).
- **P&L color language is law:** profit → `up` (green), loss → `down` (red), by sign. LONG badge =
  green, SHORT badge = blue, LIQUIDATION badge = red (see ui-registry.md).
- Brand is the **green/teal `primary`** accent by default and is **switchable** (green/violet/gold)
  via `data-accent` — build with semantic `primary`/`info`, never the raw hue, so themes just work.
- The app is **dark only** — there is no light theme. Don't add `.dark`/`next-themes` toggling.
- Borders default to `border-border`; `border-border-strong` for stronger edges. Never `border-gray-*`.
- Radius comes from `--radius` (8px) via `rounded-*` — don't hardcode pixel radii.
- Type uses the scale utilities — never arbitrary `text-[Npx]`. Numeric displays run heavy.
- Font is **Inter** (`font-sans`) only — no display or serif font.
