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

describe('sub-routes', () => {
  it('parses `#/settings/midi` as a sub-screen of settings', () => {
    expect(parseHash('#/settings/midi')).toEqual({ tab: 'settings', sub: 'midi' });
    expect(parseHash('#/settings/diagnostics')).toEqual({
      tab: 'settings',
      sub: 'diagnostics',
    });
  });

  it('omits `sub` entirely for a plain tab route', () => {
    expect(parseHash('#/settings')).toEqual({ tab: 'settings' });
    expect('sub' in parseHash('#/settings')).toBe(false);
  });

  it('degrades an unknown sub-route to the tab, not to the default tab', () => {
    expect(parseHash('#/settings/nope')).toEqual({ tab: 'settings' });
  });

  it('still falls back to the default tab when the tab itself is unknown', () => {
    expect(parseHash('#/nope/midi')).toEqual({ tab: DEFAULT_TAB });
  });

  it('round-trips through routeToHash', () => {
    expect(routeToHash({ tab: 'settings', sub: 'midi' })).toBe('#/settings/midi');
    expect(parseHash(routeToHash({ tab: 'settings', sub: 'diagnostics' }))).toEqual({
      tab: 'settings',
      sub: 'diagnostics',
    });
  });

  it('navigate(tab, sub) updates the hash and notifies', () => {
    const { win } = fakeWindow('#/settings');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    router.subscribe((route) => seen.push(routeToHash(route)));
    router.navigate('settings', 'midi');
    expect(win.location.hash).toBe('#/settings/midi');
    expect(seen).toEqual(['#/settings', '#/settings/midi']);
  });

  it('treats leaving a sub-screen for its own tab as a real change', () => {
    const { win } = fakeWindow('#/settings/midi');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    router.subscribe((route) => seen.push(routeToHash(route)));
    router.navigate('settings');
    expect(seen).toEqual(['#/settings/midi', '#/settings']);
  });

  it('does not re-notify when navigating to the current sub-route', () => {
    const { win } = fakeWindow('#/settings/midi');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    router.subscribe((route) => seen.push(routeToHash(route)));
    router.navigate('settings', 'midi');
    expect(seen).toEqual(['#/settings/midi']);
  });
});

describe('score routes', () => {
  it('parses #/score/<id> into a score route', () => {
    expect(parseHash('#/score/song.folk.hot-cross-buns')).toEqual({
      tab: DEFAULT_TAB,
      score: 'song.folk.hot-cross-buns',
    });
  });

  it('round-trips through routeToHash', () => {
    const route = { tab: DEFAULT_TAB, score: 'exercise.hanon.01.both' };
    expect(parseHash(routeToHash(route))).toEqual(route);
  });

  it('drops an id that does not look like a catalog id', () => {
    // A hash is user-editable and arrives from links; an id that would not be
    // in the catalog is dropped rather than passed to a fetch.
    expect(parseHash('#/score/../../etc/passwd')).toEqual({ tab: DEFAULT_TAB });
    expect(parseHash('#/score/')).toEqual({ tab: DEFAULT_TAB });
    expect(parseHash(`#/score/${'x'.repeat(200)}`)).toEqual({ tab: DEFAULT_TAB });
  });

  it('keeps the tab the learner opened it from', () => {
    // Opening a piece from Library and pressing Back should return to Library,
    // which is what carrying the tab on the route is for.
    const { win } = fakeWindow('#/library');
    const router = new Router(win as unknown as Window);
    router.navigateScore('song.folk.twinkle.rh');
    expect(router.route).toEqual({ tab: 'library', score: 'song.folk.twinkle.rh' });
  });

  it('notifies subscribers when the open piece changes', () => {
    const { win } = fakeWindow('#/today');
    const router = new Router(win as unknown as Window);
    const seen: (string | undefined)[] = [];
    router.subscribe((route) => seen.push(route.score));
    router.navigateScore('a.b');
    router.navigateScore('c.d');
    expect(seen).toEqual([undefined, 'a.b', 'c.d']);
  });
});
