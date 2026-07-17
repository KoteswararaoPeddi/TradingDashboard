"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@components/ui/button";

import { AddTradeDialog } from "./trades/AddTradeDialog";
import { ExportCsvButton } from "./trades/ExportCsvButton";
import { FilterChips } from "./filters/FilterChips";
import { TradesTable } from "./trades/TradesTable";

/** Every trade with running balance and result. */
export function TradesPage() {
  const [adding, setAdding] = useState(false);

  return (
    <div className="grid gap-4.5">
      {/* Add sits beside the filters, above the table: it acts on the ledger as a
          whole, so it belongs to the page rather than to any row. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4.5">
        <FilterChips />
        {/* Two ledger-wide actions, grouped: export the current view, or add to it.
            Export is outline (secondary) so Add trade stays the single primary. */}
        <div className="flex items-center gap-2">
          <ExportCsvButton />
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden />
            Add trade
          </Button>
        </div>
      </div>

      <TradesTable onAddTrade={() => setAdding(true)} />

      <AddTradeDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}
