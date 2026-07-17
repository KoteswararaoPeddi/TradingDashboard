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
  /** Trades closed that day — the calendar cell shows it. */
  count: number;
}

/** Net P&L for one calendar month (UTC), computed server-side. */
export interface MonthlyPnl {
  /** "YYYY-MM" */
  month: string;
  value: number;
  /** Distinct days in the month with at least one trade. */
  tradedDays: number;
  /** Trades closed in the month. */
  tradeCount: number;
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
  /** Gain needed to recover the deepest drawdown (asymmetric to maxDrawdown). */
  drawdownRecovery: number;

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
  /** Per-month rollup of dailyPnl — the calendar's MonthNav net reads this. */
  monthlyPnl: MonthlyPnl[];
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

/**
 * The full GET /api/analytics payload: the metric bundle plus the account-level
 * context the filter controls need. `range` and `symbols` describe the whole
 * account (not the filtered set), so the date inputs and asset select stay stable
 * as filters change; `accountTradeCount` is the unfiltered total (the "X of Y"
 * denominator and the empty-state test).
 */
export interface AnalyticsResponse extends TradeMetrics {
  range: { from: string; to: string };
  symbols: string[];
  accountTradeCount: number;
}
