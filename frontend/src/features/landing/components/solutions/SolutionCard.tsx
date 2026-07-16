import { ArrowUpRight, Check } from "lucide-react"

import { cn } from "@lib/utils"
import { Typography } from "@components/ui/typography"
import type { Solution } from "../../types/solutions.types"
import { SolutionMock } from "./SolutionMock"

export function SolutionCard({ solution }: { solution: Solution }) {
  const purple = solution.variant === "purple"
  return (
    <article
      className={cn(
        "flex flex-col rounded-3xl p-6",
        purple ? "text-primary-fg" : "border-[1.5px] border-primary/15 bg-card"
      )}
      style={
        purple
          ? {
              background:
                "linear-gradient(150deg, var(--color-violet-700) 0%, var(--color-violet-600) 55%, var(--color-violet-500) 100%)",
            }
          : undefined
      }
    >
      <Typography
        as="span"
        variant="body-sm"
        weight="semibold"
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-1.5",
          purple ? "bg-surface/20 text-primary-fg/90" : "bg-primary/10 text-primary"
        )}
      >
        <span className={cn("size-1.5 rounded-full", purple ? "bg-surface/60" : "bg-primary")} />
        {solution.pill}
      </Typography>

      <div className="mb-5 mt-5 flex items-start justify-between gap-4">
        <Typography
          as="h3"
          variant="h2"
          weight="extrabold"
          className={cn("leading-tight tracking-tight", purple ? "text-primary-fg" : "text-foreground")}
        >
          {solution.title}
        </Typography>
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full transition-transform hover:rotate-6 hover:scale-110",
            purple ? "bg-surface/20 text-primary-fg" : "bg-primary text-primary-fg"
          )}
        >
          <ArrowUpRight className="size-5" />
        </span>
      </div>

      <ul className="flex flex-col gap-2.5">
        {solution.features.map((f) => (
          <Typography
            as="li"
            variant="body-base"
            weight="medium"
            key={f}
            className={cn("flex items-center gap-2.5", purple ? "text-primary-fg/90" : "text-foreground")}
          >
            <span
              className={cn(
                "flex size-[18px] shrink-0 items-center justify-center rounded-full",
                purple ? "bg-surface/20 text-primary-fg" : "bg-primary/10 text-primary"
              )}
            >
              <Check className="size-3" strokeWidth={3} />
            </span>
            {f}
          </Typography>
        ))}
      </ul>

      <div className="mt-6">
        <SolutionMock mock={solution.mock} variant={solution.variant} />
      </div>
    </article>
  )
}
