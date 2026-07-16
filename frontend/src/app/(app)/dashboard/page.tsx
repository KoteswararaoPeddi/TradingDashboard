import type { Metadata } from "next";

import { DashboardPage } from "@features/dashboard/components/DashboardPage";

export const metadata: Metadata = {
  title: "Dashboard | Trade Journal",
};

// Thin route entry: composes the feature, holds no logic.
export default function Page() {
  return <DashboardPage />;
}
