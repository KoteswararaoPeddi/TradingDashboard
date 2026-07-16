import { Typography } from "@components/ui/typography";

import { AccentSwitcher } from "./AccentSwitcher";

interface Props {
  title: string;
}

/** Page header: live eyebrow, the account title, a subline, and the accent dots. */
export function Topbar({ title }: Props) {
  return (
    <header className="mb-4.5 flex flex-col items-start justify-between gap-5 md:flex-row">
      <div className="min-w-0">
        <span className="inline-flex items-center gap-2 text-label-base font-black tracking-wide text-primary uppercase">
          <span
            className="size-2 rounded-full bg-primary"
            // A halo, not a border: the design rings the dot with a soft brand tint.
            style={{ boxShadow: "0 0 0 6px color-mix(in srgb, var(--color-primary) 12%, transparent)" }}
            aria-hidden
          />
          Live performance cockpit
        </span>

        <Typography
          as="h1"
          variant="display-2xl"
          weight="black"
          className="mt-2 max-w-4xl text-[clamp(2rem,5vw,3.5rem)] leading-[0.95]"
        >
          {title}
        </Typography>

        <Typography variant="body-base" className="mt-3 max-w-3xl text-muted-foreground">
          Execution history, balance curve, timing edge, symbol contribution, and risk pressure for the
          live account.
        </Typography>
      </div>

      <div className="flex min-w-70 flex-wrap justify-start gap-2.5 md:justify-end">
        <AccentSwitcher />
      </div>
    </header>
  );
}
