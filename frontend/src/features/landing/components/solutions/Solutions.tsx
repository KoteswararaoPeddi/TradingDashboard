import { SOLUTIONS } from "../../data/solutions.data"
import { SectionHeading } from "../common"
import { SolutionCard } from "./SolutionCard"

export function Solutions() {
  return (
    <section id="solutions" className="bg-primary-subtle px-[5%] py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          center
          title="Smart solutions for every side of care"
          sub="One platform to manage your entire healthcare ecosystem, from front desk to finance."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {SOLUTIONS.map((solution) => (
            <SolutionCard key={solution.id} solution={solution} />
          ))}
        </div>
      </div>
    </section>
  )
}
