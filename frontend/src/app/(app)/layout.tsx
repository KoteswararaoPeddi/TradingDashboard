import { DashboardShell } from "@features/dashboard/components/shell/DashboardShell";

// Server layout: the cockpit chrome (client) wraps server-rendered pages, so page
// content stays a Server Component via the children slot. Open app — no guard.
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DashboardShell>{children}</DashboardShell>;
}
