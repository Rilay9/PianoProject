import { expect, test } from '@playwright/test';
import { openDevScore } from './fixtures/devScore';

// The P3 acceptance criteria, driven through the real renderer and a real
// ReplaySource: bytes -> parseMidiMessage -> InputSource -> engine -> cursor.
// Everything below runs in Chromium against the same code the phone runs.

test.describe('Wait mode end to end', () => {
  test('a perfect scripted run finishes and scores 100 %', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('chords-ties');
    await dev.startRun('wait');
    await dev.playPerfectly();

    const state = await dev.engineState();
    expect(state?.finished).toBe(true);
    const score = await dev.engineScore();
    expect(score?.accuracy).toBe(1);
    expect(score?.wrongNotesTotal).toBe(0);
    expect(score?.correctSteps).toBe(score?.totalSteps);
  });

  test('the cursor follows the engine, not a clock', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.startRun('wait');
    expect((await dev.engineState())?.step).toBe(0);

    // Nothing played: a second of wall time must move nothing.
    await page.waitForTimeout(1000);
    expect((await dev.engineState())?.step).toBe(0);

    await dev.playNote(60);
    expect((await dev.engineState())?.step).toBe(1);
    // The rendered cursor band moved with it.
    // The cursor band, not the faint one A4 draws on the next step.
    await expect(page.locator('.score-cursor:not(.score-cursor--next)')).toBeVisible();
  });

  test('a scripted MIDI performance drives the run through a real ReplaySource', async ({
    page,
  }) => {
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.startRun('wait');
    // tempo-change is C D | E F | G, one note per step.
    await dev.replay([
      { atMs: 0, midi: 60 },
      { atMs: 20, midi: 60, off: true },
      { atMs: 60, midi: 62 },
      { atMs: 80, midi: 62, off: true },
      { atMs: 120, midi: 64 },
      { atMs: 180, midi: 65 },
      { atMs: 240, midi: 67 },
    ]);
    const score = await dev.engineScore();
    expect((await dev.engineState())?.finished).toBe(true);
    expect(score?.accuracy).toBe(1);
    expect(score?.wrongNotesTotal).toBe(0);
    // Revised 2026-09-25 (T37): this expected a pass and master eligibility
    // from a Wait run, which the engine granted on the tempo slider's value.
    // The replay is every note right with the page waiting for each one, so
    // it is evidence of the notes and of no tempo, and neither is granted.
    const outcome = await dev.engineOutcome();
    expect(outcome?.passed).toBe(false);
    expect(outcome?.masterEligible).toBe(false);
  });

  test('a wrong note is counted and painted red without advancing', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.startRun('wait');
    await dev.playNote(99);
    expect((await dev.engineState())?.step).toBe(0);
    expect((await dev.engineScore())?.wrongNotesTotal).toBe(1);
    await dev.playNote(60);
    expect((await dev.engineState())?.step).toBe(1);
    // The note just played is now painted correct on the drawn score.
    await expect(page.locator('.score-note.is-correct')).toHaveCount(1);
  });

  test('a run over a repeat visits the printed bar twice', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('repeat-endings');
    await dev.startRun('wait');
    await dev.playPerfectly();
    const events = await dev.engineEvents();
    const steps = events.filter((e) => e.kind === 'stepAdvanced').map((e) => e.step);
    // Six steps over three printed bars: the second pass is its own steps.
    expect(steps).toEqual([1, 2, 3, 4, 5]);
    expect((await dev.engineState())?.finished).toBe(true);
  });
});

