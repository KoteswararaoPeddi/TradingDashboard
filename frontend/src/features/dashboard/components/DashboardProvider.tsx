"use client";

import { createContext, useContext, useMemo } from "react";

import type { DashboardPayload } from "../api/dashboard.loader";
import { enrichTrades } from "../lib/metrics";
import type { EnrichedTrade, TradingAccount } from "../types/trade.types";

export interface DashboardData {
  status: "ready" | "error";
  error: string | null;
  account: TradingAccount | null;
  /** The account's full trade set, enriched once (index + running balance). */
  trades: EnrichedTrade[];
}

const DashboardContext = createContext<DashboardData | null>(null);

/**
 * Shares the server-loaded account + trade set with the whole cockpit.
 *
 * Context rather than a module-level store, deliberately. The data is fetched on
 * the server and handed down as a prop, and context is the only mechanism that
 * carries it through **both** the server render and the client one. A zustand
 * singleton seeded during render does not: `useSyncExternalStore`'s server
 * snapshot does not observe a mutation made in the same render pass, so the
 * server HTML came out empty ("No account") even though the payload was present.
 *
 * Context also sidesteps the module-singleton-on-the-server problem entirely —
 * each request gets its own provider value, with no shared mutable state.
 *
 * Filters stay in zustand: that state is client-only and never server-rendered.
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
      // Enrich on render rather than on the server: index/running balance/UTC
      // buckets are cheap to derive and would otherwise add six fields per trade
      // to the serialized payload.
      trades: payload.account ? enrichTrades(payload.trades, payload.account.startingBalance) : [],
    }),
    [payload],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

/** The server-loaded account + trades. Throws outside the provider, by design. */
export function useDashboardData(): DashboardData {
  const data = useContext(DashboardContext);
  if (!data) {
    throw new Error("useDashboardData must be used inside <DashboardProvider>.");
  }
  return data;
}
