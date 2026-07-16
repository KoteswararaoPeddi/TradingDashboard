import {
  Activity,
  Bell,
  Building2,
  Calendar,
  CalendarDays,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Package,
  Plane,
  Receipt,
  RefreshCw,
  Search,
  Stethoscope,
  TrendingUp,
  TriangleAlert,
  User,
  Users,
} from "lucide-react"

import { cn } from "@lib/utils"
import { Typography } from "@components/ui/typography"

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Appointments", icon: CalendarDays },
  { label: "Billing", icon: Receipt },
  { label: "Inventory", icon: Package },
  { label: "IPD / Wards", icon: Building2 },
  { label: "Staff", icon: Users },
  { label: "Doctors", icon: Stethoscope },
  { label: "Patients", icon: User },
  { label: "Departments", icon: Building2 },
  { label: "Enquiries", icon: MessageSquare },
  { label: "Medical Tourism", icon: Plane },
  { label: "Blogs", icon: FileText },
]

const KPIS = [
  { label: "Staff & Doctors", value: "2", sub: "2 active doctors", icon: Users, tint: "bg-success-subtle text-success", card: "bg-success-subtle/40" },
  { label: "Total Patients", value: "6", sub: "+6 this month", icon: User, tint: "bg-info/10 text-info", card: "bg-info/5" },
  { label: "Today Appointments", value: "1", sub: "0 completed", icon: Calendar, tint: "bg-violet-100 text-violet-600", card: "bg-violet-50" },
  { label: "Revenue Today", value: "₹0", sub: "₹2.5K this month", icon: TrendingUp, tint: "bg-warning/15 text-warning", card: "bg-warning/5" },
]

const STATS = [
  { label: "Scheduled", value: "1", tone: "text-violet-600" },
  { label: "Confirmed", value: "0", tone: "text-success" },
  { label: "Completed", value: "0", tone: "text-foreground" },
  { label: "Cancelled", value: "0", tone: "text-danger" },
  { label: "Pending Bills", value: "1", tone: "text-warning" },
  { label: "Active Plans", value: "0", tone: "text-foreground" },
  { label: "Plans Done", value: "0", tone: "text-foreground" },
]

const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"]
// May 2026 starts on a Friday → 4 leading blanks (M T W T).
const CAL_BLANKS = 4
const CAL_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const DUTY = [
  { initials: "SP", name: "Swapnil Patil", meta: "Dental Department · 08:00-13:00" },
  { initials: "YS", name: "Dr. Yogesh Salunke", meta: "Dermatology · 09:00-17:00" },
]

