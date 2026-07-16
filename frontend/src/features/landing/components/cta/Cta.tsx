import Link from "next/link"

import { cn } from "@lib/utils"
import { Typography } from "@components/ui/typography"
import { BookDemoTrigger } from "../book-demo"
import { ctaPrimary, ctaTrial } from "../../styles/cta-styles"

const DOTS = "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 18%, transparent) 1.5px, transparent 1.5px)"

/** Closing call-to-action band. Book Demo opens the lead-capture dialog. */
export function Cta() {
  return (
    <section
      id="get-started"
      className="relative overflow-hidden px-[5%] py-24"
      style={{ background: "linear-gradient(180deg, var(--color-violet-100), var(--color-violet-50))" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-40"
        style={{ backgroundImage: DOTS, backgroundSize: "22px 22px" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-40"
        style={{ backgroundImage: DOTS, backgroundSize: "22px 22px" }}
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <Typography
          as="span"
          variant="body-sm"
          weight="semibold"
          className="mb-7 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-foreground shadow-sm shadow-primary/10"
        >
          <span className="size-1.5 rounded-full bg-primary" />
          One step to better care
        </Typography>
        <Typography
          as="h2"
          variant="display-lg"
          weight="extrabold"
          className="mb-5 leading-tight tracking-tight text-foreground md:text-display-xl"
        >
          Take the next step in <em className="font-display font-medium italic">Healthcare.</em>
        </Typography>
        <Typography variant="body-lg" className="mx-auto mb-9 max-w-xl leading-relaxed text-muted-foreground">
          Whether you&apos;re a patient looking for care or a doctor managing appointments, our platform
          makes it simple, secure, and seamless for everyone.
        </Typography>
        <div className="flex flex-wrap justify-center gap-3">
          <BookDemoTrigger className={cn(ctaPrimary, "px-7 py-3")}>
            Book Demo
          </BookDemoTrigger>
          <Link href="/signup" className={cn(ctaTrial, "px-7 py-3")}>
            Free 14 days trial
          </Link>
        </div>
      </div>
    </section>
  )
}
