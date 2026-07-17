import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Trade } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { AccountsService } from "../accounts/accounts.service";
import { CreateTradeDto } from "./dto/create-trade.dto";
import { FindTradesDto } from "./dto/find-trades.dto";
import { UpdateTradeDto } from "./dto/update-trade.dto";

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
    const accountId = await this.resolveAccountId(dto.accountId);
    return this.prisma.trade.create({ data: toTradeData({ ...dto, accountId }) });
  }

  /**
   * An explicit account is validated (unknown id → clean 404 instead of a
   * foreign-key violation surfacing as a 500); an absent one falls back to the
   * journal's single account, so the client never has to know an id exists.
   */
  private async resolveAccountId(accountId?: string): Promise<string> {
    if (!accountId) return (await this.accounts.getDefault()).id;
    await this.accounts.findOne(accountId);
    return accountId;
  }

  async update(id: string, dto: UpdateTradeDto): Promise<Trade> {
    const existing = await this.findOne(id);
    // Gross is derived from net + fees, so a change to either has to re-derive it
    // against the trade's *current* values, not just the ones in this patch.
    const merged = {
      ...dto,
      fees: dto.fees ?? existing.fees,
      netPnl: dto.netPnl ?? existing.netPnl,
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
