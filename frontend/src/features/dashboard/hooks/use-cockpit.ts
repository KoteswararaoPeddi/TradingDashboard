"use client";

import { useEffect, useState } from "react";

import { getErrorMessage } from "@lib/get-error-message";

import { getAnalytics } from "../api/analytics.service";
import { useDashboardData } from "../components/DashboardProvider";
import { useFiltersStore } from "../stores/filters.store";
import type { AnalyticsResponse } from "../types/metrics.types";
import type { TradingAccount } from "../types/trade.types";

interface Cockpit {
  status: "ready" | "error";
  error: string | null;
  account: TradingAccount | null;
  /** The analytics bundle for the active filters — what every panel renders. */
  metrics: AnalyticsResponse | null;
  /** Trades in the whole account (unfiltered) — the "X of Y" denominator. */
  accountTradeCount: number;
  /** A refetch is in flight; panels dim rather than blanking. */
  fetching: boolean;
}

/**
 * The cockpit's single data point: filters in, server-computed analytics out.
 *
 * The frontend no longer derives anything — it sends the active filters to
 * GET /analytics and renders the bundle that returns. Every panel calls this, so
 * overview, stats, charts and calendar can never disagree about the same set.
 *
 * First paint uses the server-seeded bundle (no loading gap); each filter change
 * triggers a refetch, with the previous numbers left on screen (dimmed) until the
 * new ones arrive.
 */
export function useCockpit(): Cockpit {
  const { status, error: seedError, account, initialAnalytics } = useDashboardData();
  const filters = useFiltersStore((s) => s.filters);
  const initRange = useFiltersStore((s) => s.initRange);
  // A mutation bumps this; refetching on it is how every panel picks up a
  // just-added trade without a manual page refresh.
  const dataVersion = useFiltersStore((s) => s.dataVersion);

  const [metrics, setMetrics] = useState<AnalyticsResponse | null>(initialAnalytics);
  const [error, setError] = useState<string | null>(seedError);
  const [fetching, setFetching] = useState(false);

  // Seed the date bounds from the account's real span, once, so the presets and
  // date inputs have something to resolve against.
  useEffect(() => {
    if (initialAnalytics) initRange(initialAnalytics.range);
  }, [initialAnalytics, initRange]);

  useEffect(() => {
    if (status === "error") return;
    let cancelled = false;
    setFetching(true);
    getAnalytics(filters)
      .then((res) => {
        if (cancelled) return;
        setMetrics(res);
        setError(null);
        // Repopulate the date window after a mutation cleared it (see the store's
        // notifyDataChanged), so the inputs and presets have real bounds again —
        // now including the new trade. Guarded on an empty range so seeding, which
        // itself sets the bounds, cannot loop.
        if (res.range.from && !useFiltersStore.getState().range.from) initRange(res.range);
      })
      .catch((e) => {
        if (!cancelled) setError(getErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, status, dataVersion, initRange]);

  return {
    status,
    error,
    account,
    metrics,
    accountTradeCount: metrics?.accountTradeCount ?? 0,
    fetching,
  };
}
