import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

/**
 * Query for GET /api/trades.
 *
 * Only account scoping and sort live on the server. The dashboard's own filters
 * (symbol, direction, result, date range, P&L window) are applied client-side over
 * the full set, because every panel recomputes from the same in-memory trade list.
 */
export class FindTradesDto {
  @ApiPropertyOptional({
    description: "Restrict to one trading account. Omit to return every trade.",
    example: "clx8k2p9c0000abcd1234efgh",
  })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({
    description: "Order by close time.",
    enum: ["asc", "desc"],
    default: "asc",
  })
  @IsOptional()
  @IsIn(["asc", "desc"])
  order?: "asc" | "desc";
}
