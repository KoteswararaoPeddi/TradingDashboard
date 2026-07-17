import { getErrorMessage } from "@lib/get-error-message";

import { defaultFilters } from "../lib/filters";
import type { AnalyticsResponse } from "../types/metrics.types";
import type { TradesPage, TradingAccount } from "../types/trade.types";
import { getActiveAccount } from "./accounts.service";
import { getAnalytics } from "./analytics.service";
import { getTrades } from "./trades.service";

export interface DashboardPayload {
  account: TradingAccount | null;
  /** Server-computed analytics for the unfiltered set — the first-paint numbers. */
  analytics: AnalyticsResponse | null;
  /** First page of trades for the table. */
  tradesPage: TradesPage | null;
  /** Set when the fetch failed; the shell renders it instead of the panels. */
  error: string | null;
}

/**
 * Loads the cockpit's data on the **server**, for the `(app)` layout.
 *
 * Fetching here rather than in a client effect is what puts real numbers in the
 * first paint. Now that the backend owns the maths, that means the ready-to-render
 * analytics bundle ships in the HTML — the client re-fetches only when a filter
 * changes.
 *
 * The three calls are independent (the API resolves the single account itself),
 * so they run in parallel. Never throws: a dead API renders a message inside the
 * shell, not a blown-up route.
 */
export async function loadDashboard(): Promise<DashboardPayload> {
  try {
    const unfiltered = defaultFilters("", "");
    const [account, analytics, tradesPage] = await Promise.all([
      getActiveAccount(),
      getAnalytics(unfiltered),
      getTrades(unfiltered, 1),
    ]);
    return { account, analytics, tradesPage, error: null };
  } catch (error) {
    console.error("[dashboard.loader] failed to load", error);
    return { account: null, analytics: null, tradesPage: null, error: getErrorMessage(error) };
  }
}
