import { Typography } from "@components/ui/typography"
import { FOOTER_COLUMNS, FOOTER_LEGAL_LINKS } from "../../config/footer.config"
import { Logo } from "../common/Logo"

/** Site footer — brand blurb, link columns, and a bottom bar. */
export function Footer() {
  return (
    <footer className="bg-neutral-900 px-[5%] pt-16 pb-8 text-primary-fg">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <Logo variant="white" />
            <Typography variant="body-base" className="mt-5 leading-relaxed text-primary-fg/55">
              Smarter healthcare connecting doctors and patients. The multi-tenant HMS SaaS platform
              for modern healthcare providers.
            </Typography>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:gap-16">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <Typography
                  as="h3"
                  variant="label-base"
                  weight="bold"
                  className="mb-4 uppercase tracking-wider text-primary-fg"
                >
                  {column.title}
                </Typography>
                <ul className="flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-body-base text-primary-fg/55 transition-colors hover:text-primary-fg">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="my-8 h-px bg-primary-fg/10" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Typography variant="body-sm" className="text-primary-fg/45">
            © 2026 MediNex+. All rights reserved. | Product By{" "}
            <span className="font-semibold text-primary">The Blue Intellect</span>
          </Typography>
          <div className="flex gap-6">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-body-sm text-primary-fg/45 transition-colors hover:text-primary-fg"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
