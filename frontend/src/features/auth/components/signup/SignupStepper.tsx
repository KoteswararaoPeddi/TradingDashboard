import { Check } from "lucide-react"

import { cn } from "@lib/utils"
import { Typography } from "@components/ui/typography"

type Props = { step: "details" | "otp" }

/** Two-step progress header: Hospital Details → Verify OTP. */
export function SignupStepper({ step }: Props) {
  const onOtp = step === "otp"

  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-body-sm font-bold",
            onOtp ? "bg-success/15 text-success" : "bg-primary text-primary-fg"
          )}
        >
          {onOtp ? <Check className="size-4" strokeWidth={3} /> : "1"}
        </span>
        <Typography
          as="span"
          variant="body-base"
          weight="semibold"
          className={onOtp ? "text-success" : "text-primary"}
        >
          Hospital Details
        </Typography>
      </div>

      <span className={cn("h-px w-10 sm:w-16", onOtp ? "bg-success" : "bg-border")} />

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-body-sm font-bold",
            onOtp ? "bg-primary text-primary-fg" : "bg-muted text-muted-foreground"
          )}
        >
          2
        </span>
        <Typography
          as="span"
          variant="body-base"
          weight="semibold"
          className={onOtp ? "text-primary" : "text-muted-foreground"}
        >
          Verify OTP
        </Typography>
      </div>
    </div>
  )
}
