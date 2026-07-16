export type FooterLink = { label: string; href: string }
export type FooterColumn = { title: string; links: FooterLink[] }

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Solutions", href: "#solutions" },
      { label: "Features", href: "#why-choose" },
      { label: "Pricing", href: "#pricing" },
      { label: "Get started", href: "#get-started" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  },
]

export const FOOTER_LEGAL_LINKS: FooterLink[] = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Cookies", href: "#" },
]
