import { Injectable } from "@nestjs/common";

import { toNumber } from "../../common/money";
import { PrismaService } from "../../prisma/prisma.service";
import { AccountsService } from "../accounts/accounts.service";
import { TradeEntity } from "../trades/entities/trade.entity";
import { enrichTrades, filterTrades, tradeDateRange, tradeSymbols } from "../trades/trades.logic";
import { calculateAnalytics, TradeAnalytics } from "./analytics.calculator";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";

/**
 * The full dashboard payload for one filter selection.
 *
 * `range` and `symbols` are computed over the *whole* account (not the filtered
 * set), because they seed the filter controls themselves — the asset dropdown
 * must list every symbol, and the date inputs must span all history, regardless
 * of what is currently filtered.
 */
export interface AnalyticsResult extends TradeAnalytics {
  /** Full-account date span, "YYYY-MM-DD", for seeding the date inputs. */
  range: { from: string; to: string };
  /** Every symbol the account has traded, for the asset select. */
  symbols: string[];
  /** Trades in the whole account (unfiltered) — the "X of Y" denominator and empty-state test. */
  accountTradeCount: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountsService,
  ) {}

  /**
   * Compute the analytics bundle for the filtered set.
   *
   * The whole account is fetched and enriched once (running balance / index need
   * full history), then the filter narrows it and the calculator derives every
   * panel. This is the server-side replacement for what the browser used to do —
   * the client now receives ready-to-render numbers.
   */
  async getAnalytics(query: AnalyticsQueryDto): Promise<AnalyticsResult> {
    const account = query.accountId
      ? await this.accounts.findOne(query.accountId)
      : await this.accounts.getDefault();

    const rows = await this.prisma.trade.findMany({ where: { accountId: account.id } });
    const enriched = enrichTrades(rows.map(TradeEntity.from), toNumber(account.startingBalance));

    const filtered = filterTrades(enriched, query);
    const analytics = calculateAnalytics(filtered, toNumber(account.startingBalance));

    return {
      ...analytics,
      range: tradeDateRange(enriched),
      symbols: tradeSymbols(enriched),
      accountTradeCount: enriched.length,
    };
  }
}
