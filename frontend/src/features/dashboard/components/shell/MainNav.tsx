"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@lib/utils";
import { APP_NAV, SETTINGS_NAV, type NavItem } from "@shared/config/app-nav.config";

/**
 * One sidebar row. Extracted so the pinned Settings link is the *same* control as
 * the four destinations rather than a lookalike that drifts out of sync.
 */
function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      // "page" rather than "true": this marks the current destination, which
      // is what a screen reader should announce.
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-body-base font-semibold transition-colors",
        active
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-surface-wash hover:text-foreground",
      )}
    >
      {/*
        The active row is marked three ways: a tinted surface, an accent
        icon, and the dot. That is deliberate redundancy, not decoration —
        colour alone would leave the state invisible to anyone who cannot
        separate the accent from muted grey.
      */}
      <Icon
        className={cn(
          "size-4.5 shrink-0 transition-colors",
          active ? "text-primary" : "text-subtle-foreground group-hover:text-muted-foreground",
        )}
        aria-hidden
      />
      {item.label}
      {active ? (
        <span className="ml-auto size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
      ) : null}
    </Link>
  );
}

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
