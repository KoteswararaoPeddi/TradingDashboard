/**
 * Verifies lib/metrics.ts against the reference design's known results.
 *
 * The design renders a closing balance of $1,166.40, a 50.00% win rate and a
 * 1.53 profit factor from its 18 trades. Those are hand-checkable facts about
 * the dataset, so they make a cheap, honest test of the whole metric bundle.
 *
 * Run: npx tsx scripts/verify-metrics.ts
 */
import { DESIGN_ACCOUNT, DESIGN_TRADES } from "../../backend/prisma/seed-data";
import {
  defaultFilters,
  filterTrades,
  presetFilters,
  tradeDateRange,
  tradeSymbols,
} from "../src/features/dashboard/lib/filters";
import { calculateMetrics, drawdownRecovery, enrichTrades } from "../src/features/dashboard/lib/metrics";
import type { Trade, TradeSide } from "../src/features/dashboard/types/trade.types";

/** Rebuild the API's response shape from the same source rows the seed uses. */
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
const m = calculateMetrics(enriched, start);

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
check("equity curve points", m.equityCurve.length, 19); // 18 trades + the Start point
check("curve starts at balance", m.equityCurve[0].equity, start);
check("curve ends at equity", m.equityCurve[18].equity.toFixed(2), "1166.40");
check("weekday buckets", m.weekdayPnl.length, 7);
check("hour buckets", m.hourlyPnl.length, 24);
check("weekday total == net", m.weekdayPnl.reduce((a, d) => a + d.value, 0).toFixed(2), "166.40");
check("hour total == net", m.hourlyPnl.reduce((a, h) => a + h.value, 0).toFixed(2), "166.40");
check("daily total == net", m.dailyPnl.reduce((a, d) => a + d.value, 0).toFixed(2), "166.40");
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
console.log(`  long / short       ${m.longProfit.toFixed(2)} (${m.longWins}W/${m.longLosses}L) / ${m.shortProfit.toFixed(2)} (${m.shortWins}W/${m.shortLosses}L)`);
console.log(`  streaks            ${m.maxConsecutiveWins}W / ${m.maxConsecutiveLosses}L`);
console.log(`  best hour          ${String(m.bestHour.hour).padStart(2, "0")}:00 (${m.bestHour.value.toFixed(2)})`);
console.log(`  worst hour         ${String(m.worstHour.hour).padStart(2, "0")}:00 (${m.worstHour.value.toFixed(2)})`);
console.log(`  best weekday       ${m.bestWeekday.day} (${m.bestWeekday.value.toFixed(2)})`);
console.log(`  trading days       ${m.dailyPnl.length}`);

console.log("\n--- filters ---");
const range = tradeDateRange(enriched);
check("date range from", range.from, "2026-07-08");
check("date range to", range.to, "2026-07-15");
check("symbols", tradeSymbols(enriched).join(","), "BTCUSD");

const all = filterTrades(enriched, defaultFilters(range.from, range.to));
check("default shows all", all.length, 18);
check("default sort newest", all[0].dayKey, "2026-07-15");

const winners = filterTrades(enriched, presetFilters("profit", range));
check("preset winners", winners.length, 9);
check("winners all > 0", String(winners.every((t) => t.netPnl > 0)), "true");

const losers = filterTrades(enriched, presetFilters("loss", range));
check("preset losses", losers.length, 9);
check("losses all < 0", String(losers.every((t) => t.netPnl < 0)), "true");

const liquidations = filterTrades(enriched, presetFilters("liquidation", range));
check("preset liquidations", liquidations.length, 0); // none in this dataset

const today = filterTrades(enriched, presetFilters("today", range));
check("preset today (latest day)", today.length, 3);

// The set spans 8 days (07-08 .. 07-15), so a 7-day window starts at 07-09 and
// correctly drops the 9 trades that closed on 07-08.
const last7 = filterTrades(enriched, presetFilters("last7", range));
check("preset last 7 days", last7.length, 9);
check("last7 excludes 07-08", String(last7.every((t) => t.dayKey >= "2026-07-09")), "true");

const shorts = filterTrades(enriched, { ...defaultFilters(range.from, range.to), direction: "SHORT" });
check("direction SHORT", shorts.length, 5);

// 53.49, 91.54, 81.61, 82.94, 76.51
const capped = filterTrades(enriched, { ...defaultFilters(range.from, range.to), minPnl: 50 });
check("minPnl >= 50", capped.length, 5);
check("minPnl bound respected", String(capped.every((t) => t.netPnl >= 50)), "true");

// A filtered view must not renumber history: index/balance belong to the account.
const filteredWinners = filterTrades(enriched, presetFilters("profit", range));
check(
  "filtered keeps global index",
  String(filteredWinners.every((t) => enriched[t.index - 1].id === t.id)),
  "true",
);

// Metrics over a subset still reconcile.
const winnerMetrics = calculateMetrics(winners, start);
check("winners profitFactor INF", winnerMetrics.profitFactor === null ? "INF" : "n", "INF");
check("winners win rate", winnerMetrics.winRate.toFixed(2), "100.00");
check("winners net", winnerMetrics.netProfit.toFixed(2), "481.89");

console.log(failed === 0 ? "\n✅ all checks passed" : `\n❌ ${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
