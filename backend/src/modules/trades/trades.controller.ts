import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";

import { CreateTradeDto } from "./dto/create-trade.dto";
import { FindTradesDto } from "./dto/find-trades.dto";
import { UpdateTradeDto } from "./dto/update-trade.dto";
import { PaginatedTrades, TradeEntity } from "./entities/trade.entity";
import { TradesService } from "./trades.service";

const TRADE_EXAMPLE = {
  id: "clx8k2p9c0001abcd1234efgh",
  accountId: "clx8k2p9c0000abcd1234efgh",
  symbol: "BTCUSD",
  side: "LONG",
  size: "1/1",
  entryPrice: 65258.9,
  exitPrice: 65295.42,
  grossPnl: 36.52,
  netPnl: 36.52,
  fees: 0,
  openedAt: "2026-07-15T17:27:23.000Z",
  closedAt: "2026-07-15T18:01:35.000Z",
  ticket: "#1598342621",
  status: "CLOSED",
  createdAt: "2026-07-16T09:17:17.000Z",
};

@ApiTags("trades")
@Controller("trades")
export class TradesController {
  constructor(private readonly trades: TradesService) {}

  @ApiOperation({
    summary: "List trades (filtered, paginated)",
    description:
      "Returns one page of trades matching the filters, each carrying its global index and " +
      "running balance. Analytics live at GET /analytics; this endpoint only feeds the table.",
  })
  // The global ResponseInterceptor wraps handler returns, so the example shows the envelope.
  @ApiOkResponse({
    description: "A page of trades matching the filters.",
    schema: {
      example: {
        success: true,
        message: "OK",
        data: { items: [{ ...TRADE_EXAMPLE, index: 1, balanceAfter: 1036.52 }], page: 1, limit: 50, total: 1, totalPages: 1 },
      },
    },
  })
  @ApiNotFoundResponse({
    description: "The requested accountId does not exist.",
    schema: { example: { success: false, message: 'No trading account with id "abc".' } },
  })
  @Get()
  async findAll(@Query() query: FindTradesDto): Promise<{ message: string; data: PaginatedTrades }> {
    return { message: "OK", data: await this.trades.findAll(query) };
  }

  @ApiOperation({
    summary: "Add a trade",
    description:
      "P&L is entered, not derived. Only symbol, side, netPnl and closedAt are required — " +
      "the rest is display detail for the trades table.",
  })
  @ApiCreatedResponse({
    description: "The created trade.",
    schema: { example: { success: true, message: "Trade added.", data: TRADE_EXAMPLE } },
  })
  @ApiNotFoundResponse({
    description: "The accountId does not exist.",
    schema: { example: { success: false, message: 'No trading account with id "abc".' } },
  })
  @ApiConflictResponse({
    description: "That ticket already exists on this account.",
    schema: { example: { success: false, message: "That value is already in use." } },
  })
  @Post()
  async create(@Body() dto: CreateTradeDto): Promise<{ message: string; data: TradeEntity }> {
    return { message: "Trade added.", data: TradeEntity.from(await this.trades.create(dto)) };
  }

  @ApiOperation({
    summary: "Edit a trade",
    description: "A trade's account is fixed at creation, so accountId cannot be patched.",
  })
  @ApiParam({ name: "id", description: "Trade id (cuid)." })
  @ApiOkResponse({
    description: "The updated trade.",
    schema: { example: { success: true, message: "Trade updated.", data: TRADE_EXAMPLE } },
  })
  @ApiNotFoundResponse({
    description: "No trade with that id.",
    schema: { example: { success: false, message: 'No trade with id "abc".' } },
  })
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateTradeDto,
  ): Promise<{ message: string; data: TradeEntity }> {
    return { message: "Trade updated.", data: TradeEntity.from(await this.trades.update(id, dto)) };
  }

  @ApiOperation({ summary: "Delete a trade" })
  @ApiParam({ name: "id", description: "Trade id (cuid)." })
  @ApiOkResponse({
    description: "The deleted trade.",
    schema: { example: { success: true, message: "Trade deleted.", data: TRADE_EXAMPLE } },
  })
  @ApiNotFoundResponse({
    description: "No trade with that id.",
    schema: { example: { success: false, message: 'No trade with id "abc".' } },
  })
  @Delete(":id")
  async remove(@Param("id") id: string): Promise<{ message: string; data: TradeEntity }> {
    return { message: "Trade deleted.", data: TradeEntity.from(await this.trades.remove(id)) };
  }
}
