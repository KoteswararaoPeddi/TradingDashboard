import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Trade, TradeSide, TradeStatus } from "@prisma/client";

import { toNullableNumber, toNumber } from "../../../common/money";

/** Output contract for a trade. */
export class TradeEntity {
  @ApiProperty({ example: "clx8k2p9c0001abcd1234efgh" })
  id!: string;

  @ApiProperty({ example: "clx8k2p9c0000abcd1234efgh" })
  accountId!: string;

  @ApiProperty({ example: "BTCUSD" })
  symbol!: string;

  @ApiProperty({ enum: TradeSide, example: TradeSide.LONG })
  side!: TradeSide;

  @ApiPropertyOptional({
    example: "1/1",
    description: 'Requested/filled pair, kept as text (e.g. "0.25/0.25").',
  })
  size!: string | null;

  @ApiPropertyOptional({ example: 65258.9 })
  entryPrice!: number | null;

  @ApiPropertyOptional({ example: 65295.42 })
  exitPrice!: number | null;

  @ApiProperty({ example: 36.52, description: "P&L before fees." })
  grossPnl!: number;

  @ApiProperty({ example: 36.52, description: "P&L after fees. Drives every metric." })
  netPnl!: number;

  @ApiProperty({ example: 0, description: "Total of the open/close fee pair." })
  fees!: number;

  @ApiPropertyOptional({ example: "2026-07-15T17:27:23.000Z" })
  openedAt!: Date | null;

  @ApiProperty({ example: "2026-07-15T18:01:35.000Z" })
  closedAt!: Date;

  @ApiPropertyOptional({ example: "#1598342621" })
  ticket!: string | null;

  @ApiProperty({ enum: TradeStatus, example: TradeStatus.CLOSED })
  status!: TradeStatus;

  @ApiProperty({ example: "2026-07-16T09:17:17.000Z" })
  createdAt!: Date;

  /** Explicit output mapping — the response shape never drifts with the DB row. */
  static from(t: Trade): TradeEntity {
    return {
      id: t.id,
      accountId: t.accountId,
      symbol: t.symbol,
      side: t.side,
      size: t.size,
      entryPrice: toNullableNumber(t.entryPrice),
      exitPrice: toNullableNumber(t.exitPrice),
      grossPnl: toNumber(t.grossPnl),
      netPnl: toNumber(t.netPnl),
      fees: toNumber(t.fees),
      openedAt: t.openedAt,
      closedAt: t.closedAt,
      ticket: t.ticket,
      status: t.status,
      createdAt: t.createdAt,
    };
  }
}

/**
 * A trade as it appears in the paginated table: the trade fields plus the two
 * account-level values the table shows — its position in the full history and the
 * running balance after it. These are computed server-side over the whole set
 * (not the page), so they stay correct no matter which page is requested.
 */
export class TradeRowEntity extends TradeEntity {
  @ApiProperty({ example: 18, description: "1-based position in the account's full history." })
  index!: number;

  @ApiProperty({ example: 1166.4, description: "Account balance immediately after this trade." })
  balanceAfter!: number;

  @ApiPropertyOptional({ example: "34m 12s", description: "Hold time, or null if open time unknown." })
  holdTime!: string | null;
}

/** One page of trades. Becomes the `data` of the GET /trades envelope. */
export class PaginatedTrades {
  @ApiProperty({ type: [TradeRowEntity] })
  items!: TradeRowEntity[];

  @ApiProperty({ example: 1, description: "1-based page number." })
  page!: number;

  @ApiProperty({ example: 50, description: "Rows per page." })
  limit!: number;

  @ApiProperty({ example: 256, description: "Total rows matching the filters (all pages)." })
  total!: number;

  @ApiProperty({ example: 6, description: "Total pages at this limit." })
  totalPages!: number;

  @ApiProperty({ example: 300, description: "Trades in the whole account (unfiltered) — empty-state test." })
  accountTradeCount!: number;
}
