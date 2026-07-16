import { Controller, Get, Param } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { TradingAccount } from "@prisma/client";

import { AccountsService } from "./accounts.service";
import { AccountEntity } from "./entities/account.entity";

const ACCOUNT_EXAMPLE = {
  id: "clx8k2p9c0000abcd1234efgh",
  label: "Live Account",
  accountNumber: "110920",
  startingBalance: 1000,
  currency: "USD",
  createdAt: "2026-07-16T09:17:17.000Z",
  updatedAt: "2026-07-16T09:17:17.000Z",
};

@ApiTags("accounts")
@Controller("accounts")
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @ApiOperation({
    summary: "List trading accounts",
    description: "Oldest first. The dashboard uses the first account returned.",
  })
  // The global ResponseInterceptor wraps handler returns, so the example shows the envelope.
  @ApiOkResponse({
    description: "All trading accounts.",
    schema: {
      example: { success: true, message: "OK", data: [ACCOUNT_EXAMPLE] },
    },
  })
  @Get()
  async findAll(): Promise<{ message: string; data: AccountEntity[] }> {
    const data = (await this.accounts.findAll()) as AccountEntity[];
    return { message: "OK", data };
  }

  @ApiOperation({ summary: "Get one trading account" })
  @ApiParam({ name: "id", description: "Trading account id (cuid)." })
  @ApiOkResponse({
    description: "The trading account.",
    schema: { example: { success: true, message: "OK", data: ACCOUNT_EXAMPLE } },
  })
  @ApiNotFoundResponse({
    description: "No account with that id.",
    schema: {
      example: { success: false, message: 'No trading account with id "abc".' },
    },
  })
  @Get(":id")
  async findOne(@Param("id") id: string): Promise<{ message: string; data: TradingAccount }> {
    return { message: "OK", data: await this.accounts.findOne(id) };
  }
}
