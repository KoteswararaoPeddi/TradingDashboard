import { Typography } from "@components/ui/typography";
import { cn } from "@lib/utils";

interface Props {
  /** A lucide glyph, already sized and `aria-hidden`. */
  icon: React.ReactNode;
  message: string;
  /** The way out. An empty state without one makes the user hunt for the control that trapped them. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * The dashed panel a data view shows when it has nothing to draw.
 *
 * Promoted to `shared` on its third use: the ledger hand-repeated this markup
 * for both of its empties while the calendar kept a fourth copy, and the four
 * had already drifted apart in padding and radius.
 *
 * It deliberately takes an `action` rather than assuming one. "No trades" means
 * something different on an untouched journal (add one) than under a filter
 * (clear it), and the exit is what makes the difference legible.
 */
export function EmptyState({ icon, message, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-wash-soft px-6 py-12 text-center",
        className,
      )}
    >
      {icon}
      <Typography variant="body-base" className="text-muted-foreground">
        {message}
      </Typography>
      {action}
    </div>
  );
}
