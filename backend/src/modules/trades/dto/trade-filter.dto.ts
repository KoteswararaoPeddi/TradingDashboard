import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString, Matches } from "class-validator";

import type { DirectionFilter, ResultFilter, SortBy } from "../trades.logic";

const DIRECTIONS: DirectionFilter[] = ["ALL", "LONG", "SHORT", "LIQUIDATION"];
const RESULTS: ResultFilter[] = ["ALL", "PROFIT", "LOSS", "BREAKEVEN"];
const SORTS: SortBy[] = ["newest", "oldest", "highest", "lowest", "asset"];

/**
 * The filter contract shared by GET /trades and GET /analytics, so the paginated
 * table and the analytics bundle always describe the *same* set. Period chips and
 * quick-presets are resolved to concrete from/to/result on the client, so the
 * server only sees explicit bounds.
 *
 * Query params arrive as strings; `@Type(() => Number)` coerces the numeric ones.
 * With no auth this is the only guard on what enters, so each field is constrained.
 */
export class TradeFilterQueryDto {
  @ApiPropertyOptional({
    description: "Restrict to one account. Omit — the journal resolves its single account.",
    example: "clx8k2p9c0000abcd1234efgh",
  })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ description: "Case-insensitive symbol substring match.", example: "btc" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Exact symbol, or ALL.", example: "BTCUSD" })
  @IsOptional()
  @IsString()
  asset?: string;

  @ApiPropertyOptional({ enum: DIRECTIONS, default: "ALL" })
  @IsOptional()
  @IsIn(DIRECTIONS)
  direction?: DirectionFilter;

  @ApiPropertyOptional({ enum: RESULTS, default: "ALL" })
  @IsOptional()
  @IsIn(RESULTS)
  result?: ResultFilter;

  @ApiPropertyOptional({ description: "Inclusive lower day bound, YYYY-MM-DD.", example: "2026-07-08" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "from must be YYYY-MM-DD" })
  from?: string;

  @ApiPropertyOptional({ description: "Inclusive upper day bound, YYYY-MM-DD.", example: "2026-07-15" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "to must be YYYY-MM-DD" })
  to?: string;

  @ApiPropertyOptional({ description: "Inclusive min net P&L.", example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPnl?: number;

  @ApiPropertyOptional({ description: "Inclusive max net P&L.", example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPnl?: number;

  @ApiPropertyOptional({ enum: SORTS, default: "newest" })
  @IsOptional()
  @IsIn(SORTS)
  sortBy?: SortBy;
}
