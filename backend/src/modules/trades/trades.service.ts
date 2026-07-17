import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Trade, TradingAccount } from "@prisma/client";

import { toNumber } from "../../common/money";
import { PrismaService } from "../../prisma/prisma.service";
import { AccountsService } from "../accounts/accounts.service";
import { CreateTradeDto } from "./dto/create-trade.dto";
import { FindTradesDto } from "./dto/find-trades.dto";
import { UpdateTradeDto } from "./dto/update-trade.dto";
import { PaginatedTrades, TradeEntity } from "./entities/trade.entity";
import { enrichTrades, filterTrades } from "./trades.logic";

@Injectable()
export class TradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountsService,
  ) {}

  /**
   * A filtered, paginated page of trades.
   *
   * The whole account set is fetched and enriched (so `index` and the running
   * `balanceAfter` are correct against full history), then filtered and sorted —
   * and only then sliced to a page. That is the server-side split the client
   * asked for: analytics needs every row, but the table never ships more than one
   * page across the wire.
   */
  async findAll(query: FindTradesDto): Promise<PaginatedTrades> {
    const account = await this.resolveAccount(query.accountId);

    const rows = await this.prisma.trade.findMany({ where: { accountId: account.id } });
    const enriched = enrichTrades(rows.map(TradeEntity.from), toNumber(account.startingBalance));
    const filtered = filterTrades(enriched, query);

    const limit = query.limit ?? 50;
    const page = query.page ?? 1;
    const startIndex = (page - 1) * limit;

    const items = filtered.slice(startIndex, startIndex + limit).map((entry) => ({
      ...entry.trade,
      index: entry.index,
      balanceAfter: entry.balanceAfter,
      holdTime: entry.holdTime,
      pips: entry.pips,
      filledSize: entry.filledSize,
    }));

    return {
      items,
      page,
      limit,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      accountTradeCount: enriched.length,
    };
  }

  /** Resolve an explicit account (404 if unknown) or the journal's default one. */
  private async resolveAccount(accountId?: string): Promise<TradingAccount> {
    return accountId ? this.accounts.findOne(accountId) : this.accounts.getDefault();
  }

  async findOne(id: string): Promise<Trade> {
    const trade = await this.prisma.trade.findUnique({ where: { id } });
    if (!trade) throw new NotFoundException(`No trade with id "${id}".`);
    return trade;
  }

  /**
   * Validating the account first turns an unknown id into a clean 404 instead of
   * a foreign-key violation surfacing as a 500.
   *
   * A duplicate `ticket` within the account raises P2002, which the global
   * PrismaExceptionFilter already maps to 409 — no local try/catch needed.
   */
  async create(dto: CreateTradeDto): Promise<Trade> {
    const account = await this.resolveAccount(dto.accountId);
    return this.prisma.trade.create({ data: toTradeData({ ...dto, accountId: account.id }) });
  }

  async update(id: string, dto: UpdateTradeDto): Promise<Trade> {
    const existing = await this.findOne(id);
    // Gross is derived from net + fees, so a change to either has to re-derive it
    // against the trade's *current* values. Coerce the stored values to numbers —
    // Prisma returns them as Decimal, and Decimal + Decimal would concatenate.
    const merged = {
      ...dto,
      fees: dto.fees ?? toNumber(existing.fees),
      netPnl: dto.netPnl ?? toNumber(existing.netPnl),
      grossPnl: dto.grossPnl,
    };
    return this.prisma.trade.update({ where: { id }, data: toTradeData(merged, dto) });
  }

  async remove(id: string): Promise<Trade> {
    await this.findOne(id);
    return this.prisma.trade.delete({ where: { id } });
  }
}

/**
 * Maps a validated DTO onto Prisma's shape.
 *
 * Two things happen here that the DTO cannot express:
 *  - ISO strings become Dates (the DTO validates them as strings so the error
 *    message stays readable).
 *  - `grossPnl` defaults to `netPnl + fees` — gross is P&L *before* fees, so this
 *    is the definition, not a guess. With fees at 0 it equals net, which is why
 *    the seed's gross and net match.
 *
 * `patch` (when present) limits the result to keys the caller actually sent, so a
 * PATCH never overwrites an untouched column with a default.
 */
function toTradeData(
  dto: Partial<CreateTradeDto>,
  patch?: UpdateTradeDto,
): Prisma.TradeUncheckedCreateInput {
  const fees = dto.fees ?? 0;
  const netPnl = dto.netPnl ?? 0;

  const data: Record<string, unknown> = {
    accountId: dto.accountId,
    symbol: dto.symbol,
    side: dto.side,
    size: dto.size,
    entryPrice: dto.entryPrice,
    exitPrice: dto.exitPrice,
    netPnl,
    fees,
    grossPnl: dto.grossPnl ?? netPnl + fees,
    openedAt: dto.openedAt ? new Date(dto.openedAt) : undefined,
    closedAt: dto.closedAt ? new Date(dto.closedAt) : undefined,
    ticket: dto.ticket,
    status: dto.status,
  };

  if (!patch) return data as Prisma.TradeUncheckedCreateInput;

  // On update, keep only what the caller sent (plus the re-derived gross).
  const sent = new Set([...Object.keys(patch), "grossPnl", "netPnl", "fees"]);
  for (const key of Object.keys(data)) {
    if (!sent.has(key)) delete data[key];
  }
  return data as Prisma.TradeUncheckedCreateInput;
}
