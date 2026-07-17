"use client";

import { CalendarHeatmap } from "./calendar/CalendarHeatmap";
import { FilterChips } from "./filters/FilterChips";

/** Daily P&L intensity across the selected range. */
export function CalendarPage() {
  return (
    <div className="grid gap-4.5">
      <div className="border-b border-border pb-4.5">
        <FilterChips />
      </div>
      <CalendarHeatmap />
    </div>
  );
}
