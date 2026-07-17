"use client";

import { useCockpit } from "../../hooks/use-cockpit";
import { buildStatRows } from "../../lib/stat-rows";
import { Panel } from "../Panel";
import { Tile } from "../Tile";
import { StatsSkeleton } from "./StatsSkeleton";

/** The 27 core performance stats for the active view. */
export function Stats() {
  const { status, account, metrics } = useCockpit();

  if (status !== "ready" || !metrics || !account) {
    return (
      <Panel id="stats" title="Core Performance Stats" description="Loading the active view.">
        <StatsSkeleton />
      </Panel>
    );
  }

  const rows = buildStatRows(metrics, account.startingBalance);

  return (
    <Panel
      id="stats"
      title="Core Performance Stats"
      description={`${metrics.totalTrades} trades currently selected. Key account metrics for the active trade set.`}
    >
      {/* auto-fit so the grid reflows on its own, without a breakpoint per column count. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        {rows.map((row) => (
          <Tile
            key={row.label}
            label={row.label}
            value={row.value}
            note={row.note}
            tone={row.tone}
            interactive
          />
        ))}
      </div>
    </Panel>
  );
}
