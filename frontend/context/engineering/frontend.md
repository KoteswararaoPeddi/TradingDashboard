# Frontend — Engineering Decisions (Next.js App Router)

Grounded in the real Trade Journal frontend (`frontend/src`). Every entry references a file that exists.

---

### A module store cannot carry server-rendered data; Context can

**What / Where / Why** — The cockpit's account + trades are fetched on the server by
[`(app)/layout.tsx`](../../../frontend/src/app/(app)/layout.tsx) and shared through
[`DashboardProvider`](../../../frontend/src/features/dashboard/components/DashboardProvider.tsx) —
a React Context. The obvious alternative, seeding the existing module-level zustand store from the
server payload, **silently produces empty HTML**.

**Learn:**

1. **Vocabulary**
   - **Module-level store** — state created once when the module is imported (`create(...)` at the
     top level). Every importer shares that one instance.
   - **`useSyncExternalStore`** — the React hook a store uses to subscribe components. It takes a
     *server snapshot* function used during server rendering. zustand is built on it.
   - **Hydration** — the client re-rendering the server's HTML to attach event handlers. Server and
     client must render the *same* markup.

2. **❌ naive vs ✅ our real code**

```tsx
// ❌ Looks right, typechecks, works on the client — and server-renders NOTHING.
// The useState initializer does run during render, but the store read below it
// goes through useSyncExternalStore's *server snapshot*, which does not observe a
// mutation made in the same render pass. The HTML shipped "No account".
useState(() => useDashboardStore.getState().hydrate(payload))
const account = useDashboardStore((s) => s.account) // → null on the server

// ✅ Ours — Context is plain React, so it survives the server render intact.
export function DashboardProvider({ payload, children }) {
  const value = useMemo(() => ({ account: payload.account, /* … */ }), [payload])
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}
```

3. **Plain-english why** — An external store lives *outside* React, so React has to ask it for a
   snapshot; on the server it asks once, in a way that will not see a write you made mid-render.
   Context is *inside* React's render tree, so a value passed down is simply there — on the server and
   the client alike. There is a second, quieter reason: a module store on the server is **shared by
   every concurrent request**. This app has no user identity so nothing could leak, but the moment it
   does, one request's data could render for another. Context gives each request its own value for
   free.

4. **Where else you'd use this**
   - Any server-fetched data you want in the first paint (user profile, feature flags, config).
   - Per-request values in SSR: locale, theme from a cookie, an A/B bucket.
   - Anywhere you are tempted to `store.setState()` from a Server Component's payload.
   - The inverse: keep client-only state (filters, modals, a wizard step) in the store — it never
     server-renders, so the problem cannot arise.

5. **Rule of thumb** — Server data flows **down the tree** (props → Context). Client-only state lives
   **in a store**. If it has to appear in the HTML, it must not depend on an external store.

> **Gotcha — a typecheck cannot catch this.** The store version compiled cleanly and worked in the
> browser, because on the client the mutation *is* observed. Only the server HTML was empty. The test
> that catches it is asserting on the markup itself:
> `curl -s localhost:3000/dashboard | grep "1,166.40"`. Verify the bytes, not the behaviour after
> hydration.

---
