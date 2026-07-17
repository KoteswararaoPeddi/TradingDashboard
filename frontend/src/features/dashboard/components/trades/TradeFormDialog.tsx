"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Field } from "@components/ui/field";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { getErrorMessage } from "@lib/get-error-message";

import { createTrade, updateTrade } from "../../api/trades.service";
import { tradeSchema, type TradeValues } from "../../schemas/trade.schema";
import type { EnrichedTrade } from "../../types/trade.types";

/**
 * `datetime-local` has no timezone, and the whole app reads timestamps with UTC
 * accessors so the hour/weekday buckets are stable for every viewer. So the time
 * the user types is treated as UTC — the same anchoring the seed does — rather
 * than being silently shifted by the browser's zone.
 */
const toUtcIso = (local: string): string => new Date(`${local}:00Z`).toISOString();

/** ISO back to the `YYYY-MM-DDTHH:mm` the input wants, still in UTC. */
const toLocalInput = (iso: string | null): string => (iso ? iso.slice(0, 16) : "");

const emptyValues: TradeValues = {
  symbol: "",
  side: "LONG",
  netPnl: "" as unknown as number,
  closedAt: "",
  openedAt: "",
  size: "",
  entryPrice: "",
  exitPrice: "",
  fees: "",
  ticket: "",
};

/**
 * Add / edit a trade.
 *
 * One component for both because the fields and rules are identical — the only
 * difference is whether an id exists. Splitting them would duplicate the schema
 * and let the two drift apart.
 */
export function TradeFormDialog({
  open,
  onOpenChange,
  trade,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit that trade; absent = add a new one. */
  trade?: EnrichedTrade;
}) {
  const router = useRouter();
  const editing = Boolean(trade);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TradeValues>({
    resolver: zodResolver(tradeSchema),
    mode: "onBlur",
    // `values` (not defaultValues) so opening the dialog on a different row
    // re-seeds the form instead of showing the previous trade's numbers.
    values: trade
      ? {
          symbol: trade.symbol,
          side: trade.side,
          netPnl: trade.netPnl,
          closedAt: toLocalInput(trade.closedAt),
          openedAt: toLocalInput(trade.openedAt),
          size: trade.size ?? "",
          entryPrice: trade.entryPrice ?? "",
          exitPrice: trade.exitPrice ?? "",
          fees: trade.fees,
          ticket: trade.ticket ?? "",
        }
      : emptyValues,
  });

  const onSubmit = handleSubmit(async (raw) => {
    const toastId = toast.loading(editing ? "Saving trade…" : "Adding trade…");
    try {
      const v = tradeSchema.parse(raw);
      const blank = (n: number | "" | undefined) => (n === "" || n === undefined ? undefined : n);

      const payload = {
        symbol: v.symbol,
        side: v.side,
        netPnl: v.netPnl,
        closedAt: toUtcIso(v.closedAt),
        openedAt: v.openedAt ? toUtcIso(v.openedAt) : undefined,
        size: v.size || undefined,
        entryPrice: blank(v.entryPrice),
        exitPrice: blank(v.exitPrice),
        fees: blank(v.fees),
        ticket: v.ticket || undefined,
      };

      // No accountId: the journal has one account and the API resolves it.
      if (trade) await updateTrade(trade.id, payload);
      else await createTrade(payload);

      // The trade set is loaded on the server, so re-running the loader is what
      // recomputes every metric — not a local setState.
      router.refresh();
      onOpenChange(false);
      toast.success(editing ? "Trade updated." : "Trade added.", { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error), { id: toastId });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit trade" : "Add trade"}</DialogTitle>
          <DialogDescription>
            P&amp;L is what every metric is built from. The rest is optional detail for the table.
          </DialogDescription>
        </DialogHeader>

        {/* noValidate: Zod owns validation, so the browser's own bubbles would be
            a second, differently-worded opinion. */}
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Symbol" htmlFor="symbol" error={errors.symbol?.message}>
              <Input id="symbol" placeholder="BTCUSD" autoComplete="off" aria-invalid={Boolean(errors.symbol)} {...register("symbol")} />
            </Field>

            <Field label="Direction" htmlFor="side" error={errors.side?.message}>
              {/* Select is controlled, so RHF needs a Controller rather than register(). */}
              <Controller
                control={control}
                name="side"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="side">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LONG">Long</SelectItem>
                      <SelectItem value="SHORT">Short</SelectItem>
                      <SelectItem value="LIQUIDATION">Liquidation</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Net P&L"
              htmlFor="netPnl"
              error={errors.netPnl?.message}
              hint="— after fees; negative for a loss"
            >
              <Input
                id="netPnl"
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="36.52"
                aria-invalid={Boolean(errors.netPnl)} {...register("netPnl")}
              />
            </Field>

            <Field label="Fees" htmlFor="fees" hint="(Optional)" error={errors.fees?.message}>
              <Input id="fees" type="number" step="0.01" min="0" placeholder="0" aria-invalid={Boolean(errors.fees)} {...register("fees")} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Closed at"
              htmlFor="closedAt"
              error={errors.closedAt?.message}
              hint="— UTC"
            >
              <Input id="closedAt" type="datetime-local" aria-invalid={Boolean(errors.closedAt)} {...register("closedAt")} />
            </Field>

            <Field label="Opened at" htmlFor="openedAt" hint="(Optional)" error={errors.openedAt?.message}>
              <Input id="openedAt" type="datetime-local" aria-invalid={Boolean(errors.openedAt)} {...register("openedAt")} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Entry" htmlFor="entryPrice" hint="(Opt.)" error={errors.entryPrice?.message}>
              <Input id="entryPrice" type="number" step="0.01" min="0" aria-invalid={Boolean(errors.entryPrice)} {...register("entryPrice")} />
            </Field>
            <Field label="Exit" htmlFor="exitPrice" hint="(Opt.)" error={errors.exitPrice?.message}>
              <Input id="exitPrice" type="number" step="0.01" min="0" aria-invalid={Boolean(errors.exitPrice)} {...register("exitPrice")} />
            </Field>
            <Field label="Size" htmlFor="size" hint="(Opt.)" error={errors.size?.message}>
              <Input id="size" placeholder="1/1" autoComplete="off" aria-invalid={Boolean(errors.size)} {...register("size")} />
            </Field>
          </div>

          <Field label="Ticket" htmlFor="ticket" hint="(Optional)" error={errors.ticket?.message}>
            <Input id="ticket" placeholder="#1598342621" autoComplete="off" aria-invalid={Boolean(errors.ticket)} {...register("ticket")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editing ? "Save changes" : "Add trade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
