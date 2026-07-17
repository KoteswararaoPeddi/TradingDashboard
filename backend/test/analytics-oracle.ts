/**
 * Backend port of the frontend's verify-metrics oracle.
 *
 * Asserts the server-side analytics calculator reproduces the reference design's
 * hand-checked results ($1,166.40 closing balance, 50% win rate, 1.53 profit
 * factor) from the same 18 seed rows. This is the safety net for the frontend →
 * backend calculation move: tsc/build can't tell you the math is right, this can.
 *
 * Run: npx tsx test/analytics-oracle.ts
 */
import { DESIGN_ACCOUNT, DESIGN_TRADES } from "../prisma/seed-data";
import {
  calculateAnalytics,
  drawdownRecovery,
} from "../src/modules/analytics/analytics.calculator";
import {
  enrichTrades,
  filterTrades,
  tradeDateRange,
  tradeSymbols,
  type RawTrade,
  type TradeFilterOptions,
} from "../src/modules/trades/trades.logic";
import { TradeSide } from "@prisma/client";

/** Same UTC anchoring the seed uses, so buckets land on the same hour/day. */
const toUtc = (wallClock: string): Date => new Date(`${wallClock.replace(" ", "T")}Z`);
const toSide = (s: string): TradeSide => s.trim().toUpperCase() as TradeSide;

const raw: RawTrade[] = DESIGN_TRADES.map((row, i) => ({
  id: `t${i}`,
  symbol: row.symbol,
  side: toSide(row.side),
  netPnl: row.netPnl,
  closedAt: toUtc(row.date),
  openedAt: toUtc(row.openDate),
  entryPrice: row.entryPrice,
  exitPrice: row.exitPrice,
  size: row.size,
}));

const start = DESIGN_ACCOUNT.startingBalance;
const enriched = enrichTrades(raw, start);
const m = calculateAnalytics(enriched, start);

