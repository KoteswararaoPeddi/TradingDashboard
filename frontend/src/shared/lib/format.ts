/**
 * Formatters shared by every panel. Currency is fixed to the account's currency
 * at the call site; the design's dataset is USD.
 *
 * `en-US` is pinned deliberately rather than using the visitor's locale: these
 * are financial figures read against a fixed reference design, and a locale
 * swap would silently change decimal separators and grouping.
 */
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** "$1,166.40" */
export function formatMoney(value: number): string {
  return money.format(value);
}

/** "$1.2K" — for dense surfaces like the calendar heatmap. */
export function formatCompactMoney(value: number): string {
  return compact.format(value);
}

/** "50.00%" */
export function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}

/**
 * "36.5" — the distance price travelled, to one decimal. Unsigned: a distance
 * has no direction, and the Type and P&L columns already carry that.
 */
export function formatPips(value: number): string {
  return value.toFixed(1);
}

/**
 * "1.53", or "INF" when the profit factor is unbounded (no losing trades).
 * metrics.ts models that case as null rather than Infinity.
 */
export function formatProfitFactor(value: number | null): string {
  return value === null ? "INF" : value.toFixed(2);
}

/**
 * "2026-07-15 18:01:35" — timestamps are stored anchored to UTC, so they are
 * rendered in UTC too. Using the viewer's zone would shift a trade's clock time
 * away from the hour bucket the charts put it in.
 */
export function formatTimestamp(iso: string): string {
  return iso.replace("T", " ").replace(/\.\d+Z$/, "").replace("Z", "");
}

/**
 * "15-07-2026" — the display form of a date.
 *
 * The ISO date is sliced out of the string rather than parsed through `Date`:
 * `new Date(iso)` re-projects the instant into the viewer's zone, so a trade
 * closed at 23:30 UTC would show the next day's date in Sydney and the previous
 * day's in Los Angeles, disagreeing with the UTC day the charts bucket it into.
 *
 * Display only. Anything sorted, grouped or compared keeps the raw ISO string,
 * which orders correctly as text; "DD-MM-YYYY" does not.
 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}-${m}-${y}`;
}
