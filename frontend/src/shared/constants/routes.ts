/**
 * Every route in the app. Route paths are authoritative values, so they live in
 * constants and are referenced by the nav config rather than typed as literals at
 * each `<Link>`.
 */
export const ROUTES = {
  dashboard: "/dashboard",
  analytics: "/analytics",
  trades: "/trades",
  calendar: "/calendar",
  settings: "/settings",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
