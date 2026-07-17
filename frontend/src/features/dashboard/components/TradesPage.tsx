"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@components/ui/button";

import { FilterChips } from "./filters/FilterChips";
import { TradeFormDialog } from "./trades/TradeFormDialog";
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
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="size-4" aria-hidden />
          Add trade
        </Button>
      </div>

      <TradesTable onAddTrade={() => setAdding(true)} />

      <TradeFormDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}
