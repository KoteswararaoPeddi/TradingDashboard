import type { LucideIcon } from "lucide-react";

import { Typography } from "@components/ui/typography";
import { cn } from "@lib/utils";

/**
 * How a figure is coloured. Beyond plain sign, some families read differently:
 * a ratio has no direction (`info`), a below-even win rate is a warning rather
 * than a loss (`warning`), and reference counts are neutral (`neutral`).
 */
export type Tone = "up" | "down" | "info" | "warning" | "neutral";

/**
 * The one place a tone becomes a colour. Exported so figure surfaces that aren't
 * tiles (the overview's support strip) read the same map instead of keeping a
 * second copy that could drift.
 */
export const TONE_CLASS: Record<Tone, string> = {
  up: "text-up",
  down: "text-down",
  info: "text-info",
  warning: "text-warning",
  // Fixed hue, straight from the palette: it marks a metric family and has no
  // role that the accent themes should change.
  neutral: "text-purple",
};

/**
 * The icon plate's tint, per tone. A 10% wash of the tone's own hue behind the
 * icon: it categorises the card at a glance without adding a sixth colour, and
 * it reads at arm's length where a text colour does not.
 */
const TONE_PLATE_CLASS: Record<Tone, string> = {
  up: "bg-up/10 text-up",
  down: "bg-down/10 text-down",
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
  neutral: "bg-purple/10 text-purple",
};

interface Props {
  label: string;
  value: string;
  note: string;
  tone: Tone;
  /** Optional glyph, shown on a tinted plate above the label. */
  icon?: LucideIcon;
  /** Adds the hover response. The stats grid uses it; the KPI row doesn't. */
  interactive?: boolean;
  className?: string;
}

/**
 * The cockpit's figure card: an optional tinted icon plate, a quiet uppercase
 * label, the figure, and a muted note.
 *
 * No accent bar. It was the reference cockpit's tile signature, but the stats
 * grid renders 27 tiles — 27 identical bars carrying no information is texture
 * competing with the only thing on the card worth reading.
 */
export function Tile({ label, value, note, tone, icon: Icon, interactive, className }: Props) {
  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-border-tile bg-surface-tile p-5",
        Icon ? "min-h-45" : "min-h-30",
        interactive && "transition-colors hover:border-border-strong hover:bg-surface-raised/92",
        className,
      )}
    >
      {Icon ? (
        <span className={cn("mb-5 grid size-11 shrink-0 place-items-center rounded-xl", TONE_PLATE_CLASS[tone])}>
          <Icon className="size-5" aria-hidden />
        </span>
      ) : null}

      {/* Uppercase and muted, but at medium weight with tracking rather than 800.
          A label set as heavy as its own value competes with it, and a grid of 27
          such labels has no hierarchy at all. The label names the figure; the
          figure is the point. */}
      <Typography
        as="span"
        variant="label-sm"
        weight="semibold"
        className="block tracking-wider text-muted-foreground uppercase"
      >
        {label}
      </Typography>

      <Typography
        as="strong"
        variant={Icon ? "h1" : "h2"}
        weight="black"
        className={cn(
          "mt-2 block leading-none",
          // Long money strings must break rather than widen the grid track.
          "wrap-anywhere",
          TONE_CLASS[tone],
        )}
      >
        {value}
      </Typography>

      <Typography variant="body-sm" className="mt-auto pt-3 text-subtle-foreground">
        {note}
      </Typography>
    </article>
  );
}
