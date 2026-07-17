import { OmitType, PartialType } from "@nestjs/swagger";

import { CreateTradeDto } from "./create-trade.dto";

/**
 * Body for PATCH /api/trades/:id — every field optional.
 *
 * `accountId` is omitted deliberately: moving a trade between accounts would
 * silently re-base two equity curves at once, so a trade's account is fixed at
 * creation. Deriving the rest from CreateTradeDto via PartialType keeps the
 * validation rules from drifting apart.
 */
export class UpdateTradeDto extends PartialType(OmitType(CreateTradeDto, ["accountId"] as const)) {}
