# Auth & Security — Engineering Decisions

> ⚠ **Status (read first).** The auth *client* is real and lives in the **frontend**
> (`shared/lib/axios.config.ts`, `shared/stores/auth.store.ts`, `features/auth/api/auth.service.ts`,
> `features/auth/schemas/auth.schema.ts`). The auth *server* now **exists** — `modules/auth`
> (email-OTP signup, `login`/`logout`/`me`), a global `jwt-auth.guard.ts`, and JWT in **httpOnly
> cookies** (`access_token` + `refresh_token`), all rate-limited. **One gap remains:** there is **no
> `POST /auth/refresh` handler** yet, so the client's transparent 401 → refresh → retry flow can't
> complete server-side. **Pivot note:** the app is now **per-user** (Trade Journal), not multi-tenant —
> the target JWT payload is just the user's id (`sub`); the live token still carries the pre-pivot
> tenant/role claims. Entries below describe the client design and the server contract; see Gotchas.

---

### Tokens live in httpOnly cookies, never in JS-readable storage

**What / Where / Why** — The axios instance sets `withCredentials: true`
([`shared/lib/axios.config.ts:19`](../../../frontend/src/shared/lib/axios.config.ts)) and every
service call rides it ([`features/auth/api/auth.service.ts`](../../../frontend/src/features/auth/api/auth.service.ts)).
The server is expected to set the session as an **httpOnly** cookie; the browser attaches it
automatically. No token is ever stored in `localStorage` or read by app code.

**Learn:**
1. **Vocabulary**
   - **httpOnly cookie** — a cookie JavaScript *cannot* read (`document.cookie` won't show it); only
     the browser sends it back on requests.
   - **XSS (cross-site scripting)** — attacker-injected JS running in your page.
   - **`withCredentials`** — tells the browser to include cookies on cross-origin requests.
2. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — any XSS payload can read this and exfiltrate the session
   localStorage.setItem("accessToken", token);
   axios.defaults.headers.Authorization = `Bearer ${localStorage.getItem("accessToken")}`;

   // ✅ shared/lib/axios.config.ts — the browser holds the cookie; JS never touches it
   const axiosInstance = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });
   ```
3. **Plain-english why** — A token in `localStorage` is readable by *any* script on the page, so one
   XSS bug hands over the session. An httpOnly cookie is invisible to JS, so the same XSS can't steal
   it. You trade in one class of risk (need CSRF protection) for removing a worse one.
4. **Where else you'd use this** — refresh tokens; "remember me" sessions; CSRF double-submit tokens;
   any credential a browser must send but app code should never see.
5. **Rule of thumb** — Session credentials go in httpOnly cookies; never in `localStorage`/`sessionStorage`.

---

### Transparent 401 → refresh → retry, with a single-flight queue

**What / Where / Why** — The response interceptor
([`shared/lib/axios.config.ts:37-81`](../../../frontend/src/shared/lib/axios.config.ts)) catches a
`401`, calls `/auth/refresh` once, and replays the original request. Concurrent 401s while a refresh
is in flight are **queued** (`isRefreshing` + `failedQueue`) and resumed together; if refresh fails,
the queue is rejected and the user is sent to `/login`.

**Learn:**
1. **Vocabulary**
   - **Access vs refresh token** — a short-lived access token for requests; a long-lived refresh token
     to mint a new access token without re-login.
   - **Single-flight / de-duplication** — collapsing many simultaneous identical operations into one.
   - **Thundering herd** — many requests all triggering the same expensive action at once.
2. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — 5 parallel calls all 401 → 5 concurrent refreshes → token rotation races, logout loops
   if (status === 401) { await refresh(); return axios(originalRequest); }

   // ✅ axios.config.ts — first 401 refreshes; the rest wait in line, then all replay
   if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
     if (isRefreshing) {
       return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
         .then(() => axiosInstance(originalRequest));
     }
     originalRequest._retry = true; isRefreshing = true;
     try { await refreshAccessToken(); processQueue(null); return axiosInstance(originalRequest); }
     catch (e) { processQueue(e); window.location.href = "/login"; return Promise.reject(e); }
     finally { isRefreshing = false; }
   }
   ```
3. **Plain-english why** — If a page fires several requests at once and the token just expired, they'll
   all 401 together. Refreshing per-request causes a stampede and, with rotating refresh tokens, a race
   where refreshes invalidate each other and log the user out. Doing exactly one refresh and queueing the
   rest fixes both — one network call, everyone resumes.
4. **Where else you'd use this** — de-duping concurrent cache-misses (cache stampede); one config fetch
   shared by many callers; a single reconnect for many pending socket sends; debounced token/secret rotation.
5. **Rule of thumb** — When many callers need the same one-time refresh, do it once and make the rest wait for the result.

---

### Don't retry the refresh endpoint itself (break the loop)

**What / Where / Why** — [`shared/lib/axios.config.ts:45,47`](../../../frontend/src/shared/lib/axios.config.ts):
`isAuthEndpoint = url.includes("/auth/refresh")`, and the retry branch is skipped for it. A `401` from
`/auth/refresh` (dead session) must go straight to logout, not trigger another refresh.

