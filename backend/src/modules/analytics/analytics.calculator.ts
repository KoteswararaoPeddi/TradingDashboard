import { EnrichedTrade, RawTrade } from "../trades/trades.logic";

/**
 * Pure analytics — the server-side port of the frontend's calculateMetrics.
 * No Nest, no Prisma: same input, same output, so the 43-check oracle can pin it.
 *
 * Money is Float end-to-end (see schema.prisma), so this computes in plain JS
 * numbers and rounds to 2dp exactly where the frontend did — that identical
 * operation order is what keeps the numbers matching to the cent.
 */

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export interface EquityPoint {
  label: string;
  equity: number;
}
export interface DailyPnl {
  date: string;
  value: number;
  /** Number of trades closed that day — the calendar shows it per cell. */
  count: number;
}
export interface WeekdayPnl {
  day: string;
  value: number;
}
export interface HourlyPnl {
  hour: number;
  label: string;
  value: number;
}
export interface AssetRollup {
  symbol: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
}
export interface DirectionPnl {
  long: number;
  short: number;
  liquidation: number;
}
export interface HourExtreme {
  hour: number;
  value: number;
}
export interface WeekdayExtreme {
  day: string;
  value: number;
}

/** The full analytics bundle. Mirrors the frontend TradeMetrics, minus `sorted` — the row list is served, paginated, by GET /trades. */
export interface TradeAnalytics {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  equity: number;
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
  averageTrade: number;
  profitFactor: number | null;
  rrRatio: number;
  winRate: number;
  growth: number;
  maxDrawdown: number;
  drawdownRecovery: number;
  longProfit: number;
  shortProfit: number;
  liquidationLoss: number;
  liquidationCount: number;
  longWins: number;
  shortWins: number;
  longLosses: number;
  shortLosses: number;
  direction: DirectionPnl;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  equityCurve: EquityPoint[];
  dailyPnl: DailyPnl[];
  weekdayPnl: WeekdayPnl[];
  hourlyPnl: HourlyPnl[];
  assets: AssetRollup[];
  bestHour: HourExtreme;
  worstHour: HourExtreme;
  bestWeekday: WeekdayExtreme;
  worstWeekday: WeekdayExtreme;
}

function round2(value: number): number {
  return Number(value.toFixed(2));
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

/**
 * Derive the full analytics bundle from an already-enriched, already-filtered set.
 * `startingBalance` anchors the equity curve and the drawdown peak.
 */
export function calculateAnalytics<T extends RawTrade>(
  trades: EnrichedTrade<T>[],
  startingBalance: number,
): TradeAnalytics {
  const sorted = [...trades].sort((a, b) => a.closedAtMs - b.closedAtMs);

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

  let bestTrade = sorted.length ? Number.NEGATIVE_INFINITY : 0;
  let worstTrade = sorted.length ? Number.POSITIVE_INFINITY : 0;

  const equityCurve: EquityPoint[] = [{ label: "Start", equity: startingBalance }];
  const weekdayTotals = Array<number>(7).fill(0);
  const hourTotals = Array<number>(24).fill(0);
  const dailyTotals = new Map<string, { value: number; count: number }>();
  const assetTotals = new Map<string, AssetRollup>();
  const direction = { long: 0, short: 0, liquidation: 0 };

  sorted.forEach((entry, i) => {
    const { trade, weekday, hour, dayKey } = entry;
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

    weekdayTotals[weekday] += pnl;
    hourTotals[hour] += pnl;
    const day = dailyTotals.get(dayKey) ?? { value: 0, count: 0 };
    day.value += pnl;
    day.count += 1;
    dailyTotals.set(dayKey, day);

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
    .map(([date, d]) => ({ date, value: round2(d.value), count: d.count }))
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

  const maxDrawdownOut = maxDrawdown;

  return {
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
    profitFactor: grossLoss === 0 ? null : grossProfit / grossLoss,
    rrRatio: avgLoss > 0 ? avgWin / avgLoss : 0,
    winRate: totalTrades ? (wins / totalTrades) * 100 : 0,
    growth: startingBalance > 0 ? (equity / startingBalance - 1) * 100 : 0,
    maxDrawdown: maxDrawdownOut,
    drawdownRecovery: drawdownRecovery(maxDrawdownOut),
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
    bestHour: toHourExtreme(hourRanked[0]),
    worstHour: toHourExtreme(hourRanked[hourRanked.length - 1]),
    bestWeekday: toWeekdayExtreme(weekdayRanked[0]),
    worstWeekday: toWeekdayExtreme(weekdayRanked[weekdayRanked.length - 1]),
  };
}
