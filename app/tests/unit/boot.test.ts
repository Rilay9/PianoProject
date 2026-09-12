/**
 * Sequencing the shell's mount against `hydratePersisted()` (`app/boot.ts`).
 *
 * The owner: "on loading a new version of the app (updating) the menu is
 * gone on the bottom when it refreshes. I need to restart the app for it to
 * work."
 *
 * `main.ts` used to await `hydratePersisted()` unconditionally whenever a
 * mirrored settings key was missing, with nothing bounding the wait, before
 * ever calling `mount()` — and `mountAppShell()`, which builds the tab bar,
 * lives inside `mount()`. `data/db.ts` opens its one IndexedDB connection
 * with no `blocked`/`blocking` handler, so a version bump — and `DB_VERSION`
 * has already moved five times — blocks that `open()` for as long as some
 * other connection at the old version stays alive, which a reload racing its
 * own teardown does not reliably avoid. Nothing throws in that case, so
 * there is nothing for a stray exception or `#error-banner` to explain; the
 * boot is simply still waiting on an answer that a stale connection is
 * quietly withholding, and the tab bar it would have built never exists.
 *
 * These tests drive `bootShell` directly with a `hydratePersisted` that never
 * settles, standing in for a blocked `openDatabase()` call, and check that
 * `mount` still runs once a bounded wait has passed — which is the one thing
 * a full app restart does differently from the update's own in-place reload:
 * it guarantees no stale connection is left to block the next one.
 */
import { describe, expect, it, vi } from 'vitest';
import { bootShell, HYDRATION_TIMEOUT_MS, type BootWiring } from '../../src/app/boot';

/** A fake `after` that only calls back when the test advances it by hand. */
function fakeClock(): { after: BootWiring['after']; advance: (ms: number) => void } {
  const pending: { at: number; cb: () => void }[] = [];
  let now = 0;
  return {
    after: (ms, cb) => {
      pending.push({ at: now + ms, cb });
    },
    advance: (ms) => {
      now += ms;
      // Copy first: a callback that itself queues nothing here, but the loop
      // must not re-run a callback whose time has already passed once.
      for (const entry of [...pending]) {
        if (entry.at <= now) {
          const index = pending.indexOf(entry);
          if (index !== -1) pending.splice(index, 1);
          entry.cb();
        }
      }
    },
  };
}

describe('booting when a mirrored key is missing', () => {
  it('mounts once hydration answers quickly, and applies what it restored', async () => {
    const mount = vi.fn();
    const onRestored = vi.fn();
    const clock = fakeClock();
    bootShell({
      needsHydration: () => true,
      hydratePersisted: () => Promise.resolve(['pianopath.setup']),
      onRestored,
      mount,
      after: clock.after,
    });

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(onRestored).toHaveBeenCalledWith(['pianopath.setup']);
    expect(mount).toHaveBeenCalledOnce();
  });

  it('mounts anyway once the wait runs out, even if hydration never answers', async () => {
    const mount = vi.fn();
    const clock = fakeClock();
    bootShell({
      needsHydration: () => true,
      // Stands in for a `hydratePersisted()` blocked behind a stale
      // IndexedDB connection at the old version: a promise that never
      // settles, exactly what `data/db.ts`'s unhandled `blocked` event
      // produces.
      hydratePersisted: () => new Promise(() => undefined),
      onRestored: vi.fn(),
      mount,
      after: clock.after,
    });

    await Promise.resolve();
    expect(mount).not.toHaveBeenCalled();

    clock.advance(HYDRATION_TIMEOUT_MS);
    expect(mount).toHaveBeenCalledOnce();
  });

  it('does not mount twice when hydration answers late, after the wait already mounted', async () => {
    const mount = vi.fn();
    const onRestored = vi.fn();
    let resolveHydration: (restored: string[]) => void = () => undefined;
    const clock = fakeClock();
    bootShell({
      needsHydration: () => true,
      hydratePersisted: () => new Promise((resolve) => { resolveHydration = resolve; }),
      onRestored,
      mount,
      after: clock.after,
    });

    clock.advance(HYDRATION_TIMEOUT_MS);
    expect(mount).toHaveBeenCalledOnce();

    // The database answers after all, later. It should still be applied —
    // catching a settings screen up a moment late is fine — but must not
    // mount the shell a second time.
    resolveHydration(['pianopath.setup']);
    await Promise.resolve();
    await Promise.resolve();

    expect(onRestored).toHaveBeenCalledWith(['pianopath.setup']);
    expect(mount).toHaveBeenCalledOnce();
  });

  it('never even starts the clock when nothing is missing, and mounts at once', () => {
    const mount = vi.fn();
    const hydratePersisted = vi.fn(() => new Promise<string[]>(() => undefined));
    const after = vi.fn();
    bootShell({
      needsHydration: () => false,
      hydratePersisted,
      onRestored: vi.fn(),
      mount,
      after,
    });

    expect(mount).toHaveBeenCalledOnce();
    expect(hydratePersisted).toHaveBeenCalledOnce();
    expect(after).not.toHaveBeenCalled();
  });
});
