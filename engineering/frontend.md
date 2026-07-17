# Engineering Decisions — Frontend

A teaching record of the **non-obvious** engineering decisions in Trade Journal's frontend: the forks
in the road where we chose a technique over a real alternative, and what transfers from each.

This is deliberately **separate from `frontend/context/`**. The context pipeline tells an agent what
the rules *are*; this file explains *why* they became the rules, so a reader can learn from them.

Newest entries at the top. Split this file by tech area when it outgrows one page.

---

## 2026-07-16 — `position: sticky` dies inside a grid area its own size

**What:** The app shell uses block flow below 1181px and only becomes a grid above it, so the sidebar
can stick on mobile.
**Where:** `features/dashboard/components/shell/DashboardShell.tsx`.
**Why:** `sticky top-0` on the stacked mobile nav did **nothing**. No error, no warning, no visual
clue — the class was applied, DevTools showed `position: sticky`, and it still scrolled away.

### Learn

**Vocabulary**
- **Containing block** — the box a positioned element measures itself against. For `sticky`, the
  element can only travel *within its containing block*, and it stops at that block's edges.
- The catch: for a **grid item**, the containing block is its **grid area** — not the scrollport, not
  the page.

**❌ Naive — looks right, does nothing**

```tsx
// Stacked: sidebar is row 1, main is row 2.
<div className="grid min-h-screen grid-cols-1 min-[1181px]:grid-cols-[286px_1fr]">
  <aside className="sticky top-0">…</aside>   {/* row 1 is exactly as tall as the aside */}
  <main>…</main>
</div>
```

Row 1's height *is* the sidebar's height, so the sidebar's travel range is zero pixels. It is already
at the only position it is allowed to occupy. It "sticks" — to nothing.

**✅ Ours — leave the grid where the grid is the problem**

```tsx
// Block flow on mobile → containing block is the page. Grid only when there
// genuinely are two columns.
<div className="min-h-screen min-[1181px]:grid min-[1181px]:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
  <aside className="sticky top-0 z-30 min-[1181px]:h-screen">…</aside>
  <main>…</main>
</div>
```

**Plain-english why:** Sticky isn't "pin to viewport" — it's "stay put *inside my box* until my box
leaves". The desktop version works by accident of geometry: a two-column grid gives the sidebar's
column the full page height, so it has room to travel. Stack it and the room vanishes. Nothing about
the sidebar changed; its *parent* changed what was possible.

**Why it's nasty:** every debugging instinct points at the sidebar — z-index, transform, overflow,
`top`. The bug is one level up, and the browser reports it as success.

**Where else you'd use this**
- A sticky table header inside a flex column that shrink-wraps its content.
- A sticky sidebar whose ancestor has `overflow: hidden` — same class of bug, different cause
  (that one silently reparents the containing block to the scroller).
- Sticky CTA bars inside a card grid.
- Any `sticky` that works at one breakpoint and mysteriously not at another — the layout mode changed
  underneath it.

**Rule of thumb:** When `sticky` does nothing, stop inspecting the element and **inspect its parent**.
Ask: does this element's containing block have more height than the element itself? If not, there is
nowhere to stick.

---

## 2026-07-16 — Filters that compose, instead of presets that clobber

**What:** The filter chips are two orthogonal axes (time period × result), each writing only its own
fields, rather than one list of presets that rebuilds every field.
**Where:** `features/dashboard/lib/filters.ts` (`periodRange`, `activePeriod`, `activeResult`),
rendered by `components/filters/FilterChips.tsx`.
**Why:** The existing `presetFilters(preset, range)` returned `{...defaultFilters(), ...oneChange}`.
Clean, pure, well-tested — and it made the product's central question unaskable.

### Learn

**Vocabulary**
- **Orthogonal** — two controls are orthogonal when changing one cannot affect the other. Here: a
  period touches `from`/`to`; a result touches `result`/`direction`. No overlap, so they compose.
- **Derived state** — "which chip is lit" is not stored. It is *computed* from the filters, so the
  highlight can never disagree with the data being shown.

**❌ Naive — every preset resets the world**

```ts
export function presetFilters(preset, range) {
  const base = defaultFilters(range.from, range.to);  // wipes everything
  switch (preset) {
    case "last7":  return { ...base, from: sevenDaysAgo, to: range.to };
    case "profit": return { ...base, result: "PROFIT" };   // ← just discarded the date window
  }
}
```

