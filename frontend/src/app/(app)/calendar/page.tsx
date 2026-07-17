import type { Metadata } from "next";

import { CalendarPage } from "@features/dashboard/components/CalendarPage";

export const metadata: Metadata = {
  title: "Calendar | Trade Journal",
};

// Thin route entry: composes the feature, holds no logic.
export default function Page() {
  return <CalendarPage />;
}
