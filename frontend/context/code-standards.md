# Code Standards

Conventions for **Trade Journal**. The frontend (Next.js) is the primary surface of these docs;
backend (NestJS) standards live in the relevant sections below and in library-docs.md. Follow these
every session — they prevent pattern drift. See architecture.md for structure.

---

## Engineering Mindset

- **Think before implementing** — understand what and why before writing code.
- **Read context files first** — verify against architecture.md and project-overview.md.
- **Scope is sacred** — build only what the current slice requires.
- **Build vertical slices, back to front** — model + module + endpoint, then service + UI;
  verify the whole slice in the running app before moving on.
- **Every slice must be testable** — if it can't be exercised through the UI/API after
  implementation, it's incomplete.
- **Clean over clever** — simple, readable code a junior can follow beats clever abstractions.
- **Fail gracefully** — handle errors at the boundary; surface human-readable messages; never
  let a promise float.
- **Plan for reuse** — decide where logic/UI belongs (feature-local vs. shared) before writing.

---

## TypeScript

- Strict mode is on — no exceptions.
- Never use `any` — use `unknown` and narrow.
- Avoid type assertions (`as`) unless truly necessary, and comment why.
- All function parameters and return types are explicitly typed.
- Use `type` for object shapes/unions; `interface` for extendable shapes (component props).
- All async code handles its errors.
- `const` by default; `let` only when reassignment is required.

---

## Next.js 16 (frontend)

- App Router only. React 19 APIs throughout.
- **This is not the Next.js in your training data** — read `node_modules/next/dist/docs/`
  before using a Next.js-specific feature; heed deprecation notices (see `AGENTS.md`).
- **Server Components by default.** Add `"use client"` only when a component needs
  `useState`/`useEffect`, browser APIs/event listeners, a Zustand store, or a client-only
  library. The filter bar, the trades-table controls, the accent switcher, and **every recharts
  chart** are client boundaries. Push the boundary as low in the tree as possible.
- Never add `"use client"` to a layout unless required.
- Pages/layouts in `src/app` stay thin — they compose feature components and hold no business
  logic. One route group: `(app)` for the cockpit (rendered by `AppShell`, no guard); `/` redirects
  to `/dashboard`. There is no `(auth)` group — the app has no login.
- Use `next/font` (Inter), `next/image` for images, and `next/link` for navigation. **Dynamic-import
  the charts** (`next/dynamic`, `ssr: false`).

### Folder & file architecture (frontend)

- `src/app/*` — route entries only (route groups, layouts, `page.tsx`).
- `src/features/<domain>/` — one vertical slice per domain (`dashboard`, `accounts`, `settings`).
  A slice carries only the folders it uses: `components/`, `api/` (services),
  `schemas/` (Zod), `hooks/`, `lib/` (pure logic, e.g. `dashboard/lib/metrics.ts`),
  `constants.ts`/`data/`, `stores/`, `types/`. Nest by kebab-case folder + `index.ts` barrel as a
  slice grows.
- **Promote on the second use.** A component used by one feature stays feature-local; promote it to
  `src/shared/components` only once a second feature needs it. `shared` never imports from
  `features`/`app`; a feature never imports another feature's internals.
- `src/shared/` — `components/ui` (shadcn) + shared composites (`AppShell`, `Sidebar`, `Topbar`,
  `Logo`), `config/` (sidebar nav, chart theme), `constants/`, `lib/` (`axios.config.ts`,
  `utils.ts`, format helpers, csv), `stores/` (Zustand), `hooks/`, `types/`, `styles/theme.css`.

---

## Data Fetching & Services (frontend)

- **All backend calls go through the shared axios instance** (`@lib/axios.config`) via feature
  **services** (`features/<domain>/api/<domain>.service.ts`). Never a bare `fetch`/`axios()` in a
  component.
- Services return **unwrapped, typed domain data** (unwrap the `{ success, message, data }`
  envelope). The interceptor owns 403 and 5xx — don't reimplement per call. There is no 401-refresh
  flow (no auth).
- A Client Component calls a service in an effect/handler (or via a small data hook); render
  **loading / empty / error** states for every data view (see ui-rules.md → States).
