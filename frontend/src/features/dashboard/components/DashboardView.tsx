import { CalendarDays, Stethoscope, Users } from "lucide-react"

import { ActionCard } from "./ActionCard"
import { ComingSoon } from "./ComingSoon"
import { StatCard } from "./StatCard"

export function DashboardView() {
  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Appointments today" value={0} icon={CalendarDays} tone="primary" />
        <StatCard label="Patients" value={0} icon={Users} tone="info" />
        <StatCard label="Doctors on duty" value={0} icon={Stethoscope} tone="purple" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ActionCard
          title="Settings"
          description="Manage your account and preferences"
          icon={Users}
          href="/settings"
        />
      </div>

      <ComingSoon title="Dashboard" />
    </>
  )
}
