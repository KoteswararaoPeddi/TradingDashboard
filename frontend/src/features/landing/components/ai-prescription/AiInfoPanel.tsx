import type { LucideIcon } from "lucide-react"

import { cn } from "@lib/utils"
import { Typography } from "@components/ui/typography"
import { AI_STATS } from "../../data/ai-prescription.data"
import type { AiBenefit } from "../../types/ai-prescription.types"

type Props = {
  label: string
  heading: React.ReactNode
  body: string
  benefits: AiBenefit[]
  icons: LucideIcon[]
  accent: string
  iconWell: string
}

export function AiInfoPanel({ label, heading, body, benefits, icons, accent, iconWell }: Props) {
  return (
    <div>
      <Typography as="div" variant="body-sm" weight="bold" className={cn("mb-3.5 uppercase tracking-widest", accent)}>
        {label}
      </Typography>
      <Typography
        as="h3"
        variant="h1"
        weight="extrabold"
        className="mb-4 leading-tight tracking-tight text-primary-fg sm:text-display-lg"
      >
        {heading}
      </Typography>
      <Typography variant="body-lg" className="mb-8 max-w-xl leading-relaxed text-primary-fg/55">
        {body}
      </Typography>

      <div className="mb-8 flex flex-col gap-3">
        {benefits.map((b, i) => {
          const Icon = icons[i]
          return (
            <div
              key={b.title}
              className="flex items-start gap-3.5 rounded-2xl border border-surface/[0.07] bg-surface/[0.02] p-4 transition-all hover:border-surface/15 hover:bg-surface/[0.04]"
            >
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconWell)}>
                <Icon className="size-5" />
              </span>
              <div>
                <Typography as="div" variant="body-base" weight="bold" className="text-primary-fg">
                  {b.title}
                </Typography>
                <Typography as="div" variant="body-sm" className="leading-relaxed text-primary-fg/50">
                  {b.desc}
                </Typography>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-nowrap gap-x-3 gap-y-4 sm:flex-wrap sm:gap-8">
        {AI_STATS.map((s) => (
          <div key={s.label}>
            <Typography as="div" variant="h1" className={cn("font-black leading-none tracking-tight", accent)}>
              {s.num}
            </Typography>
            <Typography as="div" variant="body-sm" weight="medium" className="mt-1 text-primary-fg/45">
              {s.label}
            </Typography>
          </div>
        ))}
      </div>
    </div>
  )
}
