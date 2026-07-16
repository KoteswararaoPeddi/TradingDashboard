import { AppShell } from "@components/AppShell"

// Server layout: wraps the app chrome (client) around server-rendered pages. Open app — no guard.
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>
}
