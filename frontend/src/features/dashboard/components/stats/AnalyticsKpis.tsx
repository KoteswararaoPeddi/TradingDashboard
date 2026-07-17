import { CheckCircle2, DollarSign, Sigma, Target } from "lucide-react";

import { formatMoney, formatPercent, formatProfitFactor } from "@lib/format";

import type { TradeMetrics } from "../../types/metrics.types";
import { Tile } from "../Tile";

interface Props {
  metrics: TradeMetrics;
}

/**
 * The four headline figures for the active view.
 *
 * These lead the page so the 27-card grid below reads as *detail* rather than as
 * 27 equally important facts. Without them the wall has no entry point: Net
 * Profit and Short Wins carry identical weight, so the eye picks neither.
 */
export function AnalyticsKpis({ metrics }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[601px]:grid-cols-2 min-[1181px]:grid-cols-4">
      <Tile
        icon={DollarSign}
        label="Total P&L"
        value={formatMoney(metrics.netProfit)}
        note={`From ${metrics.totalTrades} closed ${metrics.totalTrades === 1 ? "trade" : "trades"}`}
        tone={metrics.netProfit >= 0 ? "up" : "down"}
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
        icon={Target}
        label="Profit factor"
        value={formatProfitFactor(metrics.profitFactor)}
        note="Gross profit / gross loss. Above 1.5 is healthy"
        // Blue, not signed: a ratio has no direction to colour.
        tone="info"
      />
      <Tile
        icon={Sigma}
        label="Expectancy"
        value={formatMoney(metrics.averageTrade)}
        note="Expected result per trade"
        tone={metrics.averageTrade >= 0 ? "up" : "down"}
      />
    </div>
  );
}
