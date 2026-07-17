import axiosInstance from "@lib/axios.config";
import type { ApiResponse } from "@shared/types/api-response";

import type { TradeFilters } from "../types/filter.types";
import type { CreateTradeInput, Trade, TradesPage } from "../types/trade.types";
import type { UpdateTradeInput } from "../types/trade.types";
import { filtersToParams } from "./params";

/**
 * One page of trades for the active filters, each row carrying its global index
 * and running balance (computed server-side over the whole account).
 *
 * The table only ever holds one page: analytics need every row, but the wire
 * never carries more than `limit` of them. Filtering and pagination are the
 * server's job now — the client just names the page and the filters.
 */
export async function getTrades(filters: TradeFilters, page: number, limit = 50): Promise<TradesPage> {
  const res = await axiosInstance.get<ApiResponse<TradesPage>>("/trades", {
    params: { ...filtersToParams(filters), page, limit },
  });
  return res.data.data;
}

/**
 * Adds a trade.
 *
 * The caller re-fetches afterwards (the dashboard's analytics + trades hooks own
 * their data), so a new row — and every metric derived from it — reappears.
 */
export async function createTrade(input: CreateTradeInput): Promise<Trade> {
  const res = await axiosInstance.post<ApiResponse<Trade>>("/trades", input);
  return res.data.data;
}

export async function updateTrade(id: string, input: UpdateTradeInput): Promise<Trade> {
  const res = await axiosInstance.patch<ApiResponse<Trade>>(`/trades/${id}`, input);
  return res.data.data;
}

export async function deleteTrade(id: string): Promise<Trade> {
  const res = await axiosInstance.delete<ApiResponse<Trade>>(`/trades/${id}`);
  return res.data.data;
}
