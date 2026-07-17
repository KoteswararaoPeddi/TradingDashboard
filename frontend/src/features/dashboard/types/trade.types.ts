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
 * Body for POST /api/trades — mirrors the API's CreateTradeDto.
 *
 * Only the four fields the analytics actually need are required: `lib/metrics.ts`
 * reads `symbol`, `side`, `netPnl` and `closedAt` (plus `openedAt` for hold time).
 * Everything else is display detail on the trades table, so the form never blocks
 * on it. P&L is entered, never derived — see the DTO for why.
 */
export interface CreateTradeInput {
  /**
   * Omit it. The journal has one account and the API resolves it server-side, so
   * the form never has to know an id exists.
   */
  accountId?: string;
  symbol: string;
  side: TradeSide;
  /** Net P&L after fees. Negative for a loss. Every metric builds on this. */
  netPnl: number;
  /** ISO-8601, UTC. */
  closedAt: string;
  openedAt?: string;
  size?: string;
  entryPrice?: number;
  exitPrice?: number;
  fees?: number;
  ticket?: string;
  status?: TradeStatus;
}

/** Body for PATCH /api/trades/:id. A trade's account is fixed at creation. */
export type UpdateTradeInput = Partial<Omit<CreateTradeInput, "accountId">>;

/**
 * Body for PATCH /api/accounts/:id — the journal's settings.
 *
 * There is no create counterpart: this journal is single-user, so its account is
 * a singleton the API provisions on boot. It is never authored, only adjusted —
 * which is why `accountNumber` is absent too, being internal bookkeeping the user
 * has no reason to set.
 */
export interface UpdateAccountInput {
  /** Re-bases every metric derived from the equity curve. */
  startingBalance?: number;
  label?: string;
  currency?: string;
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
  /** Human hold time ("34m 12s"), or null when the open time is unknown. */
  holdTime: string | null;
}

/** One page of trades, as returned by GET /api/trades. */
export interface TradesPage {
  items: EnrichedTrade[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  /** Trades in the whole account (unfiltered) — empty-account vs no-match test. */
  accountTradeCount: number;
}
