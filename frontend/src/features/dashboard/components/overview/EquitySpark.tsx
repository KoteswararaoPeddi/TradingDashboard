"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

import { CHART } from "@shared/config/chart-theme";

import type { EquityPoint } from "../../types/metrics.types";

/** Unique per document — recharts references the gradient by id. */
const FILL_ID = "equity-spark-fill";

/**
 * The balance's shape, beside the balance itself.
 *
 * Deliberately chrome-free: no axes, grid, tooltip or dots. This is not the
 * Analytics equity curve in miniature — it answers "which way have I been
 * going", and any furniture at this size is noise. The full curve, with axes and
 * tooltips, lives on /analytics.
 */
export function EquitySpark({ data }: { data: EquityPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={FILL_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.28} />
            <stop offset="100%" stopColor={CHART.primary} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/*
          Fit to the data, never anchor at zero. recharts defaults a YAxis to
          [0, dataMax], which would render a $900-$1,200 history as a dead flat
          line pinned to the top edge — the exact opposite of what a sparkline is
          for. It is hidden, but it still governs the shape.
        */}
        <YAxis hide domain={["auto", "auto"]} />

        <Area
          type="monotone"
          dataKey="equity"
          stroke={CHART.primary}
          strokeWidth={2}
          fill={`url(#${FILL_ID})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
