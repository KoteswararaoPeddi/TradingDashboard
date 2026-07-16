import axiosInstance from "@lib/axios.config";
import type { ApiResponse } from "@shared/types/api-response";

import type { TradingAccount } from "../types/trade.types";

/** All trading accounts, oldest first. */
export async function getAccounts(): Promise<TradingAccount[]> {
  const res = await axiosInstance.get<ApiResponse<TradingAccount[]>>("/accounts");
  return res.data.data;
}

/**
 * The account the cockpit renders. The design has no account switcher, so the
 * first (oldest) account is the active one; the API already orders by createdAt,
 * which keeps "first" stable as more accounts are added.
 */
export async function getActiveAccount(): Promise<TradingAccount | null> {
  const accounts = await getAccounts();
  return accounts[0] ?? null;
}
