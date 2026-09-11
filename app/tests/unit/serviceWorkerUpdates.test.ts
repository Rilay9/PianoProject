/**
 * The update prompt and the update check (`00` D20, `04` §7).
 *
 * None of this was reachable by a test: it lived inline at the foot of
 * `main.ts`, which has side effects from its first line, so importing it starts
 * the whole app. Two faults were sitting in it.
 *
 * 1. **A check was recorded that never happened.** `noteUpdateCheck()` ran on
 *    the line after `registerSW()` returned — no request, no network, no
 *    answer. Diagnostics' "Last update check" therefore read *a moment ago* on
 *    a phone that had been off the network for a month, which is the exact
 *    opposite of what that line is for. It is now written from the resolution
 *    of `registration.update()`, which rejects when the fetch fails.
 * 2. **A worker already waiting when the page loaded was never offered.**
 *    `onNeedRefresh` fires for a worker that arrives *during* a page's life.
 *    Tap *Later* once, or have "offline only" swallow the toast, and the
 *    installed version waits behind a prompt that is never shown again — and
 *    an installed worker that is never applied is the update that never
 *    arrives, on a phone whose owner reloads nothing.
 */
import { describe, expect, it, vi } from 'vitest';
import { wireServiceWorkerUpdates, type RegisterSW } from '../../src/app/updates';

interface Harness {
  toasts: { apply: () => void }[];
  checks: number;
  reloads: boolean[];
  /** Runs `onRegisteredSW`, as vite-plugin-pwa does once registration lands. */
  registered: (registration?: unknown) => void;
  /** Runs `onNeedRefresh`, as it does when a new worker becomes waiting. */
  needsRefresh: () => void;
}

function wire(options: {
  offlineOnly?: boolean;
  online?: boolean;
  update?: () => Promise<void>;
}): Harness {
  const harness: Partial<Harness> & Pick<Harness, 'toasts' | 'checks' | 'reloads'> = {
    toasts: [],
    checks: 0,
    reloads: [],
  };
  const registerSW: RegisterSW = (opts) => {
    harness.registered = (registration?: unknown) => {
      opts.onRegisteredSW?.('/sw.js', registration as ServiceWorkerRegistration | undefined);
    };
    harness.needsRefresh = () => opts.onNeedRefresh?.();
    return (reloadPage?: boolean) => {
      harness.reloads.push(reloadPage === true);
      return Promise.resolve();
    };
  };
  wireServiceWorkerUpdates({
    registerSW,
    offlineOnly: () => options.offlineOnly === true,
    online: () => options.online !== false,
    showToast: (prompt) => harness.toasts.push(prompt),
    noteCheck: () => {
      harness.checks += 1;
    },
  });
  return harness as Harness;
}

function registration(fields: {
  waiting?: unknown;
  update?: () => Promise<void>;
}): ServiceWorkerRegistration {
  return {
    waiting: fields.waiting ?? null,
    installing: null,
    active: { state: 'activated' },
    update: fields.update ?? (() => Promise.resolve()),
  } as unknown as ServiceWorkerRegistration;
}

describe('the update check that is recorded', () => {
  it('is recorded only after a check that reached the server', async () => {
    const h = wire({});
    const update = vi.fn(() => Promise.resolve());
    h.registered(registration({ update }));
    expect(h.checks).toBe(0);
    await Promise.resolve();
    await Promise.resolve();
    expect(update).toHaveBeenCalledOnce();
    expect(h.checks).toBe(1);
  });

  it('is NOT recorded when the check could not reach the server', async () => {
    const h = wire({});
    // What an offline `update()` does: the fetch fails and the promise rejects.
    h.registered(registration({ update: () => Promise.reject(new Error('Failed to fetch')) }));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(h.checks).toBe(0);
  });

  it('makes no request at all while the browser says it is offline', async () => {
    const h = wire({ online: false });
    const update = vi.fn(() => Promise.resolve());
    h.registered(registration({ update }));
    await Promise.resolve();
    expect(update).not.toHaveBeenCalled();
    expect(h.checks).toBe(0);
  });

  it('makes no request and offers nothing when "offline only" is on', async () => {
    const h = wire({ offlineOnly: true });
    const update = vi.fn(() => Promise.resolve());
    h.registered(registration({ waiting: { state: 'installed' }, update }));
    await Promise.resolve();
    expect(update).not.toHaveBeenCalled();
    expect(h.checks).toBe(0);
    expect(h.toasts).toHaveLength(0);
  });
});

describe('a worker that is already waiting when the page loads', () => {
  it('is offered, because onNeedRefresh will never fire for it', () => {
    const h = wire({});
    h.registered(registration({ waiting: { state: 'installed' } }));
    expect(h.toasts).toHaveLength(1);
  });

  it('is not invented when there is nothing waiting', () => {
    const h = wire({});
    h.registered(registration({}));
    expect(h.toasts).toHaveLength(0);
  });

  it('does not throw when registration is undefined', () => {
    const h = wire({});
    expect(() => h.registered(undefined)).not.toThrow();
    expect(h.toasts).toHaveLength(0);
  });
});

describe('the prompt itself', () => {
  it('applies the waiting worker and reloads, and never does so on its own', () => {
    const h = wire({});
    h.needsRefresh();
    expect(h.toasts).toHaveLength(1);
    expect(h.reloads).toEqual([]);
    h.toasts[0]?.apply();
    expect(h.reloads).toEqual([true]);
  });

  it('is suppressed by "offline only", which asked for no update checks', () => {
    const h = wire({ offlineOnly: true });
    h.needsRefresh();
    expect(h.toasts).toHaveLength(0);
  });
});
