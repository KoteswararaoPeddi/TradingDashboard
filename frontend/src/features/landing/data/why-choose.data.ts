import { Bell, CalendarDays, CreditCard, Shield, Smartphone } from "lucide-react"

import type { WhyBenefit } from "../types/why-choose.types"

export const WHY_BENEFITS: WhyBenefit[] = [
  {
    id: "booking",
    icon: CalendarDays,
    title: "24/7 Online Booking",
    desc: "Patients can book appointments anytime, ensuring convenience without long calls or waiting lines.",
  },
  {
    id: "reminders",
    icon: Bell,
    title: "Automated Reminders",
    desc: "Smart SMS and email alerts reduce no-shows and keep both doctors and patients on schedule.",
  },
  {
    id: "records",
    icon: Shield,
    title: "Secure Digital Records",
    desc: "All patient histories, prescriptions, and reports are safely stored and easily accessible anytime.",
  },
  {
    id: "multi-device",
    icon: Smartphone,
    title: "Seamless Multi-Device Access",
    desc: "Doctors and patients can use the platform on desktop, tablet, or mobile without limitations.",
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Simplified Payments & Billing",
    desc: "Integrated payment options and billing systems make transactions faster and more transparent.",
  },
]
