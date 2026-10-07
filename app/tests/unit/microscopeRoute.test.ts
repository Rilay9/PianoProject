/**
 * The builder's microscope is a dev route, addressed by item (D2 item 1): `#/dev/microscope`
 * opens the queue, `#/dev/microscope/<item id>` opens one item, so a link in an entry opens
 * it. Never a tab and never a sub-screen of one, like `#/dev/score`; the shell's navigation
 * is `TAB_IDS` and nothing else (`microscope.spec.ts` checks the glass).
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_TAB, DEV_IDS, parseHash, routeToHash, Router, SUB_IDS, TAB_IDS, type Route } from '../../src/router';

describe('the microscope route', () => {
  it('opens the queue, or one item by id', () => {
    expect(parseHash('#/dev/microscope')).toEqual({ tab: DEFAULT_TAB, dev: 'microscope' });
    expect(parseHash('#/dev/microscope/exercise.tumbao.c')).toEqual({
      tab: DEFAULT_TAB,
      dev: 'microscope',
      devItem: 'exercise.tumbao.c',
    });
  });

  it('round-trips through the hash', () => {
    const routes: Route[] = [
      { tab: DEFAULT_TAB, dev: 'microscope' },
      { tab: DEFAULT_TAB, dev: 'microscope', devItem: 'song.classical.bach-menuet-bwv-anh-113.pdmx' },
      { tab: DEFAULT_TAB, dev: 'score' },
    ];
    for (const route of routes) expect(parseHash(routeToHash(route))).toEqual(route);
  });

  it('drops an id that is not a catalogue id, and never carries one on the score harness', () => {
    expect(parseHash('#/dev/microscope/..%2Fsecrets')).toEqual({ tab: DEFAULT_TAB, dev: 'microscope' });
    expect(parseHash('#/dev/microscope/%E0%A4%A')).toEqual({ tab: DEFAULT_TAB, dev: 'microscope' });
    expect(parseHash('#/dev/score/exercise.tumbao.c')).toEqual({ tab: DEFAULT_TAB, dev: 'score' });
  });

  it('is a builder route, never a tab or a sub-screen', () => {
    expect(DEV_IDS).toContain('microscope');
    expect(TAB_IDS as readonly string[]).not.toContain('microscope');
    expect(SUB_IDS as readonly string[]).not.toContain('microscope');
  });

  it('a second item is a new route, so the screen is rebuilt for it', () => {
    const listeners: ((event: Event) => void)[] = [];
    const win = {
      location: { hash: '#/dev/microscope/exercise.tumbao.c' },
      addEventListener: (_type: string, listener: (event: Event) => void) => listeners.push(listener),
    } as unknown as Window;
    const router = new Router(win);
    const seen: Route[] = [];
    router.subscribe((route) => seen.push(route));
    router.navigateDev('microscope', 'exercise.tumbao.d');
    expect(win.location.hash).toBe('#/dev/microscope/exercise.tumbao.d');
    expect(seen.map((route) => route.devItem)).toEqual(['exercise.tumbao.c', 'exercise.tumbao.d']);
    router.navigateDev('microscope', 'exercise.tumbao.d');
    expect(seen).toHaveLength(2);
  });
});
