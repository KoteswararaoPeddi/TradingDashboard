"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowDownRight } from "lucide-react"

import { Button } from "@components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog"
import { Field } from "@components/ui/field"
import { Input } from "@components/ui/input"
import { getErrorMessage } from "@lib/get-error-message"
import { useBookDemoStore } from "../../stores/book-demo.store"
import { demoSchema, type DemoValues } from "../../schemas/demo.schema"
import { requestDemo } from "../../api/demo.service"

const EMPTY: DemoValues = {
  fullName: "",
  hospitalName: "",
  contactNumber: "",
  email: "",
  hospitalAddress: "",
  preferredDate: "",
  preferredTime: "",
}

/** "Book a Personalized Demo" — one instance mounted on the landing page, opened from any CTA. */
export function BookDemoDialog() {
  const isOpen = useBookDemoStore((s) => s.isOpen)
  const setOpen = useBookDemoStore((s) => s.setOpen)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DemoValues>({
    resolver: zodResolver(demoSchema),
    defaultValues: EMPTY,
    mode: "onBlur",
  })

  const onSubmit = async (values: DemoValues) => {
    const toastId = toast.loading("Sending your request...")
    try {
      await requestDemo(values)
      toast.success("Demo requested — our team will reach out to confirm your slot", {
        id: toastId,
      })
      reset(EMPTY)
      setOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not send your request."), { id: toastId })
    }
  }

  const inputCls = "h-11 bg-surface"
  // Local calendar day (not UTC) — a demo can't be requested for a past date.
  const now = new Date()
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setOpen(open)
        if (!open) reset(EMPTY)
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92vh] flex-col gap-5 overflow-y-auto rounded-2xl p-6 sm:max-w-3xl sm:p-8"
      >
        <DialogHeader className="gap-2">
          <DialogTitle className="text-h3 font-extrabold tracking-tight text-foreground">
            Book a Personalized Demo
          </DialogTitle>
          <DialogDescription className="text-body-base leading-relaxed text-muted-foreground">
            See how MediNex+ can transform your hospital&apos;s operations. Fill out the form below
            and our experts will reach out to confirm your slot.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" htmlFor="d-fullName" error={errors.fullName?.message}>
              <Input id="d-fullName" autoComplete="name" className={inputCls} placeholder="Dr. John Doe" {...register("fullName")} />
            </Field>
            <Field label="Hospital/Clinic Name" htmlFor="d-hospitalName" error={errors.hospitalName?.message}>
              <Input id="d-hospitalName" autoComplete="organization" className={inputCls} placeholder="City General Hospital" {...register("hospitalName")} />
            </Field>
            <Field label="Contact Number" htmlFor="d-contactNumber" error={errors.contactNumber?.message}>
              <Input id="d-contactNumber" type="tel" autoComplete="tel" className={inputCls} placeholder="+91 98765 43210" {...register("contactNumber")} />
            </Field>
            <Field label="Email ID" htmlFor="d-email" error={errors.email?.message}>
              <Input id="d-email" type="email" autoComplete="email" className={inputCls} placeholder="john@hospital.com" {...register("email")} />
            </Field>
          </div>

          <Field label="Hospital Address" htmlFor="d-hospitalAddress" error={errors.hospitalAddress?.message}>
            <Input id="d-hospitalAddress" autoComplete="street-address" className={inputCls} placeholder="123 Health Ave, Mumbai" {...register("hospitalAddress")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preferred Date" htmlFor="d-preferredDate" error={errors.preferredDate?.message}>
              <Input id="d-preferredDate" type="date" min={todayLocal} className={inputCls} {...register("preferredDate")} />
            </Field>
            <Field label="Preferred Time" htmlFor="d-preferredTime" error={errors.preferredTime?.message}>
              <Input id="d-preferredTime" type="time" className={inputCls} {...register("preferredTime")} />
            </Field>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 h-12 w-full rounded-xl bg-linear-to-r from-primary to-primary-hover text-body-base font-semibold text-primary-fg shadow-lg shadow-primary/30 hover:-translate-y-0.5"
          >
            {isSubmitting ? "Sending..." : "Request Demo"}
          </Button>
        </form>

        {/* Rendered last so the first field — not this — receives initial focus. */}
        <DialogClose
          aria-label="Close"
          className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <ArrowDownRight className="size-4" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
