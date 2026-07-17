import { create } from "zustand";

import { defaultFilters, presetFilters } from "../lib/filters";
import type { Preset, TradeFilters } from "../types/filter.types";

interface FiltersState {
  filters: TradeFilters;
  /** The chip currently highlighted, or null once a control is touched directly. */
  activePreset: Preset | null;
  /** The account's full date span; presets and Reset resolve against it. */
  range: { from: string; to: string };
  /**
   * Bumped whenever a trade is added, edited or deleted. The server owns the
   * numbers now, so the data hooks refetch on a filter change — but a mutation
   * changes no filter. This is the extra signal that tells them the underlying
   * set moved, so `useTrades` and `useCockpit` include it in their fetch deps.
   */
  dataVersion: number;

  /** Seed the date bounds once the trade set is known. */
  initRange: (range: { from: string; to: string }) => void;
  /** Patch one or more controls. Clears the active chip: the view is now custom. */
  setFilters: (patch: Partial<TradeFilters>) => void;
  applyPreset: (preset: Preset) => void;
  reset: () => void;
  /** Signal a mutation: refetch, and reopen the date window so a new trade shows. */
  notifyDataChanged: () => void;
}

export const useFiltersStore = create<FiltersState>((set, get) => ({
  filters: defaultFilters("", ""),
  activePreset: "all",
  range: { from: "", to: "" },
  dataVersion: 0,

  initRange: (range) =>
    set({ range, filters: defaultFilters(range.from, range.to), activePreset: "all" }),

  // Touching a control makes the view custom, so no chip should still look chosen.
  setFilters: (patch) =>
    set((state) => ({ filters: { ...state.filters, ...patch }, activePreset: null })),

  applyPreset: (preset) => set({ filters: presetFilters(preset, get().range), activePreset: preset }),

  reset: () => {
    const { range } = get();
    set({ filters: defaultFilters(range.from, range.to), activePreset: "all" });
  },

  notifyDataChanged: () =>
    // Bump the version so the data hooks refetch, and clear the date window +
    // range so a trade dated after the old maximum is not filtered out of its own
    // "it was added" confirmation. The window re-seeds from the next fetch; the
    // other filters (result, direction, search) are left as the user set them.
    set((state) => ({
      dataVersion: state.dataVersion + 1,
      filters: { ...state.filters, from: "", to: "" },
      range: { from: "", to: "" },
    })),
}));
