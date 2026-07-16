"use client"

import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Button } from "@components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@components/ui/input-otp"
import { Typography } from "@components/ui/typography"
import { getErrorMessage } from "@lib/get-error-message"
import { useAuthStore } from "@shared/stores/auth.store"
import { otpSchema, type OtpValues } from "../../schemas/auth.schema"
import { resendSignupOtp, verifySignupOtp } from "../../api/auth.service"

type Props = { email: string; onBack: () => void }

const SLOT_CLASS =
  "size-12 rounded-xl border border-input bg-muted/50 text-h3 font-bold text-foreground sm:size-14"

/** Step 2 — verify the 6-digit code (RHF + Zod); creates the account and signs in. */
export function OtpStep({ email, onBack }: Props) {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
    mode: "onSubmit",
  })

  const onVerify = async ({ otp }: OtpValues) => {
    const toastId = toast.loading("Verifying...")
    try {
      const user = await verifySignupOtp({ email, otp })
      setUser(user)
      toast.success("Account created", { id: toastId })
      router.push("/dashboard")
    } catch (error) {
      const message = getErrorMessage(error, "Verification failed.")
      setError("otp", { message })
      toast.error(message, { id: toastId })
    }
  }

  const resend = async () => {
    const toastId = toast.loading("Resending...")
    try {
      await resendSignupOtp(email)
      setValue("otp", "")
      toast.success("A new code has been sent", { id: toastId })
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not resend the code."), { id: toastId })
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-body-base font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Details
      </button>

      <Typography
        as="div"
        variant="body-sm"
        weight="bold"
        className="mt-6 w-fit rounded-full bg-warning-subtle px-3 py-1 uppercase tracking-wider text-warning"
      >
        Step 2 of 2 · OTP verification
      </Typography>
      <Typography as="h1" variant="h2" weight="extrabold" className="mt-3 text-foreground">
        Check Your Email
      </Typography>
      <Typography variant="body-sm" className="mt-1.5 leading-relaxed text-muted-foreground">
        We sent a 6-digit OTP to{" "}
        <span className="font-semibold text-foreground">{email}</span>. Enter it below to verify your
        account.
      </Typography>
      <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-full rounded-full bg-primary" />
      </div>

      <form onSubmit={handleSubmit(onVerify)} className="mt-6" noValidate>
        <Typography as="div" variant="body-sm" weight="semibold" className="mb-3 text-foreground">
          Enter 6-digit OTP
        </Typography>

        <Controller
          name="otp"
          control={control}
          render={({ field }) => (
            <InputOTP
              maxLength={6}
              value={field.value}
              onChange={field.onChange}
              containerClassName="w-full"
              aria-invalid={Boolean(errors.otp)}
            >
              <InputOTPGroup className="w-full justify-between">
                {[0, 1, 2, 3, 4, 5].map((slot) => (
                  <InputOTPSlot
                    key={slot}
                    index={slot}
                    className={SLOT_CLASS}
                    aria-invalid={Boolean(errors.otp)}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          )}
        />

        {errors.otp ? (
          <Typography as="div" variant="body-sm" className="mt-3 text-center text-danger">
            {errors.otp.message}
          </Typography>
        ) : (
          <Typography as="div" variant="body-sm" className="mt-3 text-center text-muted-foreground">
            OTP is valid for 10 minutes
          </Typography>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 h-11 w-full gap-2 rounded-xl bg-linear-to-r from-primary to-primary-hover text-body-base font-semibold text-primary-fg shadow-lg shadow-primary/30 hover:-translate-y-0.5"
        >
          {isSubmitting ? (
            "Verifying..."
          ) : (
            <>
              Verify &amp; Create Account <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      <Typography variant="body-sm" className="mt-5 text-center text-muted-foreground">
        Didn&apos;t receive the code?{" "}
        <button
          type="button"
          onClick={resend}
          className="font-semibold text-primary hover:underline"
        >
          Resend OTP
        </button>
      </Typography>
    </div>
  )
}
