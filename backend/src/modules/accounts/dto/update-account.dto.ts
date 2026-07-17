import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Length, MaxLength, Min } from "class-validator";

/**
 * Body for PATCH /api/accounts/:id — the journal's settings.
 *
 * This journal is single-user and its one account is created automatically, so
 * there is no create DTO to derive from: an account is never authored, only
 * adjusted. That is also why `accountNumber` is absent — it is internal
 * bookkeeping the user has no reason to set.
 *
 * With no auth layer this DTO is the only guard on what enters the system
 * (see context/architecture.md), so every field is constrained, not just typed.
 */
export class UpdateAccountDto {
  @ApiPropertyOptional({
    description:
      "Balance the equity curve starts from. Changing it re-bases every metric derived from it.",
    example: 1000,
  })
  // maxDecimalPlaces guards against float noise like 1000.00000001 entering the ledger.
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  startingBalance?: number;

  @ApiPropertyOptional({ description: "Display label.", example: "Live Account" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  label?: string;

  @ApiPropertyOptional({ description: "ISO 4217 code.", example: "USD" })
  // Normalised so "usd" and "USD" cannot become two different currencies.
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
