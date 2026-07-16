import { formatMoney, formatPercent } from "@lib/format";

import type { TradeMetrics } from "../../types/metrics.types";
import { Tile } from "../Tile";

interface Props {
  metrics: TradeMetrics;
}

/** Four at-a-glance tiles beside the account strip. */
export function MarketBoard({ metrics }: Props) {
  return (
    <div className="grid h-full grid-cols-1 gap-3 sm:grid-cols-2">
      <Tile
        label="Win Rate"
        value={formatPercent(metrics.winRate)}
        note={`${metrics.wins} wins / ${metrics.losses} losses`}
        // Gold below a coin flip: the figure is neither a profit nor a loss, so
        // it warns rather than turning red.
        tone={metrics.winRate >= 50 ? "up" : "warning"}
      />
      <Tile
        label="Average Trade"
        value={formatMoney(metrics.averageTrade)}
        note="Net P&L divided by trades"
        tone={metrics.averageTrade >= 0 ? "up" : "down"}
      />
      <Tile label="Best Trade" value={formatMoney(metrics.bestTrade)} note="Largest single gain" tone="up" />
      <Tile label="Worst Trade" value={formatMoney(metrics.worstTrade)} note="Largest single loss" tone="down" />
    </div>
  );
}
