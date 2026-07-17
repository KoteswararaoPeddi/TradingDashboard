"use client";

import { Table, TableBody, TableHeader, TableRow } from "@components/ui/table";
import { Typography } from "@components/ui/typography";

import type { EnrichedTrade } from "../../types/trade.types";
import { Panel } from "../Panel";
import { TRADE_TABLE_MIN_WIDTH, TradeHeadCells, TradeRowCells } from "../trades/trade-columns";

/** How many rows the glance shows. The full ledger lives on /trades. */
const LIMIT = 6;

interface Props {
  /** The active view, chronological. */
  trades: EnrichedTrade[];
}

/**
 * The last few trades, on the glance.
 *
 * "Where do I stand" is only half the daily question; the other half is "what
 * just happened". Without this the dashboard states a balance and gives no way to
 * see what moved it, which is why the page felt like a number on an empty screen.
 *
 * Same columns as the full ledger on /trades — both render `trade-columns` —
 * minus the row actions. Editing belongs where you went to manage trades; these
 * six rows are for recognition, not administration.
 */
export function RecentTrades({ trades }: Props) {
  // Newest first — `sorted` is chronological, and recency is the point here.
  const rows = trades.slice(-LIMIT).reverse();

  return (
    <Panel
      id="recent"
      title="Recent activity"
      description={`The last ${rows.length} of ${trades.length} trades in the active view.`}
      padded={false}
    >
      {rows.length === 0 ? (
        <div className="m-4.5 rounded-lg border border-dashed border-border bg-surface-wash-soft p-9 text-center">
          <Typography variant="body-sm" className="text-muted-foreground">
            No trades match the current filters.
          </Typography>
        </div>
      ) : (
        <Table className={TRADE_TABLE_MIN_WIDTH}>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TradeHeadCells />
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((trade) => (
              <TableRow key={trade.id} className="border-border hover:bg-surface-wash">
                <TradeRowCells trade={trade} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
