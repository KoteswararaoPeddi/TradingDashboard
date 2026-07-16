import { HelpCircle } from "lucide-react"

import { Accordion } from "@components/ui/accordion"
import { FAQS } from "../../data/faq.data"
import { SectionHeading } from "../common"
import { FaqItem } from "./FaqItem"

/** "Frequently asked questions" — an accordion of common questions. */
export function Faq() {
  return (
    <section id="faq" className="bg-surface px-[5%] py-24">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          center
          tag="FAQ"
          tagIcon={HelpCircle}
          title="Frequently asked questions"
          sub="Everything you need to know about MediNex+."
        />
        <Accordion className="mt-14 gap-4" defaultValue={[FAQS[0].id]}>
          {FAQS.map((faq) => (
            <FaqItem key={faq.id} faq={faq} />
          ))}
        </Accordion>
      </div>
    </section>
  )
}
