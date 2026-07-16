import { Injectable, NotFoundException } from "@nestjs/common";
import { TradingAccount } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Oldest first, so "the first account" is stable as more are added. */
  async findAll(): Promise<TradingAccount[]> {
    return this.prisma.tradingAccount.findMany({ orderBy: { createdAt: "asc" } });
  }

  async findOne(id: string): Promise<TradingAccount> {
    const account = await this.prisma.tradingAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException(`No trading account with id "${id}".`);
    return account;
  }
}
