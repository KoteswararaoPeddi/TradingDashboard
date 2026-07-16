import { formatMoney, formatPercent, formatProfitFactor } from "@lib/format";

import type { Tone } from "../components/Tile";
import type { TradeMetrics } from "../types/metrics.types";

export interface StatRow {
  label: string;
  value: string;
  note: string;
  tone: Tone;
}

/**
 * Metrics whose whole family reads as a loss, so they stay red even when the
 * number itself is positive: a 17.99% drawdown or a 5-trade losing streak is
 * never good news.
 */
const NEGATIVE_LABELS = new Set([
  "Losing Trades",
  "Gross Loss",
  "Worst Trade",
  "Average Loss",
  "Long Losses",
  "Short Losses",
  "Liquidation Loss",
  "Max Drawdown",
  "Max Loss Streak",
]);

/** Ratios have no direction to colour, so they read as info. */
const RATIO_LABELS = new Set(["Profit Factor", "Risk Reward Ratio", "Win Rate"]);

/** Reference counts: neither good nor bad, just context. */
const NEUTRAL_LABELS = new Set(["Total Trades", "Starting Balance", "Max Win Streak"]);

/**
 * The design's `colorClass`, ported. Order matters: the family check wins over
 * the sign check, so "Max Drawdown" stays red at +17.99%.
 */
function statTone(label: string, value: string): Tone {
  if (NEGATIVE_LABELS.has(label)) return "down";
  if (value.includes("-")) return "down";
  if (RATIO_LABELS.has(label)) return "info";
  if (NEUTRAL_LABELS.has(label)) return "neutral";
  return "up";
}

/**
 * The 27 core performance stats, in the design's order.
 *
 * Presentation only: every number is read off the metric bundle, so this never
 * computes anything and cannot disagree with the other panels.
 */
export function buildStatRows(metrics: TradeMetrics, startingBalance: number): StatRow[] {
  const rows: Omit<StatRow, "tone">[] = [
    { label: "Total Trades", value: String(metrics.totalTrades), note: "Filtered trade count" },
    { label: "Winning Trades", value: String(metrics.wins), note: "Closed above zero" },
    { label: "Losing Trades", value: String(metrics.losses), note: "Closed below zero" },
    { label: "Win Rate", value: formatPercent(metrics.winRate), note: "Wins divided by trades" },
    { label: "Net Profit", value: formatMoney(metrics.netProfit), note: "Balance impact" },
    { label: "Gross Profit", value: formatMoney(metrics.grossProfit), note: "Total winning P&L" },
    // grossLoss is a positive magnitude; the design shows it signed.
    { label: "Gross Loss", value: `-${formatMoney(metrics.grossLoss)}`, note: "Total losing P&L" },
    {
      label: "Profit Factor",
      value: formatProfitFactor(metrics.profitFactor),
      note: "Gross profit / gross loss",
    },
    { label: "Best Trade", value: formatMoney(metrics.bestTrade), note: "Largest winner" },
    { label: "Worst Trade", value: formatMoney(metrics.worstTrade), note: "Largest loser" },
    { label: "Average Win", value: formatMoney(metrics.avgWin), note: "Mean winning trade" },
    { label: "Average Loss", value: formatMoney(metrics.avgLoss), note: "Mean losing trade" },
    {
      label: "Risk Reward Ratio",
      value: metrics.rrRatio.toFixed(2),
      note: "Average win / average loss",
    },
    { label: "Long Profit", value: formatMoney(metrics.longProfit), note: "Net from longs" },
    { label: "Short Profit", value: formatMoney(metrics.shortProfit), note: "Net from shorts" },
    { label: "Long Wins", value: String(metrics.longWins), note: "Profitable longs" },
    { label: "Short Wins", value: String(metrics.shortWins), note: "Profitable shorts" },
    { label: "Long Losses", value: String(metrics.longLosses), note: "Losing longs" },
    { label: "Short Losses", value: String(metrics.shortLosses), note: "Losing shorts" },
    {
      label: "Liquidation Loss",
      value: formatMoney(metrics.liquidationLoss),
      note: `${metrics.liquidationCount} liquidation entries`,
    },
    {
      label: "Max Drawdown",
      value: formatPercent(metrics.maxDrawdown),
      note: "Largest balance pullback",
    },
    {
      label: "Max Win Streak",
      value: String(metrics.maxConsecutiveWins),
      note: "Best consecutive run",
    },
    {
      label: "Max Loss Streak",
      value: String(metrics.maxConsecutiveLosses),
      note: "Worst consecutive run",
    },
    { label: "Current Balance", value: formatMoney(metrics.equity), note: "Starting balance plus P&L" },
    { label: "Starting Balance", value: formatMoney(startingBalance), note: "Base account balance" },
    { label: "Account Growth", value: formatPercent(metrics.growth), note: "Balance growth" },
    { label: "Average Trade", value: formatMoney(metrics.averageTrade), note: "Net P&L per trade" },
  ];

  return rows.map((row) => ({ ...row, tone: statTone(row.label, row.value) }));
}
