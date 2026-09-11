/**
 * The tips index, after a launch that lost the network.
 *
 * `loadCatalog` in `load.ts` nulls its cached promise on failure on purpose —
 * "a failure here is almost always a first launch that lost the network mid
 * precache, and it is fixed by trying again." `tips.ts`'s own index loader did
 * not follow that convention: a single failed fetch (a real one, or a
 * `!response.ok`) cached forever, so a variant chosen by the index (bass clef,
 * a rhythm feel, …) could never be picked for the rest of the session even
 * once the network recovered — every drill fell back to the plain kind file
 * and stayed there.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Re-imported per test: the module caches the index promise deliberately. */
async function loadTips(): Promise<typeof import('../../src/curriculum/tips')> {
  vi.resetModules();
  return import('../../src/curriculum/tips');
}

function indexResponse(): Response {
  return new Response(
    JSON.stringify({ kinds: { 'drill.foo': { variants: [{ variant: 'v1', when: { clef: 'bass' } }] } } }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

function fetchMock(indexReply: () => Promise<Response>): (url: string) => Promise<Response> {
  let indexCalls = 0;
  return vi.fn((url: string) => {
    if (String(url).includes('index.json')) {
      indexCalls += 1;
      return indexCalls === 1 ? indexReply() : Promise.resolve(indexResponse());
    }
    if (String(url).includes('drill.foo.v1.md')) return Promise.resolve(new Response('VARIANT', { status: 200 }));
    return Promise.resolve(new Response('BASE', { status: 200 }));
  }) as unknown as (url: string) => Promise<Response>;
}

describe('tipsFor: a transient failure fetching the index must not be permanent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('picks the right variant on a later call, once a rejected fetch is retried', async () => {
    vi.stubGlobal('fetch', fetchMock(() => Promise.reject(new Error('offline'))));
    const { tipsFor } = await loadTips();

    // Offline on the first call: no index, so it falls back to the plain kind.
    const first = await tipsFor('drill.foo', { clef: 'bass' });
    expect(first?.variant).toBeNull();
    expect(first?.markdown).toBe('BASE');

    // The network is back. A cached failure must not keep hiding the variant.
    const second = await tipsFor('drill.foo', { clef: 'bass' });
    expect(second?.variant, 'the index was never retried, so the bass-clef variant can never be chosen').toBe(
      'v1',
    );
    expect(second?.markdown).toBe('VARIANT');
  });

  it('retries the same way after a non-ok response', async () => {
    vi.stubGlobal('fetch', fetchMock(() => Promise.resolve(new Response('not found', { status: 404 }))));
    const { tipsFor } = await loadTips();

    expect((await tipsFor('drill.foo', { clef: 'bass' }))?.variant).toBeNull();
    expect((await tipsFor('drill.foo', { clef: 'bass' }))?.variant).toBe('v1');
  });
});
