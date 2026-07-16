"use client"

import { useState } from "react"
import { BarChart3 } from "lucide-react"

import { PRICING_PLANS } from "../../data/pricing.data"
import { SectionHeading } from "../common"
import { BillingToggle } from "./BillingToggle"
import { PricingCard } from "./PricingCard"
import type { BillingCycle } from "../../types/pricing.types"

/** "Simple, transparent pricing" — plan cards with a monthly/annual toggle. */
export function Pricing() {
  const [billing, setBilling] = useState<BillingCycle>("monthly")

  return (
    <section id="pricing" className="bg-primary-subtle px-[5%] py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          center
          tag="Pricing"
          tagIcon={BarChart3}
          title="Simple, transparent pricing"
          sub="Only pay for what you need. Every plan includes real, built features, no upsells, no surprises."
        />
        <div className="mt-8 flex justify-center">
          <BillingToggle value={billing} onChange={setBilling} />
        </div>
        <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} billing={billing} />
          ))}
        </div>
      </div>
    </section>
  )
}
