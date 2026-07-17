import type { Metadata } from "next";

import { AnalyticsPage } from "@features/dashboard/components/AnalyticsPage";

export const metadata: Metadata = {
  title: "Analytics | Trade Journal",
};

// Thin route entry: composes the feature, holds no logic.
export default function Page() {
  return <AnalyticsPage />;
}