- **Fetch on the server, not in an effect.** The cockpit's account + trade set are loaded by
  `(app)/layout.tsx` via `features/dashboard/api/dashboard.loader.ts` and passed to
  `DashboardProvider`. A `useEffect` fetch cannot start until the JS has downloaded and hydrated —
  measured at ~605ms of dead time with a skeleton on screen. Reach for a client fetch only for data
  that genuinely cannot be known on the server.
- **Server-loaded data goes through Context, never a module store.** `useSyncExternalStore`'s server
  snapshot does not see a mutation made during the same render, so a zustand singleton seeded at
  render time yields **empty server HTML**. Use a provider (see `DashboardProvider`); keep zustand for
  client-only state such as filters.
- **Derived analytics are computed, not fetched.** The dashboard fetches the raw trade set
  (`trades.service`) and computes every metric via the pure `features/dashboard/lib/metrics.ts` —
  keep computation out of components and services (services return raw trades only).

---

## Forms & validation

- Every form uses **React Hook Form + Zod** (both installed): add/edit trade, account settings, and
  the trade filters. The Zod schema is the **single source of truth**, lives in the
  feature's `schemas/`, and types are derived with `z.infer`.
- Validate before calling a service. Build inputs from the shared form-field components
  (`Field`/`Input`/`Select`), not raw inputs.
- Always show the form's states: inline validation errors, a disabled/submitting state, and
  success/error feedback (toast via sonner where appropriate).

---

## Client State (Zustand)

- Cross-cutting client state only — the **active-account** store, the **filter** state that drives the
  dashboard, and the **accent-theme** preference. Local UI state stays in the component.
- Select narrow slices: `useAccountStore((s) => s.activeAccountId)`.

---

## Frontend Performance & Rendering

Learn these in **layers** — foundational habits first, advanced optimizations last. Follow them in
order: the early layers prevent most performance problems before the later ones ever matter. The
bundled Next.js docs (`node_modules/next/dist/docs/`) outrank memory — re-read the relevant guide
before using a version-specific API (per AGENTS.md).

### Layer 1 — Write good code by default (habits)

- **Server Components by default; `"use client"` is the exception** — add it only when a component
  needs state/effects, event handlers, browser APIs, or a client-only library. Server Components ship
  **zero JS**. (See architecture.md → Rendering & Data Flow.)
- **Keep `"use client"` boundaries small** — push them as low as possible; extract the interactive
  leaf. `DashboardPage(server) → Panels(server) → FilterBar(client)` / `EquityChart(client)`.
- **Small, single-responsibility, reusable components** — no 800-line `Dashboard.tsx`; split into
  `Overview`, `FilterBar`, `StatsGrid`, `Charts`, `CalendarHeatmap`, `TradesTable`. Pages stay thin.
- **Business logic out of JSX** — metric math lives in `lib/metrics.ts` (pure functions), not inline
  in a component. Components are **pure and props-driven**.
- **Fetch data on the server** when appropriate; **don't fetch the same data repeatedly** — fetch the
  trade set once and derive all panels from it.
- **`next/image`, `next/font`, `next/script`** — built-in asset optimizations.
- **Dynamic-import heavy UI** — `next/dynamic` (`ssr: false`) for the **recharts charts** and any
  heavy widget; load heavy libs on demand with `import()`. Keep them out of first paint.
- **Avoid unnecessary/large dependencies** — can native JS / Next / shadcn already do it? Prefer
  narrow imports (`import { TrendingUp } from "lucide-react"`), never `import *` / barrels.
- **Keep state local** — `useState` where it's used; lift only when shared; global store (Zustand) for
  cross-cutting only, with **narrow selectors**. **Avoid prop drilling** (prefer composition).
