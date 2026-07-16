# Library Docs

How **Trade Journal** uses each third-party library — the project-specific patterns and constraints,
not general API docs. Read the relevant section before implementing a feature that touches one of
these. The app is split into `frontend/` (Next.js) and `backend/` (NestJS); sections are grouped
accordingly.

Order of authority: `node_modules/next/dist/docs` (for Next.js) → this file → general knowledge.

---

# Frontend

## axios

The single most important frontend pattern. **All authenticated backend calls go through the shared
instance** — never a bare `fetch`/`axios()`.

```typescript
// shared/lib/axios.config.ts
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // backend origin + /api
  withCredentials: true,                    // auth rides on HTTP-only cookies
})
```

The response interceptor owns cross-cutting concerns:

- **401** → single-flight token refresh (`POST /auth/refresh`) + replay original request; on refresh
  failure, redirect to `/login`. Concurrent 401s queue behind one refresh (`isRefreshing` +
  `failedQueue`).
- **403** → toast "You don't have access to that."
- **5xx** → toast a generic message + console error.

**Rules:**

- Import the default export from `@lib/axios.config` in every service.
- Services return unwrapped, typed domain data (unwrap the `{ success, message, data }` envelope →
  `.data.data`).
- Don't re-implement 401/403/5xx per call — the interceptor owns it.
- The refresh call uses a bare `axios.post` so it can't recurse through the interceptor.
- Feature services live in `features/<domain>/api/*.service.ts` (`auth.service`, `accounts.service`,
  `trades.service`). Every service returns user-scoped, typed domain data (raw trades — the metrics
  are derived on the client, not by the service).

## Chart.js (`react-chartjs-2`)

The dashboard's seven charts (equity curve, daily/weekday/hourly/asset/direction bars, win/loss
doughnut). The design uses Chart.js directly; we wrap it with `react-chartjs-2`.

**Rules:**

- **Dynamic-import every chart** (`next/dynamic`, `{ ssr: false }`) — Chart.js is heavy and needs the
  browser `canvas`. Keep charts out of first paint and off the server.
- **Register only what you use** (`Chart.register(LineElement, BarElement, ArcElement, …)`) — don't
  pull in `chart.js/auto` (it bundles everything). One registration module, imported by the wrappers.
- **Read colors from the token CSS vars**, never a hardcoded palette copy. Signed data (daily/weekday/
  hourly/asset/direction) colors each bar by sign: **up = green, down = red**. The equity line uses
  brand/blue with a green→transparent gradient fill; the doughnut uses green/red/grey for
  wins/losses/breakeven; long-vs-short uses green/blue/red. When the accent theme changes, charts
  restyle because the vars change.
- **Shared chart defaults** (`shared/config/chart-theme.ts`): `responsive: true,
  maintainAspectRatio: false`, dark grid (`rgba(255,255,255,.055)`), muted ticks, tooltip on the
  surface color, money-formatted axis/labels. Each chart passes only its data + type-specific options.
- **Destroy/rebuild on data change** is handled by `react-chartjs-2` via the `data` prop — pass fresh
  data derived from the metric bundle; don't hold a manual Chart instance.
- Chart bodies have a **fixed height** (the Panel `chart-body`) so `maintainAspectRatio: false` fills
  it; the wide equity panel is taller.

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
  inline-`style` exceptions (via `var(--color-*)`): panel/brand gradients, the app background grid,
  and P&L-proportional bar/heatmap widths.
- For conditional/merged classes use the `cn` helper from `@lib/utils`. Never concatenate class
  strings by hand.

## React Hook Form + Zod

Every form (login, signup, add/edit trade, account settings, filters). The Zod schema is the single
source of truth.

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

Cross-cutting client state only: `auth.store` (user/session), the **active-account** store, the
**filter** store that drives the dashboard recompute, and the **accent-theme** preference.

- Select narrow slices: `useAuthStore((s) => s.user)`.
- Auth checks here are **UX only** — the backend is the authorization source of truth.
- The accent-theme store writes `document.body.dataset.accent` (green/violet/gold) and persists the
  choice; components read semantic tokens so they restyle for free.

## lucide-react

Icon set. Direct named imports; size via `className` (`size-4`) or the `size` prop; color via
token-backed classes, never raw hex.

---

# Backend

## NestJS

- One **module** per domain (`auth`, `accounts`, `trades`, `mail`, `health`); controllers are thin,
  services hold logic. Every per-user query is scoped to `userId` (+ `accountId` where account-owned).
- Global `ValidationPipe` (`whitelist: true, transform: true`) in `main.ts`; `cookie-parser` enabled;
  CORS configured with `credentials: true` and the frontend origin.
- Use Nest exceptions (`NotFoundException`, `ForbiddenException`, …); a global exception filter shapes
  them into `{ success, message }`.
- A global response interceptor wraps successful returns in `{ success: true, message, data }`.

