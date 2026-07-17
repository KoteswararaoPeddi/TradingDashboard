import { Typography } from "@components/ui/typography";
import { formatMoney, formatPercent } from "@lib/format";

import type { TradeMetrics } from "../../types/metrics.types";
import { AccountMini } from "./AccountMini";

interface Props {
  /**
   * Metrics over the account's **whole** trade set, not the filtered view.
   * The sidebar reports the account's standing, which shouldn't move when a
   * filter narrows the panels on the right.
   */
  metrics: TradeMetrics;
}

/** Pinned sidebar card: balance plus four at-a-glance account figures. */
export function AccountCard({ metrics }: Props) {
  return (
    <div className="mt-auto rounded-lg border border-border bg-linear-to-b from-surface-wash to-surface-wash-soft p-4 shadow-panel">
      <Typography as="span" variant="label-base" weight="extrabold" className="block text-muted-foreground uppercase">
        Account Balance
      </Typography>

      {/* Uncoloured, matching AccountHero: a balance is a level, not a signed
          value. The Net P&L and Growth minis below carry the judgement. */}
      <Typography as="p" variant="h1" weight="black" className="mt-2 text-foreground">
        {formatMoney(metrics.equity)}
      </Typography>

      <dl className="mt-4 grid grid-cols-2 gap-2.5">
        <AccountMini label="Net P&L" value={formatMoney(metrics.netProfit)} tone={metrics.netProfit >= 0 ? "up" : "down"} />
        <AccountMini label="Growth" value={formatPercent(metrics.growth)} tone={metrics.growth >= 0 ? "up" : "down"} />
        <AccountMini label="Win Rate" value={formatPercent(metrics.winRate)} />
        <AccountMini label="Trades" value={String(metrics.totalTrades)} />
      </dl>
    </div>
  );
}
