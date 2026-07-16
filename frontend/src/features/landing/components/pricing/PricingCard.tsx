"use client"

import { Check, Globe, Minus } from "lucide-react"

import { cn } from "@lib/utils"
import { Typography } from "@components/ui/typography"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion"
import { ctaOutline, ctaTrial } from "../../styles/cta-styles"
import type { BillingCycle, PricingPlan } from "../../types/pricing.types"

type Props = {
  plan: PricingPlan
  billing: BillingCycle
}

/** A single pricing plan card. The featured plan renders as a violet panel. */
export function PricingCard({ plan, billing }: Props) {
  const featured = plan.featured
  const price = billing === "monthly" ? plan.priceMonthly : plan.priceAnnual

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-3xl p-8",
        featured ? "text-primary-fg shadow-2xl lg:-my-4 lg:py-12" : "border border-border bg-card"
      )}
      style={
        featured
          ? { background: "linear-gradient(160deg, var(--color-violet-600) 0%, var(--color-violet-700) 100%)" }
          : undefined
      }
    >
      {plan.badge && (
        <Typography
          as="span"
          variant="caption"
          weight="bold"
          className="absolute -top-3 right-6 rounded-full bg-warning px-3 py-1 text-primary-fg"
        >
          {plan.badge}
        </Typography>
      )}

      <Typography as="h3" variant="h2" weight="extrabold" className={cn(featured ? "text-primary-fg" : "text-foreground")}>
        {plan.name}
      </Typography>
      <Typography variant="body-base" className={cn("mt-1", featured ? "text-primary-fg/80" : "text-muted-foreground")}>
        {plan.tagline}
      </Typography>

      <div className="mt-6 flex items-baseline gap-1">
        <Typography as="span" variant="h2" weight="bold" className={cn(featured ? "text-primary-fg" : "text-foreground")}>
          ₹
        </Typography>
        <Typography
          as="span"
          variant="display-lg"
          weight="extrabold"
          className={cn("leading-none", featured ? "text-primary-fg" : "text-foreground")}
        >
          {price.toLocaleString("en-IN")}
        </Typography>
        <Typography as="span" variant="body-base" className={cn(featured ? "text-primary-fg/70" : "text-muted-foreground")}>
          /mo
        </Typography>
      </div>
      <Typography variant="body-sm" className={cn("mt-2", featured ? "text-primary-fg/70" : "text-muted-foreground")}>
        Billed {billing === "monthly" ? "monthly" : "annually"} · cancel anytime
      </Typography>

      <div className={cn("my-6 h-px", featured ? "bg-surface/20" : "bg-border")} />

      <ul className="flex flex-col gap-3">
        {plan.features.map((f) => (
          <Typography
            as="li"
            variant="body-base"
            weight="medium"
            key={f.label}
            className={cn(
              "flex items-center gap-2.5",
              featured
                ? f.included
                  ? "text-primary-fg"
                  : "text-primary-fg/40"
                : f.included
                  ? "text-foreground"
                  : "text-muted-foreground/50"
            )}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full",
                f.included
                  ? featured
                    ? "bg-surface/20 text-primary-fg"
                    : "bg-success-subtle text-success"
                  : featured
                    ? "bg-surface/10 text-primary-fg/40"
                    : "bg-muted text-muted-foreground/50"
              )}
            >
              {f.included ? <Check className="size-3" strokeWidth={3} /> : <Minus className="size-3" strokeWidth={3} />}
            </span>
            {f.label}
          </Typography>
        ))}
      </ul>

      <Accordion className="mt-6">
        <AccordionItem
          value="website"
          className={cn("rounded-2xl border-b-0 px-3", featured ? "bg-surface/10" : "bg-primary/5")}
        >
          <AccordionTrigger
            className={cn(
              "items-center py-3 hover:no-underline",
              featured
                ? "**:data-[slot=accordion-trigger-icon]:text-primary-fg/70"
                : "**:data-[slot=accordion-trigger-icon]:text-primary"
            )}
          >
            <span className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  featured ? "bg-surface/20 text-primary-fg" : "bg-surface text-primary"
                )}
              >
                <Globe className="size-4" />
              </span>
              <span className="flex flex-col items-start gap-1.5">
                <Typography
                  as="span"
                  variant="body-sm"
                  weight="bold"
                  className={cn("leading-tight", featured ? "text-primary-fg" : "text-primary")}
                >
                  Website &amp; Booking Engine
                </Typography>
                <Typography
                  as="span"
                  variant="caption"
                  weight="semibold"
                  className="rounded-full bg-success-subtle px-2.5 py-1 leading-tight text-success"
                >
                  {plan.website.badge}
                </Typography>
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent
            className={cn("leading-relaxed", featured ? "text-primary-fg/80" : "text-muted-foreground")}
          >
            <Typography variant="body-sm">{plan.website.detail}</Typography>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-6">
        <a href="/signup" className={cn(plan.cta.variant === "trial" ? ctaTrial : ctaOutline, "w-full py-3")}>
          {plan.cta.label}
        </a>
      </div>
      <Typography
        variant="caption"
        className={cn("mt-3 text-center", featured ? "text-primary-fg/60" : "text-muted-foreground")}
      >
        No credit card required
      </Typography>
    </article>
  )
}