let failed = 0;
function check(label: string, actual: string | number, expected: string | number): void {
  const ok = String(actual) === String(expected);
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(28)} ${String(actual).padEnd(12)} expected ${expected}`);
}

console.log("--- acceptance criteria (from the reference design) ---");
check("trades", m.totalTrades, 18);
check("closing balance", m.equity.toFixed(2), "1166.40");
check("net profit", m.netProfit.toFixed(2), "166.40");
check("win rate %", m.winRate.toFixed(2), "50.00");
check("wins", m.wins, 9);
check("losses", m.losses, 9);
check("profit factor", m.profitFactor?.toFixed(2) ?? "INF", "1.53");
check("gross profit", m.grossProfit.toFixed(2), "481.89");
check("gross loss", m.grossLoss.toFixed(2), "315.49");

console.log("\n--- internal consistency ---");
check("equity curve points", m.equityCurve.length, 19);
check("curve starts at balance", m.equityCurve[0].equity, start);
check("curve ends at equity", m.equityCurve[18].equity.toFixed(2), "1166.40");
check("weekday buckets", m.weekdayPnl.length, 7);
check("hour buckets", m.hourlyPnl.length, 24);
check("weekday total == net", m.weekdayPnl.reduce((a, d) => a + d.value, 0).toFixed(2), "166.40");
check("hour total == net", m.hourlyPnl.reduce((a, h) => a + h.value, 0).toFixed(2), "166.40");
check("daily total == net", m.dailyPnl.reduce((a, d) => a + d.value, 0).toFixed(2), "166.40");
check("monthly total == net", m.monthlyPnl.reduce((a, d) => a + d.value, 0).toFixed(2), "166.40");
check("asset total == net", m.assets.reduce((a, x) => a + x.pnl, 0).toFixed(2), "166.40");
check("direction total == net", (m.direction.long + m.direction.short + m.direction.liquidation).toFixed(2), "166.40");
check("wins+losses+be == total", m.wins + m.losses + m.breakevens, 18);
check("running balance == equity", enriched[17].balanceAfter.toFixed(2), "1166.40");
check("last index", enriched[17].index, 18);
check("assets sorted desc", String(m.assets.every((a, i, arr) => i === 0 || arr[i - 1].pnl >= a.pnl)), "true");

console.log("\n--- derived readouts ---");
console.log(`  symbols            ${m.assets.map((a) => `${a.symbol} ${a.pnl.toFixed(2)}`).join(", ")}`);
console.log(`  max drawdown       ${m.maxDrawdown.toFixed(2)}%`);
console.log(`  drawdown recovery  ${drawdownRecovery(m.maxDrawdown).toFixed(2)}%`);
console.log(`  best / worst trade ${m.bestTrade.toFixed(2)} / ${m.worstTrade.toFixed(2)}`);
console.log(`  avg win / avg loss ${m.avgWin.toFixed(2)} / ${m.avgLoss.toFixed(2)}  (R:R ${m.rrRatio.toFixed(2)})`);

console.log("\n--- filters ---");
const range = tradeDateRange(enriched);
check("date range from", range.from, "2026-07-08");
check("date range to", range.to, "2026-07-15");
check("symbols", tradeSymbols(enriched).join(","), "BTCUSD");

const base: TradeFilterOptions = { from: range.from, to: range.to, sortBy: "newest" };
const all = filterTrades(enriched, base);
check("default shows all", all.length, 18);
check("default sort newest", all[0].dayKey, "2026-07-15");

const winners = filterTrades(enriched, { ...base, result: "PROFIT" });
check("preset winners", winners.length, 9);
check("winners all > 0", String(winners.every((t) => t.trade.netPnl > 0)), "true");

const losers = filterTrades(enriched, { ...base, result: "LOSS" });
check("preset losses", losers.length, 9);
check("losses all < 0", String(losers.every((t) => t.trade.netPnl < 0)), "true");

const liquidations = filterTrades(enriched, { ...base, direction: "LIQUIDATION" });
check("preset liquidations", liquidations.length, 0);

const today = filterTrades(enriched, { ...base, from: range.to, to: range.to });
check("preset today (latest day)", today.length, 3);

// 7-day window ending on the latest day: 07-09 .. 07-15, dropping the 9 07-08 trades.
const last7 = filterTrades(enriched, { ...base, from: "2026-07-09", to: range.to });
check("preset last 7 days", last7.length, 9);
check("last7 excludes 07-08", String(last7.every((t) => t.dayKey >= "2026-07-09")), "true");

const shorts = filterTrades(enriched, { ...base, direction: "SHORT" });
check("direction SHORT", shorts.length, 5);

const capped = filterTrades(enriched, { ...base, minPnl: 50 });
check("minPnl >= 50", capped.length, 5);
check("minPnl bound respected", String(capped.every((t) => t.trade.netPnl >= 50)), "true");

// A filtered view must not renumber history: index/balance belong to the account.
check(
  "filtered keeps global index",
  String(winners.every((t) => enriched[t.index - 1].trade.id === t.trade.id)),
  "true",
);

// Analytics over a subset still reconcile.
const winnerMetrics = calculateAnalytics(winners, start);
check("winners profitFactor INF", winnerMetrics.profitFactor === null ? "INF" : "n", "INF");
check("winners win rate", winnerMetrics.winRate.toFixed(2), "100.00");
check("winners net", winnerMetrics.netProfit.toFixed(2), "481.89");

console.log("\n--- monthly rollup (calendar / MonthNav source) ---");
// Every seed row closed in July 2026, so the whole account rolls into one month.
check("monthly buckets", m.monthlyPnl.length, 1);
check("month key", m.monthlyPnl[0].month, "2026-07");
check("month net", m.monthlyPnl[0].value.toFixed(2), "166.40");
check("month trade count", m.monthlyPnl[0].tradeCount, 18);
check("month traded days == daily", m.monthlyPnl[0].tradedDays, m.dailyPnl.length);

console.log("\n--- row fields (pips / filled size) ---");
check("all rows carry pips", String(enriched.every((t) => t.pips !== null)), "true");
check("all rows carry filled size", String(enriched.every((t) => t.filledSize !== null)), "true");
// "0.01/0.01" → "0.01", "0.25/0.25" → "0.25", "1/1" → "1".
check("filled size parsed", [...new Set(enriched.map((t) => t.filledSize))].sort().join(","), "0.01,0.25,1");
const btc = enriched.find((t) => t.trade.entryPrice === 65258.9);
check("pips == |exit - entry|", btc?.pips?.toFixed(2) ?? "MISSING", "36.52");
// The strong identity (ported from the retired frontend verify-pips): fees are
// zero on every seed row, so netPnl is exactly the price move times the filled
// size. If the subtraction inverts, scales, or drops its sign, this breaks.
const identityBreaks = enriched.filter((t) => {
  const implied = (t.pips ?? 0) * Number(t.filledSize ?? 0);
  return Math.abs(implied - Math.abs(t.trade.netPnl)) > 0.01;
}).length;
check("pips x size == |netPnl| (all rows)", identityBreaks, 0);

console.log(failed === 0 ? "\n✅ all checks passed" : `\n❌ ${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
