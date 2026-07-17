import { Skeleton } from "@components/ui/skeleton";
import { cn } from "@lib/utils";

/** Below this the eight columns crush; the grid scrolls sideways instead. */
const GRID_MIN_WIDTH = "min-w-215";

/** 7 day columns + the weekly total, matching the real grid. */
const GRID_COLS = "grid-cols-[repeat(7,minmax(0,1fr))_minmax(0,0.8fr)]";

/**
 * The calendar's loading shape, mirroring the real month grid.
 *
 * Shown while the filter range is still seeding on first paint: `metrics` arrives
 * with the server HTML, but the filter store's range is seeded by an effect a
 * frame later, and in that gap `buildCalendarMonths` has no window to build. That
 * frame is *loading*, not *empty* — without this skeleton it flashed the "No
 * calendar data for the current filters" state on every refresh.
 */
export function CalendarSkeleton() {
  return (
    <div className="overflow-x-auto p-4.5 pt-3">
      <div className={cn(GRID_MIN_WIDTH, GRID_COLS, "grid gap-1.5")}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={`head-${i}`} className="mx-auto mb-1 h-2.5 w-8 rounded-sm" />
        ))}

        {/* Five week rows of eight cells, at the real cell height. */}
        {Array.from({ length: 5 * 8 }).map((_, i) => (
          <Skeleton key={`cell-${i}`} className="h-17 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
