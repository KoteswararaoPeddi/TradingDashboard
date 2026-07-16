import type { Metadata } from "next"

import { SignupWizard } from "@features/auth/components/SignupWizard"

export const metadata: Metadata = {
  title: "Create account | MediNex+",
}

export default function SignupPage() {
  return <SignupWizard />
}
