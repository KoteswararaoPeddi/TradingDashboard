import { ArrowRight, Check, PencilLine, Sparkles } from "lucide-react"

import { cn } from "@lib/utils"
import { Typography } from "@components/ui/typography"
import { SMART_DIAGNOSIS, SMART_MEDS } from "../../data/ai-prescription.data"

const STEPS = [
  { label: "Symptoms", state: "done" },
  { label: "Diagnosis", state: "done" },
  { label: "AI Rx", state: "active" },
  { label: "Review", state: "idle" },
] as const

/** The Smart Prescription mock card (decorative). */
export function AiSmartMock() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-3xl border border-violet-600/25 shadow-2xl"
      style={{ background: "color-mix(in srgb, var(--color-violet-950) 60%, #000)" }}
    >
      {/* topbar */}
      <div className="flex items-center gap-2 border-b border-surface/[0.06] px-5 py-4">
        <span className="size-2.5 rounded-full bg-red-500" />
        <span className="size-2.5 rounded-full bg-amber-500" />
        <span className="size-2.5 rounded-full bg-green-500" />
        <Typography as="span" variant="body-sm" weight="semibold" className="ml-1 min-w-0 truncate text-primary-fg/70">
          MediNex+ · Smart Prescription
        </Typography>
        <Typography
          as="span"
          variant="caption"
          weight="bold"
          className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-success/15 px-2.5 py-1 text-success"
        >
          <span className="size-1.5 rounded-full bg-success" /> AI Active
        </Typography>
      </div>

      <div className="p-5">
        {/* patient */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-surface/[0.06] bg-surface/[0.03] p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-600 to-violet-700 text-body-sm font-bold text-primary-fg">
            RK
          </span>
          <div className="min-w-0">
            <Typography as="div" variant="body-base" weight="bold" className="truncate text-primary-fg">
              Rahul Kumar
            </Typography>
            <Typography as="div" variant="caption" className="truncate text-primary-fg/40">
              Male, 34 yrs · OPD #2847
            </Typography>
          </div>
          <Typography
            as="span"
            variant="caption"
            weight="bold"
            className="ml-auto shrink-0 whitespace-nowrap rounded-full bg-violet-600/25 px-2.5 py-1 text-violet-300"
          >
            AI Ready
          </Typography>
        </div>

        {/* steps */}
        <div className="mb-4 flex items-center justify-between sm:justify-normal">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center last:flex-none sm:flex-1">
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-caption font-bold",
                    s.state === "done" && "bg-violet-600 text-primary-fg",
                    s.state === "active" && "border-[1.5px] border-violet-500 bg-violet-600/25 text-violet-300",
                    s.state === "idle" && "bg-surface/10 text-primary-fg/30"
                  )}
                >
                  {s.state === "done" ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                </span>
                <Typography as="span" variant="caption" weight="semibold" className="whitespace-nowrap text-primary-fg/50">
                  {s.label}
                </Typography>
              </span>
              {i < STEPS.length - 1 && <span className="mx-2 hidden h-px flex-1 bg-surface/10 sm:block" />}
            </div>
          ))}
        </div>

        {/* diagnosis */}
        <Typography as="div" variant="caption" weight="bold" className="mb-2 uppercase tracking-widest text-primary-fg/35">
          Diagnosis
        </Typography>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {SMART_DIAGNOSIS.map((d) => (
            <Typography
              as="span"
              key={d}
              variant="caption"
              weight="semibold"
              className="rounded-full border border-violet-600/30 bg-violet-600/15 px-2.5 py-1 text-violet-300"
            >
              {d}
            </Typography>
          ))}
        </div>

        {/* AI prescription */}
        <div
          className="rounded-2xl border border-violet-600/30 p-4"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--color-violet-600) 15%, transparent), transparent)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <Typography as="div" variant="caption" weight="bold" className="flex items-center gap-1.5 text-violet-300">
              <Sparkles className="size-3.5" /> AI-Generated Prescription
            </Typography>
            <Typography as="span" variant="caption" className="text-primary-fg/35">
              Generated in 1.2s
            </Typography>
          </div>
          {SMART_MEDS.map((m, i) => (
            <div
              key={m.name}
              className={cn("flex items-center gap-2 py-1.5", i < SMART_MEDS.length - 1 && "border-b border-surface/[0.06]")}
            >
              <span className="size-1.5 rounded-full bg-violet-400" />
              <Typography as="span" variant="body-sm" weight="semibold" className="flex-1 text-primary-fg">
                {m.name}
              </Typography>
              <Typography as="span" variant="caption" className="text-primary-fg/45">
                {m.dose}
              </Typography>
            </div>
          ))}
        </div>

        {/* notes */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-surface/[0.08] bg-surface/[0.03] px-3 py-2.5">
          <PencilLine className="size-3.5 text-primary-fg/35" />
          <Typography as="span" variant="caption" className="flex-1 text-primary-fg/35">
            Add doctor notes
          </Typography>
          <span className="flex size-6 items-center justify-center rounded-md bg-linear-to-br from-violet-600 to-violet-700 text-primary-fg">
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </div>
  )
}
