// @vitest-environment jsdom
/**
 * A screen the route has already left must never be built (Entry 52 item 1).
 *
 * `mountLazyScreen` puts a *Loading…* card on the page, fetches the screen's
 * chunk, and swaps the real screen in when it arrives. It checked that its
 * holder was still on the page before swapping — and the screen had already
 * been built by then, because every call site read
 * `import(...).then(({ Screen }) => Screen(router))`, which constructs it
 * inside the import's own `.then`.
 *
 * What that costs is invisible: an orphan screen leaves no mark on the DOM, so
 * nothing in the suite could have caught it. What it does is subscribe to the
 * shared MIDI source, ask for the microphone if the settings say to, start
 * rendering, and sit there for the life of the tab — `onScreenDispose` only
 * ever runs for a screen the shell actually mounted. One tap on Back while a
 * chunk was slow was enough to make one.
 *
 * So the test holds the factory itself and asserts it was never called. It is
 * the reason `mountLazyScreen` is exported.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mountLazyScreen } from '../../src/ui/AppShell';

/** A promise whose settling this test controls. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (cause: unknown) => void } {
  let resolve!: (value: T) => void;
  let reject!: (cause: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe('a lazily loaded screen whose route was left', () => {
  let main: HTMLElement;

  beforeEach(() => {
    document.body.replaceChildren();
    main = document.createElement('main');
    document.body.append(main);
  });

  it('is never built once its holder has left the page', async () => {
    const chunk = deferred<() => HTMLElement>();
    const build = vi.fn(() => document.createElement('section'));
    const setCurrent = vi.fn();

    const holder = mountLazyScreen(main, setCurrent, () => chunk.promise);
    main.append(holder);
    expect(holder.isConnected, 'the holder was never on the page').toBe(true);

    // The learner presses Back while the chunk is still in flight: the shell
    // empties `main` and mounts something else.
    main.replaceChildren();
    expect(holder.isConnected).toBe(false);

    // Now the chunk lands.
    chunk.resolve(build);
    await chunk.promise;
    await Promise.resolve();

    expect(build, 'a screen was built for a route nobody is on').not.toHaveBeenCalled();
    expect(setCurrent).not.toHaveBeenCalled();
  });

  it('is built, once, when the holder is still there', async () => {
    const chunk = deferred<() => HTMLElement>();
    const real = document.createElement('section');
    const build = vi.fn(() => real);
    const setCurrent = vi.fn();

    const holder = mountLazyScreen(main, setCurrent, () => chunk.promise);
    main.append(holder);
    chunk.resolve(build);
    await chunk.promise;
    await Promise.resolve();

    expect(build).toHaveBeenCalledTimes(1);
    expect(setCurrent).toHaveBeenCalledWith(real);
    expect(main.contains(real), 'the screen was built and not shown').toBe(true);
  });

  it('retries a failed chunk once, and still builds nothing after the route is left', async () => {
    // A chunk that comes back short is retried once silently. The retry must
    // answer the same question the first attempt does, because a slow chunk
    // and a failed-then-slow chunk leave the same orphan.
    const retry = deferred<() => HTMLElement>();
    let attempts = 0;
    const build = vi.fn(() => document.createElement('section'));
    const holder = mountLazyScreen(main, vi.fn(), () => {
      attempts += 1;
      return attempts === 1 ? Promise.reject(new Error('short read')) : retry.promise;
    });
    main.append(holder);
    // Let the first attempt reject and the retry start.
    await Promise.resolve();
    await Promise.resolve();
    expect(attempts, 'the failed chunk was not retried').toBe(2);

    // The learner leaves while the retry is in flight, and only then does it
    // land.
    main.replaceChildren();
    retry.resolve(build);
    await retry.promise;
    await Promise.resolve();

    expect(build).not.toHaveBeenCalled();
  });
});
