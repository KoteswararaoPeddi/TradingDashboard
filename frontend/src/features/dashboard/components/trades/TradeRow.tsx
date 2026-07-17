"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import { TableCell, TableRow } from "@components/ui/table";
import { formatDate } from "@lib/format";
import { getErrorMessage } from "@lib/get-error-message";
import { confirm } from "@shared/stores/confirm.store";

import { deleteTrade } from "../../api/trades.service";
import { useFiltersStore } from "../../stores/filters.store";
import type { EnrichedTrade } from "../../types/trade.types";
import { TradeRowCells } from "./trade-columns";

interface Props {
  trade: EnrichedTrade;
}

/** One ledger row: the shared cells, plus the delete action only /trades carries. */
export function TradeRow({ trade }: Props) {
  const router = useRouter();
  const notifyDataChanged = useFiltersStore((s) => s.notifyDataChanged);
  const [busy, setBusy] = useState(false);

  async function onDelete(): Promise<void> {
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
      notifyDataChanged();
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
        <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100">
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
