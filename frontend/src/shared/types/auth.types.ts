// The authenticated user shape the API returns (never includes passwordHash /
// hashedRefreshToken). Cross-cutting — used by the auth store, service, and UI.
export type UserRole =
  | "SUPER_ADMIN"
  | "HOSPITAL_ADMIN"
  | "DOCTOR"
  | "STAFF"
  | "PATIENT"

export type AuthUser = {
  id: string
  email: string
  name: string
  role: UserRole
  hospitalId: string
}