- **Stable list keys** (never the array index for trade rows — use the trade id);
  `memo`/`useMemo`/`useCallback` only with a measured reason (React 19's compiler reduces the need).
  The metric bundle is a good `useMemo` candidate over the filtered trade set once measured.
- **Clean-code hygiene** — name things well; focused files (`currency.ts`/`date.ts`, not a catch-all
  `utils.ts`); **never expose secrets** to the browser; **never an empty `catch`**.

> Follow Layer 1 consistently and you avoid most common performance issues. The rest is for when
> measurement (Layer 6) shows you actually need it.

### Layer 2 — Understand how Next.js renders

- **`"use client"` is transitive for imports, not for children.** Once a module has `"use client"`,
  everything it *imports and directly renders* joins the client bundle. A Server Component passed as
  **children** stays on the server — use the children-slot pattern to keep server UI inside a client
  shell (e.g. the `(app)` layout wraps the client `AppShell` and passes server pages as children).
- **Context isn't available in Server Components** — put providers in a `"use client"` component that
  takes `children`, rendered **as deep as possible**.
- **`server-only` / `client-only`** — import `server-only` in any module holding secrets/DB access so
  it can't be pulled into the client bundle. Only `NEXT_PUBLIC_` env vars reach the browser.
- **Request-time APIs opt the route into Dynamic Rendering** — `cookies()`, `headers()`,
  `searchParams` make the route dynamic. Use intentionally; wrap in `<Suspense>`.

### Layer 3 — Understand caching

Caching behavior changes across Next.js releases — **verify against the version you're on**; the
bundled docs are the source of truth.

- **`fetch` is NOT cached by default** in Next 16, and an uncached fetch **blocks render** until it
  resolves. Opt in deliberately. Trade data changes as you add/import trades — don't cache it.
- **Cache Components / `use cache`** (`cacheComponents: true`): `"use cache"` atop an async data
  function or component; set duration with `cacheLife(...)`.
- **Per-request dedup** — identical `fetch` calls are auto-memoized within one render; wrap non-`fetch`
  data (Prisma/ORM) in **`React.cache`** so repeated calls in a request share a result.

### Layer 4 — Avoid waterfalls

- **Sequential** (`await` one after another) **only when the next call depends on the previous
  result.** **Parallel** (`Promise.all`) **when the calls are independent.**

```tsx
// Bad — independent calls run sequentially (a needless waterfall)
const account = await getAccount();
const trades  = await getTrades();

// Good — independent calls start together
const [account, trades] = await Promise.all([getAccount(), getTrades()]);

// Correct sequential — the second call genuinely needs the first's result
const account = await getActiveAccount();
const trades  = await getTrades(account.id);
```

- Use **`Promise.allSettled`** when one request may fail and you don't want to lose the others.
- **Don't call a Route Handler from a Server Component** — call the data function / DB directly.

### Layer 5 — Streaming

- **`loading.js`** wraps a route segment in `<Suspense>` automatically — but a **layout** that reads
  uncached/runtime data **blocks navigation**; wrap that access in its own `<Suspense>` or move it
  into `page.js`.
- **Stream server→client with the `use` API** — pass an *unawaited* promise from a Server Component to
  a Client Component and read it with `use()` inside `<Suspense>`.
- **`<Link>` auto-prefetches** routes entering the viewport.

### Layer 6 — Measure before optimizing

```
Write → Measure → Find the bottleneck → Optimize → Measure again
```

- **Build → measure → optimize what matters.** Use Lighthouse, React DevTools Profiler,
  `@next/bundle-analyzer`, and Core Web Vitals (LCP / CLS / INP). If client-side metric compute over a
  large trade set ever shows up as slow, consider memoizing the bundle or a backend `analytics`
  summary endpoint — but **measure and get approval first** (see the performance rule below).

> **Performance approvals:** don't refactor for performance (memoization, virtualization, a backend
> analytics endpoint, chart down-sampling) without approval — call out the opportunity and the rough
> trade-off first, per the project's working preferences.

---

## Backend (NestJS) — production-grade conventions

### Four-layer structure

The backend is a modular monolith with four top-level layers (see architecture.md for the full tree):

- `src/config/` — typed, **boot-validated** configuration.
- `src/common/` — cross-cutting, domain-agnostic code (filters, interceptors, pipes, shared DTOs).
  **Imports nothing from `modules/`.**
- `src/prisma/` — the global `PrismaService` / `PrismaModule`.
- `src/modules/<domain>/` — one folder per domain: `accounts`, `trades`, `health`. (Only `health` is
  built today; `accounts` and `trades` are still to come.)

**Module boundary rule:** `common/` and `prisma/` never import from `modules/`; a module never imports
another module's internals — only its **exported service** through the Nest module system. This is
non-negotiable — it prevents circular dependencies.

### Module anatomy

