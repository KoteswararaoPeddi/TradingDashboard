"use client";

import { Skeleton } from "@components/ui/skeleton";

import { useCockpit } from "../hooks/use-cockpit";
import { Charts } from "./charts/Charts";
import { FilterChips } from "./filters/FilterChips";
import { AnalyticsKpis } from "./stats/AnalyticsKpis";
import { Stats } from "./stats/Stats";

/**
 * The deep dive: every metric and chart for the active trade set.
 *
 * Reads top-down as scope → headline → detail. The filter chips come first
 * because everything under them is an answer *about the set they select*, and a
 * page of numbers whose scope is stated last is a page you have to read twice.
 */
export function AnalyticsPage() {
  const { status, metrics } = useCockpit();

  return (
    <div className="grid gap-4.5">
      <div className="border-b border-border pb-4.5">
        <FilterChips />
      </div>

      {status === "ready" && metrics ? (
        <AnalyticsKpis metrics={metrics} />
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[601px]:grid-cols-2 min-[1181px]:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-45 rounded-xl border border-border" />
          ))}
        </div>
      )}

      <Stats />
      <Charts />
    </div>
  );
}
