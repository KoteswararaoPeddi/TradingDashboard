"use client";

import { CalendarRange, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";

import { Button } from "@components/ui/button";
import { Typography } from "@components/ui/typography";
import { formatCompactMoney, formatMoney } from "@lib/format";
import { cn } from "@lib/utils";

import { useCockpit } from "../../hooks/use-cockpit";
import {
  buildCalendarMonths,
  tintPercent,
  WEEKDAY_LABELS,
  type CalendarDay,
  type CalendarMonth,
  type CalendarWeek,
} from "../../lib/calendar";
import { useFiltersStore } from "../../stores/filters.store";
import { Panel } from "../Panel";

/**
 * The alpha range each tint travels, as `color-mix` percentages.
 *
 * The floors are not decoration. A $2 day next to a $140 day scales to ~1%,
 * which renders as an untraded cell — so the quietest traded day would silently
 * claim the trader took the day off. The floor buys back that distinction.
 */
const FILL = { floor: 10, ceiling: 52 };
const EDGE = { floor: 24, ceiling: 74 };

/** Below this the eight columns crush; the grid scrolls sideways instead. */
const GRID_MIN_WIDTH = "min-w-215";

/** Today never changes mid-session, so there is nothing to subscribe to. */
const NEVER_CHANGES = () => () => {};

/**
 * Today's UTC day key on the client, and `null` on the server.
 *
 * The clock is not a pure input: the server renders at one instant and the
 * browser hydrates at another, so `new Date()` during render desyncs hydration
 * the moment those two instants straddle UTC midnight — a bug that only ever
 * fires in production, at 00:00, for whoever happened to load the page.
 *
 * `useSyncExternalStore`'s third argument is the *server* snapshot: returning
 * null there means the first client render matches the server's markup by
 * construction (no cell marked), and the marker appears once mounted. Equal
 * date strings compare true under `Object.is`, so re-reading the clock each
 * render cannot loop.
 */
function useTodayKey(): string | null {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => new Date().toISOString().slice(0, 10),
    () => null,
  );
}

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
  const { status, error, metrics, filtered, allTrades } = useCockpit();
  const range = useFiltersStore((s) => s.filters);
  const reset = useFiltersStore((s) => s.reset);

  const months = useMemo(
    () => (metrics ? buildCalendarMonths(metrics.dailyPnl, filtered, range) : []),
    [metrics, filtered, range],
  );

  // Pin the *month*, not its index. When a filter change rebuilds the range, an
  // index would silently point at a different month; a key that no longer exists
  // falls back to the newest, which is the month a trader wants anyway.
  const [pinned, setPinned] = useState<string | null>(null);
  const pinnedIndex = pinned ? months.findIndex((m) => m.key === pinned) : -1;
  const index = pinnedIndex >= 0 ? pinnedIndex : months.length - 1;
  const month = months[index];

  const todayKey = useTodayKey();

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
      {allTrades.length === 0 ? (
        <EmptyState
          icon={<CalendarRange className="size-7 text-subtle-foreground" aria-hidden />}
          message="No trades yet. Add your first one and the calendar fills in."
        />
      ) : !month ? (
        <EmptyState
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
            {WEEKDAY_LABELS.map((day) => (
              <Typography
                key={day}
                as="span"
                variant="label-sm"
                weight="semibold"
                className="pb-1 text-center tracking-wider text-subtle-foreground uppercase"
                aria-hidden
              >
                {day}
              </Typography>
            ))}
            <Typography
              as="span"
              variant="label-sm"
              weight="semibold"
              className="pb-1 text-center tracking-wider text-subtle-foreground uppercase"
              aria-hidden
            >
              Week
            </Typography>

            {month.weeks.map((week) => (
              <WeekRow key={week.key} week={week} todayKey={todayKey} />
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

/**
 * Paging, not scoping. The arrows only move between the months the filter
 * already selected, so the nav can never show a month the chips excluded —
 * which is what keeps FilterChips the page's single source of scope.
 */
function MonthNav({
  month,
  position,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  month: CalendarMonth;
  position: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const up = month.net >= 0;

  return (
    <div className="flex shrink-0 items-center gap-4">
      <div className="text-right">
        <Typography
          as="span"
          variant="h4"
          weight="black"
          className={cn("block leading-none tabular-nums", up ? "text-up" : "text-down")}
        >
          {up ? "+" : ""}
          {formatMoney(month.net)}
        </Typography>
        <Typography variant="caption" className="mt-1 block text-subtle-foreground">
          {month.tradedDays} {month.tradedDays === 1 ? "traded day" : "traded days"}
        </Typography>
      </div>

      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" disabled={!canPrev} onClick={onPrev} aria-label="Previous month">
          <ChevronLeft className="size-4" aria-hidden />
        </Button>

        <div className="min-w-30 text-center">
          <Typography as="span" variant="body-base" weight="bold" className="block whitespace-nowrap text-foreground">
            {month.label}
          </Typography>
          {/* Only worth saying when there is more than one month to page. */}
          {canPrev || canNext ? (
            <Typography variant="caption" className="block text-subtle-foreground">
              {position}
            </Typography>
          ) : null}
        </div>

        <Button variant="ghost" size="icon" disabled={!canNext} onClick={onNext} aria-label="Next month">
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function WeekRow({ week, todayKey }: { week: CalendarWeek; todayKey: string | null }) {
  return (
    <>
      {week.days.map((day, i) =>
        day ? (
          <DayCell key={day.dayKey} day={day} today={day.dayKey === todayKey} />
        ) : (
          // No box at all outside the month: an empty bordered cell reads as a
          // day that exists and did nothing.
          <div key={`${week.key}-pad-${i}`} aria-hidden />
        ),
      )}
      <WeekCell week={week} />
    </>
  );
}

/**
 * The week's total, which the day cells cannot add up for you.
 *
 * A row of four small reds and one green is the shape of a losing week, but the
 * eye reads it as "mixed" — the total is the only thing that says which.
 */
function WeekCell({ week }: { week: CalendarWeek }) {
  const dead = week.tradedDays === 0;
  const up = week.net >= 0;

  return (
    <div
      className={cn(
        "flex min-h-20 flex-col justify-center gap-0.5 rounded-lg border border-border-soft bg-surface-well px-2 py-1.5 text-center",
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
        className={cn(
          "tabular-nums",
          dead ? "text-subtle-foreground" : up ? "text-up" : "text-down",
        )}
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

/**
 * One day. Four states, because they are four different facts: outside the
 * filter window, no trades, traded flat, traded up or down.
 */
function DayCell({ day, today }: { day: CalendarDay; today?: boolean }) {
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
        "flex min-h-20 flex-col rounded-lg border p-1.5",
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
              variance, six is a bad day, and the tint cannot tell them apart. */}
          <Typography variant="caption" className="block truncate text-subtle-foreground">
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
  if (!day.inRange) return `${day.dayKey}, outside the selected range`;
  if (day.pnl === null) return `${day.dayKey}, no trades`;
  const count = `${day.trades} ${day.trades === 1 ? "trade" : "trades"}`;
  return `${day.dayKey}, ${count}, ${day.pnl >= 0 ? "+" : ""}${formatMoney(day.pnl)}`;
}

function EmptyState({
  icon,
  message,
  action,
}: {
  icon: React.ReactNode;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="m-4.5 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-wash-soft px-6 py-12 text-center">
      {icon}
      <Typography variant="body-base" className="text-muted-foreground">
        {message}
      </Typography>
      {action}
    </div>
  );
}
