import { create } from "zustand";

import { defaultFilters, presetFilters } from "../lib/filters";
import type { Preset, TradeFilters } from "../types/filter.types";

interface FiltersState {
  filters: TradeFilters;
  /** The chip currently highlighted, or null once a control is touched directly. */
  activePreset: Preset | null;
  /** The account's full date span; presets and Reset resolve against it. */
  range: { from: string; to: string };

  /** Seed the date bounds once the trade set is known. */
  initRange: (range: { from: string; to: string }) => void;
  /** Patch one or more controls. Clears the active chip: the view is now custom. */
  setFilters: (patch: Partial<TradeFilters>) => void;
  applyPreset: (preset: Preset) => void;
  reset: () => void;
}

export const useFiltersStore = create<FiltersState>((set, get) => ({
  filters: defaultFilters("", ""),
  activePreset: "all",
  range: { from: "", to: "" },

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
}));
