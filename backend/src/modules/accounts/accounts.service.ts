import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from "@nestjs/common";
import { TradingAccount } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { UpdateAccountDto } from "./dto/update-account.dto";

/**
 * Defaults for the journal's one account.
 *
 * `startingBalance` is 0 so the app is usable the moment it boots: the equity
 * curve simply starts at zero and reads as pure cumulative P&L until the user
 * sets a real balance in Settings. Defaulting to 0 rather than prompting is what
 * keeps "add a trade" from being gated behind configuration.
 */
const DEFAULT_ACCOUNT = {
  label: "My Trading Account",
  accountNumber: "primary",
  startingBalance: 0,
  currency: "USD",
} as const;

@Injectable()
export class AccountsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AccountsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Guarantees the journal's account exists before the first request.
   *
   * This is a single-user journal, so the account is a **singleton**, not
   * something the user authors — which is why there is no create endpoint. The
   * starting balance it carries is the one number trades cannot supply, so the
   * row has to exist for metrics to have an anchor; making it appear on boot is
   * what lets the user go straight to adding trades.
   *
   * Idempotent: `accountNumber` is @unique, so a re-run is a no-op rather than a
   * second account.
   */
  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.prisma.tradingAccount.count();
    if (existing > 0) return;

    const account = await this.prisma.tradingAccount.create({ data: DEFAULT_ACCOUNT });
    this.logger.log(`Initialised journal account "${account.label}" (balance ${account.startingBalance}).`);
  }

  /** Oldest first, so "the first account" is stable as more are added. */
  async findAll(): Promise<TradingAccount[]> {
    return this.prisma.tradingAccount.findMany({ orderBy: { createdAt: "asc" } });
  }

  async findOne(id: string): Promise<TradingAccount> {
    const account = await this.prisma.tradingAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException(`No trading account with id "${id}".`);
    return account;
  }

  /**
   * The journal's account — the one every trade belongs to.
   *
   * Callers use this instead of asking the client for an `accountId`: with a
   * single account, making the caller pass one would be ceremony that can only be
   * got wrong. Falls back to creating it so a database wiped while the process is
   * running cannot leave reads permanently broken.
   */
  async getDefault(): Promise<TradingAccount> {
    const [account] = await this.prisma.tradingAccount.findMany({
      orderBy: { createdAt: "asc" },
      take: 1,
    });
    return account ?? this.prisma.tradingAccount.create({ data: DEFAULT_ACCOUNT });
  }

  /**
   * Saves the Settings page. findOne first so an unknown id is a clean 404 rather
   * than Prisma's P2025.
   */
  async update(id: string, dto: UpdateAccountDto): Promise<TradingAccount> {
    await this.findOne(id);
    return this.prisma.tradingAccount.update({ where: { id }, data: dto });
  }
}
