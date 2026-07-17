"use client";

import { Plus, Receipt, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@components/EmptyState";
import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { Table, TableBody, TableHeader, TableRow } from "@components/ui/table";

import { useTrades } from "../../hooks/use-trades";
import { useFiltersStore } from "../../stores/filters.store";
import type { EnrichedTrade } from "../../types/trade.types";
import { Panel } from "../Panel";
import { TRADE_TABLE_MIN_WIDTH, TradeHeadCells } from "./trade-columns";
import { TradeFormDialog } from "./TradeFormDialog";
import { TradeRow } from "./TradeRow";
import { TradesPagination } from "./TradesPagination";

/** Rows per page — matches the server's default page size. */
const PAGE_SIZE = 50;

/** The full ledger for the active view — one server-paginated page at a time. */
export function TradesTable({ onAddTrade }: { onAddTrade?: () => void }) {
  const reset = useFiltersStore((s) => s.reset);
  const filters = useFiltersStore((s) => s.filters);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<EnrichedTrade | undefined>(undefined);

  // A filter change re-scopes the set, so page 6 of the old view is meaningless in
  // the new one — go back to page 1. Adjusted *during render*, not in an effect, so
  // the wrong page is never painted then corrected on the next frame.
  const [prevFilters, setPrevFilters] = useState(filters);
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setPage(1);
  }

  const { status, rows, total, totalPages, accountTradeCount } = useTrades(page, PAGE_SIZE);

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

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <Panel
      id="trades"
      title="Trade history"
      description={`${total} of ${accountTradeCount} trades, with the current filters applied.`}
      padded={false}
    >
      {/* Two different empties, because they have two different ways out. An
          untouched journal is not a filter problem, and offering "Clear filters"
          to someone who has never added a trade sends them hunting for a control
          that was never the obstacle. */}
      {accountTradeCount === 0 ? (
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
      ) : total === 0 ? (
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
              {rows.map((trade) => (
                <TradeRow key={trade.id} trade={trade} onEdit={() => setEditing(trade)} />
              ))}
            </TableBody>
          </Table>

          <TradesPagination
            page={page}
            pages={totalPages}
            from={from}
            to={to}
            total={total}
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
