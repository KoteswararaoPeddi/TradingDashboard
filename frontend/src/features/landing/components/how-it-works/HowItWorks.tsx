import { Settings } from "lucide-react"

import { HOW_STEPS } from "../../data/how-it-works.data"
import { SectionHeading } from "../common"
import { HowStep } from "./HowStep"

/** "From booking to consultation" — a 3-step onboarding walkthrough. */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface px-[5%] py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          center
          tag="How it works"
          tagIcon={Settings}
          title="From booking to consultation"
          sub="Get your hospital live in 3 simple steps, no tech team required."
        />
        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {HOW_STEPS.map((step) => (
            <HowStep key={step.num} step={step} />
          ))}
        </div>
      </div>
    </section>
  )
}
