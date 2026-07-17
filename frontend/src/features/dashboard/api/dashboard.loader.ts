import { getErrorMessage } from "@lib/get-error-message";

import { getActiveAccount } from "./accounts.service";
import { getTrades } from "./trades.service";
import type { Trade, TradingAccount } from "../types/trade.types";

export interface DashboardPayload {
  account: TradingAccount | null;
  /** Raw trades. The client enriches them, so the RSC payload stays small. */
  trades: Trade[];
  /** Set when the fetch failed; the shell renders it instead of the panels. */
  error: string | null;
}

/**
 * Loads the cockpit's data on the **server**, for the `(app)` layout.
 *
 * Fetching here rather than in a client effect is what puts real numbers in the
 * first paint: a `useEffect` fetch cannot start until the JS has downloaded and
 * hydrated, which measured at ~605ms of dead time before the first request even
 * left the browser, with a skeleton on screen throughout.
 *
 * The two calls are sequential because the dependency is real: trades are fetched
 * by `accountId`, so the account has to resolve first. That is the one case
 * code-standards.md sanctions sequential awaits. Server-side the pair costs a
 * couple of local round trips instead of the user's full network latency twice.
 *
 * Never throws: a dead API should render a message inside the shell, not blow up
 * the whole route.
 */
export async function loadDashboard(): Promise<DashboardPayload> {
  try {
    const account = await getActiveAccount();
    if (!account) return { account: null, trades: [], error: null };

    const trades = await getTrades(account.id);
    return { account, trades, error: null };
  } catch (error) {
    console.error("[dashboard.loader] failed to load", error);
    return { account: null, trades: [], error: getErrorMessage(error) };
  }
}
