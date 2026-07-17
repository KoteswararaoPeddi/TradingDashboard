import { PrismaClient, TradeSide, TradeStatus } from "@prisma/client";

import { DESIGN_ACCOUNT, DESIGN_TRADES, DesignTradeRow } from "./seed-data";

const prisma = new PrismaClient();

/**
 * The source rows carry wall-clock strings with no timezone ("2026-07-15 18:01:35").
 * We anchor them to UTC so the stored instant reads back as the same wall clock
 * everywhere. That matters because the dashboard groups trades by hour-of-day and
 * weekday: if we parsed them in the seeding machine's local zone, those buckets
 * would shift for any viewer in a different timezone, and the same trade would
 * appear in a different hour. The frontend reads these with UTC accessors.
 */
function toUtcInstant(wallClock: string): Date {
  return new Date(`${wallClock.replace(" ", "T")}Z`);
}

/** "0.00/0.00" is an open/close fee pair; the schema stores one numeric total. */
function totalFees(pair: string): number {
  return pair
    .split("/")
    .map((part) => Number.parseFloat(part.trim()))
    .reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
}

function toSide(side: string): TradeSide {
  const normalized = side.trim().toUpperCase();
  if (normalized === "LONG") return TradeSide.LONG;
  if (normalized === "SHORT") return TradeSide.SHORT;
  if (normalized === "LIQUIDATION") return TradeSide.LIQUIDATION;
  throw new Error(`Unrecognised trade side in seed data: "${side}"`);
}

function toStatus(status: string): TradeStatus {
  return status.trim().toUpperCase() === "OPEN" ? TradeStatus.OPEN : TradeStatus.CLOSED;
}

function toTradeData(row: DesignTradeRow, accountId: string) {
  return {
    accountId,
    symbol: row.symbol,
    side: toSide(row.side),
    size: row.size,
    entryPrice: row.entryPrice,
    exitPrice: row.exitPrice,
    // The source has no separate gross figure; pnl and netPnl are equal because fees are zero.
    grossPnl: row.pnl,
    netPnl: row.netPnl,
    fees: totalFees(row.fees),
    openedAt: toUtcInstant(row.openDate),
    closedAt: toUtcInstant(row.date),
    ticket: row.ticket,
    status: toStatus(row.status),
  };
}

async function main(): Promise<void> {
  // Idempotent: re-running must not duplicate rows or reset the account.
  const account = await prisma.tradingAccount.upsert({
    where: { accountNumber: DESIGN_ACCOUNT.accountNumber },
    update: {},
    create: DESIGN_ACCOUNT,
  });

  // `@@unique([accountId, ticket])` is what makes this safe to re-run.
  const results = await Promise.all(
    DESIGN_TRADES.map((row) => {
      const data = toTradeData(row, account.id);
      return prisma.trade.upsert({
        where: { accountId_ticket: { accountId: account.id, ticket: row.ticket } },
        update: data,
        create: data,
      });
    }),
  );

  // Money columns come back as Prisma.Decimal; coerce for the summary arithmetic.
  const num = (v: number | { toString(): string }): number => Number(v.toString());
  const netPnl = results.reduce((sum, trade) => sum + num(trade.netPnl), 0);
  const startingBalance = num(account.startingBalance);
  console.log(
    `Seeded account ${account.label} #${account.accountNumber} ` +
      `(starting balance ${startingBalance} ${account.currency})`,
  );
  console.log(
    `Seeded ${results.length} trades | net P&L ${netPnl.toFixed(2)} | ` +
      `closing balance ${(startingBalance + netPnl).toFixed(2)}`,
  );
}

main()
  .catch((error) => {
    console.error("[seed] failed:", error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
