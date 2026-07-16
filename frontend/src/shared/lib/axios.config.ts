import axios, { AxiosError, AxiosResponse } from "axios"

// Plain axios instance for the open app — no auth cookies, no token refresh.
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const status = error.response?.status

    if (status === 403) {
      console.error("Forbidden")
    } else if (status && status >= 500) {
      console.error("Server error")
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
