import { TableCell, TableHead } from "@components/ui/table";
import { formatDate, formatMoney, formatPips } from "@lib/format";
import { cn } from "@lib/utils";

import type { EnrichedTrade, TradeSide } from "../../types/trade.types";

/**
 * Side colour is the P&L language applied to direction, per ui-rules:
 * LONG = up/green, SHORT = info/blue, LIQUIDATION = down/red.
 */
const SIDE_CLASS: Record<TradeSide, string> = {
  LONG: "text-up",
  SHORT: "text-info",
  LIQUIDATION: "text-down",
};

const HEAD = "text-label-sm font-semibold tracking-wider text-subtle-foreground uppercase";

/** Width before a trade table starts scrolling horizontally. Nine columns now. */
export const TRADE_TABLE_MIN_WIDTH = "min-w-220";

interface CellProps {
  /**
   * Reserve the trailing edge for an actions column. When false, the Balance cell
   * takes the right padding instead, so the last column never sits flush.
   */
  withActions?: boolean;
}

/**
 * The trade table's columns, defined once.
 *
 * Shared by the full ledger (/trades) and the dashboard's recent activity so the
 * two read as the same table. They previously drifted — recent activity was
 * missing Entry and Exit and used different labels — because each owned its own
 * copy. One source is the only thing that stops that recurring.
 */
export function TradeHeadCells({ withActions = false }: CellProps) {
  return (
    <>
      <TableHead className={cn("pl-4.5", HEAD)}>Open / close</TableHead>
      <TableHead className={HEAD}>Symbol</TableHead>
      <TableHead className={HEAD}>Type</TableHead>
      <TableHead className={cn("text-right", HEAD)}>Entry</TableHead>
      <TableHead className={cn("text-right", HEAD)}>Exit</TableHead>
      <TableHead className={cn("text-right", HEAD)}>Pips</TableHead>
      <TableHead className={cn("text-right", HEAD)}>Size</TableHead>
      <TableHead className={cn("text-right", HEAD)}>P&L</TableHead>
      <TableHead className={cn("text-right", HEAD, !withActions && "pr-4.5")}>Balance</TableHead>
      {withActions ? (
        // The column exists for layout; its purpose is obvious from the icons, and
        // a visible "Actions" label would add noise to an already wide header.
        <TableHead className="pr-4.5">
          <span className="sr-only">Actions</span>
        </TableHead>
      ) : null}
    </>
  );
}

/** One trade's cells, minus any actions cell the caller appends. */
export function TradeRowCells({ trade, withActions = false }: CellProps & { trade: EnrichedTrade }) {
  const up = trade.netPnl >= 0;

  return (
    <>
      {/* Timestamps are stored anchored to UTC and read with UTC accessors, so
          this clock matches the hour buckets the charts put the trade in. */}
      <TableCell className="pl-4.5 tabular-nums">
        <span className="block text-foreground">{formatDate(trade.closedAt)}</span>
        <span className="block text-body-sm text-subtle-foreground">
          {trade.openedAt ? `${trade.openedAt.slice(11, 16)} → ` : ""}
          {trade.closedAt.slice(11, 16)}
          {trade.holdTime ? ` · ${trade.holdTime}` : ""}
        </span>
      </TableCell>

      <TableCell className="font-semibold text-foreground">{trade.symbol}</TableCell>

      <TableCell>
        <span className={cn("font-semibold", SIDE_CLASS[trade.side])}>{trade.side}</span>
      </TableCell>

      {/* Prices, not money: an em dash rather than "$0.00" when absent, so a
          missing fill never reads as a real zero-priced trade. */}
      <TableCell className="text-right text-muted-foreground tabular-nums">
        {trade.entryPrice ?? "—"}
      </TableCell>
      <TableCell className="text-right text-muted-foreground tabular-nums">
        {trade.exitPrice ?? "—"}
      </TableCell>

      {/* A distance, so it takes no sign and no tone: the Type and P&L columns
          either side already say which way it went and what it earned. */}
      <TableCell className="text-right text-muted-foreground tabular-nums">
        {trade.pips === null ? "—" : formatPips(trade.pips)}
      </TableCell>

      {/* The filled half of the broker's "requested/filled" pair — the size that
          actually traded, and the one the row's P&L is computed from. Parsed
          server-side now, so the row just renders it. */}
      <TableCell className="text-right text-muted-foreground tabular-nums">
        {trade.filledSize ?? "—"}
      </TableCell>

      <TableCell className={cn("text-right font-bold tabular-nums", up ? "text-up" : "text-down")}>
        {up ? "+" : ""}
        {formatMoney(trade.netPnl)}
      </TableCell>

      <TableCell
        className={cn("text-right text-muted-foreground tabular-nums", !withActions && "pr-4.5")}
      >
        {formatMoney(trade.balanceAfter)}
      </TableCell>
    </>
  );
}
