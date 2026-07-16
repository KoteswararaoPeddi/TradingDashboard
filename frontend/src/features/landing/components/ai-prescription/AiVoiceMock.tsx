import { cn } from "@lib/utils"
import { Typography } from "@components/ui/typography"

const WAVE = [30, 60, 90, 50, 80, 40, 100, 55, 75, 35, 95, 45, 70, 50, 85, 40, 65]
const EXTRACTED = [
  ["Medicine", "Amoxicillin 500mg"],
  ["Frequency", "1-0-1 · 5 days"],
  ["Advice", "After meals"],
]

/** The Voice Prescription mock card (decorative). */
export function AiVoiceMock() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-3xl border border-blue-500/25 shadow-2xl"
      style={{ background: "color-mix(in srgb, var(--color-blue-900) 55%, #000)" }}
    >
      {/* topbar */}
      <div className="flex items-center gap-2 border-b border-surface/[0.06] px-5 py-4">
        <span className="size-2.5 rounded-full bg-red-500" />
        <span className="size-2.5 rounded-full bg-amber-500" />
        <span className="size-2.5 rounded-full bg-green-500" />
        <Typography as="span" variant="body-sm" weight="semibold" className="ml-1 text-primary-fg/70">
          MediNex+ · Voice Prescription
        </Typography>
        <Typography
          as="span"
          variant="caption"
          weight="bold"
          className="ml-auto flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2.5 py-1 text-blue-300"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-blue-400" /> Listening
        </Typography>
      </div>

      <div className="p-5">
        {/* patient */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-surface/[0.06] bg-surface/[0.03] p-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600 text-body-sm font-bold text-primary-fg">
            RK
          </span>
          <div>
            <Typography as="div" variant="body-base" weight="bold" className="text-primary-fg">
              Rahul Kumar
            </Typography>
            <Typography as="div" variant="caption" className="text-primary-fg/40">
              Male, 34 yrs · OPD #2847
            </Typography>
          </div>
        </div>

        {/* waveform */}
        <div className="mb-4 flex h-16 items-center justify-center gap-1">
          {WAVE.map((h, i) => (
            <span
              key={i}
              className="w-1 animate-pulse rounded bg-linear-to-b from-blue-400 to-blue-500"
              style={{ height: `${h}%`, animationDelay: `${i * 0.07}s` }}
            />
          ))}
        </div>

        {/* transcript */}
        <div className="mb-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.07] p-4">
          <Typography as="div" variant="caption" weight="bold" className="mb-2.5 flex items-center gap-1.5 text-blue-300">
            <span className="size-1.5 animate-pulse rounded-full bg-blue-400" /> Live transcript
          </Typography>
          <Typography variant="body-sm" className="leading-relaxed text-primary-fg/70">
            &ldquo;Prescribe Amoxicillin 500mg, twice daily for five days, after meals.&rdquo;
          </Typography>
        </div>

        {/* extracted */}
        <Typography as="div" variant="caption" weight="bold" className="mb-2 uppercase tracking-widest text-primary-fg/35">
          Auto-extracted
        </Typography>
        {EXTRACTED.map(([label, value]) => (
          <div
            key={label}
            className="mb-1.5 flex items-center gap-2.5 rounded-lg border border-surface/[0.06] bg-surface/[0.03] px-3 py-2.5"
          >
            <Typography as="span" variant="caption" weight="bold" className="min-w-20 uppercase text-primary-fg/35">
              {label}
            </Typography>
            <Typography as="span" variant="body-sm" weight="semibold" className="text-primary-fg">
              {value}
            </Typography>
          </div>
        ))}
      </div>
    </div>
  )
}
