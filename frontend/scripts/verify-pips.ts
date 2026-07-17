/**
 * Verifies lib/trade-fields.ts against the reference dataset.
 *
 * The data makes this checkable rather than a matter of opinion: every seed row
 * has zero fees, so netPnl is exactly the price move times the filled size.
 * Pips being the raw, unscaled move, that means
 *
 *     pips x filledSize == |netPnl|
 *
 * must hold for all 18 rows. If the subtraction is inverted, scaled, or the
 * absolute value is dropped, this identity breaks immediately.
 *
 * Run: npx tsx scripts/verify-pips.ts
 */
import { DESIGN_TRADES } from "../../backend/prisma/seed-data";
import { filledSize, tradePips } from "../src/features/dashboard/lib/trade-fields";
import { formatPips } from "../src/shared/lib/format";
import type { Trade, TradeSide } from "../src/features/dashboard/types/trade.types";

function toTrade(row: (typeof DESIGN_TRADES)[number], i: number): Trade {
  return {
    id: `t${i}`,
    accountId: "acc",
    symbol: row.symbol,
    side: row.side as TradeSide,
    size: row.size,
    entryPrice: row.entryPrice,
    exitPrice: row.exitPrice,
    grossPnl: row.pnl,
    netPnl: row.netPnl,
    fees: 0,
    openedAt: `${row.openDate.replace(" ", "T")}Z`,
    closedAt: `${row.date.replace(" ", "T")}Z`,
    ticket: row.ticket,
    status: "CLOSED",
    createdAt: `${row.date.replace(" ", "T")}Z`,
  };
}

/** The app's own filledSize, as a number — so the identity below tests the shipped code. */
function filled(size: string | null): number {
  return Number(filledSize(size) ?? 0);
}

const trades = DESIGN_TRADES.map(toTrade);
let failed = 0;

function check(label: string, actual: string | number, expected: string | number): void {
  const ok = String(actual) === String(expected);
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(36)} ${String(actual).padEnd(10)} expected ${expected}`);
}

console.log("--- pips x size == |netPnl|, for every seed row ---");
let broken = 0;
for (const trade of trades) {
  const pips = tradePips(trade);
  if (pips === null) {
    console.log(`FAIL  ${trade.ticket} produced no pips`);
    broken++;
    continue;
  }
  const implied = pips * filled(trade.size);
  // Cent-level tolerance: the source rows are rounded to 2dp.
  if (Math.abs(implied - Math.abs(trade.netPnl)) > 0.01) {
    console.log(`FAIL  ${trade.ticket}: ${pips.toFixed(2)} x ${filled(trade.size)} = ${implied.toFixed(2)}, |netPnl| ${Math.abs(trade.netPnl)}`);
    broken++;
  }
}
failed += broken;
check("rows failing the identity", broken, 0);
check("rows checked", trades.length, 18);

console.log("\n--- it is a raw distance: unscaled, unsigned ---");
// Ties out to the Entry/Exit columns by plain subtraction, in both directions.
const long = trades.find((t) => t.side === "LONG" && t.exitPrice! > t.entryPrice!)!;
const longLoser = trades.find((t) => t.side === "LONG" && t.exitPrice! < t.entryPrice!)!;
const short = trades.find((t) => t.side === "SHORT" && t.exitPrice! < t.entryPrice!)!;
check("== |exit - entry| exactly", String(trades.every((t) => tradePips(t) === Math.abs(t.exitPrice! - t.entryPrice!))), "true");
check("never negative", String(trades.every((t) => tradePips(t)! >= 0)), "true");
check("winning long is positive", tradePips(long)! > 0 ? "positive" : "negative", "positive");
check("losing long is positive too", tradePips(longLoser)! > 0 ? "positive" : "negative", "positive");
check("winning short is positive", tradePips(short)! > 0 ? "positive" : "negative", "positive");
// The whole point of dropping the sign: direction never enters the maths.
const flipped: Trade = { ...long, side: "SHORT" };
check("side does not change it", String(tradePips(flipped) === tradePips(long)), "true");

console.log("\n--- unknown fills are null, never zero ---");
check("liquidation still gets pips", String(tradePips({ ...trades[0], side: "LIQUIDATION" }) !== null), "true");
check("missing exit -> null", String(tradePips({ ...trades[0], exitPrice: null })), "null");
check("missing entry -> null", String(tradePips({ ...trades[0], entryPrice: null })), "null");

console.log("\n--- formatting carries no sign or currency ---");
check("formatPips(36.52)", formatPips(36.52), "36.5");
check("formatPips(331.75)", formatPips(331.75), "331.8");
check("no + or - in output", String(trades.every((t) => !/[+-]/.test(formatPips(tradePips(t)!)))), "true");
check("no currency in output", String(trades.every((t) => !/[$,]/.test(formatPips(tradePips(t)!)))), "true");

console.log("\n--- size shows one value: the filled half ---");
check("0.25/0.25 -> 0.25", String(filledSize("0.25/0.25")), "0.25");
check("1/1 -> 1", String(filledSize("1/1")), "1");
check("plain 1 survives", String(filledSize("1")), "1");
// A partial fill is the case the pair exists for: show what actually traded.
check("partial 1/0.4 -> 0.4", String(filledSize("1/0.4")), "0.4");
check("null -> null", String(filledSize(null)), "null");
check("empty -> null", String(filledSize("")), "null");
check("no slashes left anywhere", String(trades.every((t) => !filledSize(t.size)?.includes("/"))), "true");
// The filled figure must be the one the money agrees with, which the identity
// above already proves row by row.
check("filled size is numeric", String(trades.every((t) => Number.isFinite(filled(t.size)) && filled(t.size) > 0)), "true");

console.log("\n--- readout ---");
for (const t of [...trades].sort((a, b) => tradePips(b)! - tradePips(a)!).slice(0, 4)) {
  console.log(`  ${t.side.padEnd(5)} ${String(t.entryPrice).padStart(9)} -> ${String(t.exitPrice).padEnd(9)} ${formatPips(tradePips(t)!).padStart(6)} pips  size ${String(t.size).padEnd(11)} $${t.netPnl}`);
}

console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) FAILED.`);
process.exit(failed === 0 ? 0 : 1);
