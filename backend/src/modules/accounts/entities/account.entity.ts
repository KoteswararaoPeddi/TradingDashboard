import { ApiProperty } from "@nestjs/swagger";
import { TradingAccount } from "@prisma/client";

import { toNumber } from "../../../common/money";

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

  /** Explicit output mapping — the response shape never drifts with the DB row. */
  static from(a: TradingAccount): AccountEntity {
    return {
      id: a.id,
      label: a.label,
      accountNumber: a.accountNumber,
      startingBalance: toNumber(a.startingBalance),
      currency: a.currency,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }
}
