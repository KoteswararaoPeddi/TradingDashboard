"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
  AXIS_TICK,
  CHART,
  GRID_PROPS,
  moneyAxisTick,
  moneyTooltip,
  TOOLTIP_PROPS,
} from "@shared/config/chart-theme";

import type { EquityPoint } from "../../types/metrics.types";

/** Unique per document — recharts references the gradient by id. */
const FILL_ID = "equity-curve-fill";

/** Running account balance across the active trade set. */
export function EquityChart({ data }: { data: EquityPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
        <defs>
          {/* Blue at the top fading through the brand green, per the design. */}
          <linearGradient id={FILL_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.info} stopOpacity={0.35} />
            <stop offset="58%" stopColor={CHART.primary} stopOpacity={0.08} />
            <stop offset="100%" stopColor={CHART.primary} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={16} />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={moneyAxisTick} width={56} />
        <Tooltip {...TOOLTIP_PROPS} formatter={(value) => [moneyTooltip(Number(value)), "Equity"]} />

        <Area
          type="monotone"
          dataKey="equity"
          stroke={CHART.equityLine}
          strokeWidth={3}
          fill={`url(#${FILL_ID})`}
          // 18 points would otherwise be 18 dots; the shape is the story here.
          dot={false}
          activeDot={{ r: 4, fill: CHART.primary, stroke: "none" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
