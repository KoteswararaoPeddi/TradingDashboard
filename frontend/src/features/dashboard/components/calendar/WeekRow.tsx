"use client";

import type { CalendarWeek } from "../../lib/calendar";
import { DayCell } from "./DayCell";
import { WeekCell } from "./WeekCell";

interface Props {
  week: CalendarWeek;
  /** Today's UTC day key, or null before the client has resolved it. */
  todayKey: string | null;
}

/** One calendar row: seven day slots and the week's total. */
export function WeekRow({ week, todayKey }: Props) {
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
