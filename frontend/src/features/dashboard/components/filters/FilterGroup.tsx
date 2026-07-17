import { Typography } from "@components/ui/typography";

interface Props {
  label: string;
  children: React.ReactNode;
}

/** A labelled row of chips — one axis of the filter (time period, or result). */
export function FilterGroup({ label, children }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Typography
        as="span"
        variant="label-sm"
        weight="semibold"
        className="mr-1 tracking-wider text-subtle-foreground uppercase"
      >
        {label}
      </Typography>
      {children}
    </div>
  );
}
