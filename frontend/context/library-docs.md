# Library Docs

How **Trade Journal** uses each third-party library — the project-specific patterns and constraints,
not general API docs. Read the relevant section before implementing a feature that touches one of
these. The app is split into `frontend/` (Next.js) and `backend/` (NestJS); sections are grouped
accordingly.

Order of authority: `node_modules/next/dist/docs` (for Next.js) → this file → general knowledge.

---

# Frontend

## axios

The single most important frontend pattern. **All backend calls go through the shared instance** —
never a bare `fetch`/`axios()`.

```typescript
// shared/lib/axios.config.ts
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // backend origin + /api
})
```

The instance is deliberately plain: **no auth, no `withCredentials`, no 401-refresh flow, no login
redirect** (the API is open — see architecture.md → Single-user, no auth). The response interceptor
keeps only a minimal cross-cutting logger:

- **403** → toast a generic message.
- **5xx** → toast a generic message + console error.

**Rules:**

- Import the default export from `@lib/axios.config` in every service.
- Services return unwrapped, typed domain data (unwrap the `{ success, message, data }` envelope →
  `.data.data`).
- Don't re-implement 403/5xx per call — the interceptor owns it.
- Feature services live in `features/<domain>/api/*.service.ts` (`accounts.service`,
  `trades.service`). Every service returns typed domain data (raw trades — the metrics are derived on
  the client, not by the service).

## recharts

The dashboard's seven charts (equity curve, daily/weekday/hourly/asset/direction bars, win/loss
donut). The reference design draws them with Chart.js; we render the same charts with **recharts**,
which composes as React components.

**Why recharts here:** it renders **SVG**, and SVG `fill`/`stroke` accept `var(--color-up)` directly.
Chart colours therefore read the **same semantic tokens as every other component**, with no second
copy of the palette living in JS — and the accent themes restyle charts for free. A canvas library
would force literal colour strings in JS, which the token rules forbid.

**Rules:**

- **Colours come from tokens, always** — `fill="var(--color-up)"` / `stroke="var(--color-info)"`.
  Never a hex literal or a JS palette object in chart code.
- **Signed data is coloured by sign** (daily / weekday / hourly / asset): map each datum to a
  `<Cell fill={value >= 0 ? "var(--color-up)" : "var(--color-down)"} />` inside `<Bar>`. A single
  `fill` on `<Bar>` cannot express per-bar colour.
- **Mark chart components `"use client"`** and load them with `next/dynamic`. recharts is heavy, and
  `ResponsiveContainer` measures the DOM — server rendering it produces hydration noise for no gain.
- **`ResponsiveContainer` needs a sized parent.** It resolves to zero height inside an auto-height
  box and the chart silently vanishes. The Panel chart body sets a fixed height (340px, 390px for the
  wide equity panel), which satisfies it.
- **Shared defaults** live in `shared/config/chart-theme.ts` (grid stroke, tick fill, tooltip
  surface, money formatter) so all seven charts read one source rather than repeating props.
- Chart type mapping: equity curve → `AreaChart` + `<defs><linearGradient>` with `type="monotone"`;
  daily/weekday/hourly/direction → `BarChart`; asset performance → `BarChart layout="vertical"`;
  win/loss → `PieChart` + `<Pie innerRadius="68%">` for the donut.

## shadcn/ui (Radix + Base UI)

UI primitives live in `src/shared/components/ui` (button, card, input, select, dialog, table, tabs,
tooltip, dropdown-menu, …), styled with `class-variance-authority` for variants and the design tokens.

**Rules:**

- Reuse and extend primitives from `shared/components/ui` — don't pull raw Radix/Base UI into feature
  code.
- Add new primitives via the shadcn workflow (`components.json`); style them with the **dark** tokens,
  never hex.
- Compose feature composites (`Panel`, `StatCard`, `MarketTile`, `TradeRow`, `SideBadge`,
  `ResultBadge`, `CalendarHeatmap`) in the feature or `shared/components`.

## Tailwind CSS v4

- Tokens are defined with `@theme` in `shared/styles/theme.css` (imported by `app/globals.css`) — **no
  `tailwind.config.ts`** for colors/tokens. See ui-tokens.md.
- Utilities are generated from `--color-*`, `--text-*`, `--radius`, and `--font-*` variables (e.g.
  `bg-surface`, `text-foreground`, `border-border`, `text-up`/`text-down`, `text-h2`, `font-sans`).
- **Style with utilities only — no hand-written CSS files / CSS modules** for components. Sanctioned
  inline-`style` exceptions (via `var(--color-*)`): panel/brand gradients, the app background wash,
  and P&L-proportional bar/heatmap widths.
- For conditional/merged classes use the `cn` helper from `@lib/utils`. Never concatenate class
  strings by hand.

## React Hook Form + Zod

Every form (add/edit trade, account settings, filters). The Zod schema is the single source of truth.

```typescript
const form = useForm<TradeValues>({
  resolver: zodResolver(tradeSchema),
  defaultValues: DEFAULTS,
  mode: "onBlur",
})
```

