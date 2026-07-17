import type { Period, Preset, ResultFilter, TradeFilters } from "../types/filter.types";

/**
 * The date window a period chip selects.
 *
 * Periods are deliberately **orthogonal** to the result chips: a period touches
 * only `from`/`to`, a result chip touches only `result`. That is what lets "30
 * days" and "Winners" combine, which `presetFilters` cannot express because it
 * rebuilds every field from a clean slate.
 *
 * Every window is anchored to the data's latest day, not the wall clock. The
 * journal is historical, so a real "today" would show an empty dashboard.
 */
export function periodRange(period: Period, range: { from: string; to: string }): {
  from: string;
  to: string;
} {
  if (!range.to) return { from: range.from, to: range.to };
  if (period === "all") return { from: range.from, to: range.to };
  if (period === "today") return { from: range.to, to: range.to };

  const days = period === "7d" ? 6 : 29;
  const anchor = new Date(`${range.to}T00:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() - days);
  const from = anchor.toISOString().slice(0, 10);

  // Never widen past the account's own history: a 30-day window on 8 days of
  // trades is just "all time", and pretending otherwise would let two chips
  // claim to be active at once.
  return { from: from < range.from ? range.from : from, to: range.to };
}

/**
 * Which period chip the current dates correspond to, or null for a custom span.
 *
 * `all` is tested **before** every fixed window, and the order is load-bearing in
 * two ways:
 *  - Windows clamp to the account's own history, so on a journal spanning 8 days
 *    the 30-day window *is* the full range and both chips match the same dates.
 *    When a window covers everything there is, "All time" is the honest label —
 *    reporting "30 days" would imply a boundary the data does not have.
 *  - Before the range is seeded (`range` is `{"", ""}`, the store's initial state
 *    on first paint), `periodRange` collapses *every* period to `{"", ""}`, which
 *    also equals the un-seeded filters. Testing `all` first means the un-seeded
 *    frame highlights "All time" — the same chip it settles on once the range
 *    loads — instead of flashing "Today" (the previous first entry) then swapping.
 */
export function activePeriod(
  filters: TradeFilters,
  range: { from: string; to: string },
): Period | null {
  const periods: Period[] = ["all", "today", "7d", "30d"];
  return (
    periods.find((period) => {
      const { from, to } = periodRange(period, range);
      return filters.from === from && filters.to === to;
    }) ?? null
  );
}

/** Which result chip is active. Direction and result are separate axes. */
export function activeResult(filters: TradeFilters): ResultFilter | "LIQUIDATION" {
  if (filters.direction === "LIQUIDATION") return "LIQUIDATION";
  return filters.result;
}

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
