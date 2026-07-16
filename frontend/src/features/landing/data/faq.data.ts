import type { Faq } from "../types/faq.types"

export const FAQS: Faq[] = [
  {
    id: "what-is",
    question: "What is MediNex+ and who is it for?",
    answer:
      "MediNex+ is a multi-tenant Hospital Management SaaS platform designed for hospitals, clinics, diagnostic labs, and pharmacies of any size. It connects doctors, patients, admins, and staff in one unified platform.",
  },
  {
    id: "onboard",
    question: "How do I onboard my hospital?",
    answer:
      "Sign up with your hospital details, verify via OTP, and your secure workspace is ready in minutes. From there you configure departments, invite your team, and go live, no tech team required.",
  },
  {
    id: "data-security",
    question: "Is patient data secure and isolated per hospital?",
    answer:
      "Yes. Every hospital's data is fully isolated with tenant-level separation, role-based access control, and encrypted storage, so records are only ever visible to your authorized staff.",
  },
  {
    id: "multiple",
    question: "Can I manage multiple hospitals under one account?",
    answer:
      "Absolutely. The Enterprise plan includes a Multi-Hospital Super Admin panel to manage every branch, with consolidated reporting and per-hospital data isolation.",
  },
  {
    id: "billing-pharmacy",
    question: "Does MediNex+ support billing and pharmacy management?",
    answer:
      "Yes. MediNex+ includes billing and invoicing, a pharmacy counter with sales and inventory, purchase orders, and expiry and batch tracking, all integrated with patient records.",
  },
  {
    id: "support",
    question: "What support is included in all plans?",
    answer:
      "Every plan includes email support and product updates. Pro adds priority support, and Enterprise adds a dedicated account manager with a priority SLA and 24/7 phone support.",
  },
]
