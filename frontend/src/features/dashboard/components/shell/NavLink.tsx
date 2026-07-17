"use client";

import Link from "next/link";

import { cn } from "@lib/utils";
import type { NavItem } from "@shared/config/app-nav.config";

interface Props {
  item: NavItem;
  active: boolean;
}

/**
 * One sidebar row.
 *
 * Its own component so the pinned Settings link is the *same* control as the four
 * destinations rather than a lookalike that drifts out of sync the next time the
 * active treatment changes.
 */
export function NavLink({ item, active }: Props) {
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
        The active row is marked three ways: a tinted surface, an accent icon,
        and the dot. That is deliberate redundancy, not decoration — colour alone
        would leave the state invisible to anyone who cannot separate the accent
        from muted grey.
      */}
      <Icon
        className={cn(
          "size-4.5 shrink-0 transition-colors",
          active ? "text-primary" : "text-subtle-foreground group-hover:text-muted-foreground",
        )}
        aria-hidden
      />
      {item.label}
      {active ? <span className="ml-auto size-1.5 shrink-0 rounded-full bg-primary" aria-hidden /> : null}
    </Link>
  );
}
