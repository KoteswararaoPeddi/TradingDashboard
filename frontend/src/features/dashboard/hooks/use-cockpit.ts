"use client";

import { useEffect, useMemo } from "react";

import { useDashboardData } from "../components/DashboardProvider";
import { filterTrades, tradeDateRange } from "../lib/filters";
import { calculateMetrics } from "../lib/metrics";
import { useFiltersStore } from "../stores/filters.store";
import type { TradeMetrics } from "../types/metrics.types";
import type { EnrichedTrade, TradingAccount } from "../types/trade.types";

interface Cockpit {
  status: "ready" | "error";
  error: string | null;
  account: TradingAccount | null;
  /** The account's whole trade set. */
  allTrades: EnrichedTrade[];
  /** The active view. */
  filtered: EnrichedTrade[];
  /** Metrics over the **filtered** set — what every panel renders. */
  metrics: TradeMetrics | null;
}

/**
 * The cockpit's single derivation point: raw trades + filters in, active view and
 * metrics out.
 *
 * Every panel calls this rather than deriving its own numbers, which is what
 * guarantees the overview, stats, charts, calendar and table can never disagree
 * about the same trade set.
 */
export function useCockpit(): Cockpit {
  const { status, error, account, trades: allTrades } = useDashboardData();

  const filters = useFiltersStore((s) => s.filters);
  const initRange = useFiltersStore((s) => s.initRange);

  // Seed the date bounds from the data once it arrives, so the date inputs and
  // the presets have a real span to resolve against.
  useEffect(() => {
    if (allTrades.length) initRange(tradeDateRange(allTrades));
  }, [allTrades, initRange]);

  const filtered = useMemo(() => filterTrades(allTrades, filters), [allTrades, filters]);

  const metrics = useMemo(
    () => (account ? calculateMetrics(filtered, account.startingBalance) : null),
    [filtered, account],
  );

  return { status, error, account, allTrades, filtered, metrics };
}
