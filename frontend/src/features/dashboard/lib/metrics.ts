import type {
  AssetRollup,
  DailyPnl,
  EquityPoint,
  HourExtreme,
  HourlyPnl,
  TradeMetrics,
  WeekdayExtreme,
  WeekdayPnl,
} from "../types/metrics.types";
import type { EnrichedTrade, Trade } from "../types/trade.types";

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Timestamps are stored anchored to UTC, so every derived calendar value reads
 * UTC too. Using local accessors here would shift trades between hour/weekday
 * buckets depending on where the page is opened, changing the analysis itself.
 */
function utcDayKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatHoldTime(openedAt: string | null, closedAt: string): string | null {
  if (!openedAt) return null;
  const ms = new Date(closedAt).getTime() - new Date(openedAt).getTime();
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours ? `${hours}h` : "", `${minutes}m`, `${seconds}s`].filter(Boolean).join(" ");
}

/**
 * Sort the account's trades chronologically and attach the values that belong to
 * the *account's* history rather than to any filtered view: position (`index`)
 * and the `balanceAfter` running balance.
 *
 * Run this once over the full trade set. Deriving these per filter would renumber
 * rows and rewrite the running balance every time a filter changed.
 */
export function enrichTrades(trades: Trade[], startingBalance: number): EnrichedTrade[] {
  const chronological = [...trades].sort(
    (a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime(),
  );

  let balance = startingBalance;

  return chronological.map((trade, i) => {
    const closed = new Date(trade.closedAt);
    balance += trade.netPnl;

    return {
      ...trade,
      index: i + 1,
      balanceAfter: balance,
      hour: closed.getUTCHours(),
      weekday: closed.getUTCDay(),
      dayKey: utcDayKey(closed),
      holdTime: formatHoldTime(trade.openedAt, trade.closedAt),
    };
  });
}

/**
 * Derive the full metric bundle from a trade set. Pure: same input, same output,
 * no I/O. Every cockpit panel renders from this, so the panels cannot disagree.
 *
 * `startingBalance` anchors the equity curve and the drawdown peak; pass the
 * active account's value.
 */
export function calculateMetrics(
  trades: EnrichedTrade[],
  startingBalance: number,
): TradeMetrics {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime(),
  );

  let equity = startingBalance;
  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let longProfit = 0;
  let shortProfit = 0;
  let liquidationLoss = 0;
  let longWins = 0;
  let shortWins = 0;
  let longLosses = 0;
  let shortLosses = 0;
  let liquidationCount = 0;
  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let peak = startingBalance;
  let maxDrawdown = 0;

  // Empty set: best/worst collapse to 0 rather than ±Infinity.
  let bestTrade = sorted.length ? Number.NEGATIVE_INFINITY : 0;
  let worstTrade = sorted.length ? Number.POSITIVE_INFINITY : 0;

  const equityCurve: EquityPoint[] = [{ label: "Start", equity: startingBalance }];
  const weekdayTotals = Array<number>(7).fill(0);
  const hourTotals = Array<number>(24).fill(0);
  const dailyTotals = new Map<string, number>();
  const assetTotals = new Map<string, AssetRollup>();
  const direction = { long: 0, short: 0, liquidation: 0 };

  sorted.forEach((trade, i) => {
    const pnl = trade.netPnl;

    equity += pnl;
    equityCurve.push({ label: `${i + 1}`, equity: round2(equity) });

    bestTrade = Math.max(bestTrade, pnl);
    worstTrade = Math.min(worstTrade, pnl);

    if (pnl > 0) {
      wins++;
      grossProfit += pnl;
      consecutiveWins++;
      consecutiveLosses = 0;
      maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
    } else if (pnl < 0) {
      losses++;
      grossLoss += Math.abs(pnl);
      consecutiveLosses++;
      consecutiveWins = 0;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
    } else {
      breakevens++;
      consecutiveWins = 0;
      consecutiveLosses = 0;
    }

    if (trade.side === "LONG") {
      longProfit += pnl;
      if (pnl > 0) longWins++;
      if (pnl < 0) longLosses++;
      direction.long += pnl;
    } else if (trade.side === "SHORT") {
      shortProfit += pnl;
      if (pnl > 0) shortWins++;
      if (pnl < 0) shortLosses++;
      direction.short += pnl;
    } else {
      liquidationLoss += pnl;
      liquidationCount++;
      direction.liquidation += pnl;
    }

    weekdayTotals[trade.weekday] += pnl;
    hourTotals[trade.hour] += pnl;
    dailyTotals.set(trade.dayKey, (dailyTotals.get(trade.dayKey) ?? 0) + pnl);

    const asset = assetTotals.get(trade.symbol) ?? {
      symbol: trade.symbol,
      pnl: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
    };
    asset.pnl += pnl;
    asset.trades++;
    if (pnl > 0) asset.wins++;
    if (pnl < 0) asset.losses++;
    assetTotals.set(trade.symbol, asset);

    // Drawdown is measured against the highest balance seen so far, so the peak
    // only ever ratchets up.
    if (equity > peak) peak = equity;
    const drawdown = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  });

  const totalTrades = sorted.length;
  const netProfit = equity - startingBalance;
  const avgWin = wins ? grossProfit / wins : 0;
  const avgLoss = losses ? grossLoss / losses : 0;

  const assets = [...assetTotals.values()]
    .map((asset) => ({
      ...asset,
      winRate: asset.trades ? (asset.wins / asset.trades) * 100 : 0,
    }))
    .sort((a, b) => b.pnl - a.pnl);

  const dailyPnl: DailyPnl[] = [...dailyTotals.entries()]
    .map(([date, value]) => ({ date, value: round2(value) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const weekdayPnl: WeekdayPnl[] = weekdayTotals.map((value, i) => ({
    day: DAY_NAMES[i],
    value: round2(value),
  }));

  const hourlyPnl: HourlyPnl[] = hourTotals.map((value, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    value: round2(value),
  }));

  const hourRanked = [...hourlyPnl].sort((a, b) => b.value - a.value);
  const weekdayRanked = [...weekdayPnl].sort((a, b) => b.value - a.value);

  const bestHour: HourExtreme = toHourExtreme(hourRanked[0]);
  const worstHour: HourExtreme = toHourExtreme(hourRanked[hourRanked.length - 1]);
  const bestWeekday: WeekdayExtreme = toWeekdayExtreme(weekdayRanked[0]);
  const worstWeekday: WeekdayExtreme = toWeekdayExtreme(weekdayRanked[weekdayRanked.length - 1]);

  return {
    sorted,
    totalTrades,
    wins,
    losses,
    breakevens,
    grossProfit,
    grossLoss,
    netProfit,
    equity,
    bestTrade,
    worstTrade,
    avgWin,
    avgLoss,
    averageTrade: totalTrades ? netProfit / totalTrades : 0,
    // No losses means the factor is unbounded; null says so honestly instead of
    // dividing by zero and rendering "Infinity".
    profitFactor: grossLoss === 0 ? null : grossProfit / grossLoss,
    rrRatio: avgLoss > 0 ? avgWin / avgLoss : 0,
    winRate: totalTrades ? (wins / totalTrades) * 100 : 0,
    growth: startingBalance > 0 ? (equity / startingBalance - 1) * 100 : 0,
    maxDrawdown,
    longProfit,
    shortProfit,
    liquidationLoss,
    liquidationCount,
    longWins,
    shortWins,
    longLosses,
    shortLosses,
    direction,
    maxConsecutiveWins,
    maxConsecutiveLosses,
    equityCurve,
    dailyPnl,
    weekdayPnl,
    hourlyPnl,
    assets,
    bestHour,
    worstHour,
    bestWeekday,
    worstWeekday,
  };
}

/**
 * The gain needed to climb back from the deepest drawdown. Losing 50% needs
 * +100% to recover, not +50% — the asymmetry is the point of showing it.
 */
export function drawdownRecovery(maxDrawdownPct: number): number {
  if (maxDrawdownPct <= 0 || maxDrawdownPct >= 100) return 0;
  return (1 / (1 - maxDrawdownPct / 100) - 1) * 100;
}

function toHourExtreme(entry: HourlyPnl | undefined): HourExtreme {
  return entry ? { hour: entry.hour, value: entry.value } : { hour: 0, value: 0 };
}

function toWeekdayExtreme(entry: WeekdayPnl | undefined): WeekdayExtreme {
  return entry ? { day: entry.day, value: entry.value } : { day: "N/A", value: 0 };
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}
