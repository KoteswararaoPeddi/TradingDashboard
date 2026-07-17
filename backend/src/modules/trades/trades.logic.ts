import { TradeSide } from "@prisma/client";

/**
 * Pure trade-shaping logic — no Nest, no Prisma, no I/O. This is the server-side
 * source of truth for enriching, filtering and sorting a trade set; the analytics
 * calculator builds on it, and TradesService uses it for paginated listing.
 *
 * It is a faithful port of what used to live in the frontend
 * (features/dashboard/lib/{metrics,filters}.ts). Kept pure precisely so the same
 * 43-check oracle that guarded the frontend can guard it here — see
 * test/analytics-oracle.ts.
 */

/**
 * The minimum a raw trade must carry for enrichment. Matches the Prisma row.
 *
 * `entryPrice`/`exitPrice`/`size` are optional because the analytics oracle
 * feeds a trimmed fixture that only carries P&L — they exist here so the same
 * enrichment can derive the row-level `pips` and `filledSize` the table shows.
 */
export interface RawTrade {
  id: string;
  symbol: string;
  side: TradeSide;
  netPnl: number;
  closedAt: Date;
  openedAt: Date | null;
  entryPrice?: number | null;
  exitPrice?: number | null;
  size?: string | null;
}

/** A trade plus the values derived once across the account's full history. */
export interface EnrichedTrade<T extends RawTrade = RawTrade> {
  trade: T;
  /** 1-based position in the account's full chronological history. */
  index: number;
  /** Account balance immediately after this trade closed. */
  balanceAfter: number;
  /** `closedAt` as epoch ms, parsed once so no comparator re-parses it. */
  closedAtMs: number;
  /** UTC hour the trade closed (0-23). */
  hour: number;
  /** UTC weekday the trade closed (0 = Sunday). */
  weekday: number;
  /** UTC calendar day, "YYYY-MM-DD". */
  dayKey: string;
  /** Human hold time ("34m 12s"), or null when the open time is unknown. */
  holdTime: string | null;
  /** Raw price distance |exit - entry|, or null when either price is unknown. */
  pips: number | null;
  /** The filled half of the broker's "requested/filled" size, or null. */
  filledSize: string | null;
}

export type DirectionFilter = "ALL" | "LONG" | "SHORT" | "LIQUIDATION";
export type ResultFilter = "ALL" | "PROFIT" | "LOSS" | "BREAKEVEN";
export type SortBy = "newest" | "oldest" | "highest" | "lowest" | "asset";

/**
 * Server-side filter options. Period chips and presets are a UI concern: the
 * client resolves them to concrete `from`/`to`/`result` before calling, so the
 * backend only ever sees explicit bounds.
 */
export interface TradeFilterOptions {
  search?: string;
  asset?: string;
  direction?: DirectionFilter;
  result?: ResultFilter;
  /** Inclusive "YYYY-MM-DD" bounds, compared against the trade's UTC close day. */
  from?: string;
  to?: string;
  minPnl?: number | null;
  maxPnl?: number | null;
  sortBy?: SortBy;
}

const DAY = 24;

/** UTC calendar-day key. Local accessors would shift trades between buckets. */
function utcDayKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * How far price travelled between entry and exit, as a raw distance.
 *
 * Unsigned and unscaled: BTCUSD 65258.90 → 65295.42 is 36.52. Direction and
 * outcome already have their own columns, so a sign here would only restate them,
 * and leaving it unscaled keeps the figure tied to the Entry/Exit columns by
 * subtraction. Null (never 0) when a price is missing — an untravelled distance is
 * unknown, not zero.
 *
 * This is the single home for the pip figure now: instrument-aware conventions
 * (forex 0.0001 vs JPY 0.01 vs metals/indices/crypto ticks) belong here too, once
 * the schema carries per-symbol pip sizes. Today it is the raw distance the UI
 * already showed, moved server-side so every client reads one definition.
 */
function tradePips(entryPrice?: number | null, exitPrice?: number | null): number | null {
  if (entryPrice == null || exitPrice == null) return null;
  return Math.abs(exitPrice - entryPrice);
}

/**
 * The size that actually traded, from a broker's "requested/filled" pair.
 *
 * The raw field is a string like "0.25/0.25" — what was asked for, then what was
 * filled. Only the filled half is real: on a partial fill the two differ, and P&L
 * is computed off the fill, so showing anything else would print a number the
 * money disagrees with. Tolerates a plain "1" (hand-entered trades carry no pair).
 */
