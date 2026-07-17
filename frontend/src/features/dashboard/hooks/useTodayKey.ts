"use client";

import { useSyncExternalStore } from "react";

/** Today never changes mid-session, so there is nothing to subscribe to. */
const NEVER_CHANGES = () => () => {};

/**
 * Today's UTC day key on the client, and `null` on the server.
 *
 * The clock is not a pure input: the server renders at one instant and the
 * browser hydrates at another, so `new Date()` during render desyncs hydration
 * the moment those two instants straddle UTC midnight — a bug that only ever
 * fires in production, at 00:00, for whoever happened to load the page.
 *
 * `useSyncExternalStore`'s third argument is the *server* snapshot: returning
 * null there means the first client render matches the server's markup by
 * construction (no cell marked), and the marker appears once mounted. Equal
 * date strings compare true under `Object.is`, so re-reading the clock each
 * render cannot loop — but note a snapshot returning a fresh *object* would.
 */
export function useTodayKey(): string | null {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => new Date().toISOString().slice(0, 10),
    () => null,
  );
}