- Schemas live in the feature's `schemas/`; derive types via `z.infer`.
- Validate before calling a service. Build inputs from the shared form-field components, not raw
  inputs. Numeric trade fields (`size`, `entryPrice`, `exitPrice`, `pnl`, `fees`) coerce/validate as
  numbers; `side` validates against the `TradeSide` enum; dates as ISO strings.

## Zustand

Cross-cutting client state only: the **active-account** store, the **filter** store that drives the
dashboard recompute, and the **accent-theme** preference.

- Select narrow slices: `useAccountStore((s) => s.activeAccountId)`.
- The accent-theme store writes `document.body.dataset.accent` (green/violet/gold) and persists the
  choice; components read semantic tokens so they restyle for free.

## lucide-react

Icon set. Direct named imports; size via `className` (`size-4`) or the `size` prop; color via
token-backed classes, never raw hex.

---

# Backend

## NestJS

- One **module** per domain (`accounts`, `trades`, `health` — only `health` is built today);
  controllers are thin, services hold logic. Account-owned queries are scoped by `accountId`.
- Global `ValidationPipe` (`whitelist: true, transform: true`) in `main.ts`; CORS configured with the
  frontend origin.
- The only global guard is `ThrottlerGuard`, and routes are open.
- Use Nest exceptions (`NotFoundException`, `ForbiddenException`, …); a global exception filter shapes
  them into `{ success, message }`.
- A global response interceptor wraps successful returns in `{ success: true, message, data }`.

```typescript
// main.ts (essentials)
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
app.enableCors({ origin: process.env.CORS_ORIGIN })
app.setGlobalPrefix("api")
```

## `@nestjs/swagger` (OpenAPI docs)

Interactive API docs at **`/api/docs`** (spec JSON at **`/api/docs-json`**), wired in `main.ts` via
`DocumentBuilder` + `SwaggerModule.setup(...)`. It is the primary way to exercise endpoints by hand —
there is no Postman collection.

**Rules:**

- **Document every endpoint as you build it**, not afterwards: `@ApiTags("<domain>")` on the
  controller, `@ApiOperation({ summary })` per handler, and an `@ApiOkResponse`/`@ApiCreatedResponse`
  whose `schema.example` shows the **wrapped** envelope (`{ success, message, data }`) — the response
  interceptor wraps the return value, so a bare DTO example would misrepresent the real payload.
- **Annotate DTO fields with `@ApiProperty`** (`@ApiPropertyOptional` for optional ones) alongside the
  `class-validator` decorators. The DTO is the single source of truth for the request contract, and
  Swagger reads it.
- **The docs path is exempt from helmet's CSP** (see the helmet section) — keep the exemption scoped
  to `/api/docs`; don't relax CSP globally to make the UI work.
- The setup path is **literal** and independent of `setGlobalPrefix("api")` — `SwaggerModule.setup(
  "api/docs", ...)` is what puts it under `/api/docs`. Changing the global prefix won't move it.
- Because the API is unauthenticated, the docs page is open too — another reason the backend stays
  local (see architecture.md → Single-user, no auth).

## Prisma

- Single injectable `PrismaService extends PrismaClient` (connects `onModuleInit`). Inject it into
  services; **never** `new PrismaClient()` elsewhere.
- Schema in `prisma/schema.prisma`; change it via `npx prisma migrate dev --name <change>`; commit
  migrations. `prisma generate` runs on install/migrate.
- Use `select`/`include` deliberately.
- The schema is two models: **`TradingAccount`** and **`Trade`** (no `User`, no `userId`).
  `TradeSide` (`LONG | SHORT | LIQUIDATION`) and `TradeStatus` (`OPEN | CLOSED`) are **enums**. A raw
  imported broker row may be kept in a `Json` column for traceability.
- **Account-owned queries are scoped by `accountId`** — that is the only scoping dimension; there is
  no user to scope to.
- `@@unique([accountId, ticket])` makes a broker-CSV re-import idempotent;
  `@@index([accountId, closedAt])` serves the equity curve ordered by close time.

```typescript
// trades.service.ts (target)
const items = await this.prisma.trade.findMany({
  where: { accountId },
  orderBy: { closedAt: "asc" },
})
```

## class-validator + class-transformer

- Every request body is a **DTO class** with validation decorators (`@IsEmail`, `@IsString`,
  `@IsNumber`, `@IsEnum`, `@IsOptional`, `@IsDateString`, …).
- `whitelist: true` strips unknown properties; `transform: true` coerces query params (e.g. a date
  range or numeric P&L filter) to their typed form.

```typescript
export class CreateTradeDto {
  @IsString() @MinLength(1) symbol: string
  @IsEnum(TradeSide) side: TradeSide
  @IsNumber() entryPrice: number
  @IsNumber() exitPrice: number
  @IsNumber() netPnl: number
  @IsOptional() @IsNumber() fees?: number
  @IsDateString() openedAt: string
  @IsDateString() closedAt: string
  @IsOptional() @IsString() ticket?: string
}
```