test.describe('Tempo mode end to end', () => {
  test('the clock advances the cursor with nothing played, and reports misses', async ({
    page,
  }) => {
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    // 60 bpm at the top of the piece; no count-in keeps the test short.
    await dev.startRun('tempo', { countInBars: 0, tempoPct: 130 });
    await page.waitForTimeout(1200);
    const state = await dev.engineState();
    expect(state?.step).toBeGreaterThan(0);
    const score = await dev.engineScore();
    expect(score?.missedTotal).toBeGreaterThan(0);
    expect(score?.hits).toBe(0);
    await dev.stopRun();
  });

  test('a late run yields the expected timing statistics', async ({ page }) => {
    // Revised (H0, Q39; test class: revise, the clock only — every assertion
    // below is the one this case always made). It ran on the page's real timers
    // and failed three times on CI with `hits` 1. Old assumption: each replayed
    // note is delivered before the harness's next tick passes its window. A
    // note is *stamped* on the script's schedule but *delivered* by a timer, and
    // the harness ticks the engine from a timer and a frame loop of its own; a
    // page stalled past the window's close runs the tick first, the window
    // closes as a miss, and the note, still stamped inside it, finds nothing. So
    // the run is timed on a clock the test holds: Playwright's clock, installed
    // before the page loads and left running for the load, then paused, and
    // run forward through the replay so every timer fires in its due order. The
    // same run on the engine's injected clock, with the statistic asserted
    // exactly, is in `engineTempo.test.ts` (the harness's late replay).
    await page.clock.install();
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1_000);
    // The piece is 60 bpm for two beats then 144; at 130 % the first two steps
    // are ~769 ms apart. Every note is played ~100 ms after its slot.
    await dev.startRun('tempo', { countInBars: 0, tempoPct: 130, toleranceMs: 150 });
    const script = [
      { atMs: 100, midi: 60 },
      { atMs: 869, midi: 62 },
    ];
    const replayed = dev.replay(script);
    // The replay restarts the run as its source connects (`DevScoreScreen`):
    // the second `started` is the run's zero and the script's.
    await expect
      .poll(async () => (await dev.engineEvents()).filter((e) => e.kind === 'started').length)
      .toBe(2);
    // To the replay's own end: its last message, then the 250 ms it waits after it.
    await page.clock.runFor(869 + 250 + 16);
    await replayed;
    const score = await dev.engineScore();
    expect(score?.hits).toBe(2);
    expect(score?.timing.n).toBe(2);
    // Late, and inside the tolerance, so nothing was missed on those slots.
    expect(score?.timing.meanMs ?? 0).toBeGreaterThan(30);
    expect(score?.timing.latePct).toBe(100);
    expect(score?.timing.earlyPct).toBe(0);
    await dev.stopRun();
  });

  test('a long task across the first note’s window: the note, stamped inside it, is judged in it (U66)', async ({
    page,
  }) => {
    // U66 (B1), on the page's real timers, as H0's `wall-stalled` probe ran
    // (`runs/H0/red-q39-browser-probe.txt`): the main thread kept busy for
    // 400 ms from about 90 ms after the replay connects. The first note is due
    // at 100 and its window closes at 150, so the note waits behind the long
    // task past its window's close and the harness's own tick, due first,
    // comes off the queue before it. 400 ms is longer than the note's
    // remaining tolerance and well short of the stamp-trust bound (a second):
    // the case the hold is for. The engine without it counted 1 hit, 1 miss and
    // 1 wrong note here.
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.startRun('tempo', { countInBars: 0, tempoPct: 130, toleranceMs: 150 });
    const run = await page.evaluate(
      async (script) => {
        const h = window.__pianopathDevScore;
        if (!h) throw new Error('dev score harness is not attached');
        const marks = { before: 0, after: 0, busyFrom: 0, busyTo: 0 };
        setTimeout(() => {
          marks.busyFrom = performance.now();
          while (performance.now() - marks.busyFrom < 400) {
            // the long task
          }
          marks.busyTo = performance.now();
        }, 90);
        // `replay` restarts the run and connects its source before it returns
        // its promise: the connect lies between these two readings.
        marks.before = performance.now();
        const replayed = h.replay(script);
        marks.after = performance.now();
        await replayed;
        // Read at once: the third note's window (bar 2) opens long after the
        // replay's tail, so this reading holds the first bar's judgement only.
        const score = h.engineScore() as
          | (ReturnType<typeof h.engineScore> & {
              notes: { midi: number; stepIndex: number | null; ok: boolean }[];
            })
          | null;
        return {
          marks,
          hits: score?.hits,
          wrong: score?.wrongNotesTotal,
          n: score?.timing.n,
          latePct: score?.timing.latePct,
          notes: score?.notes.map((n) => [n.midi, n.stepIndex, n.ok]),
          barOneMisses: (score?.hotSpots ?? []).filter((s) => s.measureIndex === 0).map((s) => s.misses),
        };
      },
      [
        { atMs: 100, midi: 60 },
        { atMs: 869, midi: 62 },
      ],
    );
    // The long task began before the first window closed (150 ms after the
    // connect) and ended after it.
    expect(run.marks.busyFrom - run.marks.before).toBeLessThan(150);
    expect(run.marks.busyTo - run.marks.after).toBeGreaterThan(150);
    expect(run.notes).toEqual([
      [60, 0, true],
      [62, 1, true],
    ]);
    expect(run.hits).toBe(2);
    expect(run.wrong).toBe(0);
    expect(run.barOneMisses.filter((m) => m > 0)).toEqual([]);
    expect(run.n).toBe(2);
    expect(run.latePct).toBe(100);
    await dev.stopRun();
  });

  // Replaced (CL11a, Entry 219; class: replace): this read "a note far outside the tolerance is wrong"
  // for the first step's own pitch, played 400 ms after it. A right note at the wrong time costs once,
  // as the miss, and is not also a wrong key; a key the piece does not ask for is wrong, as it was.
  test('a right note far outside the tolerance is not a hit: its slot is missed, and it is charged once', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.startRun('tempo', { countInBars: 0, tempoPct: 130, toleranceMs: 100 });
    await dev.replay([{ atMs: 400, midi: 60 }]);
    const score = await dev.engineScore();
    expect(score?.hits).toBe(0);
    expect(score?.wrongNotesTotal).toBe(0);
    expect(score?.missedTotal).toBeGreaterThanOrEqual(1);
    await dev.stopRun();
  });

  test('a key the piece does not ask for, far outside the tolerance, is wrong and its slot is missed', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.startRun('tempo', { countInBars: 0, tempoPct: 130, toleranceMs: 100 });
    await dev.replay([{ atMs: 400, midi: 61 }]);
    const score = await dev.engineScore();
    expect(score?.wrongNotesTotal).toBeGreaterThanOrEqual(1);
    expect(score?.missedTotal).toBeGreaterThanOrEqual(1);
    await dev.stopRun();
  });

  test('the count-in delays the first step', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    // One bar of 2/4 at 60 bpm and 130 % is roughly 923 ms of count-in.
    await dev.startRun('tempo', { countInBars: 1, tempoPct: 130 });
    await page.waitForTimeout(300);
    expect((await dev.engineState())?.step).toBe(0);
    const events = await dev.engineEvents();
    // Ticks are already firing during the count-in, so the metronome sounds.
    expect(events.filter((e) => e.kind === 'tempoTick').length).toBeGreaterThan(0);
    expect(events.filter((e) => e.kind === 'stepAdvanced')).toHaveLength(0);
    await dev.stopRun();
  });
});

