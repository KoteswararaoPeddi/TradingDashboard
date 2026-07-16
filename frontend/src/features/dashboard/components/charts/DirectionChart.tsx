"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
  AXIS_TICK,
  CHART,
  GRID_PROPS,
  moneyAxisTick,
  moneyTooltip,
  TOOLTIP_PROPS,
} from "@shared/config/chart-theme";

import type { DirectionPnl } from "../../types/metrics.types";

/**
 * Long vs Short vs Liquidation.
 *
 * Unlike the signed charts, these bars are coloured by **direction**, not by
 * sign: the point is comparing where the edge comes from, and the sign is
 * already legible from the bar's height.
 */
export function DirectionChart({ direction }: { direction: DirectionPnl }) {
  const data = [
    { label: "Long", value: Number(direction.long.toFixed(2)), fill: CHART.up },
    { label: "Short", value: Number(direction.short.toFixed(2)), fill: CHART.short },
    { label: "Liquidation", value: Number(direction.liquidation.toFixed(2)), fill: CHART.down },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={moneyAxisTick} width={56} />
        <Tooltip {...TOOLTIP_PROPS} formatter={(value) => [moneyTooltip(Number(value)), "P&L"]} />
        <Bar dataKey="value" radius={6} isAnimationActive={false}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
