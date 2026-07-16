import axiosInstance from "@lib/axios.config"
import type { ApiResponse } from "@shared/types/api-response"
import type { AuthUser } from "@shared/types/auth.types"

export async function updateProfile(input: {
  name?: string
  email?: string
}): Promise<AuthUser> {
  const res = await axiosInstance.patch<ApiResponse<AuthUser>>("/users/me", input)
  return res.data.data
}

export async function changePassword(input: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  await axiosInstance.post("/users/me/password", input)
}
