import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_TAB, parseHash, routeToHash, Router, TAB_IDS } from '../../src/router';

describe('lesson ids', () => {
  // 61 of the 92 lessons are on a track and start with a letter. An earlier
  // pattern required a leading digit, which made every one of their pages
  // unreachable by URL without anything failing — the Plan screen navigates
  // through the router object, so nothing ever tried the hash.
  it('accepts every shape a real lesson id has', () => {
    for (const id of ['0.1', '1.1', '3.2b', 'classical.3', 'ragtime.6', 'jam', 'practice.1']) {
      expect(parseHash(`#/lesson/${id}`).lesson, id).toBe(id);
    }
  });

  it('still refuses a traversal or a shape that is not an id', () => {
    expect(parseHash('#/lesson/../secrets').lesson).toBeUndefined();
    expect(parseHash('#/lesson/Capitalised').lesson).toBeUndefined();
    expect(parseHash('#/lesson/').lesson).toBeUndefined();
  });
});

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

  /**
   * Free play (`04` §2b) is pushed over Today the way the lab is pushed over
   * Library: its own hash, no tab of its own, and the tab it came from left
   * highlighted.
   */
  it('parses `#/play` as free play over Today', () => {
    expect(parseHash('#/play')).toEqual({ tab: 'today', play: true });
    expect(routeToHash({ tab: 'today', play: true })).toBe('#/play');
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

  /**
   * `?from=` — the rung Back returns to (`04` §5, T17-2).
   *
   * Where Back goes is part of *which screen this is*: the same piece opened
   * from `2.1` and opened from the Library are two routes, and a comparison
   * that left this field out would hand the second one the first one's Back
   * and never redraw.
   */
  it('carries the rung it was opened from, and reads it back', () => {
    const { win } = fakeWindow('#/plan');
    const router = new Router(win as unknown as Window);
    router.navigateScore('song.a', { from: '2.1' });
    expect(router.route.scoreFrom).toBe('2.1');
    expect(win.location.hash).toContain('from=2.1');
    expect(parseHash(win.location.hash).scoreFrom).toBe('2.1');
  });

  it('treats the same piece opened from somewhere else as a different route', () => {
    const { win } = fakeWindow('#/plan');
    const router = new Router(win as unknown as Window);
    const seen: (string | undefined)[] = [];
    router.subscribe((route) => seen.push(route.scoreFrom));
    router.navigateScore('song.a', { from: '2.1' });
    router.navigateScore('song.a');
    expect(seen).toEqual([undefined, '2.1', undefined]);
  });

  it('drops a from that is not a lesson id, the way it drops a bad tour', () => {
    expect(parseHash('#/score/song.a?from=../../etc/passwd').scoreFrom).toBeUndefined();
    expect(parseHash('#/score/song.a?from=blues.7').scoreFrom).toBe('blues.7');
  });

  /**
   * The same parameter on the chord chart (`04` §3b, 2026-09-22).
   *
   * Entry 42 built `?from=` for the Score screen and recorded in its own
   * *what is unverified* that the chart had the identical fault one screen
   * over — a hard-coded `← Library`, so *Chart* on `jazz.5`'s song row landed
   * on the Library. One parser, one spelling, a field each.
   */
  it('carries the rung a chart was opened from, and reads it back', () => {
    const { win } = fakeWindow('#/plan');
    const router = new Router(win as unknown as Window);
    router.navigateChart('song.a', { from: 'jazz.5' });
    expect(router.route.chartFrom).toBe('jazz.5');
    expect(win.location.hash).toContain('from=jazz.5');
    expect(parseHash(win.location.hash).chartFrom).toBe('jazz.5');
    expect(parseHash(win.location.hash).chart).toBe('song.a');
  });

  it('treats the same chart opened from somewhere else as a different route', () => {
    const { win } = fakeWindow('#/plan');
    const router = new Router(win as unknown as Window);
    const seen: (string | undefined)[] = [];
    router.subscribe((route) => seen.push(route.chartFrom));
    router.navigateChart('song.a', { from: 'jazz.5' });
    router.navigateChart('song.a');
    expect(seen).toEqual([undefined, 'jazz.5', undefined]);
  });

  it('drops a chart from that is not a lesson id', () => {
    expect(parseHash('#/chart/song.a?from=../../etc/passwd').chartFrom).toBeUndefined();
    expect(parseHash('#/chart/song.a?from=jazz.5').chartFrom).toBe('jazz.5');
  });
});