Pick "Winners", then pick "Last 7 days", and Winners is silently gone. The user asked two questions
and the second erased the first.

**✅ Ours — each axis writes only its own fields**

```ts
// A period knows nothing about results.
setFilters(periodRange("7d", range));          // → { from, to }
// A result knows nothing about dates.
setFilters({ direction: "ALL", result: "PROFIT" });

// "Lit" is derived from the filters, never stored alongside them.
const period = activePeriod(filters, range);
const result = activeResult(filters);
```

**Plain-english why:** A preset is a *shortcut*, but this one was a *reset*. Because each chip rebuilt
every field, two chips could never be true at once — the model made the combination unrepresentable.
Splitting the axes means "winners, this week" is just both controls being set, which is what the user
thought they were doing all along.

**The tell:** if selecting one filter visibly un-selects an unrelated one, the state model is wrong.
No amount of UI polish fixes it, because the data structure cannot hold the answer.

**Where else you'd use this**
- Faceted search: category, price, and rating must stack, not replace.
- Table controls: sort, filter, and pagination are three axes — sorting must not reset the filter.
- Date range + granularity on any analytics screen.
- Feature flags / user preferences, where a "profile" that resets unrelated settings surprises people.

**Rule of thumb:** If two controls answer **different questions**, they must **compose**. A preset
that clears unrelated fields isn't a shortcut — it's a state model that can't represent the answer.

---

## 2026-07-16 — One config drives the nav *and* the page titles

**What:** The sidebar's destinations and the topbar's title/subline read from a single array,
`APP_NAV`, rather than each holding its own copy.
**Where:** `src/shared/config/app-nav.config.ts`, consumed by `shell/MainNav.tsx` and
`shell/Topbar.tsx`.
**Why:** The obvious alternative is for the nav to own its links and each page to own its `<h1>`. That
compiles, ships, and drifts — a page ends up called "Analytics" in the sidebar and "Performance" at
the top of itself, and nobody notices for a month because no test asserts that two unrelated files
agree on a string.

### Learn

**Vocabulary**
- **Single source of truth** — one place a fact is written; everywhere else *derives* it. The point
  isn't tidiness, it's that derived values **cannot** disagree, so a whole category of bug stops being
  possible instead of merely being unlikely.
- **Config vs constants** — a *constant* is the authoritative value of something (`/analytics` is the
  path, full stop). *Config* is a structure that drives how something renders (this path, with this
  label, this marker, this subline). Config may import constants; never the reverse.

**❌ Naive — two files, one fact, no link between them**

```tsx
// MainNav.tsx
<Link href="/analytics">Analytics</Link>

// analytics/page.tsx
<h1>Performance</h1>   // drifted, and nothing will ever tell you
```

**✅ Ours — the nav and the title read the same row**

```ts
// app-nav.config.ts
export const APP_NAV: NavItem[] = [
  { href: ROUTES.analytics, label: "Analytics", marker: "02",
    subline: "Every metric and chart for the active trade set." },
];
export function navItemFor(pathname: string) {
  return APP_NAV.find((item) => item.href === pathname);
}
```

```tsx
// Topbar.tsx — the page does not name itself; the config names it
const item = navItemFor(usePathname());
<Typography as="h1" variant="h1" weight="black">{item?.label}</Typography>
```

**Plain-english why:** Two files holding the same string will eventually hold two different strings.
One file holding it means the sidebar and the page heading are *the same fact rendered twice*, so
renaming a page is a one-line change that lands everywhere at once.

**Where else you'd use this**
- Breadcrumbs, a command palette, and a mobile nav all deriving from the same route table.
- A form's Zod schema deriving both validation *and* the TypeScript type (`z.infer`), so a field can't
  validate as one shape and type as another — this project already does it.
- Chart colours reading `var(--color-up)` rather than a JS palette copy, so the accent theme can't
  leave charts behind.
- Email subject lines and in-app notification titles for the same event.

**Rule of thumb:** If two places must agree on a fact, they must **read** it, not **repeat** it.

---

## 2026-07-16 — Never mix named and arbitrary Tailwind breakpoints on one property

**What:** All three column counts on the account strip use `min-[]` breakpoints — no `md:`.
**Where:** `features/dashboard/components/overview/AccountStrip.tsx`.
**Why:** This has now caused the same bug **twice** in this codebase. It is the single most repeated
trap here, which is exactly why it earns an entry.

