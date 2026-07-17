"use client";

import { createContext, useContext, useMemo } from "react";

import type { DashboardPayload } from "../api/dashboard.loader";
import type { AnalyticsResponse } from "../types/metrics.types";
import type { TradesPage, TradingAccount } from "../types/trade.types";

export interface DashboardData {
  status: "ready" | "error";
  error: string | null;
  account: TradingAccount | null;
  /** Server-computed analytics for the unfiltered set — the first-paint seed. */
  initialAnalytics: AnalyticsResponse | null;
  /** First page of trades — the table's first-paint seed. */
  initialTradesPage: TradesPage | null;
}

const DashboardContext = createContext<DashboardData | null>(null);

/**
 * Shares the server-loaded seed with the whole cockpit.
 *
 * Context rather than a module-level store, deliberately: the data is fetched on
 * the server and handed down as a prop, and context is the only mechanism that
 * carries it through **both** the server render and the client one. A zustand
 * singleton seeded during render does not — `useSyncExternalStore`'s server
 * snapshot does not observe a mutation made in the same render pass — so the
 * server HTML came out empty even though the payload was present. Context also
 * gives each request its own value, with no shared mutable state on the server.
 *
 * The numbers now come from the backend, so the provider no longer computes
 * anything: it just holds the seed the client hooks refetch on top of. Filters
 * stay in zustand (client-only, never server-rendered).
 */
export function DashboardProvider({
  payload,
  children,
}: {
  payload: DashboardPayload;
  children: React.ReactNode;
}) {
  const value = useMemo<DashboardData>(
    () => ({
      status: payload.error ? "error" : "ready",
      error: payload.error,
      account: payload.account,
      initialAnalytics: payload.analytics,
      initialTradesPage: payload.tradesPage,
    }),
    [payload],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

/** The server-loaded seed. Throws outside the provider, by design. */
export function useDashboardData(): DashboardData {
  const data = useContext(DashboardContext);
  if (!data) {
    throw new Error("useDashboardData must be used inside <DashboardProvider>.");
  }
  return data;
}
