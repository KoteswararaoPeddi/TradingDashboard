import type { EnrichedTrade } from "./trade.types";

/** One point on the equity curve. The first point is the starting balance. */
export interface EquityPoint {
  /** "Start", then the trade's position in the active set ("1", "2", …). */
  label: string;
  equity: number;
}

/** Net P&L for one calendar day (UTC), used by the daily chart and the heatmap. */
export interface DailyPnl {
  /** "YYYY-MM-DD" */
  date: string;
  value: number;
}

/** Net P&L for one weekday. */
export interface WeekdayPnl {
  /** "Sun" … "Sat" */
  day: string;
  value: number;
}

/** Net P&L for one hour of the day (UTC). */
export interface HourlyPnl {
  /** 0-23 */
  hour: number;
  /** "00:00" … "23:00" */
  label: string;
  value: number;
}

/** Per-symbol rollup, used by the asset chart and the leaderboard. */
export interface AssetRollup {
  symbol: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
  /** 0-100 */
  winRate: number;
}

/** Net P&L split by direction. */
export interface DirectionPnl {
  long: number;
  short: number;
  liquidation: number;
}

/** The best/worst hour of the day by net P&L. */
export interface HourExtreme {
  hour: number;
  value: number;
}

/** The best/worst weekday by net P&L. */
export interface WeekdayExtreme {
  day: string;
  value: number;
}

/**
 * Everything the cockpit renders, derived from one trade set.
 *
 * Every panel is a pure function of this bundle, which is what keeps the
 * overview, stats, charts, insights, leaderboard, heatmap and table consistent
 * with whatever the filters currently select.
 */
export interface TradeMetrics {
  /** The active set, chronological. */
  sorted: EnrichedTrade[];

  // Counts
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;

  // Money
  grossProfit: number;
  /** Positive magnitude of losses. */
  grossLoss: number;
  netProfit: number;
  /** Starting balance + net P&L of the active set. */
  equity: number;
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  /** Positive magnitude. */
  avgLoss: number;
  averageTrade: number;

  // Ratios (percentages are 0-100)
  /** null when there are no losses, i.e. an infinite factor. */
  profitFactor: number | null;
  /** avgWin / avgLoss; 0 when there are no losses to compare against. */
  rrRatio: number;
  winRate: number;
  growth: number;
  /** Largest peak-to-valley drawdown, as a percentage. */
  maxDrawdown: number;

  // Direction splits
  longProfit: number;
  shortProfit: number;
  liquidationLoss: number;
  liquidationCount: number;
  longWins: number;
  shortWins: number;
  longLosses: number;
  shortLosses: number;
  direction: DirectionPnl;

  // Streaks
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;

  // Series
  equityCurve: EquityPoint[];
  dailyPnl: DailyPnl[];
  weekdayPnl: WeekdayPnl[];
  hourlyPnl: HourlyPnl[];
  /** Sorted by net P&L, best first. */
  assets: AssetRollup[];

  // Extremes
  bestHour: HourExtreme;
  worstHour: HourExtreme;
  bestWeekday: WeekdayExtreme;
  worstWeekday: WeekdayExtreme;
}
