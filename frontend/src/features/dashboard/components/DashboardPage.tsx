"use client";

import { Typography } from "@components/ui/typography";

import { Charts } from "./charts/Charts";
import { DASHBOARD_SECTIONS, type DashboardSection } from "../constants/sections";
import { Overview } from "./overview/Overview";
import { Panel } from "./Panel";
import { Stats } from "./stats/Stats";

/**
 * Sections that have landed. Anything not listed renders a placeholder, so the
 * page always keeps the design's order and every anchor stays reachable while
 * the remaining slices are built.
 */
const BUILT: Partial<Record<string, () => React.ReactNode>> = {
  overview: Overview,
  stats: Stats,
  charts: Charts,
};

/** The cockpit's panel column, stacked in the design's order. */
export function DashboardPage() {
  return (
    <div className="grid gap-4.5">
      {DASHBOARD_SECTIONS.map((section) => {
        const Section = BUILT[section.id];
        return Section ? <Section key={section.id} /> : <Placeholder key={section.id} section={section} />;
      })}
    </div>
  );
}

function Placeholder({ section }: { section: DashboardSection }) {
  return (
    <Panel
      id={section.id}
      title={section.label}
      description={`The ${section.label.toLowerCase()} panel lands in a later slice.`}
    >
      <div className="rounded-lg border border-dashed border-border bg-surface-wash-soft p-9 text-center">
        <Typography variant="body-sm" className="text-muted-foreground">
          Not built yet.
        </Typography>
      </div>
    </Panel>
  );
}
