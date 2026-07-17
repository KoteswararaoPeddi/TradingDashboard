import axiosInstance from "@lib/axios.config";
import type { ApiResponse } from "@shared/types/api-response";

import type { TradingAccount, UpdateAccountInput } from "../types/trade.types";

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

/**
 * Saves the Settings page.
 *
 * There is no `createAccount` counterpart by design: the journal's account is a
 * singleton the API provisions on boot, so it is only ever adjusted, never
 * authored. Changing `startingBalance` re-bases every metric derived from the
 * equity curve — it is the one number the trades themselves cannot supply.
 *
 * The caller is responsible for `router.refresh()` afterwards: the account is
 * loaded on the server (see dashboard.loader.ts), so re-running the loader is
 * what puts the new numbers on screen.
 */
export async function updateAccount(
  id: string,
  input: UpdateAccountInput,
): Promise<TradingAccount> {
  const res = await axiosInstance.patch<ApiResponse<TradingAccount>>(`/accounts/${id}`, input);
  return res.data.data;
}