Every domain folder has the same shape: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`,
`entities/`, `*.service.spec.ts`. The discipline:

- **Controllers are thin** — HTTP only: route, call the service, return. No Prisma, no logic. A
  handler over ~5 lines means logic leaked in.
- **Services own logic and persistence** — they scope account-owned queries by `accountId` and throw
  Nest exceptions (`NotFoundException`, …) — never return a raw DB error.
- **DTOs are the input contract** — every request body is a class with `class-validator` decorators
  (`@IsString`, `@IsEnum(TradeSide)`, `@IsNumber`, …). `ValidationPipe({ whitelist: true, transform:
  true })` strips undeclared properties. `update-*.dto.ts` uses `PartialType(CreateDto)`.
- **Entities are the output contract** — shape responses with class-transformer
  (`@Exclude()`/`@Expose()`).

### No auth — open routes, account-scoped queries

- **There is no authentication.** No `JwtAuthGuard`, no `@Public()`, no `@CurrentUser()`, no user
  identity. **Every route is open.** The only global guard is `ThrottlerGuard` (basic rate limiting).
- **Scope by `accountId`** — an account-owned read/write filters on the `accountId` it was given.
- helmet (security headers) and `@nestjs/throttler` are always on. CORS names the frontend origin.
- Because the API is unauthenticated, Trade Journal is a **local/personal** tool and is **not safe to
  expose publicly as-is**. Don't add a user/session/ownership concept without a deliberate decision —
  and don't assume one exists.
- With no auth layer, **DTO validation is the only guard on what enters the system** — treat it as
  load-bearing.

### Config & data access

- **Config is validated at boot** (`config/env.validation.ts`) — the app refuses to start on a
  missing/invalid `DATABASE_URL`. In feature code read config through `ConfigService`, **never**
  `process.env`.
- Inject the single `PrismaService`; **never** `new PrismaClient()` elsewhere. Use `select`/`include`
  deliberately.

### Errors, logging, lifecycle

- Throw Nest exceptions in services. `PrismaExceptionFilter` maps DB errors (P2002→409, P2025→404,
  P2003→400); `AllExceptionsFilter` catches the rest. Both emit `{ success: false, message }` and
  never leak internals. The `ResponseInterceptor` wraps successes in `{ success: true, message, data }`.
- Structured logging via **nestjs-pino** + a `LoggingInterceptor` (method, url, status, latency) —
  never `console.log`. `app.enableShutdownHooks()` for a clean Prisma disconnect.

### Testing

- **Unit tests** (`*.service.spec.ts`) cover service logic with Prisma mocked.
- **e2e tests** (`test/*.e2e-spec.ts`) hit real HTTP against a test database.

---

## UI components — install shadcn, don't hand-roll; text uses Typography

- **If shadcn/ui provides it, install it — never hand-write it.** For any standard UI primitive
  shadcn offers (`dialog`, `select`, `checkbox`, `dropdown-menu`, `popover`, `table`, `tabs`,
  `tooltip`, …) add it with the CLI:
  ```bash
  npx shadcn@latest add dialog select table
  ```
  It lands in `src/shared/components/ui/` in the project's style (`components.json`). **Do not
  re-implement a component shadcn already provides.**
- **Only build by hand** when shadcn has no equivalent: the dashboard composites (`Panel`, `StatCard`,
  `MarketTile`, `SideBadge`, `ResultBadge`, `CalendarHeatmap`, the recharts wrappers) or genuinely
  custom widgets. Compose those from the installed shadcn primitives + tokens.
- **All text goes through `Typography`** (`@components/ui/typography`) using its `variant`/`weight`
  props — not raw `text-*` size classes in feature/page code. Color and layout stay on `className`.

---

## Reuse Before Creating

1. **Search first** — grep `src/shared/components/ui`, `src/shared/components`, `src/shared/lib`, and
   the feature's own `components/`/`api/`/`lib/` for something that already does the job. Never
   reimplement an existing helper (currency/date format, csv, the metrics module) or service.
2. **Extend, don't fork** — extend a close utility/component (extra prop, optional param, variant)
   rather than cloning it.
3. **Place by reach** — used by one feature → feature-local; used by two or more → promote to
   `src/shared`. Promote on the *second* use.

- **Components** are composable and **props-driven** — no business logic baked in. Build on
  `shared/components/ui` primitives; compose feature composites (`TradeRow`, `StatCard`, `MarketTile`)
  from them.
- After building or promoting a shared component, add a row to **ui-registry.md**.

---

## Constants vs. Config vs. Data

Three buckets hold values outside components:

- **Constants** — the authoritative *value* of something (route paths, enum labels: sides, statuses,
  filter presets, sort options). Pure data; no icons, classes, or JSX. Lives in `constants/`.
- **Config** — a structured object that drives how something *renders/behaves* (sidebar nav links with
  icons+labels, chart theme defaults, side/result badge styles). Composes constants plus presentation.
  Lives in `config/`.
- **Data** — static **content** the UI renders that is *not* fetched from the API. Most app content
  comes from the **backend via services**, not from `data/` files. Lives in `data/`.

Config may import constants; constants must never import config. File naming: kebab-case — constants
`*.ts`, config `*.config.ts`, data `*.data.ts`.

---

## Naming

- **Folders:** kebab-case — `trade-row`, `calendar-heatmap`.
- **Component files:** PascalCase — `TradeRow.tsx`, `StatCard.tsx`. One component per file.
- **Hooks:** `useX.ts`. **Services:** `*.service.ts`. **Schemas:** `*.schema.ts`. **Pure logic:**
  `*.ts` under `lib/` (e.g. `metrics.ts`).
- **Constants/config/data:** kebab-case (`sidebar-nav.config.ts`, `trade-sides.ts`).

---

## Component Structure

```typescript
"use client" // only if needed

// 1. External imports
import { useState } from "react"
import { Button } from "@components/ui/button"

// 2. Internal imports (shared, then feature)
import { cn } from "@lib/utils"
import { tradesService } from "@features/dashboard/api/trades.service"

// 3. Types
type Props = { accountId: string }

// 4. Component
export function TradesTable({ accountId }: Props) {
  // state · derived · handlers · JSX
}
```

- Prefer named exports (route entries `page.tsx`/`layout.tsx` are the only defaults).
- Style with Tailwind classes using the design tokens. Sanctioned inline `style`: decorative
  gradients, the background wash, and **P&L-proportional widths** — all via `var(--color-*)`, never a
  hardcoded hex.
- No hardcoded hex or raw Tailwind color literals (incl. `text-white`/`bg-white` → use
  `text-foreground`/`bg-surface`) — use tokens (ui-tokens.md).
- **Don't write CSS files or hand-roll a component shadcn provides.**

---

## Error Handling

- Never use empty catch blocks.
- Console errors carry a context prefix: `[trades.service]`, `[useTrades]`, `[metrics]`.
- User-facing errors are human-readable — surface form validation/submit errors inline; show a
  friendly fallback (toast/banner) when the API is unavailable.

---

## Environment Variables

- **Frontend:** only `NEXT_PUBLIC_`-prefixed, non-secret values — chiefly `NEXT_PUBLIC_API_URL` (the
  backend origin + `/api`). **Never** put a secret in a `NEXT_PUBLIC_` variable.
- **Backend (`backend/.env`, never committed):** `NODE_ENV`, `DATABASE_URL`, `CORS_ORIGIN`, `PORT` —
  that's the whole surface. DB credentials are backend-only and never reach the browser.
- Keep a `.env.example` in each app documenting the required keys (no real values).

---

## Import Aliases (frontend `tsconfig.json`)

```typescript
import { Button } from "@components/ui/button"        // ./src/shared/components/ui
import { cn } from "@lib/utils"                         // ./src/shared/lib
import axiosInstance from "@lib/axios.config"           // shared axios
import { tradesService } from "@features/dashboard/api/trades.service"
// Never: import { Button } from "../../../shared/components/ui/button"
```

Available: `@/*`, `@app/*`, `@features/*`, `@shared/*`, `@components/*`, `@lib/*`.

---

## Comments

- No comments restating what the code does — code should be self-explanatory.
- Comments only for **why** — a non-obvious decision or constraint (e.g. a metric formula's rationale).
- Never leave `TODO` comments in committed code.

---

## Dependencies

Don't install a package without a clear reason. First check: does shadcn/ui already provide the
component? does Next.js/React/Nest already provide it? The charting dependency is **recharts**
(already installed); CSV import/export can use a small parser or native code — 
prefer native before adding a library. The stack is documented in architecture.md and each app's
`package.json` — update the Stack table when adding a dependency.
