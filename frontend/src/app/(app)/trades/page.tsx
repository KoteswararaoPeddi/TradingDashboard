import type { Metadata } from "next";

import { TradesPage } from "@features/dashboard/components/TradesPage";

export const metadata: Metadata = {
  title: "Trades | Trade Journal",
};

// Thin route entry: composes the feature, holds no logic.
export default function Page() {
  return <TradesPage />;
}
