# Backend — Engineering Decisions (NestJS)

Grounded in the real Trade Journal backend (`backend/src`). Every entry references code that exists.

---

### Scope helmet's CSP around Swagger instead of disabling it

**What / Where / Why** — Swagger UI at `/api/docs` boots from an inline `<script>`. helmet's default
Content-Security-Policy sends `script-src 'self'`, which blocks inline scripts, so the docs page
renders blank. In [`src/main.ts`](../../../backend/src/main.ts) we apply helmet to **every path except
`/api/docs`**, rather than the two usual shortcuts: turning CSP off globally
(`helmet({ contentSecurityPolicy: false })`) or adding `'unsafe-inline'` to `script-src` app-wide.

**Learn:**

1. **Vocabulary**
   - **CSP (Content-Security-Policy)** — a response header telling the browser which sources it may
     load scripts/styles/images from. It is enforced **by the browser**, not the server.
   - **Inline script** — JS written directly in the HTML (`<script>init()</script>`) rather than
     fetched from a URL. CSP blocks these unless explicitly allowed, because they are a main vector
     for injected-code (XSS) attacks.
   - **Middleware** — a function that runs per request before the route handler; `app.use(fn)`
     registers one. It can choose to do nothing and call `next()`.

2. **❌ naive vs ✅ our real code**

```typescript
// ❌ Naive — kills CSP for the whole API so one HTML page works
app.use(helmet({ contentSecurityPolicy: false }))

// ✅ Ours (src/main.ts) — exempt only the docs path; everything else stays strict
const helmetMiddleware = helmet()
app.use((req, res, next) =>
  req.path.startsWith(`/${DOCS_PATH}`) ? next() : helmetMiddleware(req, res, next),
)
```

3. **Plain-english why** — The blank docs page tempts you to switch the whole protection off. But the
   weakness you would introduce applies to every response, while the thing you are fixing is one
   page. The exemption is a scalpel: `/api/docs` loses CSP, every real endpoint keeps it. It also
   documents its own blast radius — a reader sees exactly which path is unprotected, whereas
   `contentSecurityPolicy: false` hides that the entire app just went permissive.

4. **Where else you would use this**
   - A GraphQL server exposing GraphiQL/Playground at one route while the rest stays locked down.
   - Serving an embedded admin/BI dashboard that needs `frame-ancestors` or inline styles.
   - A webhook route that must skip the global CSRF check or the JSON body parser (raw-body signing).
   - Letting a single upload endpoint past a global request-size limit.

5. **Rule of thumb** — When one route conflicts with a global security middleware, exempt the route,
   never disable the middleware. Scope the hole to the thing that needs it.

> **Gotcha — you cannot verify CSP with a status code.** CSP is browser-enforced, so
> `curl -o /dev/null -w "%{http_code}" /api/docs` returns **200** whether the UI works or is a blank
> page. Assert on the header instead: `curl -D - -o /dev/null http://localhost:3001/api/docs` should
> show **no** `Content-Security-Policy`, while `/api/health` still shows one. Checking the status code
> alone would have "passed" a broken page.

---

### Swagger's setup path is literal and ignores the global prefix

**What / Where / Why** — `app.setGlobalPrefix("api")` moves every **controller** route under `/api`,
but it does **not** apply to `SwaggerModule.setup(path, ...)` — that path mounts verbatim. In
[`src/main.ts`](../../../backend/src/main.ts) we pass `"api/docs"` (not `"docs"`) to land the UI at
`/api/docs`. `(no lesson — a library fact worth not rediscovering)`

---

### Swagger response examples must show the wrapped envelope

**What / Where / Why** — The global `ResponseInterceptor`
([`src/common/interceptors/response.interceptor.ts`](../../../backend/src/common/interceptors/response.interceptor.ts))
wraps whatever a handler returns in `{ success, message, data }`. Swagger, however, documents the
handler's **declared** return type, which is the value *before* wrapping. Left alone, the docs would
advertise a payload shape the API never actually sends. So `@ApiOkResponse` carries an explicit
`schema.example` of the **wrapped** response — see
[`modules/health/health.controller.ts`](../../../backend/src/modules/health/health.controller.ts).

