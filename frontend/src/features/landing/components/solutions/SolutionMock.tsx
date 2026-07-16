import { TriangleAlert } from "lucide-react"

import { cn } from "@lib/utils"
import { Typography } from "@components/ui/typography"
import type { MockTone, SolutionMock as SolutionMockType } from "../../types/solutions.types"

const badgeCls: Record<MockTone, string> = {
  violet: "bg-violet-100 text-violet-700",
  green: "bg-success-subtle text-success",
  amber: "bg-warning-subtle text-warning",
  red: "bg-danger-subtle text-danger",
}
const dotCls: Record<MockTone, string> = {
  violet: "bg-violet-500",
  green: "bg-success",
  amber: "bg-warning",
  red: "bg-danger",
}
const avatarCls: Record<MockTone, string> = {
  violet: "bg-violet-600",
  green: "bg-success",
  amber: "bg-warning",
  red: "bg-danger",
}
const valueCls: Record<MockTone, string> = {
  violet: "text-violet-600",
  green: "text-success",
  amber: "text-warning",
  red: "text-danger",
}

type Props = { mock: SolutionMockType; variant: "purple" | "white" }

/** The little dashboard preview shown at the bottom of each solution card (decorative). */
export function SolutionMock({ mock, variant }: Props) {
  return (
    <div
      aria-hidden
      className={cn("rounded-xl p-3.5", variant === "purple" ? "bg-surface" : "border border-border bg-muted")}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <Typography as="div" variant="caption" weight="bold" className="text-foreground">
          {mock.title}
        </Typography>
        <div className="flex items-center gap-1.5">
          {mock.kind === "list" &&
            mock.badges?.map((b) => (
              <Typography
                as="span"
                key={b.label}
                variant="caption"
                weight="bold"
                className={cn("flex items-center gap-0.5 rounded-md px-1.5 py-0.5", badgeCls[b.tone])}
              >
                {b.tone === "red" && <TriangleAlert className="size-2.5" />}
                {b.label}
              </Typography>
            ))}
          {mock.kind === "chart" && (
            <Typography as="span" variant="caption" weight="bold" className="text-foreground">
              {mock.amount} <span className="text-success">{mock.delta}</span>
            </Typography>
          )}
        </div>
      </div>

      {mock.kind === "list" ? (
        <>
          {mock.rows.map((r, i) => (
            <div
              key={r.name}
              className={cn("flex items-center gap-2 py-1.5", i < mock.rows.length - 1 && "border-b border-border")}
            >
              {r.avatar && (
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[8px] font-bold text-primary-fg",
                    avatarCls[r.avatarTone ?? "violet"]
                  )}
                >
                  {r.avatar}
                </span>
              )}
              {r.dot && <span className={cn("size-2 shrink-0 rounded-full", dotCls[r.dot])} />}
              <div className="min-w-0 flex-1">
                <Typography as="div" variant="caption" weight="semibold" className="truncate text-foreground">
                  {r.name}
                </Typography>
                {r.sub && (
                  <Typography as="div" className="text-[9px] text-subtle-foreground">
                    {r.sub}
                  </Typography>
                )}
              </div>
              {r.badge && (
                <Typography
                  as="span"
                  variant="caption"
                  weight="semibold"
                  className={cn("shrink-0 rounded-md px-1.5 py-0.5", badgeCls[r.badge.tone])}
                >
                  {r.badge.label}
                </Typography>
              )}
              {r.value && (
                <Typography
                  as="span"
                  variant="caption"
                  weight="semibold"
                  className={cn("shrink-0", r.valueTone ? valueCls[r.valueTone] : "text-muted-foreground")}
                >
                  {r.value}
                </Typography>
              )}
            </div>
          ))}
          {mock.note && (
            <div className={cn("mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5", badgeCls[mock.note.tone])}>
              <TriangleAlert className="size-2.5 shrink-0" />
              <Typography as="span" variant="caption" weight="semibold">
                {mock.note.label}
              </Typography>
            </div>
          )}
        </>
      ) : (
        <div>
          <div className="flex h-20 items-end gap-1">
            {mock.bars.map((h, i) => (
              <span
                key={i}
                className={cn("flex-1 rounded-t-sm", mock.highlight.includes(i) ? "bg-violet-600" : "bg-violet-200")}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between">
            {mock.labels.map((l, i) => (
              <Typography as="span" key={i} className="text-[8px] text-subtle-foreground">
                {l}
              </Typography>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
