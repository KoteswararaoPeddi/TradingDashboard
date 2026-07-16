import { Controller, Get, Query } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { FindTradesDto } from "./dto/find-trades.dto";
import { TradeEntity } from "./entities/trade.entity";
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
    summary: "List trades",
    description:
      "Returns raw trades, oldest close first. Metrics (equity curve, win rate, drawdown, " +
      "profit factor) are derived by the client from this set, not by the API.",
  })
  // The global ResponseInterceptor wraps handler returns, so the example shows the envelope.
  @ApiOkResponse({
    description: "Trades for the requested account.",
    schema: { example: { success: true, message: "OK", data: [TRADE_EXAMPLE] } },
  })
  @ApiNotFoundResponse({
    description: "The requested accountId does not exist.",
    schema: { example: { success: false, message: 'No trading account with id "abc".' } },
  })
  @Get()
  async findAll(@Query() query: FindTradesDto): Promise<{ message: string; data: TradeEntity[] }> {
    const data = (await this.trades.findAll(query)) as TradeEntity[];
    return { message: "OK", data };
  }
}
