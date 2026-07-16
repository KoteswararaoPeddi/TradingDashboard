/** Mirrors the API's TradeSide / TradeStatus enums. */
export type TradeSide = "LONG" | "SHORT" | "LIQUIDATION";
export type TradeStatus = "OPEN" | "CLOSED";

/** A trading account, as returned by GET /api/accounts. */
export interface TradingAccount {
  id: string;
  label: string;
  accountNumber: string;
  startingBalance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A trade exactly as the API returns it. Timestamps are ISO strings anchored to
 * UTC; read them with UTC accessors so hour-of-day and weekday buckets are stable
 * regardless of the viewer's timezone (see engineering/database.md).
 */
export interface Trade {
  id: string;
  accountId: string;
  symbol: string;
  side: TradeSide;
  size: string | null;
  entryPrice: number | null;
  exitPrice: number | null;
  grossPnl: number;
  netPnl: number;
  fees: number;
  openedAt: string | null;
  closedAt: string;
  ticket: string | null;
  status: TradeStatus;
  createdAt: string;
}

/**
 * A trade plus the values derived once across the whole account.
 *
 * `index` and `balanceAfter` are deliberately computed over **all** trades, not
 * the filtered subset: a trade's position in the account's history and the
 * balance it left behind do not change just because a filter hides its
 * neighbours. Recomputing them per filter would renumber rows and rewrite the
 * running balance as the user types.
 */
export interface EnrichedTrade extends Trade {
  /** 1-based position in the account's full chronological history. */
  index: number;
  /** Account balance immediately after this trade closed. */
  balanceAfter: number;
  /** UTC hour the trade closed (0-23). */
  hour: number;
  /** UTC weekday the trade closed (0 = Sunday). */
  weekday: number;
  /** UTC calendar day the trade closed, "YYYY-MM-DD". */
  dayKey: string;
  /** Human hold time ("34m 12s"), or null when the open time is unknown. */
  holdTime: string | null;
}
