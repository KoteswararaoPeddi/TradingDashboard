import { Typography } from "@components/ui/typography";
import { cn } from "@lib/utils";
import { formatMoney, formatPercent } from "@lib/format";

import type { TradeMetrics } from "../../types/metrics.types";

interface Props {
  /**
   * Metrics over the account's **whole** trade set, not the filtered view.
   * The sidebar reports the account's standing, which shouldn't move when a
   * filter narrows the panels on the right.
   */
  metrics: TradeMetrics;
  startingBalance: number;
}

/** Pinned sidebar card: balance plus four at-a-glance account figures. */
export function AccountCard({ metrics, startingBalance }: Props) {
  return (
    <div className="mt-auto rounded-lg border border-border bg-linear-to-b from-surface-wash to-surface-wash-soft p-4 shadow-panel">
      <Typography as="span" variant="label-base" weight="extrabold" className="block text-muted-foreground uppercase">
        Account Balance
      </Typography>

      {/* h1 (30px) matches the design's .balance; display-lg would run 4px large. */}
      <Typography
        as="p"
        variant="h1"
        weight="black"
        className={cn("mt-2", metrics.equity >= startingBalance ? "text-up" : "text-down")}
      >
        {formatMoney(metrics.equity)}
      </Typography>

      <dl className="mt-4 grid grid-cols-2 gap-2.5">
        <Mini label="Net P&L" value={formatMoney(metrics.netProfit)} tone={metrics.netProfit >= 0 ? "up" : "down"} />
        <Mini label="Growth" value={formatPercent(metrics.growth)} tone={metrics.growth >= 0 ? "up" : "down"} />
        <Mini label="Win Rate" value={formatPercent(metrics.winRate)} />
        <Mini label="Trades" value={String(metrics.totalTrades)} />
      </dl>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-lg border border-border-soft bg-surface-well p-2.5">
      <Typography as="dt" variant="label-sm" weight="extrabold" className="block text-muted-foreground uppercase">
        {label}
      </Typography>
      <Typography
        as="dd"
        variant="h5"
        weight="bold"
        className={cn("mt-1 block", tone === "up" && "text-up", tone === "down" && "text-down")}
      >
        {value}
      </Typography>
    </div>
  );
}
