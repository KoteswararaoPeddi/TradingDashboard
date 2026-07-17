import { z } from "zod";

/**
 * Money fields accept cents at most.
 *
 * The decimal check runs on the string rather than with modulo: `1000.1 * 100` is
 * `100010.00000000001` in binary floating point, so a modulo test would reject a
 * perfectly valid figure.
 */
const money = (label: string) =>
  z.coerce
    .number({ message: `${label} must be a number.` })
    .refine((n) => (n.toString().split(".")[1]?.length ?? 0) <= 2, "At most 2 decimal places.");

/** An empty optional number input yields "", which must mean "unset", not 0. */
const optionalMoney = (label: string) =>
  z.union([z.literal(""), money(label).min(0, `${label} cannot be negative.`)]).optional();

/**
 * The add/edit trade form — the single source of truth for its rules.
 *
 * Mirrors the API's `CreateTradeDto`. Duplicating the rules client-side is not
 * redundancy: it turns a 400 round trip into an instant inline message, while the
 * DTO stays the real guard (the API is open, so it can never trust this).
 *
 * Only the fields `lib/metrics.ts` actually reads are required — a journal should
 * not refuse a trade because the user did not record their fill price. P&L is
 * entered, never derived: `size` is free-form ("1/1") and contract multipliers
 * vary by instrument, so computing it would quietly produce wrong numbers.
 */
export const tradeSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Required.")
    .max(20)
    // Normalised so "btcusd" and "BTCUSD" cannot split one instrument into two
    // rows on the asset leaderboard.
    .transform((s) => s.toUpperCase()),
  side: z.enum(["LONG", "SHORT", "LIQUIDATION"]),
  netPnl: money("P&L"),
  closedAt: z.string().min(1, "Required."),
  openedAt: z.string().optional(),
  size: z.string().trim().max(30).optional(),
  entryPrice: optionalMoney("Entry price"),
  exitPrice: optionalMoney("Exit price"),
  fees: optionalMoney("Fees"),
  ticket: z.string().trim().max(40).optional(),
});

export type TradeValues = z.input<typeof tradeSchema>;
