"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { CHART, LEGEND_PROPS, TOOLTIP_PROPS } from "@shared/config/chart-theme";

import type { TradeMetrics } from "../../types/metrics.types";

/** Trade count by result. A donut, per the design's 68% cutout. */
export function WinLossChart({ metrics }: { metrics: TradeMetrics }) {
  const data = [
    { name: "Wins", value: metrics.wins, fill: CHART.up },
    { name: "Losses", value: metrics.losses, fill: CHART.down },
    { name: "Breakeven", value: metrics.breakevens, fill: CHART.flat },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="68%"
          outerRadius="92%"
          paddingAngle={2}
          // The ring reads against the panel, so the gap between segments is the
          // surface colour rather than a border.
          stroke={CHART.surface}
          strokeWidth={4}
          isAnimationActive={false}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP_PROPS} formatter={(value, name) => [`${Number(value)} trades`, String(name)]} />
        <Legend {...LEGEND_PROPS} verticalAlign="bottom" iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}
