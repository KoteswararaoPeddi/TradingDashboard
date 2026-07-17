import { Typography } from "@components/ui/typography";

/** Sidebar brand: the TJ mark plus the wordmark. */
export function BrandBlock() {
  return (
    <a
      href="#overview"
      aria-label="Trade Journal dashboard"
      className="flex items-center gap-3 rounded-lg border border-border bg-linear-to-b from-surface-wash to-surface-wash-soft p-2.5"
    >
      <span
        className="grid size-10.5 shrink-0 place-items-center rounded-lg bg-linear-to-br from-primary to-info text-primary-fg"
        // The brand mark's glow is the one place the design tints a shadow with
        // the brand hue, so it has to follow the accent theme.
        style={{ boxShadow: "0 0 22px color-mix(in srgb, var(--color-primary) 22%, transparent)" }}
      >
        <Typography variant="body-sm" weight="black">
          TJ
        </Typography>
      </span>

      <span className="min-w-0">
        <Typography as="span" variant="h4" weight="extrabold" className="block leading-tight">
          Trade Journal
        </Typography>
      </span>
    </a>
  );
}
