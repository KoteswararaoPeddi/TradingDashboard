"use client";

import { cn } from "@lib/utils";

interface Props {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

/** One filter toggle. An interactive control, so it keeps its own utility classes. */
export function FilterChip({ active, onClick, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      // `aria-pressed` rather than a visual-only state: a toggle that only says
      // "chosen" in colour says nothing to a screen reader.
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-body-sm font-semibold transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active
          ? "bg-primary text-primary-fg"
          : "bg-surface-wash text-muted-foreground hover:bg-surface-raised hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
