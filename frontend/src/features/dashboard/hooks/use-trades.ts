"use client";

import { useEffect, useState } from "react";

import { getErrorMessage } from "@lib/get-error-message";

import { getTrades } from "../api/trades.service";
import { useDashboardData } from "../components/DashboardProvider";
import { useFiltersStore } from "../stores/filters.store";
import type { EnrichedTrade, TradesPage } from "../types/trade.types";

interface TradesView {
  status: "ready" | "error";
  error: string | null;
  rows: EnrichedTrade[];
  total: number;
  totalPages: number;
  /** Trades in the whole account — distinguishes "empty account" from "no match". */
  accountTradeCount: number;
  fetching: boolean;
}

/**
 * One page of trades for the active filters. Server-paginated: the table holds
 * only the requested page, and the running balance / index on each row are
 * computed against the whole account server-side.
 *
 * Seeded by the server's first page so the table paints immediately; refetches
 * when the filters or the page change.
 */
export function useTrades(page: number, limit = 50): TradesView {
  const { status, error: seedError, initialTradesPage } = useDashboardData();
  const filters = useFiltersStore((s) => s.filters);

  const [data, setData] = useState<TradesPage | null>(initialTradesPage);
  const [error, setError] = useState<string | null>(seedError);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (status === "error") return;
    let cancelled = false;
    setFetching(true);
    getTrades(filters, page, limit)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError(null);
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
  }, [filters, page, limit, status]);

  return {
    status,
    error,
    rows: data?.items ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    accountTradeCount: data?.accountTradeCount ?? 0,
    fetching,
  };
}
