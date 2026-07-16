"use client";

import { useEffect, useMemo } from "react";

import { Skeleton } from "@components/ui/skeleton";
import { Typography } from "@components/ui/typography";

import { calculateMetrics } from "../../lib/metrics";
import { useDashboardStore } from "../../stores/dashboard.store";
import { AccountCard } from "./AccountCard";
import { BrandBlock } from "./BrandBlock";
import { SectionNav } from "./SectionNav";
import { Topbar } from "./Topbar";

/**
 * The cockpit chrome: a fixed sidebar beside the scrolling panel column.
 *
 * Owns the one fetch of the account + trade set. Panels read the same store, so
 * the data is loaded once no matter how many panels mount.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const status = useDashboardStore((s) => s.status);
  const error = useDashboardStore((s) => s.error);
  const account = useDashboardStore((s) => s.account);
  const trades = useDashboardStore((s) => s.trades);
  const load = useDashboardStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  // The sidebar reports the account's standing, so it reads the full trade set.
  // The panels on the right recompute from the filtered set instead.
  const fullMetrics = useMemo(
    () => (account ? calculateMetrics(trades, account.startingBalance) : null),
    [trades, account],
  );

  const accountLabel = account ? `${account.label} #${account.accountNumber}` : "No account";
  const title = account
    ? `TRADING JOURNAL ${account.label} #${account.accountNumber}`
    : "TRADING JOURNAL";

  return (
    <div className="grid min-h-screen grid-cols-1 min-[1181px]:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
      {/* Design sidebar padding is 22px vertical / 18px horizontal. */}
      <aside className="z-20 flex flex-col gap-5 border-b border-border bg-surface/88 px-4.5 py-5.5 backdrop-blur-lg min-[1181px]:sticky min-[1181px]:top-0 min-[1181px]:h-screen min-[1181px]:border-r min-[1181px]:border-b-0">
        <BrandBlock accountLabel={accountLabel} />
        <SectionNav />

        {/* The account card is the sidebar's only data-bearing part, so it is the
            only thing that needs a loading state. */}
        <div className="mt-auto max-[1180px]:hidden">
          {status === "ready" && fullMetrics && account ? (
            <AccountCard metrics={fullMetrics} startingBalance={account.startingBalance} />
          ) : status === "error" ? null : (
            <Skeleton className="h-44 rounded-lg border border-border" />
          )}
        </div>
      </aside>

      <main className="min-w-0 p-4 md:p-6.5">
        <Topbar title={title} />

        {status === "error" ? (
          <div className="rounded-lg border border-dashed border-border bg-surface-wash-soft p-9 text-center">
            <Typography variant="body-base" className="text-muted-foreground">
              {error}
            </Typography>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
