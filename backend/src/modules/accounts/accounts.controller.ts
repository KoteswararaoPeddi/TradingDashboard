import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { TradingAccount } from "@prisma/client";

import { AccountsService } from "./accounts.service";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { AccountEntity } from "./entities/account.entity";

const ACCOUNT_EXAMPLE = {
  id: "clx8k2p9c0000abcd1234efgh",
  label: "My Trading Account",
  accountNumber: "primary",
  startingBalance: 1000,
  currency: "USD",
  createdAt: "2026-07-16T09:17:17.000Z",
  updatedAt: "2026-07-16T09:17:17.000Z",
};

/**
 * The journal's account.
 *
 * There is deliberately **no POST**: this is a single-user journal, so the
 * account is a singleton the service creates on boot, not something the user
 * authors. It exists only to carry the starting balance the equity curve is
 * measured from — which is why the only write here is the Settings PATCH.
 */
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

  @ApiOperation({
    summary: "Update journal settings",
    description:
      "Backs the Settings page. Changing `startingBalance` re-bases every metric derived from " +
      "the equity curve — it is the one number the trades themselves cannot supply.",
  })
  @ApiParam({ name: "id", description: "Trading account id (cuid)." })
  @ApiOkResponse({
    description: "The updated trading account.",
    schema: { example: { success: true, message: "Settings saved.", data: ACCOUNT_EXAMPLE } },
  })
  @ApiNotFoundResponse({
    description: "No account with that id.",
    schema: { example: { success: false, message: 'No trading account with id "abc".' } },
  })
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<{ message: string; data: TradingAccount }> {
    return { message: "Settings saved.", data: await this.accounts.update(id, dto) };
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
