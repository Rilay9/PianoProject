/**
 * A verified hand fact, in the app the learner gets (HD2; the reviewer's ruling,
 * `docs/review/responses/hd2-corpus-diff.md` §2 and §4; the browser case's required change, HD2b,
 * `docs/review/responses/bf57baca.md` §3).
 *
 * *The Crave* bar 40: the treble staff's inner line (staff 1, voice 2, the F5/A5 sixteenths) is the right
 * hand's, while the left hand plays staff 2 voice 3. The model's compatibility reading counts each voice
 * number over the whole piece, and this file reuses voice 2 from the lower staff, so before HD2 the line
 * was the left hand's: with *R* chosen a run did not expect it, and with *L* chosen it did, and the app's
 * duet played it for the right hand's learner as the left hand's part. The row in
 * `content/sources/verified-facts.json` (current identity = the catalogue's) now makes it the right hand's.
 * Two things are proved, each from where the learner meets it:
 *
 * 1. *What the learner is expected to play* (`scoreRun().expected`, what a Wait run waits for and a Tempo
 *    run judges): *R* chosen, the run expects the inner line through bar 40; *L* chosen, it expects the
 *    staff-2 voice-3 chords alone. The Wait runs drive the whole piece to bar 40 through the MIDI mock,
 *    as `fixtures/playInTime.ts` does.
 * 2. *What the app plays for the other hand* (the Duet): *R* chosen, the app's part is the lower staff's
 *    chords and not the inner line; *L* chosen, the app's part is the right hand's, the inner line in it.
 *    `scoreRun().pitches` cannot show this: it is the step's own notes whatever the mode expects, every
 *    hand's, so a lower-staff pitch there with *R* chosen proves only that the note is in the score. The
 *    observation is the audio boundary itself: every `AudioBufferSourceNode.start` of a piano sample, read
 *    back to the note the sample is (`audioProbe` below: each decoded buffer is matched to its soundfont
 *    entry by content, and the note is that entry plus the node's detune), over a Tempo run looping bar 40
 *    alone (`?loop=40-40`), so every piano start of the run is one of the bar's steps. It is what
 *    `ScoreSession.schedulePlayback` and `onLatched` hand to `Piano.start`, read after the sampler, with
 *    no accessor added to the app. `verifiedHands.test.ts` holds the same rule on `ScoreSession.appPitches`
 *    in isolation; here the learner's own screen does the choosing.
 *
 * Nothing heard: the notes are those the sampler is asked for, not a recording of the output.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock } from './fixtures/midiMock';
import { pressControl, revealBar } from './scoreControls';

const ID = 'song.jazz.the-crave';
/** Printed bar 40, OSMD's source measure 39 (no pickup, no repeats: `printedStaffHand` and CD1's dump). */
const BAR_INDEX = 39;
const INNER = [77, 81];
/** The left hand's chords in bar 40, staff 2 voice 3. */
const LOWER = [29, 41, 43, 45, 53, 57, 60];
/** The left hand's bar in order, one chord per step that has one (CD1's dump of the file, `docs/prompts/runs/CD1/evidence/`). */
const LEFT_BAR = [[29, 41], [45, 53, 60], [43, 53, 57]];
/** The right hand's bar in order: the twenty F5/A5 sixteenths of the inner line, then the melody's last three chords. */
const RIGHT_BAR = [...Array.from({ length: 10 }, () => [[77], [81]]).flat(), [74, 81, 84], [77, 88], [86]];

interface Row {
  id: string;
  provenance?: { identity?: { kind: string; sha256?: string } };
}

interface BarStep {
  step: number;
  expected: number[];
}

