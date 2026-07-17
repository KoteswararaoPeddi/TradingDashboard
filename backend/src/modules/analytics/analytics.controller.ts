import { Controller, Get, Query } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { AnalyticsService, AnalyticsResult } from "./analytics.service";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @ApiOperation({
    summary: "Dashboard analytics for the filtered set",
    description:
      "Returns the full, ready-to-render analytics bundle (win rate, profit factor, equity " +
      "curve, weekday/hourly/asset breakdowns, drawdown, streaks) computed server-side over the " +
      "trades matching the same filters as GET /trades. `range` and `symbols` cover the whole " +
      "account, to seed the filter controls. The frontend performs no calculation.",
  })
  @ApiOkResponse({
    description: "The analytics bundle.",
    schema: {
      example: {
        success: true,
        message: "OK",
        data: {
          totalTrades: 18,
          winRate: 50,
          profitFactor: 1.53,
          netProfit: 166.4,
          equity: 1166.4,
          maxDrawdown: 17.99,
          equityCurve: [{ label: "Start", equity: 1000 }],
          weekdayPnl: [{ day: "Mon", value: 12.3 }],
          assets: [{ symbol: "BTCUSD", pnl: 166.4, trades: 18, wins: 9, losses: 9, winRate: 50 }],
          range: { from: "2026-07-08", to: "2026-07-15" },
          symbols: ["BTCUSD"],
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: "The requested accountId does not exist.",
    schema: { example: { success: false, message: 'No trading account with id "abc".' } },
  })
  @Get()
  async get(@Query() query: AnalyticsQueryDto): Promise<{ message: string; data: AnalyticsResult }> {
    return { message: "OK", data: await this.analytics.getAnalytics(query) };
  }
}
