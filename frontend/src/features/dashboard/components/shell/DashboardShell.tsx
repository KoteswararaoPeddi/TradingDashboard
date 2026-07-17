"use client";

import { useMemo } from "react";

import { Typography } from "@components/ui/typography";

import { useDashboardData } from "../DashboardProvider";
import { calculateMetrics } from "../../lib/metrics";
import { AccountCard } from "./AccountCard";
import { BrandBlock } from "./BrandBlock";
import { MainNav } from "./MainNav";
import { Topbar } from "./Topbar";

/**
 * The cockpit chrome: a fixed sidebar beside the scrolling panel column.
 *
 * Reads the server-loaded data from context, so the sidebar renders real numbers
 * on the first paint. There is no loading state to handle: the data arrives with
 * the HTML rather than after it.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { status, error, account, trades } = useDashboardData();

  // The sidebar reports the account's standing, so it reads the full trade set.
  // The panels on the right recompute from the filtered set instead.
  const fullMetrics = useMemo(
    () => (account ? calculateMetrics(trades, account.startingBalance) : null),
    [trades, account],
  );

  const accountLabel = account ? `${account.label} #${account.accountNumber}` : "No account";

  return (
    // Block flow below 1181px, grid above it — and that is what makes the nav
    // stick on mobile. A grid item's sticky containing block is its own **grid
    // area**: stacked, the sidebar is row 1 and that row is exactly as tall as
    // the sidebar, so `sticky` has zero room to travel and silently does nothing.
    // Out of the grid, its containing block is the page, so it sticks properly.
    <div className="min-h-screen min-[1181px]:grid min-[1181px]:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
      {/* Design sidebar padding is 22px vertical / 18px horizontal. */}
      <aside className="sticky top-0 z-30 flex flex-col gap-5 border-b border-border bg-surface/88 px-4.5 py-5.5 backdrop-blur-lg min-[1181px]:h-screen min-[1181px]:border-r min-[1181px]:border-b-0">
        <BrandBlock accountLabel={accountLabel} />

        <div className="min-w-0">
          <Typography
            as="span"
            variant="label-sm"
            weight="semibold"
            className="mb-2 block px-3 tracking-wider text-subtle-foreground uppercase max-[1180px]:hidden"
          >
            Menu
          </Typography>
          <MainNav />
        </div>

        {/* Account card sits below the nav — but still **not** pinned with
            `mt-auto`. That distinction is the whole point: pinned, it left a
            screen-tall void between the nav and the card that read as a broken
            layout. Following the nav in normal flow, it closes up against it and
            the sidebar ends where its content ends. */}
        {/* No skeleton branch: the data ships with the HTML, so the card either
            has its numbers or the API is down and the panel column says so. */}
        <div className="max-[1180px]:hidden">
          {fullMetrics ? <AccountCard metrics={fullMetrics} /> : null}
        </div>
      </aside>

      {/* No padding on `main` itself: the sticky Topbar owns the top edge, so it
          starts flush at y=0 and pins with zero travel. Padding here would make
          the bar slide that distance before catching, which reads as jank. The
          page content carries its own padding instead. */}
      <main className="min-w-0">
        <Topbar />

        <div className="p-4 md:p-6.5">
          {status === "error" ? (
            <div className="rounded-xl border border-dashed border-border bg-surface-wash-soft p-9 text-center">
              <Typography variant="body-base" className="text-muted-foreground">
                {error}
              </Typography>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
