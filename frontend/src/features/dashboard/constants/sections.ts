/**
 * The cockpit's sections, in the order they stack down the page.
 *
 * The dashboard is a single long page, so the sidebar navigates by in-page
 * anchor rather than by route. `id` is both the anchor target and the nav key.
 */
export interface DashboardSection {
  id: string;
  label: string;
  /** The two-digit marker the design shows in place of an icon. */
  marker: string;
}

export const DASHBOARD_SECTIONS: DashboardSection[] = [
  { id: "overview", label: "Overview", marker: "01" },
  { id: "filters", label: "Filters", marker: "02" },
  { id: "stats", label: "Stats", marker: "03" },
  { id: "charts", label: "Charts", marker: "04" },
  { id: "calendar", label: "Calendar", marker: "05" },
  { id: "trades", label: "Trades", marker: "06" },
];
