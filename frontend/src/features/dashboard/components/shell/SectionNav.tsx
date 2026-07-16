"use client";

import { useEffect, useState } from "react";

import { cn } from "@lib/utils";

import { DASHBOARD_SECTIONS } from "../../constants/sections";

/**
 * Sidebar navigation. The cockpit is one long page, so these are in-page anchors
 * rather than routes, and "active" is whichever section is currently in view.
 */
export function SectionNav() {
  const activeId = useActiveSection();

  return (
    <nav aria-label="Dashboard sections" className="grid gap-1.5 max-[1180px]:grid-flow-col max-[1180px]:auto-cols-[minmax(120px,1fr)] max-[1180px]:overflow-x-auto">
      {DASHBOARD_SECTIONS.map((section) => {
        const active = section.id === activeId;

        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active ? "true" : undefined}
            className={cn(
              "flex min-h-10.5 items-center gap-2.5 rounded-lg border border-transparent px-3 transition-colors",
              "text-body-sm font-bold",
              active
                ? "border-border bg-surface-wash text-foreground"
                : "text-muted-foreground hover:border-border hover:bg-surface-wash hover:text-foreground",
            )}
          >
            <span className="grid size-5.5 shrink-0 place-items-center rounded-md bg-surface-wash text-label-sm font-black text-primary">
              {section.marker}
            </span>
            {section.label}
          </a>
        );
      })}
    </nav>
  );
}

/**
 * Tracks which section is on screen via IntersectionObserver rather than a
 * scroll handler: the observer only fires when a boundary is crossed, so it does
 * not run work on every scroll frame.
 */
function useActiveSection(): string {
  const [activeId, setActiveId] = useState(DASHBOARD_SECTIONS[0].id);

  useEffect(() => {
    const elements = DASHBOARD_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Several sections can be visible at once; the topmost of those wins so
        // the highlight tracks reading position rather than flickering.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // Bias the viewport upward so a section counts as active once it reaches
      // the upper third, matching where the eye actually is.
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return activeId;
}