**Learn:**

1. **❌ naive vs ✅ our real code**

```typescript
// ❌ Naive — documents the handler's return type; the client never receives this shape
@ApiOkResponse({ type: HealthDto })
@Get()
check() { return { message: "OK", data: { status: "ok" } } }

// ✅ Ours — the example matches what the interceptor actually emits
@ApiOkResponse({
  description: "The API is up.",
  schema: {
    example: {
      success: true,
      message: "OK",
      data: { status: "ok", timestamp: "2026-07-16T09:20:00.000Z" },
    },
  },
})
```

2. **Plain-english why** — Anything that rewrites responses on the way out (an interceptor, a
   serializer, a gateway) makes the handler's signature an unreliable description of the wire format.
   Docs generated from the signature will then be confidently wrong, which is worse than absent docs:
   a client written against them fails at runtime, not at compile time.

3. **Where else you would use this**
   - Any API with a global envelope/pagination wrapper (`{ items, total }`).
   - A serializer that strips or renames fields (`class-transformer` `@Exclude`) before send.
   - An API gateway that re-shapes upstream responses.
   - Error-shape docs, when a global exception filter reformats thrown errors.

4. **Rule of thumb** — Document the bytes on the wire, not the function's return type. If a global
   interceptor transforms responses, every response example must reflect the transform.

---

## Server-side analytics: port the proven pure logic, pin it with the same oracle *(2026-07-17)*

**What / Where / Why.** Moved every metric and all filtering/pagination from the frontend to the
backend (`modules/analytics/analytics.calculator.ts`, `modules/trades/trades.logic.ts`,
`GET /analytics`, paginated `GET /trades`). The alternative — leaving compute on the client — was
rejected by the user for a single-source-of-truth, mobile-ready API. The risk in *any* "move the
calculation" job is that the numbers drift during the port. We beat that by (1) porting the existing
`metrics.ts` **verbatim** (same operation order, same `round2`) into a framework-free module, and (2)
re-pointing the frontend's 43-check correctness oracle at the backend calculator **before** wiring a
single controller.

**Learn block**

