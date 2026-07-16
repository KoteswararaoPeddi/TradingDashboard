import { Typography } from "@components/ui/typography";
import { cn } from "@lib/utils";

/**
 * How a figure is coloured. Beyond plain sign, some families read differently:
 * a ratio has no direction (`info`), a below-even win rate is a warning rather
 * than a loss (`warning`), and reference counts are neutral (`neutral`).
 */
export type Tone = "up" | "down" | "info" | "warning" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  up: "text-up",
  down: "text-down",
  info: "text-info",
  warning: "text-warning",
  // Fixed hue, straight from the palette: it marks a metric family and has no
  // role that the accent themes should change.
  neutral: "text-purple",
};

interface Props {
  label: string;
  value: string;
  note: string;
  tone: Tone;
  /** Adds the hover lift. The stats grid uses it; the market board doesn't. */
  interactive?: boolean;
  className?: string;
}

/**
 * The cockpit's figure tile: uppercase label, big coloured value, muted note,
 * and the design's 3px left accent bar. Shared by the market board and the
 * stats grid so the two can never drift apart.
 */
export function Tile({ label, value, note, tone, interactive, className }: Props) {
  return (
    <article
      className={cn(
        "relative min-h-30 overflow-hidden rounded-lg border border-border-tile bg-surface-tile p-4",
        // The accent bar is the tile's signature; it tracks the theme, not the
        // P&L colour, so it stays `info` whatever the figure says.
        "before:absolute before:top-0 before:left-0 before:h-full before:w-0.75 before:bg-info before:content-['']",
        interactive &&
          "transition-all hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-raised/92",
        className,
      )}
    >
      <Typography
        as="span"
        variant="label-base"
        weight="extrabold"
        className="block text-muted-foreground uppercase"
      >
        {label}
      </Typography>

      <Typography
        as="strong"
        variant="h2"
        weight="black"
        className={cn(
          "mt-2.5 block leading-none",
          // Long money strings must break rather than widen the grid track.
          "wrap-anywhere",
          TONE_CLASS[tone],
        )}
      >
        {value}
      </Typography>

      <Typography variant="body-sm" className="mt-2.5 text-muted-foreground">
        {note}
      </Typography>
    </article>
  );
}
