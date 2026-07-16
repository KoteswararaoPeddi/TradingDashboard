import { Heart } from "lucide-react"

import { TESTIMONIALS } from "../../data/testimonials.data"
import { SectionHeading } from "../common"
import { TestimonialCard } from "./TestimonialCard"

/** "Trusted by doctors and patients" — a grid of customer testimonials. */
export function Testimonials() {
  return (
    <section id="testimonials" className="bg-background px-[5%] py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          center
          tag="Testimonials"
          tagIcon={Heart}
          title="Trusted by doctors and patients"
          sub="See what healthcare professionals say about managing their hospitals with MediNex+."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  )
}
