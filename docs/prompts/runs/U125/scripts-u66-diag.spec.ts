// U125 diagnostic: the U66 case's steps, with the page's timers logged, so a
// failing run shows which task ran when. Not a test of anything; it writes
// one JSON per run under build/u125/diag/.
import { test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { openDevScore } from '../../../tests/e2e/fixtures/devScore';

test.beforeEach(async ({ page }) => {
  const rate = Number(process.env.U125_CPU_RATE ?? '1');
  if (rate > 1 && process.env.U125_THROTTLE_AT === 'run') {
    // As the counting harness: throttled from the harness's startRun on.
    const cdp = await page.context().newCDPSession(page);
    await page.exposeBinding('__u125Throttle', () => cdp.send('Emulation.setCPUThrottlingRate', { rate }));
    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;
      let handle: unknown;
      Object.defineProperty(window, '__pianopathDevScore', {
        configurable: true,
        get: () => handle,
        set: (v: { startRun?: (...a: unknown[]) => unknown } | undefined) => {
          if (v && typeof v.startRun === 'function') {
            const original = v.startRun;
            v.startRun = (...a: unknown[]) => {
              void (w.__u125Throttle as () => Promise<void>)();
              return original(...a);
            };
          }
          handle = v;
        },
      });
    });
  } else if (rate > 1 && !process.env.U125_LATE_THROTTLE) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  }
  await page.addInitScript(() => {
    const log: [string, number, number, string?][] = [];
    (window as unknown as { __u125: typeof log }).__u125 = log;
    const now = () => performance.now();
    let seenEv = 0;
    const __u125ev = (): string => {
      const h = (window as unknown as { __pianopathDevScore?: { engineEvents?: () => { kind: string; step?: number }[] } }).__pianopathDevScore;
      const ev = h?.engineEvents?.() ?? [];
      if (ev.length < seenEv) seenEv = 0;
      const fresh = ev.slice(seenEv).map((e) => e.kind + (e.step ?? '')).join(',');
      seenEv = ev.length;
      return fresh;
    };
    const st = window.setTimeout.bind(window);
    window.setTimeout = ((fn: () => void, ms?: number, ...rest: unknown[]) => {
      const at = now();
      const d = ms ?? 0;
      return st(() => {
        if (d >= 50) log.push([`to${d}`, at + d, now()]);
        fn(...(rest as []));
        if (d >= 50) log.push([`to${d}:end`, at + d, now(), __u125ev()]);
      }, ms);
    }) as typeof window.setTimeout;
    const si = window.setInterval.bind(window);
    window.setInterval = ((fn: () => void, ms?: number) =>
      si(() => {
        const t = now();
        fn();
        log.push(['iv', t, now(), __u125ev()]);
      }, ms)) as typeof window.setInterval;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = ((fn: FrameRequestCallback) =>
      raf((ts) => {
        const t = now();
        fn(ts);
        log.push(['raf', t, now(), __u125ev()]);
      })) as typeof window.requestAnimationFrame;
  });
});

for (let i = 0; i < Number(process.env.U125_DIAG_N ?? 1); i += 1) {
  test(`diag ${i}`, async ({ page }, info) => {
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    if (process.env.U125_LATE_THROTTLE) {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.U125_CPU_RATE ?? '1') });
    }
    await dev.startRun('tempo', { countInBars: 0, tempoPct: 130, toleranceMs: 150 });
    const run = await page.evaluate(
      async (script) => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        const log = (window as unknown as { __u125: [string, number, number, string?][] }).__u125;
        log.length = 0;
        const marks = { before: 0, after: 0, busyFrom: 0, busyTo: 0 };
        setTimeout(() => {
          marks.busyFrom = performance.now();
          while (performance.now() - marks.busyFrom < 400) {
            // the long task
          }
          marks.busyTo = performance.now();
        }, 90);
        marks.before = performance.now();
        const replayed = h.replay(script);
        marks.after = performance.now();
        await replayed;
        const score = h.engineScore() as unknown as {
          hits: number;
          notes: { midi: number; stepIndex: number | null; ok: boolean; tMs: number; deltaMs?: number }[];
          hotSpots: { measureIndex: number; misses: number; wrongs: number }[];
        } | null;
        return {
          marks,
          notes: score?.notes.map((n) => [n.midi, n.stepIndex, n.ok, n.tMs, n.deltaMs ?? null]),
          hits: score?.hits,
          hotSpots: score?.hotSpots,
          events: h.engineEvents(),
          log: log.slice(),
        };
      },
      [
        { atMs: 100, midi: 60 },
        { atMs: 869, midi: 62 },
      ],
    );
    await dev.stopRun();
    const ok = JSON.stringify(run.notes?.map((n) => [n[0], n[1], n[2]])) === JSON.stringify([[60, 0, true], [62, 1, true]]);
    mkdirSync('build/u125/diag', { recursive: true });
    writeFileSync(
      `build/u125/diag/${process.env.U125_TAG ?? 'x'}-${ok ? 'ok' : 'FAIL'}-${info.repeatEachIndex}-${i}.json`,
      JSON.stringify(run, null, 1),
    );
  });
}
