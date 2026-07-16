import { Typography } from "@components/ui/typography"
import { WHY_BENEFITS } from "../../data/why-choose.data"
import { WhyChooseCard } from "./WhyChooseCard"

/** "Why choose our platform?" — a violet panel with a 3-then-2 grid of benefit cards. */
export function WhyChoose() {
  return (
    <section id="why-choose" className="bg-primary-subtle px-[5%] py-24">
      <div
        className="mx-auto max-w-6xl rounded-3xl px-6 py-16 sm:px-12 lg:px-16"
        style={{
          background: "linear-gradient(135deg, var(--color-violet-600) 0%, var(--color-violet-500) 100%)",
        }}
      >
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Typography
            as="h2"
            variant="display-lg"
            weight="extrabold"
            className="leading-tight tracking-tight text-primary-fg lg:text-display-xl"
          >
            Why choose our platform?
          </Typography>
          <Typography variant="body-lg" className="mx-auto mt-4 max-w-xl leading-relaxed text-primary-fg/80">
            Streamline healthcare with effortless booking, secure records, and smarter management for
            doctors and patients.
          </Typography>
        </div>

        <div className="grid gap-5 md:grid-cols-6">
          {WHY_BENEFITS.map((benefit, i) => (
            <div key={benefit.id} className={i < 3 ? "md:col-span-2" : "md:col-span-3"}>
              <WhyChooseCard benefit={benefit} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
