import axiosInstance from "@lib/axios.config"
import type { ApiResponse } from "@shared/types/api-response"
import type { AuthUser } from "@shared/types/auth.types"

type Credentials = { email: string; password: string }

// All calls ride the shared axios instance (withCredentials → httpOnly cookies).
// Services return unwrapped, typed domain data.

export type SignupRequest = {
  hospitalName: string
  adminName: string
  email: string
  phone: string
  password: string
}

// Step 1 — validate details + email a 6-digit OTP to the admin.
export async function requestSignupOtp(input: SignupRequest): Promise<{ email: string }> {
  const res = await axiosInstance.post<ApiResponse<{ email: string }>>(
    "/auth/signup/request-otp",
    input,
  )
  return res.data.data
}

// Resend the code for a pending signup.
export async function resendSignupOtp(email: string): Promise<{ email: string }> {
  const res = await axiosInstance.post<ApiResponse<{ email: string }>>(
    "/auth/signup/resend-otp",
    { email },
  )
  return res.data.data
}

// Step 2 — verify the OTP; creates Hospital + admin User and sets the session cookie.
export async function verifySignupOtp(input: { email: string; otp: string }): Promise<AuthUser> {
  const res = await axiosInstance.post<ApiResponse<AuthUser>>("/auth/signup/verify", input)
  return res.data.data
}

export async function login(input: Credentials): Promise<AuthUser> {
  const res = await axiosInstance.post<ApiResponse<AuthUser>>("/auth/login", input)
  return res.data.data
}

export async function logout(): Promise<void> {
  await axiosInstance.post("/auth/logout")
}

export async function getMe(): Promise<AuthUser> {
  const res = await axiosInstance.get<ApiResponse<AuthUser>>("/auth/me")
  return res.data.data
}
