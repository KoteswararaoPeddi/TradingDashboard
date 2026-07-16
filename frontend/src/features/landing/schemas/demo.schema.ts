import { z } from "zod"

// Book-a-demo lead form. Mirrors the backend CreateDemoRequestDto.
export const demoSchema = z.object({
  fullName: z.string().min(1, "Your name is required").max(120),
  hospitalName: z.string().min(1, "Hospital name is required").max(160),
  contactNumber: z
    .string()
    .min(7, "Enter a valid contact number")
    .max(30, "Contact number is too long"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  hospitalAddress: z.string().min(1, "Hospital address is required").max(240),
  preferredDate: z.string().min(1, "Choose a preferred date"),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a preferred time"),
})

export type DemoValues = z.infer<typeof demoSchema>