/** Plays a Wait run from the start to the end of the bar, striking each step's expected notes; returns the bar's steps. */
async function throughTheBar(page: Page): Promise<BarStep[]> {
  return page.evaluate(
    async ({ bar, budget }) => {
      interface Run {
        step: number;
        bar: number;
        expected: number[];
      }
      const hooked = window as unknown as {
        __pianopath?: { scoreRun?: () => Run | null };
        __midiMock?: { deliver(inputId: string | null, bytes: number[]): void };
      };
      const frame = (): Promise<void> => new Promise((done) => requestAnimationFrame(() => done()));
      const seen = new Map<number, BarStep>();
      const until = Date.now() + budget;
      let lastStep = -1;
      let stuck = 0;
      while (Date.now() < until) {
        const run = hooked.__pianopath?.scoreRun?.();
        if (!run) {
          await frame();
          continue;
        }
        if (run.bar > bar) break;
        if (run.bar === bar && !seen.has(run.step)) seen.set(run.step, { step: run.step, expected: [...run.expected] });
        stuck = run.step === lastStep ? stuck + 1 : 0;
        lastStep = run.step;
        if (stuck > 600) throw new Error(`the run stopped at step ${String(run.step)}, bar ${String(run.bar)}`);
        for (const midi of run.expected) hooked.__midiMock?.deliver(null, [0x90, midi, 90]);
        await frame();
        for (const midi of run.expected) hooked.__midiMock?.deliver(null, [0x80, midi, 0]);
        await frame();
      }
      return [...seen.values()];
    },
    { bar: BAR_INDEX, budget: 240_000 },
  );
}

async function openScore(page: Page, query: string): Promise<void> {
  await page.goto(`/#/score/${ID}${query}`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  await revealBar(page);
}

async function openWait(page: Page, hand: 'R' | 'L'): Promise<void> {
  await openScore(page, '');
  await page.locator('#score-mode').selectOption('wait');
  await page.waitForTimeout(200);
  await pressControl(page, `#score-hands-${hand}`);
  await pressControl(page, '#score-play');
}

/** The sampler's notes: each soundfont entry's bytes (a hash of them) and the MIDI number its name gives. */
function soundfontNotes(): Record<string, number> {
  const file = readFileSync(resolve('public/content/audio/acoustic_grand_piano-mp3.js'), 'utf8');
  const hash = (bytes: Uint8Array): string => {
    let h = 0x811c9dc5;
    for (const b of bytes) h = Math.imul(h ^ b, 0x01000193) >>> 0;
    return `${String(bytes.length)}:${String(h)}`;
  };
  const offsets: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const out: Record<string, number> = {};
  for (const m of file.matchAll(/"([A-G])([b#]?)(\d)":\s*"data:audio\/mp3;base64,([^"]+)"/g)) {
    const letter = m[1] ?? 'C';
    const accidental = m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0;
    const midi = (offsets[letter] ?? 0) + accidental + 12 * (Number(m[3]) + 1);
    out[hash(Buffer.from(m[4] ?? '', 'base64'))] = midi;
  }
  return out;
}

/**
 * Reads what the app asks the sampler to play.
 *
 * Installed before the page's own scripts. A decoded sample is matched to its soundfont entry by a hash of
 * the bytes it was decoded from; a started `AudioBufferSourceNode` whose buffer is one of those is a piano
 * note, its pitch the entry's plus the node's detune in semitones (the sampler holds one sample per key,
 * so the detune is zero). The metronome's click is not a sample of the soundfont and is not read. `at` is
 * the audio-clock time the note was scheduled for, in milliseconds, so one step's chord shares one value.
 */
async function audioProbe(page: Page): Promise<void> {
  await page.addInitScript((notes: Record<string, number>) => {
    const hash = (bytes: Uint8Array): string => {
      let h = 0x811c9dc5;
      for (const b of bytes) h = Math.imul(h ^ b, 0x01000193) >>> 0;
      return `${String(bytes.length)}:${String(h)}`;
    };
    const noteOf = new WeakMap<AudioBuffer, number>();
    // Patched in place and called back with the receiver it was called on, so reading it unbound is the point.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const decode = BaseAudioContext.prototype.decodeAudioData;
    BaseAudioContext.prototype.decodeAudioData = function (this: BaseAudioContext, data: ArrayBuffer) {
      const midi = notes[hash(new Uint8Array(data))];
      const result = decode.call(this, data);
      if (midi !== undefined) {
        result.then(
          (buffer) => noteOf.set(buffer, midi),
          () => undefined,
        );
      }
      return result;
    };
    const starts: { midi: number; at: number }[] = [];
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (this: AudioBufferSourceNode, when?: number, ...rest: number[]) {
      const base = this.buffer ? noteOf.get(this.buffer) : undefined;
      if (base !== undefined) starts.push({ midi: base + Math.round(this.detune.value / 100), at: Math.round((when ?? 0) * 1000) });
      return start.call(this, when ?? 0, ...rest);
    };
    (window as unknown as { __pianoStarts: typeof starts }).__pianoStarts = starts;
  }, soundfontNotes());
}

