"use client";

import { Plus, Receipt, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@components/EmptyState";
import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { Table, TableBody, TableHeader, TableRow } from "@components/ui/table";

import { useCockpit } from "../../hooks/use-cockpit";
import { pageSlice } from "../../lib/pagination";
import { useFiltersStore } from "../../stores/filters.store";
import type { EnrichedTrade } from "../../types/trade.types";
import { Panel } from "../Panel";
import { TRADE_TABLE_MIN_WIDTH, TradeHeadCells } from "./trade-columns";
import { TradeFormDialog } from "./TradeFormDialog";
import { TradeRow } from "./TradeRow";
import { TradesPagination } from "./TradesPagination";

/** The full ledger for the active view. */
export function TradesTable({ onAddTrade }: { onAddTrade?: () => void }) {
  const { status, filtered, allTrades } = useCockpit();
  const reset = useFiltersStore((s) => s.reset);
  const filters = useFiltersStore((s) => s.filters);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<EnrichedTrade | undefined>(undefined);

  // A filter change re-scopes the set under the reader, so page 6 of the old view
  // is meaningless in the new one — go back to page 1.
  //
  // Adjusted *during render*, not in an effect. An effect would paint page 6 of
  // the new set first and correct it on the next frame, a visible flash of the
  // wrong rows; React re-runs this component before touching the DOM, so nothing
  // wrong is ever shown. (It is also what `react-hooks/set-state-in-effect` is
  // steering toward.)
  const [prevFilters, setPrevFilters] = useState(filters);
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setPage(1);
  }

  if (status !== "ready") {
    return (
      <Panel id="trades" title="Trade history" description="Loading the active view." padded={false}>
        <div className="grid gap-2 p-4.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11 rounded-md" />
          ))}
        </div>
      </Panel>
    );
  }

  const slice = pageSlice(filtered, page);

  return (
    <Panel
      id="trades"
      title="Trade history"
      description={`${filtered.length} of ${allTrades.length} trades, with the current filters applied.`}
      padded={false}
    >
      {/* Two different empties, because they have two different ways out. An
          untouched journal is not a filter problem, and offering "Clear filters"
          to someone who has never added a trade sends them hunting for a control
          that was never the obstacle. */}
      {allTrades.length === 0 ? (
        <EmptyState
          className="m-4.5"
          icon={<Receipt className="size-7 text-subtle-foreground" aria-hidden />}
          message="No trades yet. Add your first one and the cockpit fills in."
          action={
            onAddTrade ? (
              <Button size="sm" onClick={onAddTrade}>
                <Plus className="size-4" aria-hidden />
                Add trade
              </Button>
            ) : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          className="m-4.5"
          icon={<SlidersHorizontal className="size-7 text-subtle-foreground" aria-hidden />}
          message="No trades match the current filters."
          action={
            <Button variant="outline" size="sm" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {/* The shadcn Table ships its own overflow-x container, so a min-width
              here scrolls the table on mobile instead of crushing 10 columns. */}
          <Table className={TRADE_TABLE_MIN_WIDTH}>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TradeHeadCells withActions />
              </TableRow>
            </TableHeader>

            <TableBody>
              {slice.items.map((trade) => (
                <TradeRow key={trade.id} trade={trade} onEdit={() => setEditing(trade)} />
              ))}
            </TableBody>
          </Table>

          <TradesPagination
            page={slice.page}
            pages={slice.pages}
            from={slice.from}
            to={slice.to}
            total={slice.total}
            onPage={setPage}
          />
        </>
      )}

      {/* One dialog for the whole table rather than one per row: `editing` holds
          which trade it is showing, so 500 rows do not mount 500 dialogs. */}
      <TradeFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(undefined)}
        trade={editing}
      />
    </Panel>
  );
}
