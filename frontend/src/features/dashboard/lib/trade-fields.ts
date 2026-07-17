/**
 * Raw trade fields read into the values the table shows.
 *
 * Kept out of the components so both trade tables and the verify scripts read
 * one implementation — and so the arithmetic can be checked without a browser.
 */
import type { Trade } from "../types/trade.types";

/**
 * The size that actually traded, from a broker's "requested/filled" pair.
 *
 * The raw field is a string like "0.25/0.25" — what was asked for, then what the
 * broker actually filled. Only the second half is real: on a partial fill the
 * two differ, and the requested figure describes an intention, not a position.
 * P&L is computed off the filled size, so showing anything else would print a
 * number the money on the row disagrees with.
 *
 * Tolerates a plain "1" (hand-entered trades carry no pair) and returns null
 * when there is nothing to show.
 */
export function filledSize(size: string | null): string | null {
  if (!size) return null;

  const filled = size.includes("/") ? size.slice(size.lastIndexOf("/") + 1) : size;
  return filled.trim() || null;
}

/**
 * How far price travelled between entry and exit, in pips.
 *
 * The raw price distance — no pip-size conversion, no currency, no sign. BTCUSD
 * moving 65258.90 → 65295.42 is 36.5. Because nothing is scaled, the figure
 * ties back to the Entry and Exit columns by subtraction, which is what lets a
 * reader check it at a glance.
 *
 * Unsigned on purpose, and it buys two things. Direction and outcome already
 * have columns (Type, P&L), so a sign here would only restate them. And a
 * distance needs no direction, so a `LIQUIDATION` — whose recorded side carries
 * no direction to sign a move with — still gets a real number instead of a blank.
 */
export function tradePips(trade: Trade): number | null {
  // Null, never 0: a trade with no recorded fill did not travel zero pips, we
  // simply do not know how far it travelled.
  if (trade.entryPrice === null || trade.exitPrice === null) return null;

  return Math.abs(trade.exitPrice - trade.entryPrice);
}
