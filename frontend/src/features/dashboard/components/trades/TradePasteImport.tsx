"use client";

import { isAxiosError } from "axios";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import { Textarea } from "@components/ui/textarea";
import { Typography } from "@components/ui/typography";
import { formatDate, formatMoney } from "@lib/format";
import { getErrorMessage } from "@lib/get-error-message";
import { cn } from "@lib/utils";

import { createTrade } from "../../api/trades.service";
import { parseTrades } from "../../lib/parse-trades";
import { useFiltersStore } from "../../stores/filters.store";

const PLACEHOLDER = `Paste one or more trades, 12 lines each:

S
BTCUSD
0.35/0.35
63,277.31
62,637.80
+223.83
+223.83
0.00/0.00
17/07/2026 15:04:54
17/07/2026 16:36:59
#1612355311
Closed`;

const SIDE_CLASS = { LONG: "text-up", SHORT: "text-info", LIQUIDATION: "text-down" } as const;

/**
 * Add trades by pasting a broker's history instead of filling the form.
 *
 * Parse is live and preview-first: the rows show before anything is written, so
 * a mis-pasted block is caught by eye, not discovered in the journal. Duplicates
 * (a ticket already stored) come back as a 409 and are reported as "already in
 * your journal", not as a failure — re-pasting the same block is safe.
 */
export function TradePasteImport({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const notifyDataChanged = useFiltersStore((s) => s.notifyDataChanged);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const { trades, errors } = useMemo(() => parseTrades(text), [text]);
  const canImport = trades.length > 0 && !busy;

  async function onImport(): Promise<void> {
    setBusy(true);
    const toastId = toast.loading(`Importing ${trades.length} ${trades.length === 1 ? "trade" : "trades"}…`);

    let added = 0;
    let skipped = 0;
    let failed = 0;

    for (const trade of trades) {
      try {
        // A parsed trade is already a create payload — no accountId, the API resolves it.
        await createTrade(trade);
        added++;
      } catch (error) {
        // A duplicate ticket is a 409 (the unique constraint), which is a skip,
        // not a failure: the trade is already where the user wanted it.
        if (isAxiosError(error) && error.response?.status === 409) skipped++;
        else {
          failed++;
          console.error("[TradePasteImport] failed to add", getErrorMessage(error));
        }
      }
    }

    setBusy(false);
    if (added > 0) {
      // Two updates for two audiences: notifyDataChanged refetches the client
      // panels (table, analytics) and reopens the date window so the new trade is
      // in view; router.refresh re-runs the server loader for the seed the sidebar
      // reads directly.
      notifyDataChanged();
      router.refresh();
    }

    const parts = [
      added > 0 && `Added ${added}`,
      skipped > 0 && `${skipped} already in your journal`,
      failed > 0 && `${failed} failed`,
    ].filter(Boolean);
    const summary = parts.join(" · ") || "Nothing to import";

    if (failed > 0) toast.error(summary, { id: toastId });
    else toast.success(summary, { id: toastId });

    // Leave the panel open on any failure so the pasted text is still there to
    // fix; a clean run has nothing left to do.
    if (failed === 0 && added + skipped > 0) {
      setText("");
      onClose();
    }
  }

  return (
    // `flex-1 min-h-0` lets the panel fill the tall dialog; the textarea grows to
    // take the slack so a big multi-trade paste has room without inner scrolling.
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        className="min-h-52 flex-1 resize-none font-mono text-body-sm"
        aria-label="Paste trades"
      />

      {trades.length > 0 ? (
        <div className="rounded-lg border border-border-soft bg-surface-well">
          <Typography variant="label-sm" weight="semibold" className="block px-3 pt-2.5 text-subtle-foreground uppercase">
            {trades.length} {trades.length === 1 ? "trade" : "trades"} ready
          </Typography>
          <ul className="max-h-48 divide-y divide-border overflow-y-auto p-1.5">
            {trades.map((t, i) => (
              <li key={t.ticket ?? i} className="flex items-center justify-between gap-3 px-1.5 py-1.5">
                <span className="flex min-w-0 items-baseline gap-2">
                  <Typography as="span" variant="body-sm" weight="bold" className={cn("shrink-0", SIDE_CLASS[t.side])}>
                    {t.side}
                  </Typography>
                  <Typography as="span" variant="body-sm" weight="semibold" className="shrink-0 text-foreground">
                    {t.symbol}
                  </Typography>
                  <Typography as="span" variant="caption" className="truncate text-subtle-foreground">
                    {formatDate(t.closedAt)}
                    {t.ticket ? ` · ${t.ticket}` : ""}
                  </Typography>
                </span>
                <Typography
                  as="span"
                  variant="body-sm"
                  weight="bold"
                  className={cn("shrink-0 tabular-nums", t.netPnl >= 0 ? "text-up" : "text-down")}
                >
                  {t.netPnl >= 0 ? "+" : ""}
                  {formatMoney(t.netPnl)}
                </Typography>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {errors.length > 0 ? (
        <div className="rounded-lg border border-down/40 bg-down/8 p-3">
          <Typography as="span" variant="body-sm" weight="semibold" className="flex items-center gap-1.5 text-down">
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            {errors.length} {errors.length === 1 ? "block" : "blocks"} couldn&apos;t be read
          </Typography>
          <ul className="mt-1.5 flex flex-col gap-1">
            {errors.map((e) => (
              <li key={e.block}>
                <Typography as="span" variant="caption" className="text-muted-foreground">
                  Trade {e.block}: {e.reason}
                </Typography>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={onImport} disabled={!canImport}>
          {busy
            ? "Importing…"
            : `Import ${trades.length || ""} ${trades.length === 1 ? "trade" : "trades"}`.trim()}
        </Button>
      </div>
    </div>
  );
}
