"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LineChart } from "lucide-react"

import { cn } from "@lib/utils"
import { APP_NAV } from "@shared/config/app-nav"

/**
 * App chrome (top nav). Renders the sticky header and page content unconditionally —
 * the app is open, with no authentication or session guard. `children` pass through,
 * so page content stays a Server Component.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center px-6">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LineChart className="size-5" />
            </span>
            <span className="text-h6 font-bold text-foreground">Trade Journal</span>
          </Link>

          <nav className="absolute left-1/2 hidden w-max -translate-x-1/2 items-center gap-1 lg:flex">
            {APP_NAV.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-body-base font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}
