import axiosInstance from "@lib/axios.config"
import type { ApiResponse } from "@shared/types/api-response"
import type { DemoValues } from "../schemas/demo.schema"

// Public "Book a demo" lead submission → persists on the backend + notifies the team.
export async function requestDemo(input: DemoValues): Promise<{ id: string }> {
  const res = await axiosInstance.post<ApiResponse<{ id: string }>>("/demo-requests", input)
  return res.data.data
}
