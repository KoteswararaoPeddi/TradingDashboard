import { Home, Settings, type LucideIcon } from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

// Top-nav items for the authenticated app shell.
export const APP_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Settings", href: "/settings", icon: Settings },
]
