import { z } from "zod"

// Single source of truth for auth form validation; types are derived via z.infer.
// Mirrors the backend DTO rules (email + 8–72 char password).

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginValues = z.infer<typeof loginSchema>

// Step 1 — hospital + admin details. Mirrors the backend SignupRequestDto.
export const hospitalSignupSchema = z
  .object({
    hospitalName: z
      .string()
      .min(1, "Hospital name is required")
      .max(120, "Hospital name is too long"),
    adminName: z
      .string()
      .min(1, "Your name is required")
      .max(120, "Name is too long"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    phone: z
      .string()
      .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type HospitalSignupValues = z.infer<typeof hospitalSignupSchema>

// Step 2 — the 6-digit OTP.
export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
})

export type OtpValues = z.infer<typeof otpSchema>
