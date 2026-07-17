"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";

import { TradePasteImport } from "./TradePasteImport";

/**
 * Add trades by pasting a broker's history.
 *
 * There is no field form and no edit mode: a trade arrives from a broker as a
 * block, so pasting is the whole input path. Corrections are a delete-and-repaste
 * rather than an edit form — one way in, nothing to keep in sync.
 */
export function AddTradeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Tall by design: paste needs room for a multi-trade block and its preview
          without the dialog scrolling internally. `min-h` sets the floor; `max-h`
          keeps it inside the viewport on short screens, where it scrolls. */}
      <DialogContent className="flex max-h-[92vh] min-h-[70vh] flex-col overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add trades</DialogTitle>
          <DialogDescription>
            Paste one or more trades from your broker — one 12-line block each.
          </DialogDescription>
        </DialogHeader>

        <TradePasteImport onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
