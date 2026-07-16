import { Injectable } from "@nestjs/common";
import { Trade } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { AccountsService } from "../accounts/accounts.service";
import { FindTradesDto } from "./dto/find-trades.dto";

@Injectable()
export class TradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountsService,
  ) {}

  async findAll(query: FindTradesDto): Promise<Trade[]> {
    // Fail loudly on an unknown account rather than quietly returning an empty list,
    // which would look identical to "this account has no trades yet".
    if (query.accountId) await this.accounts.findOne(query.accountId);

    return this.prisma.trade.findMany({
      where: query.accountId ? { accountId: query.accountId } : undefined,
      // Chronological by default: the equity curve and running balance are cumulative,
      // so the natural read order is the order the trades closed in.
      orderBy: { closedAt: query.order ?? "asc" },
    });
  }
}