interface BarRun {
  /** What the run expected of the learner, by step, in the order the steps came. */
  steps: BarStep[];
  /** What the app asked the sampler for, by scheduled time: one chord per step it played. */
  app: number[][];
  /** How many chords the sampler was asked for in all, repeats from later laps included. */
  starts: number;
}

/**
 * A Tempo run looping bar 40 alone, in the Duet's default (the app plays the hand not chosen), for as long
 * as it takes to see every step expected and the piano (still loading when the run starts) play a lap.
 */
async function loopBar(page: Page, hand: 'R' | 'L'): Promise<BarRun> {
  await installMidiMock(page, { permission: 'granted' });
  await audioProbe(page);
  await openScore(page, `?mode=tempo&hands=${hand}&loop=40-40`);
  await pressControl(page, '#score-play');
  const result = await page.evaluate(async (budget) => {
    interface Run {
      step: number;
      bar: number;
      expected: number[];
      armed: boolean;
    }
    const hooked = window as unknown as {
      __pianopath?: { scoreRun?: () => Run | null; audioStarts?: { piano: number } };
      __midiMock?: { deliver(inputId: string | null, bytes: number[]): void };
      __pianoStarts: { midi: number; at: number }[];
    };
    const frame = (): Promise<void> => new Promise((done) => requestAnimationFrame(() => done()));
    const steps = new Map<number, { step: number; expected: number[] }>();
    const until = Date.now() + budget;
    let lastStep = -1;
    // Laps seen once the piano has sounded: at least two, so a lap begun before the samples were ready is not the only one.
    let lapsWithPiano = 0;
    while (Date.now() < until && lapsWithPiano < 2) {
      const run = hooked.__pianopath?.scoreRun?.();
      if (!run) {
        await frame();
        continue;
      }
      if (run.step < lastStep && (hooked.__pianopath?.audioStarts?.piano ?? 0) > 0) lapsWithPiano += 1;
      lastStep = run.step;
      if (!steps.has(run.step)) steps.set(run.step, { step: run.step, expected: [...run.expected] });
      // A run that holds for the learner's first note (T8) starts on it.
      if (run.armed) {
        for (const midi of run.expected) hooked.__midiMock?.deliver(null, [0x90, midi, 90]);
        await frame();
        for (const midi of run.expected) hooked.__midiMock?.deliver(null, [0x80, midi, 0]);
      }
      await frame();
    }
    return { steps: [...steps.values()], starts: hooked.__pianoStarts };
  }, 90_000);
  const byTime = new Map<number, Set<number>>();
  for (const { midi, at } of result.starts) byTime.set(at, (byTime.get(at) ?? new Set()).add(midi));
  const app = [...byTime.entries()].sort((a, b) => a[0] - b[0]).map(([, chord]) => [...chord].sort((a, b) => a - b));
  return { steps: result.steps, app, starts: result.starts.length };
}

/** The chords of a step list, in step order, the steps that expect nothing left out. */
const chordsOf = (steps: BarStep[]): number[][] =>
  [...steps]
    .sort((a, b) => a.step - b.step)
    .map((s) => [...s.expected].sort((a, b) => a - b))
    .filter((chord) => chord.length > 0);

/** Whether `whole` occurs in `chords` as consecutive chords: the app played the hand's bar through once, start to end. */
function containsWhole(chords: number[][], whole: number[][]): boolean {
  const text = JSON.stringify(whole).slice(1, -1);
  return JSON.stringify(chords).includes(text);
}

