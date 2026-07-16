"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { Card, CardContent } from "@components/ui/card"
import { Typography } from "@components/ui/typography"
import { SignupStepper } from "./signup/SignupStepper"
import { HospitalDetailsStep } from "./signup/HospitalDetailsStep"
import { OtpStep } from "./signup/OtpStep"
import type { SignupRequest } from "../api/auth.service"

/** Two-step hospital signup: details → OTP verification. */
export function SignupWizard() {
  const [step, setStep] = useState<"details" | "otp">("details")
  const [data, setData] = useState<SignupRequest | null>(null)

  return (
    <div className="w-full max-w-2xl">
      <div className="flex flex-col items-center gap-4">
        <Link href="/" aria-label="MediNex+ home">
          <Image
            src="/medinexplus-logo-normal.png"
            alt="MediNex+"
            width={1045}
            height={199}
            priority
            className="h-9 w-auto"
          />
        </Link>
        <SignupStepper step={step} />
      </div>

      <Card className="mt-4 rounded-2xl shadow-xl">
        <CardContent className="p-5 sm:p-6">
          {step === "details" ? (
            <>
              <HospitalDetailsStep
                defaults={data}
                onSent={(d) => {
                  setData(d)
                  setStep("otp")
                }}
              />
              <Typography
                variant="body-base"
                className="mt-5 text-center text-muted-foreground"
              >
                Already registered?{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Sign In
                </Link>
                {" · "}
                <Link href="/" className="font-semibold text-primary hover:underline">
                  Back to Home
                </Link>
              </Typography>
            </>
          ) : (
            data && <OtpStep email={data.email} onBack={() => setStep("details")} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
