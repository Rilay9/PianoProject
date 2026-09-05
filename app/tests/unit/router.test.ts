import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_TAB, parseHash, routeToHash, Router, TAB_IDS } from '../../src/router';

describe('parseHash', () => {
  it('parses every known tab id', () => {
    for (const tab of TAB_IDS) {
      expect(parseHash(`#/${tab}`)).toEqual({ tab });
    }
  });

  it('falls back to the default tab for an empty hash', () => {
    expect(parseHash('')).toEqual({ tab: DEFAULT_TAB });
    expect(parseHash('#')).toEqual({ tab: DEFAULT_TAB });
    expect(parseHash('#/')).toEqual({ tab: DEFAULT_TAB });
  });

  it('falls back to the default tab for an unknown route', () => {
    expect(parseHash('#/nonsense')).toEqual({ tab: DEFAULT_TAB });
  });

  it('tolerates a hash without the leading slash', () => {
    expect(parseHash('#plan')).toEqual({ tab: 'plan' });
  });
});

describe('routeToHash', () => {
  it('round-trips with parseHash', () => {
    for (const tab of TAB_IDS) {
      expect(parseHash(routeToHash({ tab }))).toEqual({ tab });
    }
  });
});

/**
 * Minimal fake of the window surface Router depends on. Deliberately does
 * NOT invoke the registered hashchange listener when `location.hash` is set
 * directly — real browsers fire that event asynchronously on a later task,
 * never synchronously within the same call that set the hash. Tests that
 * need to simulate an external navigation (e.g. the back button) call
 * `fireHashChange()` explicitly instead.
 */
function fakeWindow(initialHash: string) {
  let hash = initialHash;
  let hashChangeHandler: (() => void) | undefined;
  return {
    win: {
      location: {
        get hash() {
          return hash;
        },
        set hash(value: string) {
          hash = value;
        },
      },
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'hashchange') hashChangeHandler = cb;
      }),
    },
    /** Simulates the browser's async hashchange event firing after `hash` was changed externally. */
    fireHashChange: (newHash: string) => {
      hash = newHash;
      hashChangeHandler?.();
    },
  };
}

describe('Router', () => {
  it('reads the initial route from the current hash', () => {
    const { win } = fakeWindow('#/library');
    const router = new Router(win as unknown as Window);
    expect(router.route).toEqual({ tab: 'library' });
  });

  it('defaults to "today" when the hash is empty', () => {
    const { win } = fakeWindow('');
    const router = new Router(win as unknown as Window);
    expect(router.route).toEqual({ tab: DEFAULT_TAB });
  });

  it('notifies subscribers immediately with the current route', () => {
    const { win } = fakeWindow('#/settings');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    router.subscribe((route) => seen.push(route.tab));
    expect(seen).toEqual(['settings']);
  });

  it('notifies subscribers on navigate() and updates location.hash', () => {
    const { win } = fakeWindow('#/today');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    router.subscribe((route) => seen.push(route.tab));
    router.navigate('progress');
    expect(seen).toEqual(['today', 'progress']);
    expect(router.route).toEqual({ tab: 'progress' });
    expect(win.location.hash).toBe('#/progress');
  });

  it('does not re-notify when navigating to the already-current tab', () => {
    const { win } = fakeWindow('#/today');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    router.subscribe((route) => seen.push(route.tab));
    router.navigate('today');
    expect(seen).toEqual(['today']);
  });

  it('does not double-notify when a later hashchange event confirms the same route', () => {
    // Simulates the real-browser sequence: navigate() applies the route
    // synchronously, and the async hashchange event that follows re-derives
    // the identical route — it must be a no-op, not a duplicate emission.
    const { win, fireHashChange } = fakeWindow('#/today');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    router.subscribe((route) => seen.push(route.tab));
    router.navigate('library');
    fireHashChange('#/library');
    expect(seen).toEqual(['today', 'library']);
  });

  it('reacts to an external hash change (e.g. the back button)', () => {
    const { win, fireHashChange } = fakeWindow('#/today');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    router.subscribe((route) => seen.push(route.tab));
    fireHashChange('#/plan');
    expect(seen).toEqual(['today', 'plan']);
    expect(router.route).toEqual({ tab: 'plan' });
  });

  it('unsubscribe stops further notifications', () => {
    const { win } = fakeWindow('#/today');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    const unsubscribe = router.subscribe((route) => seen.push(route.tab));
    unsubscribe();
    router.navigate('settings');
    expect(seen).toEqual(['today']);
  });
});