## Config validation (`@nestjs/config` + class-validator)

Configuration is **validated at boot** so a bad env crashes the app at startup, not on the first
request. `config/env.validation.ts` defines an `EnvironmentVariables` class with class-validator
decorators; `ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv })`
runs it.

- The full env surface is small: **`DATABASE_URL`** (required), plus `NODE_ENV`, `CORS_ORIGIN`, and
  `PORT` with defaults.
- `config/configuration.ts` returns a **typed, namespaced** object. In feature code read config via
  `ConfigService.get(...)` / `getOrThrow(...)`, **never** `process.env`.

## helmet + `@nestjs/throttler` (security)

- helmet supplies the security headers in `main.ts`. It is applied to **every path except
  `/api/docs`**: Swagger UI boots from inline scripts, which helmet's default CSP (`script-src
  'self'`) blocks, leaving a blank page. The API otherwise serves only JSON, so the docs route is the
  sole HTML surface — exempt just that path rather than weakening CSP globally.

  ```typescript
  const helmetMiddleware = helmet()
  app.use((req, res, next) =>
    req.path.startsWith("/api/docs") ? next() : helmetMiddleware(req, res, next),
  )
  ```

  Verify with `curl -D - -o /dev/null http://localhost:3001/api/health` (CSP header present) vs
  `/api/docs` (absent). CSP is browser-enforced, so a plain `curl` of the docs page returns 200 even
  when the UI is broken — check the header, not just the status code.
- A **global** `ThrottlerGuard` (via `APP_GUARD`) rate-limits everything — it is now the **only**
  global guard. Tighten a specific route with `@Throttle(...)` if it ever needs it.
- Rate limiting is basic hygiene, **not** an access control: the API is open by design and is meant
  for local/personal use only.

## nestjs-pino + `LoggingInterceptor` (logging)

- `LoggerModule.forRoot({ pinoHttp: { autoLogging: false, ... } })`; `app.useLogger(app.get(Logger))`
  and create the app with `bufferLogs: true`. `pino-pretty` transport in dev only; redact
  any sensitive headers.
- `autoLogging` is **off** so a single `LoggingInterceptor` owns request logs (method, url, status,
  latency). Never `console.log` in app code — inject the pino logger.

## PrismaExceptionFilter

A dedicated `@Catch(Prisma.PrismaClientKnownRequestError)` filter maps DB error codes to clean HTTP
responses, keeping the `{ success: false, message }` envelope:

- `P2002` (unique constraint) → **409 Conflict** (e.g. a duplicate `ticket` on CSV import)
- `P2025` (record not found) → **404 Not Found**
- `P2003` (FK constraint) → **400 Bad Request**

Register it **before** `AllExceptionsFilter` in `useGlobalFilters(...)` so Prisma errors are handled
by the specific filter and never fall through to the generic 500.

## Graceful shutdown

- `app.enableShutdownHooks()` in `main.ts` so Prisma disconnects cleanly on SIGTERM/SIGINT.

## Testing (Jest)

- **Unit:** `*.service.spec.ts` next to each service — logic with `PrismaService` mocked.
- **e2e:** `test/*.e2e-spec.ts` — real HTTP through the app against a dedicated test database.

---

## CSV import / export

- **Export** (**backend**, `papaparse`) *(2026-07-17 — moved server-side; supersedes the client-side
  `Blob` plan)*: `GET /api/trades/export?<filters>` streams the **filtered** ledger as a `text/csv`
  attachment. It reuses the table's `enrich → filter` pipeline (so `index`/`balanceAfter`/sort match the
  screen; no page slice) and builds the file with `Papa.unparse({ fields, data })` — the `{fields,data}`
  form so the header row is emitted even for an empty result, and papaparse owns escaping (a comma or
  quote in a symbol/ticket can't corrupt a row). The route takes `@Res() res: express.Response` and
  `res.send(csv)`, which puts Nest in manual-response mode so the global `ResponseInterceptor` envelope
  is skipped and the body stays raw CSV. The frontend never shapes a cell — `ExportCsvButton` builds the
  URL from `filtersToParams` and clicks a transient `<a>`; the server's `Content-Disposition` names and
  saves the file (no `Blob`, no whole-set fetch). **papaparse is isomorphic** — the same lib parses on
  import and unparses on export; it lives in the **backend** deps here because generation is server-side.
- **Import** (backend or frontend parse): a broker CSV maps to `CreateTradeDto[]`; validate every row,
  scope to the target `accountId`, and dedupe on `ticket` (`@@unique([accountId, ticket])`) so
  re-importing is idempotent. `papaparse`'s `parse` is the natural fit when file import lands.

---

## Out of scope (for now)

See project-overview.md for the current scope. There is **no AI**, no live market-data feed, and no
order execution in this product — do not add an AI SDK, a market-data client, or a broker API. No
payment integration is wired. If any new integration is introduced, document its pattern here first.
