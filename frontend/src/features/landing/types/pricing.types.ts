export type BillingCycle = "monthly" | "annual"

export type PricingFeature = {
  label: string
  included: boolean
}

export type PricingPlan = {
  id: string
  name: string
  tagline: string
  /** Per-month price when billed monthly (INR). */
  priceMonthly: number
  /** Per-month price when billed annually (INR, ~20% off). */
  priceAnnual: number
  features: PricingFeature[]
  website: { badge: string; detail: string }
  cta: { label: string; variant: "trial" | "outline" }
  /** Corner ribbon label, e.g. "Most Popular". */
  badge?: string
  /** The highlighted (violet) plan. */
  featured?: boolean
}