### Learn

**Vocabulary**
- **Named breakpoint** — Tailwind's built-in `sm: md: lg:` prefixes.
- **Arbitrary breakpoint** — a one-off `min-[1181px]:` prefix.
- **Cascade order** — CSS applies the *last* matching rule of equal specificity. Tailwind decides that
  order when it generates the stylesheet, and its ordering between the two families is not the
  intuitive "narrower first."

**❌ Naive — reads correctly, renders wrong**

```tsx
// "2 up, 3 from md, 6 on wide" — except md: wins at 1440 and you get 3.
className="grid grid-cols-2 md:grid-cols-3 min-[1181px]:grid-cols-6"
```

**✅ Ours — one family, so source order means what it looks like**

```tsx
className="grid grid-cols-2 min-[781px]:grid-cols-3 min-[1181px]:grid-cols-6"
```

**Plain-english why:** You are not writing three rules that apply in order of screen width. You are
writing three CSS rules of equal specificity and *hoping* the generator emits them in the order you
imagined. Stay in one family and the emitted order matches the order you read.

**How it presents:** silently. It typechecks, it lints, the class string looks obviously correct in
review. The only way to catch it is to render at the width in question — which is why this project
verifies layout at 1440 / 900 / 600 in a real browser rather than trusting the class list.

**Where else you'd use this**
- Any responsive property with three-plus stops: `grid-cols`, `flex-direction`, `text-*`, `gap-*`.
- Mixing `dark:` with a custom `[data-theme]` variant on the same property — same equal-specificity
  coin flip.
- Hand-written media queries at overlapping widths in one stylesheet.

**Rule of thumb:** One property, one breakpoint family. If you need a custom stop anywhere, use custom
stops **everywhere** on that property.

---

## 2026-07-16 — Export the map, don't copy it

**What:** `TONE_CLASS` (tone → colour class) is exported from `Tile.tsx` so non-tile figure surfaces
import it.
**Where:** `components/Tile.tsx` → consumed by `overview/AccountStrip.tsx`.
**Why:** The strip needed the same five-way tone vocabulary as the tiles but isn't a tile. The lazy
move is a second `const TONE_CLASS` in the strip. Then someone adds a sixth tone to one of them.

### Learn

**❌ Naive — a second copy, born already drifting**

```tsx
// AccountStrip.tsx
const TONE_CLASS = { up: "text-up", down: "text-down", info: "text-info" };
//                                   ^ quietly missing `warning` and `neutral`
```

**✅ Ours — one map, two consumers**

```tsx
// Tile.tsx
export const TONE_CLASS: Record<Tone, string> = { up: "text-up", /* … */ };

// AccountStrip.tsx
import { TONE_CLASS, type Tone } from "../Tile";
```

**Plain-english why:** `Record<Tone, string>` makes the map **exhaustive** — add a tone to the union
and TypeScript fails every incomplete map. That guarantee is worth exactly one map. Two maps, and the
compiler happily enforces two different versions of the truth.

**Where else you'd use this**
- Status → badge colour, shared by a table cell and a detail header.
- Role → permission set, read by a route guard and a UI toggle.
- Enum → human label, used by a `<Select>` and a CSV export.
- Error code → user-facing message, in an interceptor and an inline field error.

**Rule of thumb:** When a second component needs a mapping, **export it** — don't retype it. The
exhaustiveness check is only worth something if there's one map to check.

---

## 2026-07-16 — Two columns of unrelated content will not agree on height

