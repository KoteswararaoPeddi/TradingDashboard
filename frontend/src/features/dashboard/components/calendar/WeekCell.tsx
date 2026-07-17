"use client";

import { Typography } from "@components/ui/typography";
import { formatCompactMoney } from "@lib/format";
import { cn } from "@lib/utils";

import type { CalendarWeek } from "../../lib/calendar";

/**
 * The week's total, which the day cells cannot add up for you.
 *
 * A row of four small reds and one green is the shape of a losing week, but the
 * eye reads it as "mixed" — the total is the only thing that says which.
 */
export function WeekCell({ week }: { week: CalendarWeek }) {
  const dead = week.tradedDays === 0;
  const up = week.net >= 0;

  return (
    <div
      className={cn(
        "flex min-h-17 flex-col justify-center gap-0.5 rounded-lg border border-border-soft bg-surface-well px-2 py-1.5 text-center",
        dead && "opacity-45",
      )}
    >
      <Typography
        as="span"
        variant="label-sm"
        weight="semibold"
        className="tracking-wider text-subtle-foreground uppercase"
      >
        Week
      </Typography>
      <Typography
        as="span"
        variant="body-base"
        weight="black"
        className={cn("tabular-nums", dead ? "text-subtle-foreground" : up ? "text-up" : "text-down")}
      >
        {!dead && up ? "+" : ""}
        {formatCompactMoney(week.net)}
      </Typography>
      <Typography variant="caption" className="text-subtle-foreground">
        {dead ? "No trades" : `${week.tradedDays} ${week.tradedDays === 1 ? "day" : "days"}`}
      </Typography>
    </div>
  );
}