1. **Vocabulary**
   - **Oracle test** — a test that asserts outputs against independently-known-correct values (here,
     the reference design's hand-checked $1,166.40 / 50% / 1.53), as opposed to asserting "same as
     last run". It survives a rewrite because it doesn't depend on the implementation.
   - **Pure module** — no framework, no I/O; output depends only on input. Importable by a test with
     no server boot, which is what lets the oracle run in milliseconds.

2. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — rebuild the maths on the server "cleaner", verify by eyeballing the UI
   function calcWinRate(trades) { return trades.filter(isWin).length / trades.length * 100 }

   // ✅ ours — port the proven code unchanged into a pure module, then pin it
   //   analytics.calculator.ts is a line-for-line move of the frontend metrics.ts
   //   test/analytics-oracle.ts asserts the SAME 43 numbers the frontend oracle did
   const analytics = calculateAnalytics(filterTrades(enrichTrades(rows, start), q), start)
   ```

3. **Plain-english why** — A reimplementation that "looks right" can be off by a rounding step or an
   ordering difference you'll never spot by eye across 27 metrics. Porting verbatim removes the
   *translation* as a source of error; running the pre-existing oracle against the new code turns
   "looks right" into "provably identical to the version we trusted". You verify the risky part
   (the maths) before building the cheap part (controllers/DTOs), so a drift is caught at minute 10,
   not after the whole stack is wired.

4. **Where else you'd use this**
   - Rewriting a hot function in another language (JS → Rust/WASM): keep the reference impl and
     differential-test against it.
   - Splitting a monolith: move a module, run its existing tests against the new home before changing
     callers.
   - Replacing a library with a hand-rolled version: assert both give identical output on a fixture
     set first.
   - Any "optimize without changing behavior" task — the behavior lock is the test, not your reading.

5. **Rule of thumb** — When you move a calculation, move the test that proves it *first*, and port the
   code unchanged; optimize only after the oracle is green in its new home.

---

## Normalize money at the DB boundary when the column type is in flux *(2026-07-17)*

**What / Where / Why.** The Prisma client typed money as `Decimal` while `schema.prisma` still said
`Float` (a half-applied migration). Rather than commit the whole calculator to `Decimal` arithmetic —
or assume `number` and get silent bugs — we coerce every money field to a plain `number` at the exact
boundary where Prisma rows enter our code (`common/money.ts` `toNumber`, used in entity `from()`
mappers and the analytics/trades services). One calculation path, robust to either column type.

**Learn block**

1. **Plain-english why** — `Decimal + Decimal` in decimal.js does **not** throw; `equity += pnl`
   quietly produces a wrong value (string-ish concatenation / NaN), and `tsc` is happy because the
   types line up. A bug that compiles and runs but computes wrong is the worst kind. Coercing at the
   boundary means the ~300 lines of arithmetic downstream never have to know or care what the column
   type is this week — there is exactly one place the representation is decided.

2. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — trust the field is a number; compiles, computes wrong at runtime on Decimal
   let equity = account.startingBalance
   for (const t of trades) equity += t.netPnl   // Decimal + number → garbage

   // ✅ ours — coerce at the Prisma boundary, compute on plain numbers
   const enriched = enrichTrades(rows.map(TradeEntity.from), toNumber(account.startingBalance))
   //                                     ^ from() runs toNumber on every money field
   ```

3. **Where else you'd use this** — reading `NUMERIC`/`DECIMAL` columns (node-postgres returns them as
   strings); an ORM that returns `BigInt` for counts; a JSON API that sends money as strings to dodge
   float error; any field whose wire/DB type differs from the type your logic wants.

4. **Rule of thumb** — Decide a value's representation once, at the boundary it enters your system;
   never let a DB/serialization type leak into business arithmetic.

---

## Draw the client/server line by "must be correct" vs "only helps render" *(2026-07-17)*

**What / Where / Why.** After the analytics move, three small computations still lived on the client:
the calendar's daily→monthly totals, per-row `pips` (`|exit − entry|`), and `filledSize` (parse
`"0.25/0.25"` → `"0.25"`). We moved **pips**, **filledSize**, and **monthly totals** to the backend
(`trades.logic.enrichTrades` exposes `pips`/`filledSize` on `TradeRowEntity`; `analytics.calculator`
emits `monthlyPnl[]`), but deliberately **kept** two things on the client: the heatmap **tint** (map a
raw `value` → colour/alpha) and the calendar's per-row **"Week" subtotal**. The test isn't "is it
arithmetic" — it's *"must this value be correct and identical on every client, or does it only exist to
render this one layout?"*

**Learn block**

1. **Vocabulary** — *Domain aggregate*: a total with meaning independent of any screen (a month's net
   P&L). *Presentation rollup*: a number that only exists because of how one UI arranges things (the
   sum of the day-cells in a Monday-start, month-clipped calendar row — not a real ISO week).

2. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — one blanket rule: "no math on the frontend", so the API ships pixels
   { date: "2026-07-17", netPnl: 420, backgroundColor: "#00b894", opacity: 0.67, cellWidth: 28 }

   // ✅ ours — backend owns the domain totals; the client owns the pixels
   // server: raw, reusable numbers
   monthlyPnl: [{ month: "2026-07", value: 166.4, tradedDays: 5, tradeCount: 18 }]
   dailyPnl:   [{ date: "2026-07-11", value: -62.42, count: 4 }]
   // client (DayCell.tsx): decides how -62.42 becomes a colour
   backgroundColor: `color-mix(in oklab, var(--color-down) ${tintPercent(strength)}%, transparent)`
   ```

3. **Plain-english why** — Baking colour/opacity/width into the API couples it to today's design: a
   restyle or a second client (mobile) would need an API change to recolour a cell. Conversely, letting
   each client re-sum a month invites drift — web rounds one way, mobile another, and the two disagree
   on the headline number. So the rule cuts both ways: **totals up** (to the server, computed once),
   **pixels down** (to the client, free to restyle). The month-grid *week* row is the edge case — its
   subtotal is "sum the cells this layout happens to show," which has no meaning off this grid, so it
   stays a client rollup of already-fetched daily data.

4. **Where else you'd use this**
   - A dashboard API returning `status: "healthy"` (domain) but not `badgeColor: "green"` (presentation).
   - Search returning relevance *scores* (server) while the client picks how many stars that is.
   - A report endpoint giving subtotals/grand-totals (server) but not column widths or page breaks.
   - i18n: server sends a number + currency code; the client formats `1234.5 → "$1,234.50"`.

5. **Rule of thumb** — If a second client would need the same number, compute it server-side; if a
   restyle would change it, leave it on the client. "Must be correct everywhere" → backend; "only helps
   render" → frontend. Never ship colours, widths, or opacities from the API.

---

## Bypass the response envelope with `@Res()` for file downloads *(2026-07-17)*

**What / Where / Why.** CSV export (`GET /trades/export`) had to return a raw `text/csv` body, but a
global `ResponseInterceptor` wraps *every* handler return in `{ success, message, data }`. Rather than
special-case the interceptor, the handler injects the platform response with `@Res() res` and calls
`res.send(csv)` itself — injecting `@Res()` (without `passthrough: true`) puts Nest in **manual-response
mode**, so it never serialises a return value and the interceptor's mapped output is simply discarded.
The route also reuses the *exact* `enrichTrades → filterTrades` pipeline the JSON table uses, so the
file matches the on-screen view instead of being a second, drifting query.

**Learn block**

1. **Vocabulary** — *Response interceptor*: cross-cutting code that transforms every handler's return
   before it's sent (here, the envelope). *Manual-response mode*: when you take the raw `res` object,
   the framework steps back and assumes you'll end the response yourself.

2. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — return the string; the global interceptor wraps it:
   //   { success:true, message:"OK", data:"Index,Ticket,...\n1,#123,..." }
   //   → not a CSV, and the browser saves JSON
   @Get("export") export() { return this.trades.exportCsv(query) }

   // ✅ ours — take the response, set the headers, send raw; envelope skipped
   @Get("export")
   async export(@Query() q: FindTradesDto, @Res() res: Response) {
     const csv = await this.trades.exportCsv(q)
     res.setHeader("Content-Type", "text/csv; charset=utf-8")
     res.setHeader("Content-Disposition", `attachment; filename="trades-${stamp}.csv"`)
     res.send(csv)
   }
   ```

3. **Plain-english why** — A global interceptor is the right default (uniform JSON), but a file download
   is the one case where uniformity is *wrong* — the client wants bytes, not a JSON wrapper around a
   stringified file. `@Res()` is the escape hatch: one route opts out without weakening the rule for the
   other 99%. Note the trade-off — you've now taken responsibility for ending the response, and other
   interceptors on that route are also bypassed, so use it only where you truly need raw control.

4. **Where else you'd use this** — streaming a PDF/zip/image; Server-Sent Events or a chunked stream;
   a webhook that must echo an exact plaintext challenge; a health endpoint a load balancer wants as
   bare `OK`; any proxy/redirect where you set the status and headers yourself.

5. **Rule of thumb** — Keep the global envelope for data; drop to `@Res()` for bytes. When a route's
   contract is "a file", not "a JSON payload", take the response object and own it end to end.
