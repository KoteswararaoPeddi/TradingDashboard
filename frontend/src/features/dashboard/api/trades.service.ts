import axiosInstance from "@lib/axios.config";
import type { ApiResponse } from "@shared/types/api-response";

import type { Trade } from "../types/trade.types";

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