```typescript
// main.ts (essentials)
app.use(cookieParser())
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
app.enableCors({ origin: process.env.CORS_ORIGIN, credentials: true })
app.setGlobalPrefix("api")
```

## Prisma

- Single injectable `PrismaService extends PrismaClient` (connects `onModuleInit`). Inject it into
  services; **never** `new PrismaClient()` elsewhere.
- Schema in `prisma/schema.prisma`; change it via `npx prisma migrate dev --name <change>`; commit
  migrations. `prisma generate` runs on install/migrate.
- Use `select`/`include` deliberately; **never select or return `passwordHash`**.
- `TradeSide` (`LONG | SHORT | LIQUIDATION`) and `TradeStatus` (`OPEN | CLOSED`) are **enums**. A raw
  imported broker row may be kept in a `Json` column for traceability.
- **Every query is scoped to the owner** — `userId`, plus `accountId` where account-owned. A user can
  never read or write another user's trades or accounts.

```typescript
// trades.service.ts (target)
const items = await this.prisma.trade.findMany({
  where: { userId, accountId },
  orderBy: { closedAt: "asc" },
})
```

## Passport JWT + cookies

- Two tokens: short-lived `access_token`, long-lived `refresh_token`, both **HTTP-only cookies**.
- `JwtStrategy` extracts the token from the request cookie (custom extractor), validates, and returns
  the user payload (`sub` = userId).
- Global `JwtAuthGuard`; `@Public()` decorator opts public routes (`/auth/signup/*`, `/auth/login`,
  `/auth/refresh`, health) out.
- `/auth/refresh` validates the refresh token and re-issues both cookies. `/auth/logout` clears them.
  (Note: the refresh handler is a known gap in the current scaffold — see engineering/auth-security.md.)

## bcryptjs

- Hash passwords with a cost factor of 10–12 on register and password change.
- Compare with `bcrypt.compare` on login. Never log, return, or expose the hash.

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

- Validate presence/type of `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and the mail
  credentials; optional `PORT`, `CORS_ORIGIN`, `NODE_ENV` with defaults.
- `config/configuration.ts` returns a **typed, namespaced** object (`jwt.accessSecret`, `mail.user`,
  …). In feature code read config via `ConfigService.get(...)` / `getOrThrow(...)`, **never**
  `process.env`.

## helmet + `@nestjs/throttler` (security)

- `app.use(helmet())` in `main.ts` for security headers.
- A **global** `ThrottlerGuard` (via `APP_GUARD`) rate-limits everything; tighten limits on
  `/auth/*` (brute force) with a route-level `@Throttle(...)`.

## nestjs-pino + `LoggingInterceptor` (logging)

- `LoggerModule.forRoot({ pinoHttp: { autoLogging: false, ... } })`; `app.useLogger(app.get(Logger))`
  and create the app with `bufferLogs: true`. `pino-pretty` transport in dev only; redact
  `authorization` / `cookie` headers.
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

## Auth decorators (`@Public`, `@CurrentUser`) + graceful shutdown

- `@Public()` (sets metadata) marks the few routes the global `JwtAuthGuard` should skip.
- `@CurrentUser()` is a param decorator returning `request.user` (set by `JwtStrategy`), so the
  `userId` always comes from the verified JWT: `list(@CurrentUser("id") userId: string)`.
- `app.enableShutdownHooks()` in `main.ts` so Prisma disconnects cleanly on SIGTERM/SIGINT.

## nodemailer (Gmail SMTP) — sign-up OTP

- The `mail` module sends the sign-up email OTP via Gmail SMTP (nodemailer). Credentials live only in
  `backend/.env` (`GMAIL_USER` / app password) — never `NEXT_PUBLIC_`, never sent to the client.
- Keep mail behind the `MailService` interface so the transport is swappable; a mail outage must not
  crash a request (fire-and-forget where the send isn't on the critical path).

## Testing (Jest)

- **Unit:** `*.service.spec.ts` next to each service — logic with `PrismaService` mocked.
- **e2e:** `test/*.e2e-spec.ts` — real HTTP through the app against a dedicated test database.

---

## CSV import / export

- **Export** (frontend): the design builds a CSV of the **filtered** trade set client-side (`Blob` +
  object URL + download link) — reuse a small `shared/lib/csv.ts` helper; no library needed.
- **Import** (backend or frontend parse): a broker CSV maps to `CreateTradeDto[]`; validate every row,
  scope to `userId`/`accountId`, and dedupe on `ticket` (unique per account) so re-importing is
  idempotent. Prefer native parsing / a tiny parser before adding a CSV dependency.

---

## Out of scope (for now)

See project-overview.md for the current scope. There is **no AI**, no live market-data feed, and no
order execution in this product — do not add an AI SDK, a market-data client, or a broker API. No
payment integration is wired. If any new integration is introduced, document its pattern here first.
