"use client";

import { useEffect, useState } from "react";

import { cn } from "@lib/utils";
import { ACCENT_STORAGE_KEY, ACCENTS, DEFAULT_ACCENT, type Accent } from "@shared/constants/accent";

/** The dot colour for each theme, per the design's .theme-dot rules. */
const DOT_TOKEN: Record<Accent, string> = {
  green: "var(--color-brand)",
  violet: "var(--color-purple)",
  gold: "var(--color-gold)",
};

/**
 * Topbar accent dots. Writes `data-accent` on <body>; theme.css does the rest,
 * so no component needs to know which hue is active.
 */
export function AccentSwitcher() {
  const [accent, setAccent] = useState<Accent>(DEFAULT_ACCENT);

  // Read the stored choice after mount, never during render: the server rendered
  // the default, and reading localStorage while rendering would desync hydration.
  useEffect(() => {
    const stored = window.localStorage.getItem(ACCENT_STORAGE_KEY);
    if (stored && (ACCENTS as readonly string[]).includes(stored)) {
      applyAccent(stored as Accent);
      setAccent(stored as Accent);
    }
  }, []);

  const choose = (next: Accent) => {
    applyAccent(next);
    setAccent(next);
    window.localStorage.setItem(ACCENT_STORAGE_KEY, next);
  };

  return (
    <div
      role="group"
      aria-label="Dashboard accent theme"
      className="inline-flex h-10 overflow-hidden rounded-lg border border-border"
    >
      {ACCENTS.map((option) => (
        <button
          key={option}
          type="button"
          title={`${option[0].toUpperCase()}${option.slice(1)} theme`}
          aria-pressed={accent === option}
          onClick={() => choose(option)}
          className={cn(
            "grid min-w-10.5 place-items-center border-r border-border transition-colors last:border-r-0",
            "hover:bg-surface-wash",
            accent === option && "bg-surface-wash",
          )}
        >
          <span
            className="size-3.5 rounded-full ring-4 ring-surface-wash"
            style={{ background: DOT_TOKEN[option] }}
          />
          <span className="sr-only">{option} theme</span>
        </button>
      ))}
    </div>
  );
}

function applyAccent(accent: Accent): void {
  document.body.dataset.accent = accent;
}
