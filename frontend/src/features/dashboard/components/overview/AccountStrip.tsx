import { Typography } from "@components/ui/typography";
import { formatMoney, formatPercent, formatProfitFactor } from "@lib/format";
import { cn } from "@lib/utils";

import type { TradeMetrics } from "../../types/metrics.types";

interface Props {
  metrics: TradeMetrics;
  startingBalance: number;
}

/** The four headline account figures, full-bleed across the panel's left column. */
export function AccountStrip({ metrics, startingBalance }: Props) {
  return (
    // Four across, collapsing to one column below 780px — the design keeps all
    // four in a row even after the overview itself stacks at 1180px.
    <dl className="grid grid-cols-1 border-y border-border bg-surface-well-soft min-[781px]:grid-cols-4">
      <StripItem
        label="Current Balance"
        value={formatMoney(metrics.equity)}
        tone={metrics.equity >= startingBalance ? "up" : "down"}
        note={`Starting balance: ${formatMoney(startingBalance)}`}
      />
      <StripItem
        label="Net Profit"
        value={formatMoney(metrics.netProfit)}
        tone={metrics.netProfit >= 0 ? "up" : "down"}
        note={`${metrics.growth.toFixed(2)}% account growth`}
      />
      <StripItem
        label="Max Drawdown"
        value={formatPercent(metrics.maxDrawdown)}
        // Always red: a drawdown is a loss figure even when it is small.
        tone="down"
        note="Peak-to-valley pressure"
      />
      <StripItem
        label="Profit Factor"
        value={formatProfitFactor(metrics.profitFactor)}
        // Blue, not signed: a ratio has no direction to colour.
        tone="info"
        note="Gross profit / gross loss"
      />
    </dl>
  );
}

function StripItem({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "up" | "down" | "info";
}) {
  return (
    // Stacked: divided by a bottom rule. Four across: divided by right rules,
    // with no rule after the last cell.
    // `@container` makes the value below size against this cell, not the viewport.
    <div className="@container min-h-28 border-b border-border p-4.5 last:border-b-0 min-[781px]:border-r min-[781px]:border-b-0 min-[781px]:last:border-r-0">
      <Typography as="dt" variant="label-base" weight="extrabold" className="block text-muted-foreground uppercase">
        {label}
      </Typography>
      <Typography
        as="dd"
        variant="display-lg"
        weight="black"
        className={cn(
          "mt-2 leading-none whitespace-nowrap",
          // The design sizes this clamp(22px, 3vw, 34px) — but 3vw tracks the
          // viewport while the value lives in a cell an eighth as wide, so at
          // 1440 its own $1,166.40 overflows by 36px and collides with the next
          // cell. `cqi` sizes against the cell instead: still 34px once the cell
          // is wide enough, shrinking to 22px rather than overlapping.
          "text-[clamp(1.375rem,19cqi,2.125rem)]",
          tone === "up" && "text-up",
          tone === "down" && "text-down",
          tone === "info" && "text-info",
        )}
      >
        {value}
      </Typography>
      <Typography variant="body-sm" className="mt-2.5 text-muted-foreground">
        {note}
      </Typography>
    </div>
  );
}
