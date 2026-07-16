import type { Preset, TradeFilters } from "../types/filter.types";
import type { EnrichedTrade } from "../types/trade.types";

/** Filters with every constraint open. `from`/`to` are set from the data's range. */
export function defaultFilters(from: string, to: string): TradeFilters {
  return {
    search: "",
    asset: "ALL",
    direction: "ALL",
    result: "ALL",
    from,
    to,
    minPnl: null,
    maxPnl: null,
    sortBy: "newest",
  };
}

/** The account's full date span, used to seed and reset the date inputs. */
export function tradeDateRange(trades: EnrichedTrade[]): { from: string; to: string } {
  if (!trades.length) return { from: "", to: "" };
  const days = trades.map((t) => t.dayKey).sort();
  return { from: days[0], to: days[days.length - 1] };
}

/** Distinct symbols in the set, for the asset select. */
export function tradeSymbols(trades: EnrichedTrade[]): string[] {
  return [...new Set(trades.map((t) => t.symbol))].sort();
}

/**
 * Narrow the set to the active view, then order it.
 *
 * Pure and synchronous: with a personal journal's trade count this runs in
 * microseconds, so the whole dashboard can recompute on every keystroke without
 * a round trip.
 */
export function filterTrades(trades: EnrichedTrade[], filters: TradeFilters): EnrichedTrade[] {
  const search = filters.search.trim().toLowerCase();

  const matched = trades.filter((trade) => {
    if (search && !trade.symbol.toLowerCase().includes(search)) return false;
    if (filters.asset !== "ALL" && trade.symbol !== filters.asset) return false;
    if (filters.direction !== "ALL" && trade.side !== filters.direction) return false;

    // dayKey is "YYYY-MM-DD", so lexical comparison is chronological.
    if (filters.from && trade.dayKey < filters.from) return false;
    if (filters.to && trade.dayKey > filters.to) return false;

    if (filters.minPnl !== null && trade.netPnl < filters.minPnl) return false;
    if (filters.maxPnl !== null && trade.netPnl > filters.maxPnl) return false;

    if (filters.result === "PROFIT" && trade.netPnl <= 0) return false;
    if (filters.result === "LOSS" && trade.netPnl >= 0) return false;
    if (filters.result === "BREAKEVEN" && trade.netPnl !== 0) return false;

    return true;
  });

  return sortTrades(matched, filters.sortBy);
}

function sortTrades(trades: EnrichedTrade[], sortBy: TradeFilters["sortBy"]): EnrichedTrade[] {
  const sorted = [...trades];
  const closedAt = (t: EnrichedTrade) => new Date(t.closedAt).getTime();

  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => closedAt(b) - closedAt(a));
    case "oldest":
      return sorted.sort((a, b) => closedAt(a) - closedAt(b));
    case "highest":
      return sorted.sort((a, b) => b.netPnl - a.netPnl);
    case "lowest":
      return sorted.sort((a, b) => a.netPnl - b.netPnl);
    case "asset":
      // Ties inside a symbol fall back to newest, so the order is deterministic.
      return sorted.sort((a, b) => a.symbol.localeCompare(b.symbol) || closedAt(b) - closedAt(a));
    default:
      return sorted;
  }
}

/**
 * Translate a quick-preset chip into filters. Presets always start from a clean
 * slate rather than layering onto whatever was set, so a chip's meaning never
 * depends on the controls' previous state.
 */
export function presetFilters(preset: Preset, range: { from: string; to: string }): TradeFilters {
  const base = defaultFilters(range.from, range.to);

  switch (preset) {
    case "today":
      // "Today" means the latest day with trades, not the wall-clock date: the
      // dataset is historical, so the real today would show an empty dashboard.
      return { ...base, from: range.to, to: range.to };
    case "last7": {
      const latest = new Date(`${range.to}T00:00:00Z`);
      latest.setUTCDate(latest.getUTCDate() - 6);
      const from = latest.toISOString().slice(0, 10);
      return { ...base, from: from < range.from ? range.from : from, to: range.to };
    }
    case "profit":
      return { ...base, result: "PROFIT" };
    case "loss":
      return { ...base, result: "LOSS" };
    case "liquidation":
      return { ...base, direction: "LIQUIDATION" };
    case "all":
    default:
      return base;
  }
}
