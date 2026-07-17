"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import { TableCell, TableRow } from "@components/ui/table";
import { formatDate } from "@lib/format";
import { getErrorMessage } from "@lib/get-error-message";
import { confirm } from "@shared/stores/confirm.store";

import { deleteTrade } from "../../api/trades.service";
import type { EnrichedTrade } from "../../types/trade.types";
import { TradeRowCells } from "./trade-columns";

interface Props {
  trade: EnrichedTrade;
  onEdit: () => void;
}

/** One ledger row: the shared cells, plus the actions only /trades carries. */
export function TradeRow({ trade, onEdit }: Props) {
  const router = useRouter();
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
