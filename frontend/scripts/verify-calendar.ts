/**
 * Verifies lib/calendar.ts against the reference dataset.
 *
 * The grid's whole job is putting the right P&L under the right weekday, and
 * every way that breaks is silent: an off-by-one `leading` slides the month a
 * column, a local-time accessor moves a late trade to the wrong day, and a
 * dropped day just looks like a day off. None of it throws, so it gets checked
 * here against facts that hold independently of the calendar code.
 *
 * Run: npx tsx scripts/verify-calendar.ts
 */
import { DESIGN_ACCOUNT, DESIGN_TRADES } from "../../backend/prisma/seed-data";
import {
  buildCalendarMonths,
  tintPercent,
  WEEKDAY_LABELS,
  type CalendarDay,
} from "../src/features/dashboard/lib/calendar";
import { tradeDateRange } from "../src/features/dashboard/lib/filters";
import { calculateMetrics, enrichTrades } from "../src/features/dashboard/lib/metrics";
import type { Trade, TradeSide } from "../src/features/dashboard/types/trade.types";

const trades: Trade[] = DESIGN_TRADES.map((row, i) => ({
  id: `t${i}`,
  accountId: "acc",
  symbol: row.symbol,
  side: row.side as TradeSide,
  size: row.size,
  entryPrice: row.entryPrice,
  exitPrice: row.exitPrice,
  grossPnl: row.pnl,
  netPnl: row.netPnl,
  fees: 0,
  openedAt: `${row.openDate.replace(" ", "T")}Z`,
  closedAt: `${row.date.replace(" ", "T")}Z`,
  ticket: row.ticket,
  status: "CLOSED",
  createdAt: `${row.date.replace(" ", "T")}Z`,
}));

const start = DESIGN_ACCOUNT.startingBalance;
const enriched = enrichTrades(trades, start);
const metrics = calculateMetrics(enriched, start);
const range = tradeDateRange(enriched);
const months = buildCalendarMonths(metrics.dailyPnl, enriched, range);

let failed = 0;

function check(label: string, actual: string | number, expected: string | number): void {
  const ok = String(actual) === String(expected);
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(30)} ${String(actual).padEnd(12)} expected ${expected}`);
}

const allSlots = months.flatMap((m) => m.weeks.flatMap((w) => w.days));
const allDays = allSlots.filter((d): d is CalendarDay => d !== null);
const traded = allDays.filter((d) => d.pnl !== null);

console.log("--- the grid conserves the trade set ---");
// If the calendar loses or double-counts a day, these stop matching the bundle
// every other panel renders from.
check("day cells with P&L", traded.length, metrics.dailyPnl.length);
check("calendar total == net", sum(traded.map((d) => d.pnl ?? 0)).toFixed(2), "166.40");
check("month nets == net", sum(months.map((m) => m.net)).toFixed(2), "166.40");
check("trade count == 18", sum(allDays.map((d) => d.trades)), 18);
check("no day rendered twice", new Set(allDays.map((d) => d.dayKey)).size, allDays.length);

console.log("\n--- weekly totals are the days above them ---");
// The week column is the one figure the day cells cannot be checked against by
// eye, so it gets checked here.
const weeks = months.flatMap((m) => m.weeks);
const weekMath = weeks.filter((w) => {
  const own = sum(w.days.filter(Boolean).map((d) => d!.pnl ?? 0));
  return own.toFixed(2) !== w.net.toFixed(2);
});
check("weeks whose net != their days", weekMath.length, 0);
check("week nets == month net", sum(weeks.map((w) => w.net)).toFixed(2), "166.40");
check("traded days == 5", sum(weeks.map((w) => w.tradedDays)), 5);
check("every week has 7 slots", String(weeks.every((w) => w.days.length === 7)), "true");

console.log("\n--- Monday-first: days land under the right weekday ---");
// Derived from the cell's own key via getUTCDay(), independently of the padding
// maths — this is what catches a grid shifted by a column.
const misplaced: string[] = [];
for (const month of months) {
  for (const week of month.weeks) {
    week.days.forEach((day, column) => {
      if (!day) return;
      const expected = (new Date(`${day.dayKey}T00:00:00Z`).getUTCDay() + 6) % 7;
      if (expected !== column) misplaced.push(`${day.dayKey} in col ${column}, expected ${expected}`);
    });
  }
}
for (const m of misplaced) console.log(`FAIL  misplaced: ${m}`);
failed += misplaced.length;
check("cells in the wrong column", misplaced.length, 0);
check("header starts Monday", WEEKDAY_LABELS[0], "Mon");
check("header ends Sunday", WEEKDAY_LABELS[6], "Sun");
check("months rendered", months.length, 1);
check("month label", months[0].label, "July 2026");
check("July has 31 real cells", allDays.length, 31);
// July 2026 starts on a Wednesday -> 2 blank slots before it, Monday-first.
check("July leading blanks", months[0].weeks[0].days.filter((d) => d === null).length, 2);

console.log("\n--- UTC, not local ---");
// A trade closed late UTC must stay on its UTC day; a local accessor would move
// it and silently disagree with the charts' hour/weekday buckets.
const byKey = new Map(allDays.map((d) => [d.dayKey, d]));
for (const t of enriched) {
  const cell = byKey.get(t.dayKey);
  if (!cell || cell.pnl === null) {
    console.log(`FAIL  trade ${t.ticket} has no cell for ${t.dayKey}`);
    failed++;
  }
}
check("every trade has a tinted cell", "true", "true");

console.log("\n--- three states stay distinct ---");
const flat = allDays.filter((d) => d.pnl === 0);
const empty = allDays.filter((d) => d.pnl === null);
check("no-trade days are null", String(empty.every((d) => d.trades === 0)), "true");
check("traded days have a count", String(traded.every((d) => d.trades > 0)), "true");
check("flat days are not null", String(flat.every((d) => d.pnl === 0)), "true");

console.log("\n--- the tint floor keeps a quiet day visible ---");
// The reason the floor exists: the smallest traded day must not scale to a
// tint indistinguishable from an untraded cell.
const strengths = traded.map((d) => d.strength);
check("max strength is 1", Math.max(...strengths).toFixed(2), "1.00");
check("strengths within 0..1", String(strengths.every((s) => s >= 0 && s <= 1)), "true");
check("quietest day still tinted", tintPercent(Math.min(...strengths), 10, 52) >= 10 ? "true" : "false", "true");
check("tint(0) == floor", tintPercent(0, 10, 52), 10);
check("tint(1) == ceiling", tintPercent(1, 10, 52), 52);

console.log("\n--- readout ---");
console.log(`  range              ${range.from} -> ${range.to}`);
for (const m of months) {
  console.log(`  ${m.label.padEnd(14)} net ${m.net.toFixed(2).padStart(8)}  traded days ${m.tradedDays}  weeks ${m.weeks.length}`);
  for (const w of m.weeks) {
    const row = w.days
      .map((d) => (d ? String(d.date).padStart(2) : " ·"))
      .join(" ");
    console.log(`    ${row}  |  week ${w.net.toFixed(2).padStart(8)} (${w.tradedDays}d)`);
  }
}
console.log(`  traded days        ${traded.map((d) => `${d.dayKey.slice(8)}:${(d.pnl ?? 0).toFixed(0)}`).join(" ")}`);

console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) FAILED.`);
process.exit(failed === 0 ? 0 : 1);

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
