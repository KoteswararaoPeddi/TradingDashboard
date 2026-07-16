# Database — Engineering Decisions (Prisma / PostgreSQL)

Grounded in the real Trade Journal schema ([`backend/prisma/schema.prisma`](../../../backend/prisma/schema.prisma)):
two models, `TradingAccount` → `Trade`, plus the enums `TradeSide` (`LONG|SHORT|LIQUIDATION`) and
`TradeStatus` (`OPEN|CLOSED`). The app is single-user, so there is no ownership dimension — `accountId`
is the only scoping column.

**Status:** the init migration has not been run yet — `prisma migrate dev --name init` needs a reachable
`DATABASE_URL`.

---
