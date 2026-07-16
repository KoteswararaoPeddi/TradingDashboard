"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowRight, Building2, Mail, Phone, User } from "lucide-react"

import { Button } from "@components/ui/button"
import { Field } from "@components/ui/field"
import { PasswordInput } from "@components/ui/password-input"
import { Typography } from "@components/ui/typography"
import { getErrorMessage } from "@lib/get-error-message"
import { IconInput } from "./IconInput"
import { hospitalSignupSchema, type HospitalSignupValues } from "../../schemas/auth.schema"
import { requestSignupOtp, type SignupRequest } from "../../api/auth.service"

type Props = {
  defaults: SignupRequest | null
  onSent: (data: SignupRequest) => void
}

/** Step 1 — hospital + admin details; on submit emails a verification OTP. */
export function HospitalDetailsStep({ defaults, onSent }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HospitalSignupValues>({
    resolver: zodResolver(hospitalSignupSchema),
    defaultValues: defaults
      ? { ...defaults, confirmPassword: defaults.password }
      : {
          hospitalName: "",
          adminName: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        },
    mode: "onBlur",
  })

  const onSubmit = async (values: HospitalSignupValues) => {
    const payload: SignupRequest = {
      hospitalName: values.hospitalName,
      adminName: values.adminName,
      email: values.email,
      phone: values.phone,
      password: values.password,
    }
    const toastId = toast.loading("Sending verification code...")
    try {
      await requestSignupOtp(payload)
      toast.success("Code sent to your email", { id: toastId })
      onSent(payload)
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not send the code."), { id: toastId })
    }
  }

  return (
    <div>
      <Typography
        as="span"
        variant="body-sm"
        weight="bold"
        className="inline-flex rounded-full bg-primary/10 px-3 py-1 uppercase tracking-wider text-primary"
      >
        Step 1 of 2 · Hospital details
      </Typography>
      <Typography as="h1" variant="h2" weight="extrabold" className="mt-3 text-foreground">
        Register Your Hospital
      </Typography>
      <Typography variant="body-sm" className="mt-1.5 leading-relaxed text-muted-foreground">
        Fill in your hospital and admin details. We&apos;ll send a verification OTP to confirm your
        email.
      </Typography>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 rounded-full bg-primary" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-3" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Hospital Name" htmlFor="hospitalName" error={errors.hospitalName?.message}>
            <IconInput
              id="hospitalName"
              icon={Building2}
              placeholder="e.g. City Medical Center"
              aria-invalid={Boolean(errors.hospitalName)}
              {...register("hospitalName")}
            />
          </Field>
          <Field label="Admin Full Name" htmlFor="adminName" error={errors.adminName?.message}>
            <IconInput
              id="adminName"
              icon={User}
              placeholder="Your full name"
              aria-invalid={Boolean(errors.adminName)}
              {...register("adminName")}
            />
          </Field>
          <Field label="Email Address" htmlFor="email" error={errors.email?.message}>
            <IconInput
              id="email"
              type="email"
              icon={Mail}
              autoComplete="email"
              placeholder="admin@hospital.com"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </Field>
          <Field label="Mobile Number" htmlFor="phone" error={errors.phone?.message}>
            <IconInput
              id="phone"
              type="tel"
              icon={Phone}
              inputMode="numeric"
              placeholder="10-digit mobile"
              aria-invalid={Boolean(errors.phone)}
              {...register("phone")}
            />
          </Field>
        </div>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            className="h-10 bg-muted/50"
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
        </Field>
        <Field
          label="Confirm Password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirmPassword"
            className="h-10 bg-muted/50"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
        </Field>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 h-11 w-full gap-2 rounded-xl bg-linear-to-r from-primary to-primary-hover text-body-base font-semibold text-primary-fg shadow-lg shadow-primary/30 hover:-translate-y-0.5"
        >
          {isSubmitting ? (
            "Sending..."
          ) : (
            <>
              Send Verification OTP <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
