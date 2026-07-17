import { Typography } from "@components/ui/typography";
import { cn } from "@lib/utils";

interface Props {
  label: string;
  value: string;
  /** Omit for unsigned figures (Win Rate, Trades) — they carry no direction to colour. */
  tone?: "up" | "down";
}

/** One figure in the account card's 2x2 grid. A `<dt>/<dd>` pair, so it reads as the list it is. */
export function AccountMini({ label, value, tone }: Props) {
  return (
    <div className="rounded-lg border border-border-soft bg-surface-well p-2.5">
      <Typography as="dt" variant="label-sm" weight="extrabold" className="block text-muted-foreground uppercase">
        {label}
      </Typography>
      <Typography
        as="dd"
        variant="h5"
        weight="bold"
        className={cn("mt-1 block", tone === "up" && "text-up", tone === "down" && "text-down")}
      >
        {value}
      </Typography>
    </div>
  );
}