**What:** The Overview panel dropped its two-column `aside` layout for a single stacked column.
**Where:** `components/overview/Overview.tsx` (was using `Panel`'s `aside` prop).
**Why:** The panel rendered a `1.25fr / 0.75fr` grid: a 4-cell strip on the left, a 2×2 tile board on
the right. The board was simply taller, so the bottom-left of the panel was permanently empty. It read
as a rendering bug.

### Learn

**❌ Naive — fix the symptom**

```tsx
// "add min-height / stretch the cells / drop a spacer in"
<div className="min-h-[250px]">{children}</div>
```

Every one of those is filler propping up a column that has nothing to say, and each breaks again the
moment the content changes length.

**✅ Ours — remove the constraint that created it**

```tsx
// One column: hero over strip. There is no second column to disagree with.
<Panel padded={false}>
  <AccountHero … />
  <AccountStrip metrics={metrics} />
</Panel>
```

**Plain-english why:** `items-stretch` stretches the *column*, not the content inside it. If the two
columns hold unrelated things, their natural heights are unrelated, and the shorter one shows the
difference as dead space. You can't fix that with padding, because the mismatch isn't a spacing bug —
it's the layout asking two independent things to be the same size.

**Where else you'd use this**
- A sidebar-and-content split where the sidebar runs short on some pages.
- Card grids where one card's body is longer — let the grid row size, don't force equal heights.
- A form's two-column field layout when one column has an inline error and the other doesn't.
- Any "why is there a gap here" bug: check whether a parent is coupling two heights that were never
  related.

**Rule of thumb:** Dead space next to content is a **structure** bug, not a spacing bug. Ask what is
forcing the two boxes to share a dimension, and remove that — don't fill the hole.

---

## 2026-07-16 — Facts, no lesson

- **Cockpit is four routes, not one anchored page** (`/dashboard`, `/analytics`, `/trades`,
  `/calendar`). `SectionNav`'s `IntersectionObserver` and `constants/sections.ts` deleted; active
  state is now `usePathname() === href`. *(no lesson — a scope change, not a technique)*
- **`MarketBoard.tsx` removed**; its four figures moved into `AccountStrip`. *(no lesson)*
- **Topbar title demoted** from the account name at up to 56px to the page label at 29px. *(design
  hierarchy; recorded in progress-tracker.md → Decisions)*

---

## 2026-07-17 — Format dates at the render edge, never in the data

**What:** Display dates as `DD-MM-YYYY` through a single `formatDate` helper called in JSX, while
every stored/compared value stays a raw ISO string.
**Where:** `shared/lib/format.ts`, called from `trades/trade-columns.tsx` and `trades/TradesTable.tsx`.
**Why:** The tempting alternative is to reformat once at the source — in `metrics.ts`'s `utcDayKey`,
or when trades arrive from the API — so "the date is just already right" everywhere. That quietly
breaks sorting and grouping.

### Learn

**Vocabulary**
- **ISO 8601** — the `2026-07-15T18:01:35Z` timestamp format. Its fields run largest-to-smallest
  (year, month, day), which is what makes the next point work.
- **Lexicographic order** — plain alphabetical/text ordering, what `localeCompare` and `sort()` do to
  strings by default.
- **Render edge** — the last moment before a value becomes pixels: inside JSX, not in the store, the
  service, or the metric math.

**❌ Naive — reformat at the source**

```ts
// metrics.ts — "format it once and it's right everywhere"
function utcDayKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${d}-${m}-${y}`;          // now every consumer gets DD-MM-YYYY
}

// …and filters.ts still sorts those keys as text:
sorted.sort((a, b) => a.date.localeCompare(b.date));
// "01-08-2026" < "15-07-2026" — August sorts before July. Silently.
```

**✅ Ours — ISO in the data, DD-MM-YYYY at the edge**

```ts
// shared/lib/format.ts — display only
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}-${m}-${y}`;
}
```

```tsx
// trade-columns.tsx — reformatted where it becomes pixels
<span className="block text-foreground">{formatDate(trade.closedAt)}</span>
```

**Plain-english why:** ISO dates sort correctly *as text* with no date parsing at all, because the
year comes first, then the month, then the day — so comparing character by character compares
significance in the right order. `DD-MM-YYYY` puts the least significant number first, so text
comparison sorts by day-of-month and scrambles the year entirely. The moment you reformat in the
data layer, every `localeCompare`, `Map` key and range filter downstream is silently wrong, and
nothing throws: the chart just draws its bars in a nonsense order and you blame the chart.

The second trap is `new Date(iso)` inside the formatter. It looks like the "proper" way to handle a
date, but it converts the instant into *the viewer's* timezone. A trade closed at 23:30 UTC then
renders as the 16th in Sydney and the 15th in Los Angeles, while the charts, which bucket by UTC
day, keep it on the 15th for everyone. The table and the chart would disagree about which day a
trade happened on, depending on where you opened the page. Slicing the string never re-projects
anything, so it cannot drift.

**Where else you'd use this**
- Currency: store integer cents (or a decimal), format `$1,166.40` at the edge — never store the
  formatted string, or you can't add two of them.
