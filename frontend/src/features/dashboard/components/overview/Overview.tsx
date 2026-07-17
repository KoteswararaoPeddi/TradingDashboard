"use client";

import { Skeleton } from "@components/ui/skeleton";

import { useCockpit } from "../../hooks/use-cockpit";
import { Panel } from "../Panel";
import { AccountHero } from "./AccountHero";
import { KpiRow } from "./KpiRow";

/** The account command center: the balance, its shape, and the figures behind it. */
export function Overview() {
  const { status, account, allTrades, metrics } = useCockpit();

  if (status !== "ready" || !metrics || !account) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="grid gap-4">
      <Panel
        id="overview"
        title="Account command center"
        // Says plainly that every number on the page follows the filters, so a
        // narrowed set never looks like the account's whole story.
        description={`Showing ${metrics.totalTrades} of ${allTrades.length} trades. Values follow the active view.`}
        padded={false}
      >
        <AccountHero
          equity={metrics.equity}
          netProfit={metrics.netProfit}
          growth={metrics.growth}
          startingBalance={account.startingBalance}
          equityCurve={metrics.equityCurve}
          tradeCount={metrics.totalTrades}
        />
      </Panel>

      <KpiRow metrics={metrics} />
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid gap-4">
      <Panel id="overview" title="Account command center" description="Loading the active view." padded={false}>
        <div className="grid gap-6 px-5 pt-4 pb-6 min-[861px]:grid-cols-[minmax(0,auto)_minmax(0,1fr)] min-[861px]:items-center min-[861px]:gap-10">
          <div>
            <Skeleton className="h-3 w-28 rounded-sm" />
            <Skeleton className="mt-3 h-13 w-72 rounded-md" />
            <Skeleton className="mt-3 h-3 w-44 rounded-sm" />
          </div>
          <Skeleton className="h-22 w-full rounded-md" />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 min-[601px]:grid-cols-2 min-[1181px]:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-45 rounded-xl border border-border" />
        ))}
      </div>
    </div>
  );
}
