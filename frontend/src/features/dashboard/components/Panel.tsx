import { Typography } from "@components/ui/typography";
import { cn } from "@lib/utils";

interface Props {
  /** Anchor target for the sidebar nav, when this panel is a section. */
  id?: string;
  title: string;
  description?: string;
  /** Optional control on the right of the header (e.g. Reset). */
  action?: React.ReactNode;
  /**
   * Optional right-hand column. When set the panel becomes a two-column grid
   * (header + children on the left, this on the right) and `children` render
   * unpadded, since a full-bleed child like the account strip owns its own edges.
   */
  aside?: React.ReactNode;
  className?: string;
  /** Set false when the child supplies its own padding (tables, charts, strips). */
  padded?: boolean;
  children: React.ReactNode;
}

const SURFACE =
  "scroll-mt-6 overflow-hidden rounded-lg border border-border bg-linear-to-b from-surface-wash to-surface-wash-soft shadow-panel";

/**
 * The cockpit's core container. Every section is a Panel, so the header rhythm
 * and surface treatment are defined once here rather than per section.
 */
export function Panel({
  id,
  title,
  description,
  action,
  aside,
  className,
  padded = true,
  children,
}: Props) {
  const header = (
    <div className="flex items-start justify-between gap-3.5 p-4.5 pb-0">
      <div className="min-w-0">
        <Typography as="h2" variant="h3" weight="black">
          {title}
        </Typography>
        {description ? (
          <Typography variant="body-sm" className="mt-1.5 text-muted-foreground">
            {description}
          </Typography>
        ) : null}
      </div>
      {action}
    </div>
  );

  if (aside) {
    return (
      <section
        id={id}
        className={cn(SURFACE, "grid items-stretch gap-4.5 min-[1181px]:grid-cols-[1.25fr_0.75fr]", className)}
      >
        <div className="min-w-0">
          {header}
          {children}
        </div>
        <div className="min-w-0 p-4.5">{aside}</div>
      </section>
    );
  }

  return (
    <section id={id} className={cn(SURFACE, className)}>
      {header}
      <div className={cn(padded && "p-4.5")}>{children}</div>
    </section>
  );
}
