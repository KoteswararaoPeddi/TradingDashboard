"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
  AXIS_TICK,
  GRID_PROPS,
  moneyAxisTick,
  moneyTooltip,
  signedFill,
  TOOLTIP_PROPS,
} from "@shared/config/chart-theme";

/** Keys of T whose value is a string — valid category axes. */
type StringKey<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T] & string;
/** Keys of T whose value is a number — valid value axes. */
type NumberKey<T> = { [K in keyof T]: T[K] extends number ? K : never }[keyof T] & string;

interface Props<T> {
  data: T[];
  /** Field holding the category label. */
  categoryKey: StringKey<T>;
  /** Field holding the signed P&L. */
  valueKey: NumberKey<T>;
  /** Bars run left-to-right instead of bottom-up (asset performance). */
  horizontal?: boolean;
  /** Tooltip series name. */
  name: string;
  radius?: number;
  /** Category axis label width, horizontal mode only. */
  categoryWidth?: number;
}

/**
 * A bar chart whose bars are coloured by the sign of their value.
 *
 * Four of the cockpit's charts (daily, weekday, hourly, asset) differ only in
 * their data and orientation, so they share this rather than repeating the axis,
 * grid and tooltip wiring four times.
 *
 * Per-bar colour needs a `<Cell>` per datum: a single `fill` on `<Bar>` paints
 * every bar the same, which would throw away the green/red language entirely.
 */
export function SignedBarChart<T extends object>({
  data,
  categoryKey,
  valueKey,
  horizontal,
  name,
  radius = 6,
  categoryWidth = 64,
}: Props<T>) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 4, right: 8, bottom: 0, left: horizontal ? 0 : -8 }}
      >
        <CartesianGrid {...GRID_PROPS} vertical={horizontal} horizontal={!horizontal} />

        {horizontal ? (
          <>
            <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={moneyAxisTick} />
            <YAxis
              type="category"
              dataKey={categoryKey}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={categoryWidth}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={categoryKey} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={4} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={moneyAxisTick} width={56} />
          </>
        )}

        <Tooltip {...TOOLTIP_PROPS} formatter={(value) => [moneyTooltip(Number(value)), name]} />

        <Bar dataKey={valueKey} radius={radius} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell key={i} fill={signedFill(Number(entry[valueKey]))} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
