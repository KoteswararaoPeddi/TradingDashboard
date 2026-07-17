import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

import { TradeFilterQueryDto } from "./trade-filter.dto";

/**
 * Query for GET /api/trades — the shared filter contract plus pagination.
 *
 * The full filtered set is still enriched server-side (so the running balance and
 * global index are correct), then only the requested page crosses the wire. That
 * is the payload win: analytics needs every row, but the table never ships more
 * than one page of them.
 */
export class FindTradesDto extends TradeFilterQueryDto {
  @ApiPropertyOptional({ description: "1-based page number.", default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: "Rows per page.", default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