/** Decorative hospital dashboard preview shown in the hero (aria-hidden illustration). */
export function HeroDashboardMock() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-2xl border border-violet-600/10 bg-surface text-left shadow-2xl shadow-violet-600/15"
    >
      {/* topbar */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="flex size-6 items-center justify-center rounded-md bg-linear-to-br from-violet-600 to-violet-700 text-primary-fg">
            <Activity className="size-3.5" strokeWidth={2.5} />
          </span>
          <Typography as="span" variant="body-sm" weight="extrabold" className="text-foreground">
            MediNex+
          </Typography>
        </span>
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5">
          <Search className="size-3.5 text-subtle-foreground" />
          <Typography as="span" variant="caption" className="text-subtle-foreground">
            Search...
          </Typography>
        </div>
        <span className="relative flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Bell className="size-3.5" />
          <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-danger text-[8px] font-bold text-primary-fg">
            1
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-linear-to-br from-violet-600 to-violet-500 text-caption font-bold text-primary-fg">
            DJ
          </span>
          <span>
            <Typography as="div" variant="caption" weight="bold" className="leading-tight text-foreground">
              Dr
            </Typography>
            <Typography as="div" className="text-[10px] leading-tight text-subtle-foreground">
              Hosp. Admin
            </Typography>
          </span>
        </span>
      </div>

      {/* body */}
      <div className="grid grid-cols-[24%_76%] md:grid-cols-[18%_54%_28%]">
        {/* sidebar */}
        <aside className="border-r border-border py-3">
          <Typography as="div" className="px-4 pb-1.5 text-[9px] font-bold uppercase tracking-widest text-subtle-foreground">
            General
          </Typography>
          {NAV.map((item) => (
            <div
              key={item.label}
              className={cn(
                "mx-2 flex items-center gap-2 rounded-md px-2 py-1.5",
                item.active ? "bg-violet-100 text-violet-700" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-3.5 shrink-0" />
              <Typography as="span" variant="caption" weight={item.active ? "semibold" : "normal"}>
                {item.label}
              </Typography>
            </div>
          ))}
          <div className="mx-2 mt-3 flex items-center gap-2 border-t border-border px-2 pt-3">
            <span className="flex size-6 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-violet-600 text-[9px] font-bold text-primary-fg">
              JB
            </span>
            <Typography as="span" variant="caption" weight="semibold" className="text-foreground">
              Dr Jaybhave
            </Typography>
          </div>
        </aside>

        {/* main */}
        <main className="border-r border-border p-4">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <Typography as="div" variant="body-base" weight="bold" className="text-foreground">
                Dashboard
              </Typography>
              <Typography as="div" className="text-[10px] text-subtle-foreground">
                Last updated 7:35:06 PM
              </Typography>
            </div>
            <span className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-[10px] text-muted-foreground">
              <RefreshCw className="size-3" /> Refresh
            </span>
          </div>

          {/* KPI cards */}
          <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {KPIS.map((k) => (
              <div key={k.label} className={cn("rounded-xl border border-border p-2.5", k.card)}>
                <span className={cn("mb-2 flex size-6 items-center justify-center rounded-lg", k.tint)}>
                  <k.icon className="size-3.5" />
                </span>
                <Typography as="div" variant="caption" className="text-muted-foreground">
                  {k.label}
                </Typography>
                <Typography as="div" variant="h4" weight="extrabold" className="leading-tight text-foreground">
                  {k.value}
                </Typography>
                <Typography as="div" className="text-[9px] text-subtle-foreground">
                  {k.sub}
                </Typography>
              </div>
            ))}
          </div>

          {/* stat row */}
          <div className="mb-3 grid grid-cols-4 overflow-hidden rounded-lg border border-border sm:grid-cols-7">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={cn("px-1.5 py-2 text-center", i < STATS.length - 1 && "border-r border-border")}
              >
                <Typography as="div" className="text-[8px] uppercase tracking-wide text-subtle-foreground">
                  {s.label}
                </Typography>
                <Typography as="div" variant="body-base" weight="extrabold" className={cn("leading-tight", s.tone)}>
                  {s.value}
                </Typography>
              </div>
            ))}
          </div>

          {/* chart */}
          <div className="rounded-xl border border-border p-3">
            <Typography as="div" variant="caption" weight="bold" className="text-foreground">
              Monthly Activity Trends
            </Typography>
            <div className="mb-2 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-violet-600" />
                <Typography as="span" className="text-[9px] text-muted-foreground">
                  Appointments
                </Typography>
              </span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-success" />
                <Typography as="span" className="text-[9px] text-muted-foreground">
                  New Patients
                </Typography>
              </span>
            </div>
            <svg viewBox="0 0 320 80" className="h-20 w-full" preserveAspectRatio="none">
              <polyline
                points="0,66 40,64 80,62 120,58 160,54 200,46 240,36 280,22 320,8"
                fill="none"
                stroke="var(--color-violet-600)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <polyline
                points="0,70 40,69 80,68 120,66 160,62 200,56 240,48 280,34 320,18"
                fill="none"
                stroke="var(--color-success)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="mt-1 flex justify-between">
              {MONTHS.map((m) => (
                <Typography as="span" key={m} className="text-[8px] text-subtle-foreground">
                  {m}
                </Typography>
              ))}
            </div>
          </div>
        </main>

        {/* right panel */}
        <section className="hidden p-4 md:block">
          <Typography as="div" className="mb-2 text-[9px] font-bold uppercase tracking-widest text-subtle-foreground">
            Date
          </Typography>
          <Typography as="div" variant="caption" weight="bold" className="mb-1.5 text-foreground">
            May 2026
          </Typography>
          <div className="mb-3 grid grid-cols-7 gap-0.5 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <Typography as="span" key={i} className="text-[8px] font-semibold text-subtle-foreground">
                {d}
              </Typography>
            ))}
            {Array.from({ length: CAL_BLANKS }).map((_, i) => (
              <span key={`b${i}`} />
            ))}
            {CAL_DAYS.map((d) => (
              <Typography
                as="span"
                key={d}
                className={cn(
                  "py-0.5 text-[9px] text-muted-foreground",
                  d === 12 && "rounded-full bg-violet-600 font-bold text-primary-fg"
                )}
              >
                {d}
              </Typography>
            ))}
          </div>

          <Typography as="div" className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-subtle-foreground">
            Live Alerts
          </Typography>
          <div className="mb-1.5 rounded-md border border-danger/15 bg-danger-subtle px-2 py-1.5">
            <Typography as="div" className="flex items-center gap-1 text-[9px] font-semibold text-danger">
              <TriangleAlert className="size-2.5" /> 1 inventory item below minimum stock level
            </Typography>
          </div>
          <div className="mb-3 rounded-md border border-warning/20 bg-warning-subtle px-2 py-1.5">
            <Typography as="div" className="flex items-center gap-1 text-[9px] font-semibold text-warning">
              <TriangleAlert className="size-2.5" /> 1 bills pending collection
            </Typography>
          </div>

          <Typography as="div" className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-subtle-foreground">
            Doctors on duty
          </Typography>
          {DUTY.map((d) => (
            <div key={d.initials} className="mb-1.5 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground">
                {d.initials}
              </span>
              <div className="min-w-0">
                <Typography as="div" variant="caption" weight="semibold" className="truncate text-foreground">
                  {d.name}
                </Typography>
                <Typography as="div" className="text-[8px] text-subtle-foreground">
                  {d.meta}
                </Typography>
              </div>
            </div>
          ))}

          <Typography as="div" className="mb-1 mt-3 text-[9px] font-bold uppercase tracking-widest text-subtle-foreground">
            Today&apos;s Summary
          </Typography>
          {[
            ["Follow-ups", "0"],
            ["New Patients", "0"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between border-b border-border py-1 last:border-0">
              <Typography as="span" variant="caption" className="text-muted-foreground">
                {label}
              </Typography>
              <Typography as="span" variant="caption" weight="bold" className="text-foreground">
                {value}
              </Typography>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
