import Link from "next/link"
import { BadgeCheck, Calendar, Sparkles, Star } from "lucide-react"

import { cn } from "@lib/utils"
import { Typography } from "@components/ui/typography"
import { BookDemoTrigger } from "../book-demo"
import { ctaTrial } from "../../styles/cta-styles"
import { REVIEW_AVATARS } from "../../data/hero.data"
import { HeroDashboardMock } from "./HeroDashboardMock"

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden px-[5%] pt-32 pb-16"
      style={{
        background:
          "linear-gradient(170deg, var(--color-violet-100) 0%, var(--color-violet-50) 45%, var(--color-violet-100) 100%)",
      }}
    >
      {/* decorative orb */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-[560px] w-[900px] -translate-x-1/2"
        style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.85) 0%, transparent 60%)" }}
      />

      {/* rotating stamp */}
      <div aria-hidden className="pointer-events-none absolute right-[6%] top-28 hidden size-24 lg:block">
        <svg viewBox="0 0 100 100" className="size-full animate-spin [animation-direction:reverse] [animation-duration:20s]">
          <defs>
            <path id="hero-stamp" d="M50,50 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" />
          </defs>
          <text className="fill-primary text-[9px] font-bold uppercase tracking-[0.18em]">
            <textPath href="#hero-stamp">Health One Platform • Complete Care •</textPath>
          </text>
        </svg>
        <span className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-hover text-primary-fg shadow-lg shadow-primary/40">
          <Sparkles className="size-4" />
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <Typography
          as="span"
          variant="body-sm"
          weight="semibold"
          className="mb-7 inline-flex items-center gap-2 rounded-full bg-surface/90 px-4 py-2 text-primary shadow-sm shadow-primary/10 backdrop-blur"
        >
          <Sparkles className="size-3.5" aria-hidden />
          Seamless healthcare
        </Typography>
        <Typography
          as="h1"
          variant="display-lg"
          weight="extrabold"
          className="mb-5 leading-tight tracking-tight text-foreground md:text-display-xl lg:text-display-2xl"
        >
          Smarter healthcare connecting doctors and patients{" "}
          <em className="font-display font-medium italic">Anywhere!</em>
        </Typography>
        <Typography variant="body-lg" className="mx-auto mb-8 max-w-lg leading-relaxed text-muted-foreground">
          Connect doctors and patients with effortless scheduling, secure records, and smooth
          hospital operations, all in one platform.
        </Typography>
        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <BookDemoTrigger className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-br from-primary to-primary-hover px-6 py-3 text-body-base font-semibold text-primary-fg shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 sm:w-auto">
            <Calendar className="size-4" aria-hidden /> Book Demo
          </BookDemoTrigger>
          <Link href="/signup" className={cn(ctaTrial, "w-full px-6 py-3 sm:w-auto")}>
            Free 14 days trial
          </Link>
        </div>
      </div>

      {/* dashboard preview + floating cards — hidden on mobile (too detailed for small screens) */}
      <div className="relative z-10 mx-auto mt-14 hidden w-full max-w-6xl md:block">
        <HeroDashboardMock />

        {/* reviews card */}
        <div className="absolute bottom-8 -left-6 hidden rounded-2xl bg-surface p-3.5 shadow-xl md:block">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="flex gap-0.5 text-amber-500" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3" fill="currentColor" />
              ))}
            </span>
            <Typography as="span" variant="body-sm" weight="bold" className="text-foreground">
              4.9
            </Typography>
          </div>
          <Typography as="div" variant="caption" weight="semibold" className="mb-2 text-muted-foreground">
            from client reviews
          </Typography>
          <div className="flex">
            {REVIEW_AVATARS.map((a, i) => (
              <Typography
                as="span"
                variant="caption"
                weight="bold"
                key={a.initials}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border-2 border-surface text-[8px] text-primary-fg",
                  a.bg,
                  i > 0 && "-ml-2"
                )}
              >
                {a.initials}
              </Typography>
            ))}
          </div>
        </div>

        {/* trusted-by-doctors card */}
        <div className="absolute top-[62%] -right-8 hidden items-center gap-2.5 rounded-2xl bg-surface p-3 shadow-xl lg:flex">
          <span className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-amber-500 to-amber-600 text-primary-fg">
            <BadgeCheck className="size-5" />
          </span>
          <div>
            <Typography as="div" variant="body-sm" weight="bold" className="text-foreground">
              Trusted by Doctors
            </Typography>
            <Typography as="div" variant="caption" className="text-muted-foreground">
              500+ hospitals onboard
            </Typography>
          </div>
        </div>
      </div>
    </section>
  )
}