test.describe('a verified hand: The Crave bar 40’s inner line is the right hand’s (HD2)', () => {
  test.setTimeout(360_000);

  test('the row is current: its identity is the catalogue’s', () => {
    const catalog = JSON.parse(readFileSync(resolve('public/content/catalog.json'), 'utf8')) as Row[];
    const row = catalog.find((item) => item.id === ID);
    const store = JSON.parse(readFileSync(resolve('..', 'content', 'sources', 'verified-facts.json'), 'utf8')) as {
      facts: { item: string; kind: string; bars: number[]; identity: { sha256: string } }[];
    };
    const fact = store.facts.find((f) => f.item === ID && f.kind === 'hand' && f.bars[0] === 40);
    expect(fact?.identity.sha256).toBe(row?.provenance?.identity?.sha256);
  });

  test('R chosen: a Wait run waits for the inner line through bar 40', async ({ page }) => {
    await installMidiMock(page, { permission: 'granted' });
    await openWait(page, 'R');
    const steps = await throughTheBar(page);
    const waited = steps.filter((s) => s.expected.some((midi) => INNER.includes(midi)));
    // Twenty notes of the F5/A5 line, each its own step; before HD2 none was the right hand's.
    expect(waited.length, JSON.stringify(steps)).toBeGreaterThanOrEqual(20);
    // The staff-2 chords are not the right hand's: nothing the run waits for is in the left hand's register.
    expect(steps.every((s) => s.expected.every((midi) => midi >= 60)), JSON.stringify(steps)).toBe(true);
  });

  test('L chosen: a Wait run waits for the staff-2 chords alone', async ({ page }) => {
    await installMidiMock(page, { permission: 'granted' });
    await openWait(page, 'L');
    const steps = await throughTheBar(page);
    expect(steps.length, 'the run reached bar 40').toBeGreaterThan(0);
    const expected = new Set(steps.flatMap((s) => s.expected));
    expect([...expected].filter((midi) => INNER.includes(midi)), 'the inner line is not the left hand’s').toEqual([]);
    expect([...expected].sort((a, b) => a - b), 'the left hand’s chords, staff 2 voice 3').toEqual(LOWER);
  });

  test('R chosen: the inner line is the learner’s to play and the app plays the lower staff alone', async ({ page }) => {
    const run = await loopBar(page, 'R');
    expect(run.starts, 'the piano sounded: the app’s part was observed, not assumed').toBeGreaterThan(0);
    // What the learner is expected to play at each step of the bar: the right hand's, the inner line in it.
    expect.soft(chordsOf(run.steps), 'the learner’s steps').toEqual(RIGHT_BAR);
    // What the app played for the other hand: the lower staff's chords, each step of them, and nothing else.
    const lower = new Set(LEFT_BAR.map((chord) => JSON.stringify(chord)));
    expect.soft(run.app.filter((chord) => !lower.has(JSON.stringify(chord))), 'the app played nothing but the left hand’s chords').toEqual([]);
    expect.soft(run.app.flat().filter((midi) => INNER.includes(midi)), 'the inner line is not in the app’s part').toEqual([]);
    expect.soft(containsWhole(run.app, LEFT_BAR), 'the app played the left hand’s bar through').toBe(true);
  });

  test('L chosen: the lower staff is the learner’s to play and the app plays the right hand, the inner line in it', async ({ page }) => {
    const run = await loopBar(page, 'L');
    expect(run.starts, 'the piano sounded: the app’s part was observed, not assumed').toBeGreaterThan(0);
    expect.soft(chordsOf(run.steps), 'the learner’s steps: the left hand’s chords, staff 2 voice 3').toEqual(LEFT_BAR);
    const right = new Set(RIGHT_BAR.map((chord) => JSON.stringify(chord)));
    expect.soft(run.app.filter((chord) => !right.has(JSON.stringify(chord))), 'the app played nothing but the right hand’s chords').toEqual([]);
    expect.soft(run.app.flat().filter((midi) => INNER.includes(midi)).length, 'the inner line is in the app’s part').toBeGreaterThanOrEqual(20);
    expect.soft(run.app.flat().filter((midi) => LOWER.includes(midi)), 'the learner’s own chords are not').toEqual([]);
    expect.soft(containsWhole(run.app, RIGHT_BAR), 'the app played the right hand’s bar through').toBe(true);
  });
});