/**
 * The three parameters the guided tour rides on (`04` §5c-1).
 *
 * The tour opens the *real* Score screen rather than drawing an imitation of
 * it, which needs the hash to carry three things: which mode to start in,
 * which bars to loop, and which walkthrough Back returns to. They follow
 * `blind=1` exactly — a query parameter on the score route, dropped rather
 * than trusted when it is not something this app wrote.
 */
describe('the score route carries a mode, a loop and a way back', () => {
  it('parses all three', () => {
    expect(parseHash('#/score/song.a?mode=tempo')).toEqual({
      tab: DEFAULT_TAB,
      score: 'song.a',
      scoreMode: 'tempo',
    });
    expect(parseHash('#/score/song.a?loop=1-2')).toEqual({
      tab: DEFAULT_TAB,
      score: 'song.a',
      scoreLoop: { from: 1, to: 2 },
    });
    expect(parseHash('#/score/song.a?tour=drill.tour.app-basics')).toEqual({
      tab: DEFAULT_TAB,
      score: 'song.a',
      tour: 'drill.tour.app-basics',
    });
  });

  it('accepts every mode the Score screen offers, and nothing else', () => {
    for (const mode of ['wait', 'tempo', 'listen', 'free'] as const) {
      expect(parseHash(`#/score/song.a?mode=${mode}`).scoreMode, mode).toBe(mode);
    }
    // Not a mode: the screen would be asked for something it cannot be, and
    // falling back to the learner's own default is the right answer.
    expect(parseHash('#/score/song.a?mode=slowly').scoreMode).toBeUndefined();
    expect(parseHash('#/score/song.a?mode=').scoreMode).toBeUndefined();
    expect(parseHash('#/score/song.a?mode=toString').scoreMode).toBeUndefined();
  });

  /**
   * `?hands=` — the Library's Duet door (`04` §4).
   *
   * The hand has to survive the hash, because the Score screen reads it where
   * it picks its focus and every route off that screen (Blind, Perform) is
   * rebuilt from the hash: a hand dropped there takes the app's half of the
   * duet with it, silently.
   */
  it('carries a hand, and only one of the three', () => {
    for (const hands of ['R', 'L', 'both'] as const) {
      expect(parseHash(`#/score/song.a?hands=${hands}`).scoreHands, hands).toBe(hands);
    }
    expect(parseHash('#/score/song.a?hands=left').scoreHands).toBeUndefined();
    expect(parseHash('#/score/song.a?hands=').scoreHands).toBeUndefined();
    expect(parseHash('#/score/song.a?hands=toString').scoreHands).toBeUndefined();
    expect(routeToHash({ tab: 'today', score: 'song.a', scoreMode: 'tempo', scoreHands: 'R' })).toBe(
      '#/score/song.a?mode=tempo&hands=R',
    );
  });

  it('refuses a loop that is not two bar numbers in order', () => {
    // A pickup bar is printed 0, so 0 is a real bar number here.
    expect(parseHash('#/score/song.a?loop=0-1').scoreLoop).toEqual({ from: 0, to: 1 });
    expect(parseHash('#/score/song.a?loop=4-2').scoreLoop).toBeUndefined();
    expect(parseHash('#/score/song.a?loop=1').scoreLoop).toBeUndefined();
    expect(parseHash('#/score/song.a?loop=one-two').scoreLoop).toBeUndefined();
    expect(parseHash('#/score/song.a?loop=-1-2').scoreLoop).toBeUndefined();
  });

  it('refuses a tour id that is not a catalog id', () => {
    // It is used as a navigation target and nothing else, so a Back that would
    // go nowhere is dropped in favour of one that goes to the tab.
    expect(parseHash('#/score/song.a?tour=../../etc/passwd').tour).toBeUndefined();
    expect(parseHash('#/score/song.a?tour=').tour).toBeUndefined();
  });

  it('round-trips all three together, alongside blind and performance', () => {
    const route = {
      tab: DEFAULT_TAB,
      score: 'song.folk.hot-cross-buns',
      blind: true,
      performance: true,
      scoreMode: 'wait' as const,
      scoreLoop: { from: 1, to: 2 },
      tour: 'drill.tour.app-basics',
    };
    expect(parseHash(routeToHash(route))).toEqual(route);
  });

  it('navigateScore puts them in the hash', () => {
    const { win } = fakeWindow('#/plan');
    const router = new Router(win as unknown as Window);
    router.navigateScore('song.folk.hot-cross-buns', {
      mode: 'tempo',
      loop: { from: 1, to: 2 },
      tour: 'drill.tour.app-basics',
    });
    expect(parseHash(win.location.hash)).toEqual({
      tab: DEFAULT_TAB,
      score: 'song.folk.hot-cross-buns',
      scoreMode: 'tempo',
      scoreLoop: { from: 1, to: 2 },
      tour: 'drill.tour.app-basics',
    });
    expect(router.route.scoreMode).toBe('tempo');
    expect(router.route.tour).toBe('drill.tour.app-basics');
  });

  it('treats a change of mode or of loop on the same piece as a real change', () => {
    // The tour opens the same piece three times and only these change. Without
    // them in the comparison the second step would be handed the first step's
    // screen, unchanged and in the wrong mode.
    const { win } = fakeWindow('#/plan');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    router.subscribe((route) => seen.push(routeToHash(route)));
    router.navigateScore('song.a', { mode: 'wait', tour: 'drill.t' });
    router.navigateScore('song.a', { mode: 'tempo', tour: 'drill.t' });
    router.navigateScore('song.a', { mode: 'wait', loop: { from: 1, to: 2 }, tour: 'drill.t' });
    expect(seen).toEqual([
      '#/plan',
      '#/score/song.a?mode=wait&tour=drill.t',
      '#/score/song.a?mode=tempo&tour=drill.t',
      '#/score/song.a?mode=wait&loop=1-2&tour=drill.t',
    ]);
  });

  it('does not re-notify when the same loop is asked for twice', () => {
    // The range is an object, so an identity comparison would call every
    // repeat a change and rebuild the screen under the learner's hands.
    const { win } = fakeWindow('#/plan');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    router.subscribe((route) => seen.push(routeToHash(route)));
    router.navigateScore('song.a', { loop: { from: 1, to: 2 } });
    router.navigateScore('song.a', { loop: { from: 1, to: 2 } });
    expect(seen).toEqual(['#/plan', '#/score/song.a?loop=1-2']);
  });

  it('leaves a plain score route exactly as it was', () => {
    // Nothing new appears on a route that asked for none of it.
    expect(parseHash('#/score/song.a')).toEqual({ tab: DEFAULT_TAB, score: 'song.a' });
    expect(routeToHash({ tab: DEFAULT_TAB, score: 'song.a' })).toBe('#/score/song.a');
  });
});