- Sorting a table by a user-facing column: sort the underlying value, render the label.
- Phone numbers / IDs: store canonical (E.164), render pretty. Search matches the canonical form.
- Any `Map` or `Set` key built from a date or number: key on the canonical value, label on display.

**Rule of thumb:** **Canonical in the data, human at the edge.** If a value is compared, sorted,
grouped or keyed, formatting it early doesn't save work, it destroys the ordering the raw form gave
you for free.

---

## 2026-07-17 — Build the grid from the calendar, not from the data

**What:** `buildCalendarMonths` walks every day of every month in the filter's range and *looks up*
each day's P&L, instead of walking the trades and placing them into cells.
**Where:** `features/dashboard/lib/calendar.ts`, rendered by `components/calendar/CalendarHeatmap.tsx`.
**Why:** Iterating the data is the reflex — you have `dailyPnl`, you map it to cells. But the empty
days *are* the information on a calendar, and data you don't have can't tell you where it isn't.

### Learn

**Vocabulary**
- **Sparse data** — a collection with entries only where something happened. `dailyPnl` has 5 entries
  for a month, not 31: it says nothing about the other 26 days.
- **Dense grid** — a layout with a slot for every position, occupied or not. A calendar month is
  always 28-31 cells regardless of how many were traded.
- **Leading offset** — the count of blank cells before day 1, so the 1st lands under its real weekday.

**❌ Naive — map the data to cells**

```tsx
// "I have the daily totals, so render them"
{metrics.dailyPnl.map((day) => (
  <DayCell key={day.date} date={day.date} pnl={day.value} />
))}
// July renders as FIVE cells in a row: 8, 11, 12, 14, 15.
// It is not a calendar. It is a bar chart wearing a grid.
```

**✅ Ours — walk the calendar, look up the data**

```ts
const pnlByDay = new Map(dailyPnl.map((d) => [d.date, d.value]));

for (let date = 1; date <= dayCount; date++) {
  const dayKey = toDayKey(year, month, date);
  const inRange = dayKey >= range.from && dayKey <= range.to;
  const pnl = inRange ? (pnlByDay.get(dayKey) ?? null) : null;
  days.push({ dayKey, date, pnl, inRange, /* … */ });
}
```

**Plain-english why:** The question a calendar answers is "what happened on the 13th?", and "nothing"
is a real answer. If you build the grid by iterating what you have, every day you *didn't* trade
simply ceases to exist, and the days you did trade slide left to fill the hole — so the 15th renders
in the 5th cell, under the wrong weekday, and the whole point of a calendar (that Mondays line up
under Mondays) is gone. Walking 1→31 and looking each day up means the shape of the month comes from
the month, and the data only decides how each cell is *painted*.

The `?? null` is the other half. `Map.get` returns `undefined` for a missing day, and it would be
easy to write `?? 0` and move on — but then a day you didn't trade is indistinguishable from a day
you traded to exactly break-even. Those are different facts about a trader, and one of them is a
much better day than the other. `null` means "no trades", `0` means "traded flat", and the cell
renders them differently on purpose.

**Where else you'd use this**
- Time series with gaps: a chart of daily sign-ups must plot zero-days, or a dead week looks like a
  busy one with fewer points.
- A weekly schedule / timetable grid: build the slots, then fill them.
- Pagination or seat maps: render the full set of positions, mark the occupied ones.
- Any report with "no activity" rows: an invoice run that silently omits zero-value months reads as
  though those months were never billed.

**Rule of thumb:** When the layout is fixed and the data is sparse, **iterate the layout and look up
the data** — never iterate the data and hope it reconstructs the layout. Absence is information; a
`.map()` over what you have can't express it.

---

## 2026-07-17 — Two lists for weekdays, because display order is not bucket order

**What:** The calendar displays Mon→Sun from a new `WEEKDAY_LABELS`, while `metrics.ts` keeps its
Sunday-first `DAY_NAMES` untouched.
**Where:** `features/dashboard/lib/calendar.ts` vs `features/dashboard/lib/metrics.ts`.
**Why:** A trading week is Mon-Fri, so the grid must start on Monday. The obvious move — rotate the
`DAY_NAMES` array the project already has — silently corrupts every weekday chart in the app.

### Learn

