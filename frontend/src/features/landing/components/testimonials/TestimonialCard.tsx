import { Star } from "lucide-react"

import { cn } from "@lib/utils"
import { Typography } from "@components/ui/typography"
import type { Testimonial } from "../../types/testimonials.types"

/** A single testimonial card — star rating, quote, and author. */
export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const { rating, quote, initials, name, role } = testimonial
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
      <span className="mb-4 flex gap-0.5" aria-label={`Rated ${rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn("size-4", i < rating ? "text-amber-500" : "text-muted-foreground/30")}
            fill="currentColor"
            strokeWidth={0}
          />
        ))}
      </span>

      <Typography variant="body-base" className="mb-6 grow italic leading-relaxed text-muted-foreground">
        &ldquo;{quote}&rdquo;
      </Typography>

      <div className="flex items-center gap-3">
        <Typography
          as="span"
          variant="body-sm"
          weight="bold"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg"
        >
          {initials}
        </Typography>
        <div>
          <Typography as="div" variant="body-base" weight="bold" className="text-foreground">
            {name}
          </Typography>
          <Typography as="div" variant="body-sm" className="text-muted-foreground">
            {role}
          </Typography>
        </div>
      </div>
    </article>
  )
}
