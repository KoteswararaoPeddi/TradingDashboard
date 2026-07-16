# Database — Engineering Decisions (Prisma / PostgreSQL)

Grounded in the real Trade Journal schema ([`backend/prisma/schema.prisma`](../../../backend/prisma/schema.prisma)):
two models, `TradingAccount` → `Trade`, plus the enums `TradeSide` (`LONG|SHORT|LIQUIDATION`) and
`TradeStatus` (`OPEN|CLOSED`). The app is single-user, so there is no ownership dimension — `accountId`
is the only scoping column.

**Status:** live. The schema is migrated (`20260716091717_init`) into a dedicated `trade_journal`
PostgreSQL database — `trading_accounts` and `trades` exist with both enums and both indexes.

---
