import axiosInstance from "@lib/axios.config";
import type { ApiResponse } from "@shared/types/api-response";

import type { CreateTradeInput, Trade, UpdateTradeInput } from "../types/trade.types";

/**
 * Raw trades for an account, oldest close first.
 *
 * The API deliberately returns raw rows and no computed metrics: the cockpit
 * fetches the set once and derives every panel from it via lib/metrics.ts, so
 * filtering never costs a round trip.
 */
export async function getTrades(accountId: string): Promise<Trade[]> {
  const res = await axiosInstance.get<ApiResponse<Trade[]>>("/trades", {
    params: { accountId, order: "asc" },
  });
  return res.data.data;
}

/**
 * Adds a trade.
 *
 * The caller is responsible for `router.refresh()` afterwards: the account and
 * trade set are loaded on the server (see dashboard.loader.ts), so re-running the
 * loader is what puts the new row — and every metric derived from it — on screen.
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
