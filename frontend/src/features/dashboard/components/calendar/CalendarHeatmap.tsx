"use client";

import { CalendarRange, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@components/EmptyState";
import { Button } from "@components/ui/button";
import { Typography } from "@components/ui/typography";
import { cn } from "@lib/utils";

import { useCockpit } from "../../hooks/use-cockpit";
import { useTodayKey } from "../../hooks/useTodayKey";
import { buildCalendarMonths, WEEKDAY_LABELS } from "../../lib/calendar";
import { useFiltersStore } from "../../stores/filters.store";
import { Panel } from "../Panel";
import { MonthNav } from "./MonthNav";
import { WeekRow } from "./WeekRow";

/** Below this the eight columns crush; the grid scrolls sideways instead. */
const GRID_MIN_WIDTH = "min-w-215";

/** 7 day columns + the weekly total. The week column is narrower: it is support, not a day. */
const GRID_COLS = "grid-cols-[repeat(7,minmax(0,1fr))_minmax(0,0.8fr)]";

/**
 * Each day of the month tinted by what it made or lost, with its week's total
 * alongside.
 *
 * A month grid answers a question the daily P&L bar chart cannot: *when* the
 * damage happened. Bars are ordered by trading day, so a Monday habit or a bad
 * week reads as an anonymous run of red; on a calendar it lands under the same
 * column, or in the same row, and names itself.
 */
export function CalendarHeatmap() {
  const { status, error, metrics, accountTradeCount } = useCockpit();
  const range = useFiltersStore((s) => s.filters);
  const reset = useFiltersStore((s) => s.reset);
  const todayKey = useTodayKey();

  const months = useMemo(
    () => (metrics ? buildCalendarMonths(metrics.dailyPnl, range) : []),
    [metrics, range],
  );

  // Pin the *month*, not its index. When a filter change rebuilds the range, an
  // index would silently point at a different month; a key that no longer exists
  // falls back to the newest, which is the month a trader wants anyway.
  const [pinned, setPinned] = useState<string | null>(null);
  const pinnedIndex = pinned ? months.findIndex((m) => m.key === pinned) : -1;
  const index = pinnedIndex >= 0 ? pinnedIndex : months.length - 1;
  const month = months[index];

  if (status !== "ready") {
    return (
      <Panel id="calendar" title="Performance calendar" description="Could not load the calendar.">
        <Typography variant="body-base" className="text-muted-foreground">
          {error ?? "Something went wrong."}
        </Typography>
      </Panel>
    );
  }

  return (
    <Panel
      id="calendar"
      title="Performance calendar"
      description="Each day tinted by its net result across the selected range."
      padded={false}
      action={
        month ? (
          <MonthNav
            month={month}
            position={`${index + 1} of ${months.length}`}
            canPrev={index > 0}
            canNext={index < months.length - 1}
            onPrev={() => setPinned(months[index - 1].key)}
            onNext={() => setPinned(months[index + 1].key)}
          />
        ) : null
      }
    >
      {/* Two empties with two different ways out, matching the ledger: an
          untouched journal is not a filter problem. */}
      {accountTradeCount === 0 ? (
        <EmptyState
          className="m-4.5"
          icon={<CalendarRange className="size-7 text-subtle-foreground" aria-hidden />}
          message="No trades yet. Add your first one and the calendar fills in."
        />
      ) : !month ? (
        <EmptyState
          className="m-4.5"
          icon={<SlidersHorizontal className="size-7 text-subtle-foreground" aria-hidden />}
          message="No calendar data for the current filters."
          action={
            <Button variant="outline" size="sm" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto p-4.5 pt-3">
          <div className={cn(GRID_MIN_WIDTH, GRID_COLS, "grid gap-1.5")}>
            {/* Column heads. `aria-hidden` because they label nothing a screen
                reader can associate: this is a CSS grid, not an ARIA grid, and
                every cell names its own full date instead. */}
            {[...WEEKDAY_LABELS, "Week"].map((label) => (
              <Typography
                key={label}
                as="span"
                variant="label-sm"
                weight="semibold"
                className="pb-1 text-center tracking-wider text-subtle-foreground uppercase"
                aria-hidden
              >
                {label}
              </Typography>
            ))}

            {month.weeks.map((week) => (
              <WeekRow key={week.key} week={week} todayKey={todayKey} />
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
