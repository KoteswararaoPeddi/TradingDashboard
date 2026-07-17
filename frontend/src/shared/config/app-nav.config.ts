import {
  CalendarDays,
  LayoutDashboard,
  LineChart,
  Receipt,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@shared/constants/routes";

export interface NavItem {
  href: string;
  /** Sidebar link text, and the page's `h1`. */
  label: string;
  /**
   * The sidebar glyph. An icon, not the design's `01`/`02` marker: numbering
   * four destinations implies a sequence you work through, which is false — they
   * are places you jump between. An icon is also recognised without being read,
   * which is the entire job of nav at a glance.
   */
  icon: LucideIcon;
  /** The page's subline, under the title. */
  subline: string;
}

/**
 * The app's destinations, in sidebar order.
 *
 * This drives the sidebar nav *and* the topbar's title/subline, so a page cannot
 * be named one thing in the nav and another at the top of its own page.
 *
 * Filters is deliberately not here. It scopes every view rather than being a
 * place you go, so it lives as a persistent control on the pages it narrows.
 */
export const APP_NAV: NavItem[] = [
  {
    href: ROUTES.dashboard,
    label: "Dashboard",
    icon: LayoutDashboard,
    subline: "Where the account stands right now.",
  },
  {
    href: ROUTES.analytics,
    label: "Analytics",
    icon: LineChart,
    subline: "Every metric and chart for the active trade set.",
  },
  {
    href: ROUTES.trades,
    label: "Trades",
    icon: Receipt,
    subline: "Every trade with running balance and result.",
  },
  {
    href: ROUTES.calendar,
    label: "Calendar",
    icon: CalendarDays,
    subline: "Daily P&L across the selected range.",
  },
];

/**
 * Settings, deliberately kept out of `APP_NAV`.
 *
 * The four entries above are analytical views of the same trade set — places you
 * jump between while working. Settings is configuration you visit rarely and
 * leave, so listing it as a fifth peer would overstate it. It renders pinned to
 * the foot of the sidebar instead, away from the working set.
 */
export const SETTINGS_NAV: NavItem = {
  href: ROUTES.settings,
  label: "Settings",
  icon: Settings,
  subline: "Starting balance and currency for the journal.",
};

/**
 * The nav entry owning a pathname, for the topbar's title.
 *
 * Searches Settings too: it is rendered apart from the main nav, but it is still
 * a page that needs its title and subline at the top.
 */
export function navItemFor(pathname: string): NavItem | undefined {
  return [...APP_NAV, SETTINGS_NAV].find((item) => item.href === pathname);
}
