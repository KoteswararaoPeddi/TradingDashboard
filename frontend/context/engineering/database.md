# Database — Engineering Decisions (Prisma / PostgreSQL)

Grounded in the real Trade Journal schema ([`backend/prisma/schema.prisma`](../../../backend/prisma/schema.prisma)):
two models, `TradingAccount` → `Trade`, plus the enums `TradeSide` (`LONG|SHORT|LIQUIDATION`) and
`TradeStatus` (`OPEN|CLOSED`). The app is single-user, so there is no ownership dimension — `accountId`
is the only scoping column.

**Status:** live. The schema is migrated (`20260716091717_init`) into a dedicated `trade_journal`
PostgreSQL database, seeded with one account and 18 trades via `npm run seed`.

---

### Anchor zone-less timestamps to UTC, don't let the machine's zone decide

**What / Where / Why** — The source rows carry wall-clock strings with no timezone
(`"2026-07-15 18:01:35"`). In [`prisma/seed.ts`](../../../backend/prisma/seed.ts) we append `Z` before
parsing, so the string is read **as UTC**, rather than `new Date("2026-07-15T18:01:35")`, which would
interpret it in whatever zone the seeding machine happens to be in.

**Learn:**

1. **Vocabulary**
   - **Wall clock** — a date/time with no zone attached ("6pm"). Ambiguous on its own: 6pm *where*?
   - **Instant** — an unambiguous point in time (a JS `Date` is one). Rendering an instant as a wall
     clock requires choosing a zone.
   - **`timestamp without time zone`** — the Postgres column type Prisma's `DateTime` maps to. It
     stores a wall clock and does **no** conversion. Whatever you hand it is what comes back.

2. **❌ naive vs ✅ our real code**

```typescript
// ❌ Naive — the seeding machine's zone silently becomes part of the data.
// In IST this stores 12:31:35; in UTC it stores 18:01:35. Same input, different rows.
new Date("2026-07-15 18:01:35".replace(" ", "T"))

// ✅ Ours (prisma/seed.ts) — the string means what it says, everywhere
function toUtcInstant(wallClock: string): Date {
  return new Date(`${wallClock.replace(" ", "T")}Z`)
}
```

3. **Plain-english why** — This looks like pedantry until you notice what the dashboard does with the
   data: it groups trades by **hour of day** and **weekday** ("your 16:00 hour bleeds money", "Fridays
   pay"). Those buckets are the product. If the timestamp's meaning depends on who parsed it, a trade
   slides between hours — and a viewer in another timezone sees a *different analysis* of identical
   data. Anchoring to UTC makes the stored value mean one thing, so the buckets are stable. The
   frontend then reads with UTC accessors (`getUTCHours()`), keeping the round trip honest.

4. **Where else you'd use this**
   - Importing any CSV/broker/bank export whose timestamps have no zone.
   - Storing a **birthday** or invoice due date, where "the date" must not shift across zones.
   - Cron/scheduling metadata that must fire at the same wall clock regardless of server location.
   - Comparing timestamps across services deployed in different regions.

5. **Rule of thumb** — A zone-less timestamp is not data, it's a riddle. Decide its zone explicitly at
   the boundary where it enters your system, and never let the host's locale answer for you.

---

### Make the seed idempotent with the natural key, not "delete everything first"

**What / Where / Why** — `prisma/seed.ts` upserts trades on the composite unique
`@@unique([accountId, ticket])` (a broker ticket is unique within an account), rather than the common
`deleteMany()`-then-`createMany()` pattern.

**Learn:**

1. **Vocabulary**
   - **Idempotent** — running it twice leaves the same result as running it once.
   - **Natural key** — a field the real world already guarantees is unique (a broker's ticket number),
     as opposed to a surrogate id the database invents (`cuid()`).

2. **❌ naive vs ✅ our real code**

```typescript
// ❌ Naive — idempotent, but by destruction. Re-seeding nukes any row you added
// by other means, and churns every id/foreign key.
await prisma.trade.deleteMany()
await prisma.trade.createMany({ data: rows })

// ✅ Ours — converges on the desired state, row by row
await prisma.trade.upsert({
  where: { accountId_ticket: { accountId: account.id, ticket: row.ticket } },
  update: data,
  create: data,
})
```

3. **Plain-english why** — Both approaches survive a second run, but only one is safe to run against a
   database you care about. `deleteMany` treats "re-seed" as "reset", which is fine on an empty dev DB
   and destructive anywhere else. Upserting on the natural key makes the seed a *convergence* step:
   it can top up a partially-loaded database, fix a corrected value, and re-run in CI without
   collateral damage. It also makes the same code reusable as a CSV importer later, which is exactly
   where this project is heading.

4. **Where else you'd use this**
   - CSV/API importers that may re-deliver rows already seen (dedupe on the provider's id).
   - Webhook handlers, where the provider retries and may deliver the same event twice.
   - Syncing reference data (currencies, symbols) on every deploy.
   - Any "ensure this row exists" migration.

5. **Rule of thumb** — Idempotency should come from a unique key, not from a `DELETE`. If your seed
   starts by emptying a table, it isn't a seed, it's a reset.
