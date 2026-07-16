import { Building2, Rocket, Settings } from "lucide-react"

import type { HowStep } from "../types/how-it-works.types"

export const HOW_STEPS: HowStep[] = [
  {
    num: "01",
    icon: Building2,
    title: "Register Your Hospital",
    desc: "Sign up with your hospital details, verify via OTP, and your secure workspace is ready.",
  },
  {
    num: "02",
    icon: Settings,
    title: "Configure & Invite Team",
    desc: "Add departments, set up doctors, staff roles, schedules, and configure billing in minutes.",
  },
  {
    num: "03",
    icon: Rocket,
    title: "Go Live & Manage",
    desc: "Start accepting patients, managing appointments, and accessing real-time dashboards.",
  },
]
