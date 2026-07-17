"use client";

import { usePathname } from "next/navigation";

import { Typography } from "@components/ui/typography";
import { navItemFor } from "@shared/config/app-nav.config";

import { AccentSwitcher } from "./AccentSwitcher";

/** Page header: the page title, its subline, and the accent dots. */
export function Topbar() {
  const pathname = usePathname();
  const item = navItemFor(pathname);

  return (
    // Sticky from 1181px up only. Below that the sidebar is itself a sticky strip
    // at top-0, and a second bar pinned to the same edge would collide with it —
    // two sticky bars stacked on a phone would also eat most of the viewport.
    //
    // The header owns the top edge of `main` (which carries no padding of its
    // own), so it starts at y=0 and pins with zero travel. When `main` padded its
    // own top, the bar slid that padding's worth before catching — a small jump
    // that reads as jank precisely because a pinned bar is supposed to be still.
    //
    // `bg-background/85 + backdrop-blur` because the page scrolls *under* this,
    // and a transparent app bar just prints rows through the title.
    <header className="z-20 flex flex-col items-start justify-between gap-4 border-b border-border bg-background/85 px-4 py-4 backdrop-blur-lg md:flex-row md:items-center md:px-6.5 min-[1181px]:sticky min-[1181px]:top-0">
      <div className="min-w-0">
        {/*
          The title is a label, not the headline. It used to render the account
          name at up to 56px, which made the loudest thing on the page a caption
          for what you were already looking at — and put it in direct competition
          with the balance, the figure the page exists to show. The account
          identity lives in the sidebar brand block; this just names the page.
        */}
        <Typography as="h1" variant="h2" weight="black" className="text-foreground">
          {item?.label ?? "Trade Journal"}
        </Typography>

        {item ? (
          <Typography variant="body-sm" className="mt-1 max-w-3xl text-muted-foreground">
            {item.subline}
          </Typography>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2.5">
        <AccentSwitcher />
      </div>
    </header>
  );
}
