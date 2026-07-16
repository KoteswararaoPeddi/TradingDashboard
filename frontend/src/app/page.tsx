import { redirect } from "next/navigation"

// Open app: the root entry sends the user straight into the dashboard.
export default function HomePage() {
  redirect("/dashboard")
}
