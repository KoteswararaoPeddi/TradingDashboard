# Frontend — Engineering Decisions (Next.js App Router)

Grounded in the real Trade Journal frontend (`frontend/src`). Every entry references a file that exists.

---

### Server components by default; push `"use client"` to the leaves

**What / Where / Why** — The root layout ([`app/layout.tsx`](../../../frontend/src/app/layout.tsx)) and
the app-group layout ([`app/(app)/layout.tsx`](../../../frontend/src/app/(app)/layout.tsx)) are **server**
components. Interactivity is isolated in small client components — `GlobalHosts`
([`shared/components/GlobalHosts.tsx`](../../../frontend/src/shared/components/GlobalHosts.tsx)) and the
`AppShell` chrome — which carry the `"use client"` directive.

**Learn:**
1. **Vocabulary**
   - **Server Component** — renders on the server, ships **zero** JS to the browser; the default in the App Router.
   - **Client Component** — opts into browser JS (state, effects, event handlers) via `"use client"`.
2. **❌ naive vs ✅ our real code**
   ```tsx
   // ❌ naive — "use client" at the top of the layout makes the whole subtree client-rendered
   "use client";
   export default function AppLayout({ children }) { return <AppShell>{children}</AppShell>; }

   // ✅ app/(app)/layout.tsx — server layout wraps a client shell only where interactivity lives
   export default function AppLayout({ children }) { return <AppShell>{children}</AppShell>; }
   ```
3. **Plain-english why** — `"use client"` is contagious downward: put it high and everything below
   ships as JS. Keeping layouts on the server and marking only the interactive leaves keeps the JS
   bundle small and lets pages stream server-rendered.
4. **Where else you'd use this** — a static marketing page with one interactive form; a server-rendered
   table with a client filter bar; a dashboard shell (server) around interactive widgets (client).
5. **Rule of thumb** — Stay on the server by default; add `"use client"` at the smallest leaf that truly needs it.

---

### One polymorphic `Typography` component: visual variant decoupled from HTML element

**What / Where / Why** — [`shared/components/ui/typography/typography.tsx`](../../../frontend/src/shared/components/ui/typography/typography.tsx)
renders text through a single component. `cva` maps a `variant` (e.g. `display-2xl`, `h2`, `body-base`)
to token classes ([`typography.styles.ts`](../../../frontend/src/shared/components/ui/typography/typography.styles.ts)),
while a separate `elementMap` picks the semantic tag. `asChild` (Radix `Slot`) lets it lend its styles
to another element.

**Learn:**
1. **Vocabulary**
   - **`cva` (class-variance-authority)** — builds a className from typed variant props.
   - **Polymorphic component** — one component that can render as different HTML tags.
   - **`asChild` / `Slot`** — render *as* the child element instead of wrapping it, so styles merge onto it.
2. **❌ naive vs ✅ our real code**
   ```tsx
   // ❌ naive — visual size welded to the tag; a big <h1> that should be an <h2> for SEO is impossible
   <h1 className="text-5xl font-bold tracking-tight">…</h1>

   // ✅ typography.styles.ts — variant = looks, elementMap = semantics, chosen independently
   'display-2xl': 'text-display-2xl leading-16 tracking-[-1px]',
   export const elementMap = { 'display-2xl': 'h1', h2: 'h2', 'body-base': 'p', caption: 'span' }
   ```
3. **Plain-english why** — How big text *looks* and what tag it *is* are different concerns. Coupling
   them forces you to choose between correct heading order (accessibility/SEO) and the design. Splitting
   them lets a visually-huge element still be the semantically-correct tag, and centralizes the type
   scale so it can't drift across the app.
4. **Where else you'd use this** — Button/Link `asChild`; a `Card` that can be an `<article>` or `<li>`;
   any design-system primitive where look and semantics vary independently.
5. **Rule of thumb** — Separate a component's visual variant from the element it renders — choose each independently.

---

### `cn()` teaches tailwind-merge the custom type-scale tokens

**What / Where / Why** — [`shared/lib/utils.ts`](../../../frontend/src/shared/lib/utils.ts) doesn't just
`twMerge(clsx(...))`; it uses `extendTailwindMerge` to register the project's custom `text-*` sizes
(`text-body-base`, `text-label-lg`, …) as the `font-size` group.

**Learn:**
1. **Vocabulary**
   - **`tailwind-merge`** — dedupes conflicting Tailwind classes, keeping the last one *per group*.
   - **Class group** — tailwind-merge's notion of "these classes conflict" (all `text-size`, all `bg`, …).
2. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — twMerge thinks text-label-lg (a SIZE) and text-secondary-foreground (a COLOUR)
   //           are the same `text-*` group and silently drops one → colour vanishes
   export const cn = (...i) => twMerge(clsx(i));

   // ✅ shared/lib/utils.ts — register custom sizes so size ≠ colour in merge logic
   const twMerge = extendTailwindMerge({ extend: { classGroups: {
     "font-size": [{ text: ["display-2xl","h1","body-base","label-lg", /* … */ "caption"] }],
   }}});
   ```
3. **Plain-english why** — Out of the box, tailwind-merge only knows the default `text-*` sizes. Custom
   tokens named `text-<size>` collide with `text-<colour>` because both start with `text-`, so merging a
   size and a colour drops one — buttons silently lose their colour. Registering the custom sizes
   restores the correct grouping. This is a subtle bug you only catch by *seeing* a colour disappear.
4. **Where else you'd use this** — any Tailwind design system with custom token names; custom spacing or
   radius scales; shadcn projects that add bespoke `text-*`/`bg-*` tokens.
5. **Rule of thumb** — If you add custom Tailwind tokens, teach tailwind-merge about them or `cn()` will eat your styles.

---

### Content lives in `data`/`config`; shape in `types`; components stay presentational

**What / Where / Why** — Landing sections read from `data/*.data.ts` and `config/*.config.ts`, typed by
`types/*.types.ts`. E.g. [`Faq.tsx`](../../../frontend/src/features/landing/components/faq/Faq.tsx) just
`FAQS.map(...)`; the copy is in [`faq.data.ts`](../../../frontend/src/features/landing/data/faq.data.ts),
the shape in [`faq.types.ts`](../../../frontend/src/features/landing/types/faq.types.ts), nav items in
[`nav.config.ts`](../../../frontend/src/features/landing/config/nav.config.ts).

**Learn:**
1. **❌ naive vs ✅ our real code**
   ```tsx
   // ❌ naive — copy hardcoded inline; editing text means editing JSX, mapping is manual
   <Accordion><Item q="What is Trade Journal?" a="…" /><Item q="How do I import trades?" a="…" /></Accordion>

   // ✅ Faq.tsx — component renders; data file holds the content
   <Accordion defaultValue={[FAQS[0].id]}>{FAQS.map((faq) => <FaqItem key={faq.id} faq={faq} />)}</Accordion>
   ```
2. **Plain-english why** — Separating content from presentation means a copy change touches a data file,
   not component logic; the shape is enforced by one type; and the component is a trivial, reusable map.
   It's the smallest step toward a CMS without adopting one.
3. **Where else you'd use this** — nav menus; pricing tiers; feature grids; testimonials; any
   list-driven UI; anything you might later move to a CMS or i18n catalog.
4. **Rule of thumb** — Keep copy and config in data files typed by one source; keep components presentational.

---

### Feature-folder architecture with path aliases

**What / Where / Why** — Code is organized by **feature** (`features/auth`, `features/dashboard`,
`features/landing`, `features/settings`), each with its own `components/`, `api/`, `schemas/`, `data/`,
`types/`; truly shared code sits in `shared/`. Imports use aliases (`@features`, `@shared`, `@lib`,
`@components`) rather than deep `../../..` paths.

**Learn:**
1. **Plain-english why** — Grouping by feature (not by file *type*) keeps everything for one capability
   together, so a feature can be understood, moved, or deleted as a unit. Aliases make imports stable
   under refactors — moving a file doesn't rewrite a chain of `../`.
2. **Where else you'd use this** — any app past a handful of screens; monorepo packages; teams owning
   vertical slices; anything you expect to refactor.
3. **Rule of thumb** — Organize by feature, not by file type; import by alias, not by relative path depth.

---

### Zustand store read through narrow selectors

**What / Where / Why** — [`shared/stores/auth.store.ts`](../../../frontend/src/shared/stores/auth.store.ts)
is a small Zustand store; its own docstring prescribes reading it via a **narrow selector**,
`useAuthStore((s) => s.user)`, not by grabbing the whole store.

**Learn:**
1. **Vocabulary**
   - **Selector** — a function that picks the slice of state a component actually needs.
   - **Re-render subscription** — a component re-renders when the value it subscribes to changes.
2. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — subscribes to the whole store; re-renders on ANY field change
   const { user } = useAuthStore();

   // ✅ auth.store.ts usage — subscribe only to `user`
   const user = useAuthStore((s) => s.user);
   ```
3. **Plain-english why** — Subscribing to the entire store re-renders a component even when a field it
   ignores changes. A narrow selector subscribes to just one slice, so unrelated updates cost nothing.
4. **Where else you'd use this** — any Zustand/Redux/Context read; `useSelector` in Redux; derived-state
   memoization; splitting a big context into focused ones.
5. **Rule of thumb** — Subscribe to the slice you use, not the whole store.

---

### Imperative, promise-based confirm dialog

**What / Where / Why** — [`shared/stores/confirm.store.ts`](../../../frontend/src/shared/stores/confirm.store.ts)
exposes `confirm(options): Promise<boolean>`, so a delete flow reads `if (await confirm({...})) delete()`.
A single `ConfirmDialogHost` (mounted in [`GlobalHosts`](../../../frontend/src/shared/components/GlobalHosts.tsx))
renders it. A new request dismisses any pending one as cancelled.

**Learn:**
1. **❌ naive vs ✅ our real code**
   ```tsx
   // ❌ naive — every deletable component wires its own open state + two callbacks + a <Dialog>
   const [open, setOpen] = useState(false);
   <ConfirmDialog open={open} onConfirm={doDelete} onCancel={() => setOpen(false)} />

   // ✅ confirm.store.ts — call it like window.confirm(), but async and styled
   if (await confirm({ title: "Delete trade?", destructive: true })) doDelete();
   ```
2. **Plain-english why** — Modeling a yes/no question as a Promise turns a callback-and-state dance into
   a single linear `await`, and one shared host means you don't remount a dialog per call site.
3. **Where else you'd use this** — "discard unsaved changes?"; destructive-action guards; a promise-based
   toast with an Undo action; imperative alert/prompt replacements.
4. **Rule of thumb** — Model a user yes/no as an awaited Promise resolved by one shared host.

---

### Typed API envelope, unwrapped in the service layer

**What / Where / Why** — [`shared/types/api-response.ts`](../../../frontend/src/shared/types/api-response.ts)
mirrors the backend's `{ success, message, data }`. Services
([`features/auth/api/auth.service.ts`](../../../frontend/src/features/auth/api/auth.service.ts)) type the
call as `ApiResponse<AuthUser>` and return the **unwrapped** `res.data.data`, so components receive plain
domain objects.

**Learn:**
1. **Plain-english why** — Centralizing the "unwrap `.data.data`" step in the service means components
   never see transport envelopes — they get `AuthUser`, not `ApiResponse<AuthUser>`. One place knows the
   wire format; everything downstream is clean and typed.
2. **Where else you'd use this** — any REST client with a wrapper shape; GraphQL response unwrapping;
   pagination envelopes; mapping DTOs to view models at the service boundary.
3. **Rule of thumb** — Unwrap transport shapes once in the service layer; hand components domain types.

---

### Error messages distinguish "server unreachable" from "server said no"

**What / Where / Why** — [`shared/lib/get-error-message.ts`](../../../frontend/src/shared/lib/get-error-message.ts)
checks `!error.response` to detect a *network* failure and returns a connection-specific message;
otherwise it surfaces the backend's `message`, falling back to a generic string.

**Learn:**
1. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — "Something went wrong" whether the server is down or the password was wrong
   catch (e) { toast.error("Something went wrong"); }

   // ✅ get-error-message.ts
   if (isAxiosError(error)) {
     if (!error.response) return "We couldn't connect to the server. Please check your connection…";
     if (error.response.data?.message) return error.response.data.message;
   }
   ```
2. **Plain-english why** — "No response object" means the request never reached the server (offline,
   CORS, timeout) — a fundamentally different problem than a 4xx the server chose to return. Telling them
   apart lets the UI give an actionable message instead of a catch-all.
3. **Where else you'd use this** — any fetch/axios error handler; retry logic (retry network errors, not
   400s); offline banners; distinguishing timeout vs rejection.
4. **Rule of thumb** — Treat "no response" (network) and "error response" (server) as different failures with different messages.

---

### CTA styles are token-driven className strings in one place

**What / Where / Why** — [`features/landing/styles/cta-styles.ts`](../../../frontend/src/features/landing/styles/cta-styles.ts)
defines `ctaPrimary/ctaOutline/ctaGhost/ctaTrial` as shared className strings built from **design tokens**
(`bg-primary`, `text-primary-fg`, `bg-danger`) — never raw hex or ad-hoc colours (an `AGENTS.md` hard rule).

**Learn:**
1. **Plain-english why** — Repeating a long button className across sections guarantees drift; centralizing
   it keeps every CTA identical and makes a restyle a one-file change. Using tokens (not hex) means a theme
   change propagates everywhere automatically.
2. **Where else you'd use this** — shared badge/chip/card class sets; status colours; any repeated visual
   treatment; enforcing a "no raw colours" design-token policy.
3. **Rule of thumb** — Centralize repeated class sets and build them from tokens, never hardcoded colours.

---

### A one-line client "trigger" keeps section components as Server Components

**What / Where / Why** — The Book Demo CTAs live in `Hero` and `Cta`, both **Server Components**. To
open the dialog they need `onClick` + a Zustand store (client-only). Instead of adding `"use client"` to
those big marketing sections, the click surface is a tiny leaf —
[`components/book-demo/BookDemoTrigger.tsx`](../../../frontend/src/features/landing/components/book-demo/BookDemoTrigger.tsx),
a `"use client"` `<button>` that just calls `useBookDemoStore().open()` and spreads `props`. The dialog
([`BookDemoDialog`](../../../frontend/src/features/landing/components/book-demo/BookDemoDialog.tsx)) is
mounted **once** in `LandingPage`; any number of triggers open the same instance via the store.

**Learn:**
1. **Vocabulary**
   - **Server Component** — renders on the server, ships zero JS; can't use hooks, state, or event handlers.
   - **Client island** — the smallest `"use client"` subtree that needs interactivity, embedded in a server tree.
2. **❌ naive vs ✅ our real code**
   ```tsx
   // ❌ naive — mark the whole section client just to get one onClick
   "use client"
   export function Hero() { /* entire hero + mock now ships as JS */ }

   // ✅ keep Hero a Server Component; interactivity is a leaf
   <BookDemoTrigger className={ctaPrimary}>Book Demo</BookDemoTrigger>
   // BookDemoTrigger.tsx ("use client"): <button onClick={open} {...props} />
   ```
3. **Plain-english why** — `"use client"` is contagious downward: marking a section client ships all its
   markup as JS. Pushing the boundary to a leaf button keeps the heavy static content server-rendered and
   sends only the few bytes that actually need a handler.
4. **Where else you'd use this** — a "copy" button in server-rendered docs; a like/bookmark toggle in a
   server list item; "open menu"/"open modal" triggers; any single interactive control inside static content.
5. **Rule of thumb** — Push the `"use client"` boundary down to the smallest interactive leaf; open shared UI through a store, not props threaded through server parents.

---

### Overriding a shadcn `sm:max-w-*` needs a `sm:` variant, not a base class

**What / Where / Why** — `DialogContent` ships `sm:max-w-sm`. `BookDemoDialog` needs a wider dialog to
match `BookDemo.png`; passing base `max-w-2xl` did **nothing at ≥640px** — the dialog stayed 384px.
`tailwind-merge` only de-dupes classes that target the *same* property **at the same variant**;
`max-w-2xl` (no variant) and `sm:max-w-sm` (sm variant) are different keys, so both survive and
`sm:max-w-sm` wins from `sm` up. The fix is `sm:max-w-2xl` — same variant, so it replaces the default.

**Learn:**
1. **Vocabulary**
   - **Variant** — a Tailwind prefix (`sm:`, `hover:`, `dark:`) that scopes a class to a condition.
   - **tailwind-merge** — the `cn()` helper that drops earlier conflicting classes so `className` overrides win.
2. **❌ naive vs ✅ our real code**
   ```tsx
   // ❌ base class can't beat the component's sm: default → still 384px on desktop
   <DialogContent className="max-w-2xl" />        // default has sm:max-w-sm

   // ✅ match the variant so twMerge replaces it
   <DialogContent className="sm:max-w-2xl" />
   ```
3. **Plain-english why** — twMerge compares like-for-like: a responsive class and an unconditional class
   are different "slots," so neither cancels the other; at the `sm` breakpoint the component's `sm:` class
   is still active and applies. Override at the *same* breakpoint and it's a true replacement.
4. **Where else you'd use this** — overriding any shadcn/library default that's set behind `sm:`/`md:`/
   `hover:`/`dark:` (widths, padding, grid columns, hover colours); debugging "my className isn't applying."
5. **Rule of thumb** — To override a variant-scoped default, repeat the variant; a bare class only wins where no variant is active.
