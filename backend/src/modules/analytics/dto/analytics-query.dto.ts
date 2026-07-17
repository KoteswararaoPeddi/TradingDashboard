import { TradeFilterQueryDto } from "../../trades/dto/trade-filter.dto";

/**
 * Query for GET /api/analytics — the same filter contract as the trades list, so
 * the bundle always describes the set the table is showing. No pagination:
 * analytics is computed over the whole filtered set (a win rate over one page is
 * meaningless), only the resulting summary crosses the wire.
 */
export class AnalyticsQueryDto extends TradeFilterQueryDto {}
