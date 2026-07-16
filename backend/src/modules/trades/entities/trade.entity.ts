import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TradeSide, TradeStatus } from "@prisma/client";

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
}
