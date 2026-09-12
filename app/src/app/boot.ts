// Sequencing the shell's mount against the settings mirror's reconciliation.
//
// This lived inline in `main.ts`, which has side effects from its first line
// (`util/errorLog`'s own history note says the same thing about `app/updates`)
// — so a test importing it starts the whole app. The one rule worth a test of
// its own:
//
// * **Mounting must not wait on data forever.** `data/persist.ts`'s
//   `hydratePersisted()` opens the IndexedDB database, and `data/db.ts` opens
//   it with no `blocked`/`blocking` handler at all. A version bump — and
//   `DB_VERSION` has moved five times already — blocks that `open()` for as
//   long as any other connection to the same database, at the old version,
//   stays alive; the spec never fires `success` or `upgradeneeded` while it
//   is blocked, only the silent `blocked` event nothing here listens for. The
//   moment that is most likely to leave a stale connection lying around is
//   exactly a service-worker update's own `location.reload()` — the old
//   page's teardown and the new page's boot race, and the old connection does
//   not reliably close before the new one asks to open at the bumped
//   version. `main.ts` used to await `hydratePersisted()` unconditionally
//   whenever a mirrored key was missing (`needsHydration()`), with nothing
//   bounding the wait — so a blocked open meant `mountAppShell()` was never
//   called at all, and the tab bar (built inside it) never existed. Nothing
//   throws, so there is no exception for `util/errorLog` to catch and no
//   banner to show: the boot is not broken, it is only waiting on an answer
//   that a stale connection elsewhere is quietly withholding. Restarting the
//   app from the launcher — rather than the reload the update itself
//   performs — is what finally closes that stale connection.
//
// So: give hydration a head start, since the common case answers in a
// millisecond and getting the mirror right before anything reads it avoids a
// screen quietly overwriting a real value with a default (see `main.ts`'s own
// comment on `mount`). But mount regardless once it has had a fair chance,
// and let a hydration that answers late still apply what it found — a
// settings screen re-read a moment later is a small correction; a shell that
// never appears is not.

export interface BootWiring {
  needsHydration: () => boolean;
  hydratePersisted: () => Promise<unknown[]>;
  /** Called with the keys `hydratePersisted` restored, when it found any. */
  onRestored: (restored: unknown[]) => void;
  mount: () => void;
  /** `setTimeout` in the app; a fake in tests. */
  after: (ms: number, cb: () => void) => void;
}

/** How long hydration gets before the shell mounts without it regardless. */
export const HYDRATION_TIMEOUT_MS = 2000;

export function bootShell(deps: BootWiring): void {
  if (!deps.needsHydration()) {
    deps.mount();
    // Still reconcile in the background, so the database keeps up with what
    // this session writes — nothing downstream is waiting on this one.
    void deps.hydratePersisted().catch(() => undefined);
    return;
  }

  let mounted = false;
  const mountOnce = (): void => {
    if (mounted) return;
    mounted = true;
    deps.mount();
  };

  void deps
    .hydratePersisted()
    .then((restored) => {
      if (restored.length > 0) deps.onRestored(restored);
    })
    .catch(() => undefined)
    .finally(mountOnce);

  // The fallback: if hydration has not answered by the time this fires,
  // mount anyway rather than leave the shell — tab bar included — waiting on
  // a database call that may never come back.
  deps.after(HYDRATION_TIMEOUT_MS, mountOnce);
}