/**
 * The two routes that ride on `tab: 'library'` with every other field absent.
 *
 * `paper` and `importFor` were left out of `setRoute`'s comparison, so a
 * navigation that changed only one of them was a no-op: the hash moved and
 * the screen did not. Three real taps were lost that way — the Library tab
 * from a paper piece, the second piece of a book, and a second *Import for
 * this rung* — and none of them failed anywhere a test could see.
 */
describe('paper and import-for routes are real changes', () => {
  it('re-renders when the Library tab is tapped from a paper piece', () => {
    const { win } = fakeWindow('#/paper/book.czerny-599/no-1');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    router.subscribe((route) => seen.push(routeToHash(route)));
    router.navigate('library');
    expect(seen).toEqual(['#/paper/book.czerny-599/no-1', '#/library']);
  });

  it('re-renders when a second piece of the same book is opened', () => {
    const { win } = fakeWindow('#/library');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    router.subscribe((route) => seen.push(routeToHash(route)));
    router.navigatePaper('book.czerny-599', 'no-1');
    router.navigatePaper('book.czerny-599', 'no-2');
    router.navigatePaper('book.czerny-100', 'no-2');
    expect(seen).toEqual([
      '#/library',
      '#/paper/book.czerny-599/no-1',
      '#/paper/book.czerny-599/no-2',
      '#/paper/book.czerny-100/no-2',
    ]);
  });

  it('does not re-render when the same paper piece is asked for twice', () => {
    // `paper` is an object, so an identity comparison would call every repeat
    // a change and rebuild the screen under the learner's hands.
    const { win } = fakeWindow('#/library');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    router.subscribe((route) => seen.push(routeToHash(route)));
    router.navigatePaper('book.czerny-599', 'no-1');
    router.navigatePaper('book.czerny-599', 'no-1');
    expect(seen).toEqual(['#/library', '#/paper/book.czerny-599/no-1']);
  });

  it('re-renders when the rung an import is for changes', () => {
    const { win } = fakeWindow('#/plan');
    const router = new Router(win as unknown as Window);
    const seen: string[] = [];
    router.subscribe((route) => seen.push(routeToHash(route)));
    router.navigateImportFor('classical.1');
    router.navigateImportFor('classical.2');
    // …and leaving the picker for plain Library is a change too.
    router.navigate('library');
    expect(seen).toEqual([
      '#/plan',
      '#/library?for=classical.1',
      '#/library?for=classical.2',
      '#/library',
    ]);
  });
});
