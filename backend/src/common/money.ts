/**
 * Coerce a money column to a plain JS number at the Prisma boundary.
 *
 * The schema is mid-migration between Float and Decimal, so a money field may come
 * back as a number (Float) or a Prisma.Decimal (Decimal). All analytics arithmetic
 * runs on plain numbers, so every value is normalised here on the way out of the
 * DB — `Number()` handles a number as-is and a Decimal via its string value.
 *
 * At a personal journal's scale, number precision is not a concern; the reason to
 * normalise (rather than compute on Decimal) is to keep one calculation path that
 * the 43-check oracle can pin.
 */
export function toNumber(value: number | { toString(): string } | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value.toString());
}

/** Same coercion but preserves null (for optional prices). */
export function toNullableNumber(
  value: number | { toString(): string } | null | undefined,
): number | null {
  return value == null ? null : toNumber(value);
}
