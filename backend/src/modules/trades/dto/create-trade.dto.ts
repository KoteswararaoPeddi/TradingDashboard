import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TradeSide, TradeStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

/**
 * Body for POST /api/trades.
 *
 * Required fields are exactly the ones the analytics depend on: `lib/metrics.ts`
 * reads only `symbol`, `side`, `netPnl`, `closedAt` and `openedAt`. Everything
 * else is display detail on the trades table, so it stays optional — a journal
 * should not refuse a trade because the user did not record their fill price.
 *
 * P&L is entered, never derived: `size` is a free-form string ("1/1") and
 * contract multipliers vary by instrument, so computing it from entry/exit would
 * quietly produce wrong numbers.
 *
 * With no auth layer this DTO is the only guard on what enters the system
 * (see context/architecture.md), so every field is constrained, not just typed.
 */
export class CreateTradeDto {
  @ApiPropertyOptional({
    description:
      "Account the trade belongs to. Omit it — this journal has one account and the server " +
      "resolves it. Only honoured if you genuinely have more than one. Unknown ids give a 404.",
    example: "clx8k2p9c0000abcd1234efgh",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accountId?: string;

  @ApiProperty({ description: "Instrument traded.", example: "BTCUSD" })
  // Normalised so "btcusd" and "BTCUSD" cannot split one instrument into two
  // rows on the asset leaderboard.
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  symbol!: string;

  @ApiProperty({ enum: TradeSide, description: "Direction.", example: TradeSide.LONG })
  @IsEnum(TradeSide)
  side!: TradeSide;

  @ApiProperty({
    description:
      "Net profit/loss after fees — the number every metric is built from. Negative for a loss.",
    example: 36.52,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  netPnl!: number;

  @ApiProperty({
    description: "Close time, ISO-8601. Drives the equity curve order and the hour/weekday buckets.",
    example: "2026-07-15T18:01:35.000Z",
  })
  @IsDateString()
  closedAt!: string;

  @ApiPropertyOptional({ description: "Open time, ISO-8601.", example: "2026-07-15T17:27:23.000Z" })
  @IsOptional()
  @IsDateString()
  openedAt?: string;

  @ApiPropertyOptional({
    description: "Free-form requested/filled pair, e.g. “1/1”.",
    example: "1/1",
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  size?: string;

  @ApiPropertyOptional({ description: "Entry fill price.", example: 65258.9 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  entryPrice?: number;

  @ApiPropertyOptional({ description: "Exit fill price.", example: 65295.42 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exitPrice?: number;

  @ApiPropertyOptional({ description: "Total fees. Defaults to 0.", example: 0, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fees?: number;

  @ApiPropertyOptional({
    description: "P&L before fees. Derived as netPnl + fees when omitted.",
    example: 36.52,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  grossPnl?: number;

  @ApiPropertyOptional({
    description: "Broker ticket. Unique per account, which makes re-importing idempotent.",
    example: "#1598342621",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  ticket?: string;

  @ApiPropertyOptional({ enum: TradeStatus, default: TradeStatus.CLOSED })
  @IsOptional()
  @IsEnum(TradeStatus)
  status?: TradeStatus;
}
