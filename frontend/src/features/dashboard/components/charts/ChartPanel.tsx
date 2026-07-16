import { cn } from "@lib/utils";

import { Panel } from "../Panel";

interface Props {
  title: string;
  description: string;
  /** The equity curve spans the full 12 columns and gets extra height. */
  wide?: boolean;
  children: React.ReactNode;
}

/**
 * A chart in its own panel.
 *
 * The fixed body height is load-bearing, not decoration: recharts'
 * `ResponsiveContainer` measures its parent, and inside an auto-height box it
 * resolves to zero and the chart silently disappears.
 */
export function ChartPanel({ title, description, wide, children }: Props) {
  return (
    <Panel
      title={title}
      description={description}
      padded={false}
      className={cn("col-span-12", !wide && "min-[781px]:col-span-6")}
    >
      <div
        className={cn(
          "px-4.5 pt-3 pb-4.5",
          // 310px on small screens; 340 standard, 390 for the wide equity panel.
          "h-77.5",
          wide ? "min-[781px]:h-97.5" : "min-[781px]:h-85",
        )}
      >
        {children}
      </div>
    </Panel>
  );
}