**Vocabulary**
- **Index-coupled array** — an array whose *positions* are meaningful because something else indexes
  into it. `DAY_NAMES[trade.weekday]` only works while position 0 is the day `getUTCDay()` calls 0.
- **Display order** — the sequence a human should read things in. Unrelated to storage order.

**❌ Naive — reorder the list you already have**

```ts
// metrics.ts — "the calendar needs Monday first, so..."
export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ...200 lines away, this still runs and still "works":
weekdayTotals[trade.weekday] += pnl;          // getUTCDay(): 0 = SUNDAY
const weekdayPnl = weekdayTotals.map((value, i) => ({ day: DAY_NAMES[i], value }));
// Sunday's P&L is now labelled "Mon". The chart renders. Nothing throws.
// "Best weekday: Mon" is wrong by one day, forever.
```

**✅ Ours — a second list, named for its job**

```ts
// calendar.ts — display order only
export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** `getUTCDay()` is Sunday-based (0-6). Shift it so Monday is column 0. */
function mondayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}
```

```ts
// metrics.ts — untouched, still indexed by getUTCDay()
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
```

**Plain-english why:** `DAY_NAMES` looks like a list of labels, but it is really a lookup table keyed
by the number JavaScript's `getUTCDay()` hands you — and that number is fixed by the language: Sunday
is 0, whatever you would prefer. The array's *order is its contract*. Reordering it to suit a new
screen keeps every line of code compiling and every chart rendering, while shifting every weekday
label by one. That is the worst class of bug: no crash, no red, just a dashboard confidently telling
a trader their best day is Monday when it was Sunday.

The fix isn't cleverness, it's naming. Two arrays that *look* identical do different jobs, so they
get different names and live in different modules. `mondayIndex()` does the rotation at the one place
that needs it — the presentation layer — and the maths underneath never learns the calendar exists.

**Where else you'd use this**
- Enum-to-label maps keyed by a DB integer: never reorder for the UI, map at the edge.
- Month arrays indexed by `getMonth()` (0-based January) — same trap, twelve ways to be wrong.
- Status/priority lists where the API's numeric code indexes the array, but the UI wants them sorted
  by severity.
- Any `COLORS[i]` palette indexed by a series id: sorting the legend must not resort the palette.

**Rule of thumb:** If anything indexes into an array by number, **its order is an API**. Need a
different order? Add a second list named for the new job — never rotate the original.

---

## 2026-07-17 — The clock is not a pure input: `useSyncExternalStore`, not an effect

**What:** The calendar's today marker resolves the current date through `useSyncExternalStore` with a
**null server snapshot**, rather than `new Date()` during render or a `setState` in an effect.
**Where:** `useTodayKey()` in `features/dashboard/components/calendar/CalendarHeatmap.tsx`.
**Why:** `new Date()` in render is a hydration bug that only fires at midnight, in production. The
reflexive fix — `useState(null)` + `useEffect(() => setState(...))` — works, but it renders twice and
`react-hooks/set-state-in-effect` rejects it. There is a purpose-built hook for exactly this.

### Learn

**Vocabulary**
- **Hydration** — React attaching to server-rendered HTML in the browser. It assumes the client's
  first render produces *exactly* the markup the server sent.
- **Impure render** — a render whose output depends on something other than props and state. `Date`,
  `Math.random`, and `localStorage` are the usual three.
- **Server snapshot** — `useSyncExternalStore`'s third argument: the value to use when there is no
  browser. This is the whole reason the hook fits here.

**❌ Naive — read the clock in render**

```tsx
const todayKey = new Date().toISOString().slice(0, 10);   // runs on BOTH server and client
<DayCell today={day.dayKey === todayKey} />
// Server renders the 17th at 23:59:59.900. Browser hydrates the 18th at 00:00:00.100.
// Markup mismatch, hydration error, in a component that worked all day yesterday.
```

**❌ Also naive — patch it in an effect**

```tsx
const [todayKey, setTodayKey] = useState<string | null>(null);
useEffect(() => setTodayKey(new Date().toISOString().slice(0, 10)), []);
// Correct output, but every mount renders twice, and the lint rule says no.
```

**✅ Ours — declare the server's answer**

```tsx
const NEVER_CHANGES = () => () => {};   // module scope: subscribe must be stable

function useTodayKey(): string | null {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => new Date().toISOString().slice(0, 10),   // client snapshot
    () => null,                                     // server snapshot
  );
}
```

