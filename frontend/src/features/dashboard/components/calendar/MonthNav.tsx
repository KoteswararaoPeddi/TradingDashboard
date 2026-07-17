"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@components/ui/button";
import { Typography } from "@components/ui/typography";
import { formatMoney } from "@lib/format";
import { cn } from "@lib/utils";

import type { CalendarMonth } from "../../lib/calendar";

interface Props {
  month: CalendarMonth;
  /** "2 of 3" — shown only when there is more than one month to page. */
  position: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * The calendar's month header: the month's net, and the arrows to page months.
 *
 * Paging, not scoping. The arrows only move between the months the filter
 * already selected, so the nav can never show a month the chips excluded —
 * which is what keeps FilterChips the page's single source of scope.
 */
export function MonthNav({ month, position, canPrev, canNext, onPrev, onNext }: Props) {
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
