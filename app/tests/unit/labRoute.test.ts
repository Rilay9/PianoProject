/**
 * The two routes this work added (docs/04 §2 and §3c).
 *
 * **`?seed=`** is how the day's sight-read reaches the generator. The Score
 * screen builds a sight-read from the catalog row's own drill parameters,
 * which say a level and a number of bars and nothing about *which* exercise —
 * so without the seed in the hash the only way to give the day one phrase
 * would have been a catalog item per day. It has to survive a reload and a
 * back gesture, and it has to refuse rubbish: a generator handed a seed it
 * cannot use picks its own silently, and the day would quietly stop being the
 * same day.
 *
 * **`#/lab`** is the accompaniment lab, pushed over Library the way the chord
 * chart is, so the tab stays highlighted and Back returns to it.
 */
import { describe, expect, it, vi } from 'vitest';
import { parseHash, routeToHash, Router } from '../../src/router';

function fakeWindow(hash: string) {
  return {
    location: { hash } as Location,
    addEventListener: vi.fn(),
  };
}

describe('?seed= on a score route', () => {
  it('parses and round-trips', () => {
    const route = parseHash('#/score/drill.reading.sight-reading-2?seed=1234567');
    expect(route.score).toBe('drill.reading.sight-reading-2');
    expect(route.seed).toBe(1234567);
    expect(routeToHash(route)).toBe('#/score/drill.reading.sight-reading-2?seed=1234567');
  });

  it('carries zero, which is a seed like any other', () => {
    expect(parseHash('#/score/x?seed=0').seed).toBe(0);
    expect(routeToHash({ tab: 'today', score: 'x', seed: 0 })).toBe('#/score/x?seed=0');
  });

  it('takes the whole 32-bit range the generator uses', () => {
    expect(parseHash('#/score/x?seed=4294967295').seed).toBe(4294967295);
  });

  it('drops anything that is not one, rather than carrying it', () => {
    for (const bad of ['', 'abc', '-1', '1.5', '4294967296', '99999999999999']) {
      expect(parseHash(`#/score/x?seed=${bad}`).seed, bad).toBeUndefined();
    }
  });

  it('rides beside the flags that were already there', () => {
    const route = parseHash('#/score/x?blind=1&mode=tempo&seed=77');
    expect(route.blind).toBe(true);
    expect(route.scoreMode).toBe('tempo');
    expect(route.seed).toBe(77);
    expect(routeToHash(route)).toBe('#/score/x?blind=1&mode=tempo&seed=77');
  });

  it('is written into the hash by navigateScore, so a reload reproduces the day', () => {
    const win = fakeWindow('#/today');
    const router = new Router(win);
    router.navigateScore('drill.reading.sight-reading-1', { seed: 42 });
    expect(win.location.hash).toBe('#/score/drill.reading.sight-reading-1?seed=42');
    expect(router.route.seed).toBe(42);
    // The same piece at another seed is another route, or tomorrow's read
    // would never replace today's.
    const seen: (number | undefined)[] = [];
    router.subscribe((route) => seen.push(route.seed));
    router.navigateScore('drill.reading.sight-reading-1', { seed: 43 });
    expect(seen).toEqual([42, 43]);
  });
});

describe('#/lab', () => {
  it('parses to the lab over the Library tab', () => {
    expect(parseHash('#/lab')).toEqual({ tab: 'library', lab: true });
    expect(routeToHash({ tab: 'library', lab: true })).toBe('#/lab');
  });

  it('is what navigateLab goes to', () => {
    const win = fakeWindow('#/today');
    const router = new Router(win);
    router.navigateLab();
    expect(win.location.hash).toBe('#/lab');
    expect(router.route.lab).toBe(true);
    expect(router.route.tab).toBe('library');
  });

  it('leaving it is a route change the shell can see', () => {
    const win = fakeWindow('#/lab');
    const router = new Router(win);
    const seen: (boolean | undefined)[] = [];
    router.subscribe((route) => seen.push(route.lab));
    router.navigate('library');
    expect(seen).toEqual([true, undefined]);
  });
});
