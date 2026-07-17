"use client";

import { usePathname } from "next/navigation";

import { APP_NAV, SETTINGS_NAV } from "@shared/config/app-nav.config";

import { NavLink } from "./NavLink";

/**
 * Sidebar navigation across the app's pages.
 *
 * These are routes, so "active" is simply the current pathname. The previous
 * IntersectionObserver is gone with the single-page cockpit: it existed to track
 * which section had scrolled into view, and there are no in-page sections to
 * track any more.
 *
 * Settings renders under a rule rather than as a fifth peer: the entries above it
 * are analytical views of one trade set, and it is configuration. It is separated
 * here rather than pinned to the sidebar's foot with `mt-auto` — that is exactly
 * what left a screen-tall void mid-sidebar when the account card was pinned.
 */
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="grid gap-1 max-[1180px]:grid-flow-col max-[1180px]:auto-cols-[minmax(130px,1fr)] max-[1180px]:overflow-x-auto"
    >
      {APP_NAV.map((item) => (
        <NavLink key={item.href} item={item} active={pathname === item.href} />
      ))}

      {/* Hidden on mobile: the nav is a horizontal scroller there, where a rule
          would occupy a whole column slot and read as an empty tab. */}
      <span className="my-1 h-px bg-border max-[1180px]:hidden" aria-hidden />

      <NavLink item={SETTINGS_NAV} active={pathname === SETTINGS_NAV.href} />
    </nav>
  );
}
