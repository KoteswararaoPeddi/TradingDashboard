"use client";

import { useTrades } from "../hooks/use-trades";
import { Overview } from "./overview/Overview";
import { RecentTrades } from "./overview/RecentTrades";

/** How many rows the glance shows. The full ledger lives on /trades. */
const RECENT_LIMIT = 6;

/**
 * The glance. This page answers "where do I stand" and "what just happened", and
 * deliberately stops there — the 27 stat cards and the seven charts are a
 * different job and live on Analytics.
 */
export function DashboardPage() {
  // The first page of the active view is the recent activity — the server sorts
  // and limits it, so the glance asks for exactly the rows it shows.
  const { status, rows, total } = useTrades(1, RECENT_LIMIT);

  return (
    <div className="grid gap-4.5">
      <Overview />
      {status === "ready" ? <RecentTrades trades={rows} total={total} /> : null}
    </div>
  );
}
