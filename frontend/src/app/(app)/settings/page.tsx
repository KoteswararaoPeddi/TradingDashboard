import type { Metadata } from "next";

import { SettingsPage } from "@features/dashboard/components/SettingsPage";

export const metadata: Metadata = {
  title: "Settings | Trade Journal",
};

// Thin route entry: composes the feature, holds no logic.
export default function Page() {
  return <SettingsPage />;
}
