import { formatCompactMoney, formatMoney } from "@lib/format";

/**
 * One source for how every chart looks.
 *
 * Colours are `var(--color-*)` strings, not hex. recharts renders SVG, and SVG
 * `fill`/`stroke` resolve CSS variables — so charts read the same tokens as the
 * rest of the app and restyle with the accent themes for free. A canvas library
 * would have forced a second copy of the palette into JS.
 */
export const CHART = {
  /** P&L direction — the same green/red language the panels use. */
  up: "var(--color-up)",
  down: "var(--color-down)",
  /** Series/accent hues. */
  info: "var(--color-info)",
  primary: "var(--color-primary)",
  /** Fixed, non-themeable hues (see ui-registry.md → Tile). */
  short: "var(--color-short)",
  flat: "var(--color-flat)",
  equityLine: "var(--color-blue-soft)",
  /** Chrome. */
  grid: "var(--color-chart-grid)",
  tick: "var(--color-muted-foreground)",
  surface: "var(--color-surface)",
  border: "var(--color-hairline-strong)",
  text: "var(--color-foreground)",
} as const;

/** Signed data colours each datum by sign — the core rule, applied per `<Cell>`. */
export function signedFill(value: number): string {
  return value >= 0 ? CHART.up : CHART.down;
}

/** Shared axis/grid props, spread into each chart so they can't drift. */
export const AXIS_TICK = { fill: CHART.tick, fontSize: 11 } as const;

export const GRID_PROPS = {
  stroke: CHART.grid,
  strokeDasharray: "0",
  vertical: false,
} as const;

/** Tooltip chrome. recharts styles it inline rather than by class. */
export const TOOLTIP_PROPS = {
  contentStyle: {
    background: CHART.surface,
    border: `1px solid ${CHART.border}`,
    borderRadius: "var(--radius)",
    fontSize: 12,
    padding: "8px 10px",
  },
  labelStyle: { color: CHART.text, fontWeight: 700, marginBottom: 2 },
  itemStyle: { color: CHART.tick },
  cursor: { fill: "var(--color-wash-soft)" },
} as const;

export const LEGEND_PROPS = {
  wrapperStyle: { fontSize: 11, fontWeight: 700, color: CHART.tick },
} as const;

/** Y axis: compact so the gutter stays narrow ("$1.2K"). */
export const moneyAxisTick = (value: number): string => formatCompactMoney(value);

/** Tooltips show the exact figure — the axis is where we abbreviate, not here. */
export const moneyTooltip = (value: number): string => formatMoney(value);
