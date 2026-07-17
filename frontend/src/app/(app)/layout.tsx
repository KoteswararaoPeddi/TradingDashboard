import { loadDashboard } from "@features/dashboard/api/dashboard.loader";
import { DashboardProvider } from "@features/dashboard/components/DashboardProvider";
import { DashboardShell } from "@features/dashboard/components/shell/DashboardShell";

/**
 * Server layout: fetches the cockpit's data, then wraps the chrome (client)
 * around server-rendered pages via the children slot. Open app — no guard.
 *
 * Fetching here rather than per page means the account and trade set load once
 * for the whole route group, and the provider hands the same data to both the
 * shell and the pages without prop-drilling across the route boundary.
 */
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const payload = await loadDashboard();

  return (
    <DashboardProvider payload={payload}>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
