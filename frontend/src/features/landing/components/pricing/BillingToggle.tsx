"use client"

import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs"
import { Typography } from "@components/ui/typography"
import type { BillingCycle } from "../../types/pricing.types"

type Props = {
  value: BillingCycle
  onChange: (value: BillingCycle) => void
}

/** Monthly / Annual segmented toggle that drives the plan prices. */
export function BillingToggle({ value, onChange }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as BillingCycle)}>
      <TabsList className="group-data-horizontal/tabs:h-auto gap-1 rounded-full border border-border bg-surface p-1.5">
        <TabsTrigger
          value="monthly"
          className="h-auto rounded-full px-6 py-2 text-body-base font-semibold text-muted-foreground hover:text-primary data-active:bg-primary data-active:text-primary-fg data-active:hover:text-primary-fg"
        >
          Monthly
        </TabsTrigger>
        <TabsTrigger
          value="annual"
          className="h-auto gap-2 rounded-full px-6 py-2 text-body-base font-semibold text-muted-foreground hover:text-primary data-active:bg-primary data-active:text-primary-fg data-active:hover:text-primary-fg"
        >
          Annual
          <Typography
            as="span"
            variant="caption"
            weight="bold"
            className="rounded-full bg-success-subtle px-2 py-0.5 text-success"
          >
            Save 20%
          </Typography>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
