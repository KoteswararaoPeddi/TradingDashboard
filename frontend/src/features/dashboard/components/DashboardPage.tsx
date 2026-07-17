"use client";

import { useCockpit } from "../hooks/use-cockpit";
import { Overview } from "./overview/Overview";
import { RecentTrades } from "./overview/RecentTrades";

/**
 * The glance. This page answers "where do I stand" and "what just happened", and
 * deliberately stops there — the 27 stat cards and the seven charts are a
 * different job and live on Analytics.
 */
export function DashboardPage() {
  const { status, metrics } = useCockpit();

  return (
    <div className="grid gap-4.5">
      <Overview />
      {status === "ready" && metrics ? <RecentTrades trades={metrics.sorted} /> : null}
    </div>
  );
}
