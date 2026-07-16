import { ApiProperty } from "@nestjs/swagger";

/** Output contract for a trading account. */
export class AccountEntity {
  @ApiProperty({ example: "clx8k2p9c0000abcd1234efgh" })
  id!: string;

  @ApiProperty({ example: "Live Account" })
  label!: string;

  @ApiProperty({ example: "110920" })
  accountNumber!: string;

  @ApiProperty({ example: 1000, description: "Balance the equity curve starts from." })
  startingBalance!: number;

  @ApiProperty({ example: "USD" })
  currency!: string;

  @ApiProperty({ example: "2026-07-16T09:17:17.000Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2026-07-16T09:17:17.000Z" })
  updatedAt!: Date;
}
