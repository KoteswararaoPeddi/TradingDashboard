import { Typography } from "@components/ui/typography"
import type { HowStep as HowStepType } from "../../types/how-it-works.types"

/** A single "how it works" step — ghost number, icon tile, title, description. */
export function HowStep({ step }: { step: HowStepType }) {
  const { icon: Icon, num, title, desc } = step
  return (
    <div className="flex flex-col items-center text-center">
      <Typography as="span" variant="display-2xl" weight="extrabold" className="mb-3 leading-none text-primary/30">
        {num}
      </Typography>
      <span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-7" />
      </span>
      <Typography as="h3" variant="h3" weight="bold" className="mb-2 text-foreground">
        {title}
      </Typography>
      <Typography variant="body-base" className="max-w-xs leading-relaxed text-muted-foreground">
        {desc}
      </Typography>
    </div>
  )
}