test.describe('generated sight-reading renders and can be practised', () => {
  for (const level of [1, 2, 3, 4] as const) {
    test(`level ${level} renders and drives a perfect Wait run`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));

      const dev = await openDevScore(page);
      await dev.loadSightReading(level, 2468, 4);
      expect(await dev.lastError()).toBe('');
      expect(await dev.stepCount()).toBeGreaterThan(0);
      // It actually drew: notation, not an empty SVG.
      await expect(page.locator('.score-buffer.is-front svg').first()).toBeVisible();
      expect(await dev.noteElementCount()).toBeGreaterThan(0);
      expect(await dev.measureCounts()).toEqual({ unrolled: 4, printed: 4 });

      await dev.startRun('wait');
      await dev.playPerfectly();
      expect((await dev.engineState())?.finished).toBe(true);
      expect((await dev.engineScore())?.accuracy).toBe(1);
      expect(errors).toEqual([]);
    });
  }

  test('the same seed gives the same exercise, a different seed does not', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.loadSightReading(2, 777, 4);
    const first = await dev.currentStepNoteIds();
    const firstSteps = await dev.stepCount();

    await dev.loadSightReading(2, 777, 4);
    expect(await dev.currentStepNoteIds()).toEqual(first);
    expect(await dev.stepCount()).toBe(firstSteps);

    await dev.loadSightReading(2, 778, 4);
    const other = await dev.stepCount();
    const otherIds = await dev.currentStepNoteIds();
    expect(other !== firstSteps || JSON.stringify(otherIds) !== JSON.stringify(first)).toBe(true);
  });
});
