import type { TradeFilters } from "../types/filter.types";

/**
 * Translate the UI filter state into the query params GET /trades and
 * GET /analytics accept. "ALL" and null mean "no constraint", so they are
 * omitted rather than sent — the backend treats an absent param as unfiltered.
 *
 * This is the whole of the client's filtering role now: decide *which* values to
 * send. The actual narrowing and every metric happen on the server.
 */
export function filtersToParams(filters: TradeFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.asset && filters.asset !== "ALL") params.asset = filters.asset;
  if (filters.direction !== "ALL") params.direction = filters.direction;
  if (filters.result !== "ALL") params.result = filters.result;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.minPnl !== null) params.minPnl = filters.minPnl;
  if (filters.maxPnl !== null) params.maxPnl = filters.maxPnl;
  if (filters.sortBy) params.sortBy = filters.sortBy;

  return params;
}