**Learn:**
1. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — refresh 401s → interceptor refreshes again → 401 → … infinite loop
   if (status === 401) { await refresh(); ... }

   // ✅ axios.config.ts — the refresh call is exempt from the refresh-retry
   const isAuthEndpoint = originalRequest?.url?.includes("/auth/refresh");
   if (status === 401 && !originalRequest._retry && !isAuthEndpoint) { ... }
   ```
2. **Plain-english why** — The mechanism that *recovers* from a 401 must not apply to *itself*, or a
   permanent failure becomes an infinite loop. The `_retry` flag guards the same thing for normal
   requests: each request gets exactly one refresh attempt.
3. **Where else you'd use this** — a logging transport must not log its own failures; a retry wrapper
   must exclude the retry-trigger; cache-fill must not recurse into cache-fill; error middleware must not throw into itself.
4. **Rule of thumb** — A recovery mechanism must exempt itself and cap its own attempts.

---

### Client auth state is UX-only; the server is the source of truth

**What / Where / Why** — [`shared/stores/auth.store.ts`](../../../frontend/src/shared/stores/auth.store.ts)
holds `user` + a three-state `status` (`loading | authenticated | unauthenticated`), hydrated once from
`GET /auth/me`. Its own comment states it is "client-side and UX-only — the backend remains the
authorization source of truth."

**Learn:**
1. **Plain-english why** — Anything in the browser can be edited by the user, so client state can
   decide what to *show* (menus, redirects, spinners) but must never be trusted to *authorize*. The
   server re-checks every protected request regardless of what the store says. The explicit `loading`
   state also prevents a "flash of logged-out UI" before `/auth/me` resolves.
2. **Where else you'd use this** — feature-flag gating in the UI (server still enforces); role-based
   menu hiding (server still checks roles); optimistic UI that the server validates; showing a paywall
   while the server enforces entitlement.
3. **Rule of thumb** — Client state decides what to *render*; only the server decides what's *allowed*.

---

### Validate on the client with Zod, but mirror — never replace — server rules

**What / Where / Why** — [`features/auth/schemas/auth.schema.ts`](../../../frontend/src/features/auth/schemas/auth.schema.ts)
defines `loginSchema`/`signupSchema`, derives types with `z.infer`, cross-validates `confirmPassword`
with `.refine`, and bounds the password to **8–72 chars** — explicitly "mirrors the backend DTO rules."

**Learn:**
1. **Vocabulary**
   - **`z.infer`** — derive the TS type *from* the validation schema, so type and runtime check can't drift.
   - **DTO** — Data Transfer Object; the server's shape/rules for an incoming request body.
2. **Plain-english why** — Client validation is a fast UX courtesy (instant feedback, no round-trip),
   not a security boundary — it can be bypassed. So it must *duplicate* the server's rules, not stand in
   for them. The `72` cap is not arbitrary: **bcrypt silently truncates input past 72 bytes**, so both
   sides reject longer passwords to avoid a confusing security footgun.
3. **Where else you'd use this** — any form with a matching backend DTO; shared validation in a
   monorepo (`z.infer` for both ends); config-file validation; API-boundary parsing of untrusted JSON.
4. **Rule of thumb** — Validate on the client for UX and on the server for safety — same rules, two purposes.

---

## Gotchas / Learned (auth-security)

- **The refresh endpoint is the missing piece.** The server implements OTP signup, `login`, `logout`,
  `me`, and sets both `access_token` and `refresh_token` httpOnly cookies — but there is **no
  `POST /auth/refresh` handler** ([`auth.controller.ts`](../../../backend/src/modules/auth/auth.controller.ts)),
  even though the client's interceptor calls it on every 401 and the DB already stores a
  `hashedRefreshToken`. **Lesson:** the client is ahead of the server here — token rotation (verify the
  presented refresh token against the stored hash, mint a new access token, re-set the cookie) must be
  implemented before the silent-refresh UX actually works. Track as `[~]`, not done.
- **Cross-cutting server hardening is in place at the composition root** — `helmet`, `cookie-parser`,
  `ThrottlerGuard`, CORS `credentials: true`, `ValidationPipe({ whitelist: true })`
  ([`backend/src/main.ts`](../../../backend/src/main.ts), [`app.module.ts`](../../../backend/src/app.module.ts)).
  See [backend.md](backend.md) for the guard-ordering and global-hardening entries. `(cross-reference)`
- **`hashedRefreshToken` backs refresh-token rotation** — the `User.hashedRefreshToken` column
  ([`schema.prisma`](../../../backend/prisma/schema.prisma)) stores a bcrypt hash of the *current* refresh
  token, written by `issueTokens` and nulled on `logout`, so the server can detect reuse/replay once the
  `/auth/refresh` handler lands. **Lesson:** persist a *hash* of the live refresh token, never the token
  itself — you can still validate the presented token (bcrypt-compare) and revoke it (null the column =
  logged out everywhere) without ever storing a usable secret.
