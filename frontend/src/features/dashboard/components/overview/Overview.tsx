"use client";

import { useCockpit } from "../../hooks/use-cockpit";
import { Panel } from "../Panel";
import { AccountHero } from "./AccountHero";
import { KpiRow } from "./KpiRow";
import { OverviewSkeleton } from "./OverviewSkeleton";

/** The account command center: the balance, its shape, and the figures behind it. */
export function Overview() {
  const { status, account, accountTradeCount, metrics } = useCockpit();

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
        description={`Showing ${metrics.totalTrades} of ${accountTradeCount} trades. Values follow the active view.`}
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
