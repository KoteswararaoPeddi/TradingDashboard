import { Activity, CheckCircle2, Target, TrendingDown } from "lucide-react";

import { formatMoney, formatPercent, formatProfitFactor } from "@lib/format";

import type { TradeMetrics } from "../../types/metrics.types";
import { Tile } from "../Tile";

interface Props {
  metrics: TradeMetrics;
}

/**
 * The four figures that back the hero up, as KPI cards.
 *
 * Four, not six: Best and Worst Trade are trivia on a glance — they answer "what
 * was my luckiest day", not "how am I doing". They already live in the stats grid
 * on /analytics. These four are the ones that change what a trader does next.
 */
export function KpiRow({ metrics }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[601px]:grid-cols-2 min-[1181px]:grid-cols-4">
      <Tile
        icon={TrendingDown}
        label="Max drawdown"
        value={formatPercent(metrics.maxDrawdown)}
        note="Peak-to-valley pressure"
        // Always red: a drawdown is a loss figure even when it is small.
        tone="down"
      />
      <Tile
        icon={Target}
        label="Profit factor"
        value={formatProfitFactor(metrics.profitFactor)}
        note="Gross profit / gross loss"
        // Blue, not signed: a ratio has no direction to colour.
        tone="info"
      />
      <Tile
        icon={CheckCircle2}
        label="Win rate"
        value={formatPercent(metrics.winRate)}
        note={`${metrics.wins} wins / ${metrics.losses} losses`}
        // Gold below a coin flip: neither a profit nor a loss, so it warns rather
        // than turning red.
        tone={metrics.winRate >= 50 ? "up" : "warning"}
      />
      <Tile
        icon={Activity}
        label="Average trade"
        value={formatMoney(metrics.averageTrade)}
        note="Net P&L divided by trades"
        tone={metrics.averageTrade >= 0 ? "up" : "down"}
      />
    </div>
  );
}