function parseFilledSize(size?: string | null): string | null {
  if (!size) return null;
  const filled = size.includes("/") ? size.slice(size.lastIndexOf("/") + 1) : size;
  return filled.trim() || null;
}

/** "34m 12s" from open→close, or null when the open time is unknown. */
function formatHoldTime(openedAt: Date | null, closedAt: Date): string | null {
  if (!openedAt) return null;
  const totalSeconds = Math.max(0, Math.round((closedAt.getTime() - openedAt.getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours ? `${hours}h` : "", `${minutes}m`, `${seconds}s`].filter(Boolean).join(" ");
}

/**
 * Sort the account's trades chronologically and attach account-level values
 * (`index`, running `balanceAfter`). Run once over the full set: deriving these
 * per filtered view would renumber rows and rewrite the running balance.
 */
export function enrichTrades<T extends RawTrade>(
  trades: T[],
  startingBalance: number,
): EnrichedTrade<T>[] {
  // Parse each closedAt exactly once; everything downstream sorts on closedAtMs.
  const chronological = trades
    .map((trade) => ({ trade, closed: trade.closedAt }))
    .sort((a, b) => a.closed.getTime() - b.closed.getTime());

  let balance = startingBalance;

  return chronological.map(({ trade, closed }, i) => {
    balance += trade.netPnl;
    return {
      trade,
      index: i + 1,
      balanceAfter: balance,
      closedAtMs: closed.getTime(),
      hour: closed.getUTCHours(),
      weekday: closed.getUTCDay(),
      dayKey: utcDayKey(closed),
      holdTime: formatHoldTime(trade.openedAt, closed),
      pips: tradePips(trade.entryPrice, trade.exitPrice),
      filledSize: parseFilledSize(trade.size),
    };
  });
}

/** Narrow the enriched set to the active view, then order it. */
export function filterTrades<T extends RawTrade>(
  trades: EnrichedTrade<T>[],
  filters: TradeFilterOptions,
): EnrichedTrade<T>[] {
  const search = (filters.search ?? "").trim().toLowerCase();

  const matched = trades.filter(({ trade, dayKey }) => {
    if (search && !trade.symbol.toLowerCase().includes(search)) return false;
    if (filters.asset && filters.asset !== "ALL" && trade.symbol !== filters.asset) return false;
    if (filters.direction && filters.direction !== "ALL" && trade.side !== filters.direction) {
      return false;
    }

    // dayKey is "YYYY-MM-DD", so lexical comparison is chronological.
    if (filters.from && dayKey < filters.from) return false;
    if (filters.to && dayKey > filters.to) return false;

    if (filters.minPnl != null && trade.netPnl < filters.minPnl) return false;
    if (filters.maxPnl != null && trade.netPnl > filters.maxPnl) return false;

    if (filters.result === "PROFIT" && trade.netPnl <= 0) return false;
    if (filters.result === "LOSS" && trade.netPnl >= 0) return false;
    if (filters.result === "BREAKEVEN" && trade.netPnl !== 0) return false;

    return true;
  });

  return sortTrades(matched, filters.sortBy ?? "newest");
}

export function sortTrades<T extends RawTrade>(
  trades: EnrichedTrade<T>[],
  sortBy: SortBy,
): EnrichedTrade<T>[] {
  const sorted = [...trades];
  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => b.closedAtMs - a.closedAtMs);
    case "oldest":
      return sorted.sort((a, b) => a.closedAtMs - b.closedAtMs);
    case "highest":
      return sorted.sort((a, b) => b.trade.netPnl - a.trade.netPnl);
    case "lowest":
      return sorted.sort((a, b) => a.trade.netPnl - b.trade.netPnl);
    case "asset":
      // Ties inside a symbol fall back to newest, so the order is deterministic.
      return sorted.sort(
        (a, b) => a.trade.symbol.localeCompare(b.trade.symbol) || b.closedAtMs - a.closedAtMs,
      );
    default:
      return sorted;
  }
}

/** The account's full date span, for seeding the client's date inputs. */
export function tradeDateRange(trades: EnrichedTrade[]): { from: string; to: string } {
  if (!trades.length) return { from: "", to: "" };
  const days = trades.map((t) => t.dayKey).sort();
  return { from: days[0], to: days[days.length - 1] };
}

/** Distinct symbols in the set, for the client's asset select. */
export function tradeSymbols(trades: EnrichedTrade[]): string[] {
  return [...new Set(trades.map((t) => t.trade.symbol))].sort();
}

export const HOURS_IN_DAY = DAY;
