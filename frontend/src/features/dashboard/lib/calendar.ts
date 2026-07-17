import type { DailyPnl } from "../types/metrics.types";

/**
 * Month names are a fixed list rather than `Intl.DateTimeFormat`, for the same
 * reason format.ts pins `en-US`: these grids are read against a fixed reference,
 * and a locale swap would rename the months under the user.
 */
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * The week runs **Monday to Sunday**, not Sunday to Saturday.
 *
 * A trading week is Mon-Fri, so a Sunday-first grid splits the weekend across
 * both ends of the row and puts the quietest days on either side of the week it
 * is meant to frame. Monday-first keeps the working week contiguous and the
 * weekend together at the end, which is what makes a weekly total mean anything.
 *
 * Written out rather than single letters: "M T W T F S S" has two Ts and two Ss,
 * so the reference's own header can only be read by counting columns.
 */
export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** `getUTCDay()` is Sunday-based (0-6). Shift it so Monday is column 0. */
function mondayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

/** One cell. `pnl === null` means the day had no trades, which is not the same fact as $0.00. */
export interface CalendarDay {
  /** "2026-07-15" — the UTC day key, matching `EnrichedTrade.dayKey`. */
  dayKey: string;
  /** Day of the month, 1-31. */
  date: number;
  /** Net P&L for the day, or null when no trades closed. */
  pnl: number | null;
  trades: number;
  /** False for a day inside the month but outside the active filter window. */
  inRange: boolean;
  /** 0-1: |pnl| against the loudest day in the whole view. 0 when flat or empty. */
  strength: number;
}

/** One row: seven slots, `null` where the month has not started or has ended. */
export interface CalendarWeek {
  key: string;
  days: (CalendarDay | null)[];
  net: number;
  tradedDays: number;
}

export interface CalendarMonth {
  /** "2026-07" — stable React key, and what the month nav pins to. */
  key: string;
  /** "July 2026". */
  label: string;
  /** Net P&L across the month's in-range days. */
  net: number;
  tradedDays: number;
  weeks: CalendarWeek[];
}

/**
 * Build the month grids for the active view.
 *
 * The grid is walked from the **calendar**, not from the trades: every day of
 * every month in range gets a cell, and the data is looked up per day. Mapping
 * the trades to cells instead would silently drop every untraded day, sliding
 * the traded ones left into the wrong weekday — and on a calendar the empty days
 * are half the information.
 *
 * P&L is read from the metric bundle's `dailyPnl` rather than re-grouping the
 * trades here. A second grouping would be a second source of the same number,
 * free to drift from the charts by a rounding step.
 *
 * All date maths uses UTC accessors — the whole app buckets by UTC day, so a
 * local-time grid would file trades under different cells than the charts do.
 */
export function buildCalendarMonths(
  dailyPnl: DailyPnl[],
  range: { from: string; to: string },
): CalendarMonth[] {
  if (!range.from || !range.to) return [];

  const pnlByDay = new Map(dailyPnl.map((d) => [d.date, d.value]));
  // Per-day trade counts come straight from the server bundle now — no second
  // grouping of the trades on the client, so the count can never drift from P&L.
  const countByDay = new Map(dailyPnl.map((d) => [d.date, d.count]));

  // One scale for every month in the view, not one per month: per-month scales
  // would paint a $12 day in a quiet month the same green as a $140 day in a
  // loud one, and comparing days at a glance is the whole point of the tint.
  const maxAbs = Math.max(0, ...dailyPnl.map((d) => Math.abs(d.value)));

  const months: CalendarMonth[] = [];
  const cursor = startOfMonth(range.from);
  const last = startOfMonth(range.to);

  while (cursor <= last) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    const dayCount = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const days: CalendarDay[] = [];
    for (let date = 1; date <= dayCount; date++) {
      const dayKey = toDayKey(year, month, date);
      const inRange = dayKey >= range.from && dayKey <= range.to;
      const pnl = inRange ? (pnlByDay.get(dayKey) ?? null) : null;

      days.push({
        dayKey,
        date,
        pnl,
        trades: inRange ? (countByDay.get(dayKey) ?? 0) : 0,
        inRange,
        strength: pnl && maxAbs ? Math.abs(pnl) / maxAbs : 0,
      });
    }

    const weeks = toWeeks(days, mondayIndex(new Date(Date.UTC(year, month, 1))));

    months.push({
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: `${MONTH_NAMES[month]} ${year}`,
      net: round2(sum(days.map((d) => d.pnl ?? 0))),
      tradedDays: days.filter((d) => d.pnl !== null).length,
      weeks,
    });

    cursor.setUTCMonth(month + 1);
  }

  return months;
}

/**
 * Slice the month into Monday-start rows, padding both ends with `null`.
 *
 * The pad is `null` rather than a neighbouring month's date: a cell showing
 * "31" from last month next to a real "1" invites reading it as this month's
 * data, and its P&L belongs to a total this grid is not showing.
 */
function toWeeks(days: CalendarDay[], leading: number): CalendarWeek[] {
  const slots: (CalendarDay | null)[] = [...Array<null>(leading).fill(null), ...days];
  while (slots.length % 7 !== 0) slots.push(null);

  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < slots.length; i += 7) {
    const row = slots.slice(i, i + 7);
    const traded = row.filter((d): d is CalendarDay => Boolean(d) && d!.pnl !== null);

    weeks.push({
      // The first real day anchors the key: stable across re-renders, and unique
      // even when two months' rows start on the same weekday.
      key: row.find(Boolean)?.dayKey ?? `pad-${i}`,
      days: row,
      net: round2(sum(traded.map((d) => d.pnl ?? 0))),
      tradedDays: traded.length,
    });
  }

  return weeks;
}

/**
 * The tint's alpha, as a percentage for `color-mix`.
 *
 * The floor matters: a genuinely tiny day scaled linearly against a $140 day
 * lands near 0% and renders as an untraded cell, which is a different fact. The
 * floor keeps "I traded and barely moved" visibly distinct from "I did not trade".
 */
export function tintPercent(strength: number, floor: number, ceiling: number): number {
  return round2(floor + (ceiling - floor) * clamp01(strength));
}

function startOfMonth(dayKey: string): Date {
  const [y, m] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

function toDayKey(year: number, month: number, date: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}
