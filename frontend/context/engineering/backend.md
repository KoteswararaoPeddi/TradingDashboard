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
