import { z } from "zod";

/**
 * The journal's settings form — the single source of truth for its rules.
 *
 * Mirrors the API's `UpdateAccountDto`. There is no create counterpart: the
 * account is a singleton the API provisions on boot, so it is only ever adjusted.
 */
export const settingsSchema = z.object({
  startingBalance: z.coerce
    .number({ message: "Enter a number." })
    .min(0, "Cannot be negative.")
    // Money, so cents are the floor. Checked on the decimal string rather than
    // with modulo: 1000.1 * 100 is 100010.00000000001 in binary floating point,
    // which would reject a perfectly valid figure.
    .refine((n) => (n.toString().split(".")[1]?.length ?? 0) <= 2, "At most 2 decimal places."),
  currency: z
    .string()
    .trim()
    .length(3, "Use a 3-letter code, e.g. USD")
    // Normalised so "usd" and "USD" cannot become two different currencies.
    .transform((s) => s.toUpperCase()),
});

export type SettingsValues = z.input<typeof settingsSchema>;
