/**
 * A content read that stalls must fail, not hang.
 *
 * `fetch` has no timeout of its own, and nothing here gave it one. A response
 * that is accepted and never arrives left `await fetch(...)` pending for ever:
 * the retry never ran, nothing rejected, and every screen waiting on the
 * catalog simply never appeared. No error, no empty state — a blank screen.
 *
 * That is the only path in the app's boot that can hang silently, and it is the
 * best explanation available for a failure seen three times in two days, where
 * a screen never mounted inside a 120 s wait and then passed when run again.
 * On the owner's phone it is worse than a flaky test: the app is offline-first
 * and these files are precached, so a stalled read means a dead screen with no
 * message on a bad connection.
 *
 * The retry is deliberately given twice the patience, because the case it was
 * written for — a first launch that lost the network mid-precache — is slow
 * rather than dead.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CATALOG = [{ id: 'song.one', title: 'One' }];

/** Re-imported per test: the module caches the catalog promise deliberately. */
async function loader(): Promise<typeof import('../../src/curriculum/load')> {
  vi.resetModules();
  return import('../../src/curriculum/load');
}

describe('a content read that never answers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('gives up instead of waiting for ever', async () => {
    // A server that accepts the connection and then says nothing. Without a
    // timeout this promise is simply never settled, and neither is the screen.
    const hung = vi.fn(
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'TimeoutError'));
          });
        }),
    );
    vi.stubGlobal('fetch', hung);

    const { allItems } = await loader();
    const settled = vi.fn();
    const failed = vi.fn();
    void allItems().then(settled, failed);

    // Both attempts: twelve seconds, then twenty-four.
    await vi.advanceTimersByTimeAsync(12_000);
    await vi.advanceTimersByTimeAsync(24_000);
    await Promise.resolve();

    expect(settled, 'a stalled read resolved with something').not.toHaveBeenCalled();
    expect(failed, 'a stalled read never rejected — the screen would never appear').toHaveBeenCalled();
    // And it did try twice, which is what the retry is for.
    expect(hung).toHaveBeenCalledTimes(2);
  });

  it('carries a signal on the request, so the abort can reach it', async () => {
    const seen: (AbortSignal | undefined)[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: { signal?: AbortSignal }) => {
        seen.push(init?.signal);
        return Promise.resolve(
          new Response(JSON.stringify(CATALOG), { status: 200, headers: { 'content-type': 'application/json' } }),
        );
      }),
    );

    const { allItems } = await loader();
    await allItems();
    expect(seen[0], 'the request went out with no way to abort it').toBeInstanceOf(AbortSignal);
  });

  it('a read that answers in time is untouched by any of this', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(CATALOG), { status: 200, headers: { 'content-type': 'application/json' } }),
        ),
      ),
    );
    const { allItems } = await loader();
    const items = await allItems();
    expect(items.map((item) => item.id)).toContain('song.one');
  });
});
