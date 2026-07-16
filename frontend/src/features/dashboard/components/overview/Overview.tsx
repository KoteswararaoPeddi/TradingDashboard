"use client";

import { Skeleton } from "@components/ui/skeleton";

import { useCockpit } from "../../hooks/use-cockpit";
import { Panel } from "../Panel";
import { AccountStrip } from "./AccountStrip";
import { MarketBoard } from "./MarketBoard";

/** The account command center: headline figures plus the market board. */
export function Overview() {
  const { status, account, allTrades, metrics } = useCockpit();

  if (status !== "ready" || !metrics || !account) {
    return (
      <Panel id="overview" title="Account Command Center" description="Loading the active view.">
        <OverviewSkeleton />
      </Panel>
    );
  }

  return (
    <Panel
      id="overview"
      title="Account Command Center"
      // Says plainly that every number on the page follows the filters, so a
      // narrowed set never looks like the account's whole story.
      description={`Showing ${metrics.totalTrades} of ${allTrades.length} trades. Dashboard values follow the active view.`}
      aside={<MarketBoard metrics={metrics} />}
    >
      <AccountStrip metrics={metrics} startingBalance={account.startingBalance} />
    </Panel>
  );
}

function OverviewSkeleton() {
  return (
    <div className="p-4.5">
      <div className="grid gap-3 min-[1181px]:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg border border-border" />
        ))}
      </div>
    </div>
  );
}
