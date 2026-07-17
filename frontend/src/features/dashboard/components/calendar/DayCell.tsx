"use client";

import { Typography } from "@components/ui/typography";
import { formatCompactMoney, formatDate, formatMoney } from "@lib/format";
import { cn } from "@lib/utils";

import { tintPercent, type CalendarDay } from "../../lib/calendar";

/**
 * The alpha range each tint travels, as `color-mix` percentages.
 *
 * The floors are not decoration. A $2 day next to a $140 day scales to ~1%,
 * which renders as an untraded cell — so the quietest traded day would silently
 * claim the trader took the day off. The floor buys back that distinction.
 */
const FILL = { floor: 10, ceiling: 52 };
const EDGE = { floor: 24, ceiling: 74 };

interface Props {
  day: CalendarDay;
  today?: boolean;
}

/**
 * One day of the calendar.
 *
 * Four states, because they are four different facts: outside the filter window,
 * no trades, traded flat, traded up or down.
 */
export function DayCell({ day, today }: Props) {
  const traded = day.pnl !== null;
  const signed = traded && day.pnl !== 0;
  const up = (day.pnl ?? 0) > 0;

  // P&L-proportional colour cannot be a utility class — the alpha is data. This
  // is the sanctioned inline-style route, reading the same tokens as everything
  // else rather than a second copy of the palette.
  const tint = signed
    ? {
        backgroundColor: `color-mix(in oklab, var(--color-${up ? "up" : "down"}) ${tintPercent(day.strength, FILL.floor, FILL.ceiling)}%, transparent)`,
        borderColor: `color-mix(in oklab, var(--color-${up ? "up" : "down"}) ${tintPercent(day.strength, EDGE.floor, EDGE.ceiling)}%, transparent)`,
      }
    : undefined;

  return (
    <div
      title={cellTitle(day)}
      style={tint}
      className={cn(
        "flex min-h-17 flex-col rounded-lg border p-1.5",
        !day.inRange && "opacity-35",
        signed && "border-transparent",
        !signed && traded && "border-border-soft bg-surface-well",
        !traded && "border-border-tile bg-surface-well-soft",
        today && "ring-1 ring-primary/70",
      )}
    >
      <div className="flex items-center gap-1">
        <Typography
          as="span"
          variant="label-base"
          weight="semibold"
          className={cn(
            "tabular-nums",
            today ? "text-primary" : traded ? "text-foreground" : "text-subtle-foreground",
          )}
        >
          {day.date}
        </Typography>
        {today ? <span className="size-1 rounded-full bg-primary" aria-hidden /> : null}
      </div>

      {traded ? (
        <div className="mt-auto">
          <Typography
            as="span"
            variant="body-sm"
            weight="black"
            className={cn(
              "block truncate tabular-nums",
              !signed && "text-muted-foreground",
              signed && (up ? "text-up" : "text-down"),
            )}
          >
            {up ? "+" : ""}
            {formatCompactMoney(day.pnl ?? 0)}
          </Typography>
          {/* The count is what turns "-$76" into a story: one bad trade is
              variance, six is a bad day, and the tint cannot tell them apart.

              `text-foreground/70`, not `text-subtle-foreground`: this line sits on
              the day's colour tint (up/down at up to ~52% alpha), and the dark
              slate `subtle-foreground` (#667085) all but vanishes on green or red.
              Dimmed white reads on every cell state — tinted, flat, or dark. */}
          <Typography variant="caption" weight="semibold" className="block truncate text-foreground/70">
            {day.trades} {day.trades === 1 ? "trade" : "trades"}
          </Typography>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The tint and the compact figure are both approximations, so the exact number
 * and the trade count live here — and this is the only thing a screen reader
 * gets, since a coloured box says nothing.
 */
function cellTitle(day: CalendarDay): string {
  // dayKey stays ISO for keys and range comparisons; only its display is DD-MM-YYYY.
  const date = formatDate(day.dayKey);
  if (!day.inRange) return `${date}, outside the selected range`;
  if (day.pnl === null) return `${date}, no trades`;
  const count = `${day.trades} ${day.trades === 1 ? "trade" : "trades"}`;
  return `${date}, ${count}, ${day.pnl >= 0 ? "+" : ""}${formatMoney(day.pnl)}`;
}
