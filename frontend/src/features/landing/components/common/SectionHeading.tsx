import type { LucideIcon } from "lucide-react"

import { cn } from "@lib/utils"
import { Typography } from "@components/ui/typography"

type SectionHeadingProps = {
  tag?: string
  tagIcon?: LucideIcon
  title: React.ReactNode
  sub?: React.ReactNode
  center?: boolean
  className?: string
}

/** Optional tag chip (with optional icon) + title + subtitle, shared across the marketing sections. */
export function SectionHeading({ tag, tagIcon: TagIcon, title, sub, center, className }: SectionHeadingProps) {
  return (
    <div className={cn(center && "text-center", className)}>
      {tag && (
        <Typography
          as="span"
          variant="label-base"
          weight="bold"
          className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 uppercase tracking-wider text-primary"
        >
          {TagIcon && <TagIcon className="size-3.5" />}
          {tag}
        </Typography>
      )}
      <Typography
        as="h2"
        variant="display-lg"
        weight="extrabold"
        className="leading-tight tracking-tight text-foreground lg:text-display-xl"
      >
        {title}
      </Typography>
      {sub && (
        <Typography
          variant="body-lg"
          className={cn("mt-3 max-w-xl leading-relaxed text-muted-foreground", center && "mx-auto")}
        >
          {sub}
        </Typography>
      )}
    </div>
  )
}
