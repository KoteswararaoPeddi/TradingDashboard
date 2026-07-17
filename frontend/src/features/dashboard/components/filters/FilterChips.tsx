"use client";

import { CheckCircle2, Layers, XCircle, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useTodayKey } from "../../hooks/useTodayKey";
import { activePeriod, activeResult, periodRange } from "../../lib/filters";
import { useFiltersStore } from "../../stores/filters.store";
import { FilterChip } from "./FilterChip";
import { FilterGroup } from "./FilterGroup";
import type { Period, ResultFilter } from "../../types/filter.types";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "all", label: "All time" },
];

type ResultChip = ResultFilter | "LIQUIDATION";

const RESULTS: { id: ResultChip; label: string; icon: LucideIcon }[] = [
  { id: "ALL", label: "All trades", icon: Layers },
  { id: "PROFIT", label: "Winners", icon: CheckCircle2 },
  { id: "LOSS", label: "Losers", icon: XCircle },
  { id: "LIQUIDATION", label: "Liquidations", icon: Zap },
];

/**
 * The cockpit's scope control: a time window and a result filter.
 *
 * These are two independent axes, not one list of presets. The old preset model
 * rebuilt every filter from a clean slate, so choosing "Last 7 days" silently
 * threw away "Winners" — you could never ask "how did my winners do this week",
 * which is the entire question a journal exists to answer. Each group now touches
 * only its own fields, so they compose.
 *
 * Filters are a control, never a page: this renders on the pages it scopes.
 */
export function FilterChips() {
  const filters = useFiltersStore((s) => s.filters);
  const range = useFiltersStore((s) => s.range);
  const setFilters = useFiltersStore((s) => s.setFilters);
  // The wall-clock day so "Today"/"7 days" mean now, not the last traded day.
  const today = useTodayKey();

  const period = activePeriod(filters, range, today);
  const result = activeResult(filters);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <FilterGroup label="Time period">
        {PERIODS.map((item) => (
          <FilterChip
            key={item.id}
            active={period === item.id}
            onClick={() => setFilters(periodRange(item.id, range, today))}
          >
            {item.label}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup label="Filter by">
        {RESULTS.map((item) => {
          const Icon = item.icon;
          return (
            <FilterChip
              key={item.id}
              active={result === item.id}
              // Direction and result are separate fields, so each chip must clear
              // the other axis rather than leave a stale constraint behind.
              onClick={() =>
                setFilters(
                  item.id === "LIQUIDATION"
                    ? { direction: "LIQUIDATION", result: "ALL" }
                    : { direction: "ALL", result: item.id },
                )
              }
            >
              <Icon className="size-3.5 shrink-0" aria-hidden />
              {item.label}
            </FilterChip>
          );
        })}
      </FilterGroup>
    </div>
  );
}
