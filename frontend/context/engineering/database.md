# Database — Engineering Decisions (Prisma / PostgreSQL)

> ⚠ **Target Trade Journal schema (read first).**
> The schema described below is the intended **per-user trading model** —
> `User` → `TradingAccount` → `Trade` (enums `TradeSide` = `LONG|SHORT|LIQUIDATION`,
> `TradeStatus` = `OPEN|CLOSED`). **Ownership is per-user, not multi-tenant:** every owned row carries
> `userId` (and `accountId` for account-scoped rows) and cascades from `User`. There is **no
> organization/tenant** and **no `hospitalId`** — a user can only ever read their own accounts and trades.
> **The live `schema.prisma` has not been migrated to this model yet**; the modelling patterns below are
> stack-level and unchanged, but every trading-domain *example* is a **target pattern** and is labelled as
> such (`— target`).

---

### `cuid()` string primary keys, not auto-increment integers

**What / Where / Why** — Every model uses `id String @id @default(cuid())`
([`schema.prisma`](../../../backend/prisma/schema.prisma), on each model) instead of an
auto-incrementing integer.

**Learn:**
1. **Vocabulary**
   - **`cuid`** — a collision-resistant unique ID generated *without* a round-trip to the database.
   - **Enumeration attack** — guessing `/trades/2`, `/trades/3`… because sequential IDs are predictable.
2. **❌ naive vs ✅ our real code**
   ```prisma
   // ❌ naive — sequential, guessable, leaks row counts
   id Int @id @default(autoincrement())

   // ✅ schema.prisma
   id String @id @default(cuid())
   ```
3. **Plain-english why** — Sequential integers reveal how many rows exist and let anyone walk your
   API by incrementing a number. Opaque IDs can be generated client- or app-side before insertion,
   don't leak volume, and are safe to expose in URLs.
4. **Where else you'd use this** — any public-facing resource URL; IDs generated offline before a
   batch import; distributed inserts where you can't coordinate a sequence; idempotency keys.
5. **Rule of thumb** — Public IDs should be opaque and non-sequential; save auto-increment for internal-only tables.

---

### Snake_case tables via `@@map`, camelCase in code

**What / Where / Why** — Models declare `@@map("trading_accounts")`, `@@map("trades")`,
`@@map("signup_otps")`, etc. so the database uses SQL-idiomatic `snake_case` table names while Prisma
code stays `camelCase` (`prisma.tradingAccount`, `prisma.trade`). `(— target for the trading tables)`

**Learn:**
1. **Plain-english why** — SQL convention is `snake_case`; JS/TS convention is `camelCase`. `@@map`
   lets each side follow its own norm, so raw SQL, DBAs, and ORMs all read naturally. `(concept-light)`
2. **Where else you'd use this** — `@map` on individual columns; ORM naming strategies in general;
   mapping API JSON keys to internal field names.
3. **Rule of thumb** — Let each layer use its native naming convention and map at the boundary.

---

### Every owned row is scoped to `User` with `onDelete: Cascade`

**What / Where / Why** — Each owned model has `user User @relation(fields:[userId], references:[id],
onDelete: Cascade)`; `Trade` additionally cascades from its `TradingAccount` via `accountId`. Deleting a
user removes all their trading accounts and trades in one DB-enforced operation, and deleting one account
removes that account's trades. `(— target)`

**Learn:**
1. **Vocabulary**
   - **Cascade delete** — deleting a parent row automatically deletes the child rows referencing it.
   - **Orphan row** — a child whose parent no longer exists; a data-integrity bug.
2. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — hand-delete every child table, in the right order, or orphan data
   await prisma.trade.deleteMany({ where: { userId } });
   await prisma.tradingAccount.deleteMany({ where: { userId } });
   await prisma.user.delete({ where: { id: userId } }); // forget one → orphans
   ```
   ```prisma
   // ✅ schema.prisma — the database guarantees it
   user User @relation(fields: [userId], references: [id], onDelete: Cascade)
   ```
3. **Plain-english why** — Integrity rules enforced in the database can't be bypassed by a forgetful
   code path, a second service, or a manual query. One `user.delete` cleans up all their accounts and
   trades atomically.
4. **Where else you'd use this** — deleting a user and their data (GDPR "delete all my data"); a post and
   its comments; a cart and its line items; an account and its transactions. (Choose `SetNull`/`Restrict`
   when children must survive.)
5. **Rule of thumb** — Encode ownership and cleanup in the schema, not in application code you have to remember to run.

---

### Composite `@@unique` to model "one row per slot" (idempotent import)

**What / Where / Why** — The pattern the trading schema reaches for to keep imports idempotent:
`@@unique([accountId, ticket])` on `Trade` guarantees the same broker `ticket` can exist at most once per
account — so re-importing a statement can't create duplicate trades, the DB refuses the second insert.
(`TradingAccount` uses the same idea for `@@unique([userId, accountNumber])` — one account number per
user.) `(— target; add these constraints when the trades/accounts models land.)`

**Learn:**
1. **Plain-english why** — "No duplicates for this combination" is a rule the database can enforce
   perfectly with a composite unique index. Doing it in code (check-then-insert) has a race window
   where two concurrent imports both pass the check and both insert. The constraint has no race.
2. **Where else you'd use this** — one row per `(account, brokerTicket)` on import; one account number per
   `(user, accountNumber)`; one vote per `(user, poll)`; one like per `(user, post)`.
3. **Rule of thumb** — Uniqueness rules belong in a unique constraint, not a pre-insert `SELECT`.

---

### Composite indexes shaped like the queries (`userId` / `accountId` first)

**What / Where / Why** — `Trade` carries `@@index([userId])`, `@@index([accountId])`,
`@@index([accountId, closedAt])`, and `@@index([userId, symbol])`; `TradingAccount` has
`@@index([userId])`. Every list query filters by owner first (user, then account), then by a facet
(symbol, close time), so the indexes lead with the ownership column. `(— target)`

**Learn:**
1. **Vocabulary**
   - **Composite index** — an index on several columns in a specific order.
   - **Leftmost-prefix rule** — a composite index on `(a, b)` also speeds queries filtering on just `a`,
     but not queries filtering on just `b`.
2. **Plain-english why** — Index column order must match how you query. Because every screen shows
   "*my* trades, optionally filtered by symbol/side," `(userId, symbol)` serves both the `userId`-only
   list and the `userId + symbol` filter; `(accountId, closedAt)` serves the per-account equity curve
   ordered by close time. A `(symbol, userId)` index would help neither as well.
3. **Where else you'd use this** — `(userId, status)` dashboards; `(accountId, closedAt)` timelines;
   `(conversationId, sentAt)` message history; any "my X filtered by Y" list.
4. **Rule of thumb** — Index for your real queries, most-selective/always-present column first; don't index columns you never filter on.

---

### `Json` columns for variable-shape sub-structures

**What / Where / Why** — The columns the analytics actually read and aggregate (`symbol`, `side`,
`netPnl`, `grossPnl`, `fees`, `openedAt`, `closedAt`) are **real typed columns**. A `Json` column is the
right call only for a blob you read and write *whole* and never query field-by-field — e.g. the raw
imported broker row kept for audit (`Trade.raw Json`) or a freeform tags/notes payload. `(— target;
optional, add only if such a blob appears.)`

**Learn:**
1. **Plain-english why** — Normalize data you filter, join, or aggregate on. For a blob you always
   load and save together as one unit (the untouched broker payload behind an imported trade), a child
   table adds joins and migrations for no query benefit — a `Json` column is simpler and just as correct.
   The trade-off: you *can't* efficiently query "all trades where raw.commissionCurrency = EUR" without
   extracting that field into a real column.
2. **Where else you'd use this** — audit-log payloads; webhook bodies; per-user settings blobs; imported
   record snapshots; flexible form answers. (Promote a field to a real column the moment you need to filter on it.)
3. **Rule of thumb** — Normalize what you query; `Json` what you only ever read and write whole.

---

### `@db.Date` when you mean a calendar day, not an instant

**What / Where / Why** — A trade's `openedAt` and `closedAt` **are instants** (an execution happens at a
precise moment), so they stay full `DateTime`. `@db.Date` is for *calendar* facts — e.g. if a
daily-P&L-summary or journal-entry table is added, its `day` column would be `DateTime @db.Date` to store
a date with no time or timezone. `(— target; the trade timestamps are the instant case.)`

**Learn:**
1. **Plain-english why** — "The trade closed at 14:32:07 UTC" is a moment in time; "the P&L for
   Tuesday" is a calendar fact. Storing a calendar day as a full timestamp drags in timezone bugs (does
   midnight UTC belong to Monday or Tuesday for a trader in New York?). `@db.Date` stores exactly the
   concept you mean.
2. **Where else you'd use this** — daily summary rows; report "as-of" dates; invoice due dates;
   holidays. (Use a real timestamp for *events* — trade opened-at/closed-at, created-at, logged-in-at.)
3. **Rule of thumb** — Use a date type for calendar days and a timestamp for instants; never conflate the two.

---

## Gotchas / Learned (database)

- **Signup uses a staging table, not a half-built User.** The `User` is created **only after** the email
  OTP is verified — until then the pending data (name, hashed password, hashed OTP, expiry) lives in a
  separate `SignupOtp` row (email `@unique`, so re-requesting upserts). On verify, a
  **`prisma.$transaction`** creates the `User` and deletes the `SignupOtp` atomically. **Lesson:** don't
  pollute real tables with unverified/abandoned signups — stage them, and promote atomically.
  **Target-pivot note:** the live `SignupOtp`/verify code still stages org fields and provisions an org
  row alongside the user; the per-user target stages and creates only the `User`. `[~]`
- **Editing `schema.prisma` does nothing until you migrate.** The live database is still the pre-pivot
  multi-tenant schema on its own PostgreSQL database; **the trading model (`User`/`TradingAccount`/`Trade`,
  the `TradeSide`/`TradeStatus` enums) has not been generated or applied yet.** **Lesson stands:** a
  `schema.prisma` edit changes nothing on disk until a migration is generated *and* applied — do both in
  the same change. Track the trading migration as `[~]`, not done.
- **Prisma creates the database if it's missing.** Pointing `DATABASE_URL` at a database name that doesn't
  exist yet and running `migrate dev` creates that database automatically — one Postgres server, a
  separate DB per app. `(no lesson — pure fact)`
- **`DemoRequest` is the one table with no owner.** Book-demo leads (`demo_requests`, migration
  `20260705165249_add_demo_request`) are captured from the *public* landing page, before any account
  exists — so unlike every owned model they aren't scoped to a `User` and don't cascade from one.
  **Lesson:** the "every table has `userId`" rule applies to *owned* data; pre-account / global records
  (marketing leads, waitlist, system audit) are legitimately owner-less — scope by ownership, not by reflex.
