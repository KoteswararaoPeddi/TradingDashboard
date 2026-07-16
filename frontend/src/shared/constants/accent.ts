/**
 * Dashboard accent themes. Applied as `data-accent` on <body>; theme.css swaps the
 * accent hues off that attribute. The surface ramp and the P&L up/down colours are
 * deliberately not themeable.
 */
export const ACCENTS = ["green", "violet", "gold"] as const;

export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_ACCENT: Accent = "green";

/** Persisted so the choice survives a reload. */
export const ACCENT_STORAGE_KEY = "trade-journal:accent";
