"use client";

import { Pencil, Plus, Receipt, SlidersHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@components/ui/table";
import { Typography } from "@components/ui/typography";

import { confirm } from "@shared/stores/confirm.store";
import { formatDate } from "@lib/format";
import { getErrorMessage } from "@lib/get-error-message";

import { deleteTrade } from "../../api/trades.service";
import { useCockpit } from "../../hooks/use-cockpit";
import { useFiltersStore } from "../../stores/filters.store";
import type { EnrichedTrade } from "../../types/trade.types";
import { Panel } from "../Panel";
import { TRADE_TABLE_MIN_WIDTH, TradeHeadCells, TradeRowCells } from "./trade-columns";
import { TradeFormDialog } from "./TradeFormDialog";

/** Rows revealed per "Load more" press. */
const STEP = 24;

/** The full ledger for the active view. */
export function TradesTable({ onAddTrade }: { onAddTrade?: () => void }) {
  const { status, filtered, allTrades } = useCockpit();
  const reset = useFiltersStore((s) => s.reset);
  const [shown, setShown] = useState(STEP);
  const [editing, setEditing] = useState<EnrichedTrade | undefined>(undefined);

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

  const rows = filtered.slice(0, shown);

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
        <div className="m-4.5 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-wash-soft px-6 py-12 text-center">
          <Receipt className="size-7 text-subtle-foreground" aria-hidden />
          <Typography variant="body-base" className="text-muted-foreground">
            No trades yet. Add your first one and the cockpit fills in.
          </Typography>
          {onAddTrade ? (
            <Button size="sm" onClick={onAddTrade}>
              <Plus className="size-4" aria-hidden />
              Add trade
            </Button>
          ) : null}
        </div>
      ) : filtered.length === 0 ? (
        // The empty state offers the way out, not just the bad news: with filters
        // applied, "no trades" is almost always a filter problem, and the fix
        // belongs where the user hits the wall.
        <div className="m-4.5 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-wash-soft px-6 py-12 text-center">
          <SlidersHorizontal className="size-7 text-subtle-foreground" aria-hidden />
          <Typography variant="body-base" className="text-muted-foreground">
            No trades match the current filters.
          </Typography>
          <Button variant="outline" size="sm" onClick={reset}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          {/* The shadcn Table ships its own overflow-x container, so a min-width
              here scrolls the table on mobile instead of crushing 9 columns. */}
          <Table className={TRADE_TABLE_MIN_WIDTH}>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TradeHeadCells withActions />
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((trade) => (
                <Row key={trade.id} trade={trade} onEdit={() => setEditing(trade)} />
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between gap-4 border-t border-border p-4.5">
            <Typography variant="body-sm" className="text-subtle-foreground">
              Showing {rows.length} of {filtered.length}
            </Typography>
            {shown < filtered.length ? (
              <Button variant="outline" size="sm" onClick={() => setShown((n) => n + STEP)}>
                Load more
              </Button>
            ) : null}
          </div>
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

function Row({ trade, onEdit }: { trade: EnrichedTrade; onEdit: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    // Deleting rewrites the running balance of every later trade, so this is
    // worth a confirm even though it is one row.
    const ok = await confirm({
      title: "Delete this trade?",
      description: `${trade.symbol} ${trade.side} · ${formatDate(trade.closedAt)}. The running balance of every later trade will shift.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;

    setBusy(true);
    try {
      await deleteTrade(trade.id);
      router.refresh();
      toast.success("Trade deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <TableRow className="group border-border hover:bg-surface-wash">
      <TradeRowCells trade={trade} withActions />

      <TableCell className="pr-4.5">
        {/* Visible on hover on a pointer, but always present for keyboard and
            touch: `group-hover`-only actions are unreachable without a mouse.
            focus-within keeps them up while tabbing through them. */}
        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label={`Edit ${trade.symbol} trade from ${formatDate(trade.closedAt)}`}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={busy}
            onClick={onDelete}
            aria-label={`Delete ${trade.symbol} trade from ${formatDate(trade.closedAt)}`}
            className="text-subtle-foreground hover:text-down"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
