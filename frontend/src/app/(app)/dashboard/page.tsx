import type { Metadata } from "next"

import { Card, CardContent } from "@components/ui/card"
import { Typography } from "@components/ui/typography"

export const metadata: Metadata = {
  title: "Dashboard | Trade Journal",
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <Typography as="h1" variant="display-lg" weight="bold" className="text-foreground">
        Dashboard
      </Typography>

      <Card>
        <CardContent className="py-10 text-center">
          <Typography variant="body-lg" className="text-muted-foreground">
            Coming soon — your trading cockpit will live here.
          </Typography>
        </CardContent>
      </Card>
    </div>
  )
}
