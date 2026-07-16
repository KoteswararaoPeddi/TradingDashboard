// Shared className strings for the landing page's marketing CTAs (token-driven, no hex).
// Kept in one place so every CTA across sections stays consistent.

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer text-body-base"

/** Solid violet gradient — the primary marketing action. */
export const ctaPrimary = `${base} bg-linear-to-br from-primary to-primary-hover px-6 py-2.5 text-primary-fg shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-primary/40`

/** Quiet pill — secondary action on light surfaces. */
export const ctaOutline = `${base} rounded-full border-[1.5px] border-primary/20 bg-surface/90 px-6 py-2.5 font-medium text-foreground backdrop-blur hover:-translate-y-0.5 hover:border-primary hover:text-primary`

/** Small violet-outline button — the nav "Sign in". */
export const ctaGhost = `${base} border-[1.5px] border-primary/30 px-5 py-2 text-primary hover:border-primary hover:bg-primary-subtle`

/** Red trial button. */
export const ctaTrial = `${base} bg-danger px-5 py-2 text-primary-fg hover:-translate-y-0.5 hover:bg-danger-hover`
