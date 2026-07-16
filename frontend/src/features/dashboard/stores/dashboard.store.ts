import { create } from "zustand";

import { getErrorMessage } from "@lib/get-error-message";

import { getActiveAccount } from "../api/accounts.service";
import { getTrades } from "../api/trades.service";
import { enrichTrades } from "../lib/metrics";
import type { EnrichedTrade, TradingAccount } from "../types/trade.types";

type Status = "idle" | "loading" | "ready" | "error";

interface DashboardState {
  status: Status;
  error: string | null;
  account: TradingAccount | null;
  /** The account's full trade set, enriched once (index + running balance). */
  trades: EnrichedTrade[];
  load: () => Promise<void>;
}

/**
 * Holds the account and its trades for the whole cockpit.
 *
 * The set is fetched **once** and every panel derives from it, so filtering never
 * costs a round trip. A store rather than context because the shell (rendered by
 * the layout) and the panels (rendered by the page) are separate subtrees that
 * must read the same data.
 */
export const useDashboardStore = create<DashboardState>((set, get) => ({
  status: "idle",
  error: null,
  account: null,
  trades: [],

  load: async () => {
    // Guard re-entry: the shell and the page both mount at once, and neither
    // should be able to fire a second fetch of the same data.
    if (get().status === "loading" || get().status === "ready") return;

    set({ status: "loading", error: null });

    try {
      const account = await getActiveAccount();

      if (!account) {
        set({ status: "ready", account: null, trades: [] });
        return;
      }

      const trades = await getTrades(account.id);

      set({
        status: "ready",
        account,
        trades: enrichTrades(trades, account.startingBalance),
      });
    } catch (error) {
      console.error("[dashboard.store] failed to load", error);
      set({ status: "error", error: getErrorMessage(error) });
    }
  },
}));
