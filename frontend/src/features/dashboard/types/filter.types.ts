/** "ALL" plus the trade sides, as the direction select offers them. */
export type DirectionFilter = "ALL" | "LONG" | "SHORT" | "LIQUIDATION";

/** Result buckets, keyed off the sign of net P&L. */
export type ResultFilter = "ALL" | "PROFIT" | "LOSS" | "BREAKEVEN";

export type SortBy = "newest" | "oldest" | "highest" | "lowest" | "asset";

/** The quick-preset chips above the filter grid. */
export type Preset = "all" | "today" | "last7" | "profit" | "loss" | "liquidation";

/**
 * The active view. Every cockpit panel recomputes from the set these select,
 * which is what keeps the overview, stats, charts and table in agreement.
 */
export interface TradeFilters {
  /** Free-text symbol match, case-insensitive. */
  search: string;
  /** "ALL" or an exact symbol. */
  asset: string;
  direction: DirectionFilter;
  result: ResultFilter;
  /** Inclusive "YYYY-MM-DD" bounds, compared against the trade's UTC close day. */
  from: string;
  to: string;
  /** Inclusive net-P&L bounds; null means unbounded. */
  minPnl: number | null;
  maxPnl: number | null;
  sortBy: SortBy;
}
