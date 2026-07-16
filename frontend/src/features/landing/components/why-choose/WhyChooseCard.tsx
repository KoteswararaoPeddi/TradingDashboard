import { Typography } from "@components/ui/typography"
import type { WhyBenefit } from "../../types/why-choose.types"

/** A single "why choose" benefit card (white tile on the violet panel). */
export function WhyChooseCard({ benefit }: { benefit: WhyBenefit }) {
  const { icon: Icon, title, desc } = benefit
  return (
    <article className="h-full rounded-2xl bg-card p-6 shadow-lg shadow-primary/5">
      <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <Typography as="h3" variant="h4" weight="bold" className="mb-2 text-foreground">
        {title}
      </Typography>
      <Typography variant="body-base" className="leading-relaxed text-muted-foreground">
        {desc}
      </Typography>
    </article>
  )
}
