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
