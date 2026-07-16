import { ChevronDown } from "lucide-react"

import { Typography } from "@components/ui/typography"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion"
import type { Faq } from "../../types/faq.types"

/** A single FAQ accordion card. Question turns violet and reveals the answer when open. */
export function FaqItem({ faq }: { faq: Faq }) {
  return (
    <AccordionItem value={faq.id} className="rounded-2xl border border-border bg-card px-6">
      <AccordionTrigger className="items-center gap-4 py-5 hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden">
        <Typography
          as="span"
          variant="body-lg"
          weight="bold"
          className="text-left text-foreground transition-colors group-aria-expanded/accordion-trigger:text-primary"
        >
          {faq.question}
        </Typography>
        <span className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-aria-expanded/accordion-trigger:bg-primary group-aria-expanded/accordion-trigger:text-primary-fg">
          <ChevronDown className="size-4 transition-transform group-aria-expanded/accordion-trigger:rotate-180" />
        </span>
      </AccordionTrigger>
      <AccordionContent className="text-muted-foreground">
        <Typography variant="body-base" className="max-w-3xl leading-relaxed">
          {faq.answer}
        </Typography>
      </AccordionContent>
    </AccordionItem>
  )
}