**Plain-english why:** The server renders the page at one instant and the browser hydrates it at
another — milliseconds later, which is fine, right up until those two instants fall on opposite sides
of midnight. Then the server says the 17th and the browser says the 18th, the markup doesn't match,
and you get a bug that is unreproducible on your machine, invisible in review, and arrives as a
report timestamped 00:00 UTC.

`useSyncExternalStore` exists to read values React doesn't control, and its third argument lets you
*state outright* what the server should see. Returning `null` there means the first client render
matches the server's markup by construction — no cell is marked — and the real date takes over
immediately after. No effect, no second render, no lint suppression: the divergence is declared
rather than patched up afterwards.

Two details that look optional and aren't. `subscribe` lives at module scope because a fresh function
each render makes React tear down and re-subscribe every time. And the client snapshot builds a new
string on every call, which is only safe because React compares snapshots with `Object.is` — equal
strings are equal, so it settles. Return a fresh **object** from a snapshot and you get an infinite
render loop.

**Where else you'd use this**
- `localStorage` / `sessionStorage` reads — theme, accent, dismissed banners.
- `window.matchMedia`, viewport size, online status, `navigator.*` — none exist on the server.
- "3 minutes ago" relative timestamps — server snapshot the absolute time.
- Any third-party non-React store you must read during render.

**Rule of thumb:** If the server cannot know it, **say so in the server snapshot** — don't compute it
in render and don't paper over it in an effect. Render must be a pure function of props and state,
and the clock is neither.

---

## 2026-07-17 — Reset state during render, not in an effect

**What:** When a filter changes, the ledger returns to page 1 by adjusting state *during render*,
not in a `useEffect`.
**Where:** `features/dashboard/components/trades/TradesTable.tsx`.
**Why:** The reflex is `useEffect(() => setPage(1), [filters])`. It is the wrong tool, it paints the
wrong rows for a frame, and `react-hooks/set-state-in-effect` rejects it.

### Learn

**Vocabulary**
- **Derived state** — state that exists only because something else changed. `page` is real state (the
  user picked it), but "page 1 after a filter change" is derived from `filters`.
- **Commit** — the moment React writes a render's output to the DOM. Effects run *after* commit;
  render-phase updates run *before* it.

**❌ Naive — reset in an effect**

```tsx
const [page, setPage] = useState(1);
useEffect(() => setPage(1), [filters]);
// 1. filters change  -> render with page=6 against the NEW 2-page set
// 2. commit          -> the browser paints... whatever page 6 of 2 pages is
// 3. effect runs     -> setPage(1)
// 4. re-render, commit again -> page 1
// The user sees a frame of wrong rows. On a slow device, several.
```

**✅ Ours — adjust while rendering**

```tsx
const [page, setPage] = useState(1);
const [prevFilters, setPrevFilters] = useState(filters);

if (prevFilters !== filters) {
  setPrevFilters(filters);
  setPage(1);
}
```

**Plain-english why:** Calling `setState` while rendering looks illegal, and it would be if you did
it to *another* component. Doing it to your own is a documented React pattern: React notices the
state changed before it has committed anything, throws away the in-progress output, and immediately
re-runs the component with the new value. Nothing reaches the DOM in between, so there is no flash —
the wrong page is never painted, not even for a frame. The effect version *always* paints it, because
effects run after commit, by definition.

The comparison is `prevFilters !== filters`, an identity check, and that only works because the
filters object is replaced rather than mutated (zustand's `set({ filters: {...} })`). Mutate it in
place and this silently never fires — the same trap that makes `useEffect` dependency arrays lie.

The belt-and-braces half is that `pageSlice` clamps anyway. Two mechanisms for one problem sounds
redundant, but they answer different questions: clamping keeps the render *valid* (never an empty
page), the reset keeps it *correct* (page 1 is what you want after re-scoping).

**Where else you'd use this**
- Clearing a selected row when the list it indexes into is replaced.
- Resetting a wizard step when the entity being edited changes.
- Dropping a cached "expanded" set when its tree reloads.
- Any `useEffect` whose whole body is `setSomething(...)` — that is the tell. It is not
  synchronising with an external system, so it is not an effect's job.

**Rule of thumb:** An effect that only calls `setState` is state you should have adjusted during
render. Effects are for talking to the outside world; **reacting to your own props and state is just
rendering.**
