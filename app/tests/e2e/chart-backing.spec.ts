/**
 * The Chord chart's bass and drums do not need its comp (CB1; the reviewer's
 * ruling in `docs/review/responses/a7b1-bluebossa-design.md` §4, reproduced by
 * the Blue Bossa probe, `docs/pending-review.md` Entry 266, Station 4).
 *
 * Blue Bossa's chart is run for its first four bars (stopped as bar 5 begins,
 * at 240 bpm) in the four settings of *Comp* and *Bass + drums*, and what the
 * app schedules on the audio clock is counted:
 *
 *   A  Bass + drums on, Comp on    bass, drums and the piano comp
 *   B  Bass + drums on, Comp off   the same bass and drums, no piano
 *   C  Comp on, Bass + drums off   the piano comp, no bass, no drums
 *   D  both off                    the click alone
 *
 * Before CB1 case B scheduled nothing but the click: the backing was scheduled
 * from inside the comp, and the Bass + drums chip forced Comp on, so turning
 * the comp off again silenced the rhythm section while the chip still read
 * pressed. A7b.1 step 11 (comp Blue Bossa in shells over the app's bass and
 * drums) needs exactly case B.
 *
 * Instrumentation, an init script and nothing in the app: every oscillator and
 * buffer-source start is classified by how it was built. The kit's tones set
 * their frequency with `setValueAtTime` (a kick also ramps it down; a bass note
 * does not); the kit's snare and hat are noise through a *highpass* filter at
 * 1800 and 7000 Hz; the metronome's clicks set `frequency.value` or go through
 * a bandpass, so they fall in neither class. Piano starts are the app's own
 * counter, `window.__pianopath.audioStarts.piano`.
 *
 * Each case sets a chip to the state it wants by reading `aria-pressed`, never
 * by assuming what a click does, so the same cases run on the code before and
 * after the change. Nothing here is heard: these are counts of what is
 * scheduled, not how it sounds.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ITEM = 'song.jazz.kenny-dorham-blue-bossa.pdmx';

interface Probe {
  bass: number;
  kick: number;
  snare: number;
  hat: number;
  bassHz: number[];
}
interface Counts extends Probe {
  piano: number;
  chips: { comp: string | null; backing: string | null };
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const freqSet = new WeakMap<AudioParam, number>();
    const ramped = new WeakSet<AudioParam>();
    const target = new WeakMap<AudioNode, AudioNode>();
    const probe: Probe = { bass: 0, kick: 0, snare: 0, hat: 0, bassHz: [] };
    (window as unknown as { __probe: Probe }).__probe = probe;
    // The originals are taken off the prototypes to be wrapped and called back
    // with the instance as `this`; `unbound-method` guards the opposite case.
    /* eslint-disable @typescript-eslint/unbound-method */
    const setV = AudioParam.prototype.setValueAtTime;
    AudioParam.prototype.setValueAtTime = function (v: number, t: number) {
      if (!freqSet.has(this)) freqSet.set(this, v);
      return setV.call(this, v, t);
    };
    const ramp = AudioParam.prototype.exponentialRampToValueAtTime;
    AudioParam.prototype.exponentialRampToValueAtTime = function (v: number, t: number) {
      ramped.add(this);
      return ramp.call(this, v, t);
    };
    const connect = AudioNode.prototype.connect as (...a: unknown[]) => unknown;
    (AudioNode.prototype as unknown as { connect: unknown }).connect = function (
      this: AudioNode,
      d: unknown,
      ...rest: unknown[]
    ) {
      if (d instanceof AudioNode && !target.has(this)) target.set(this, d);
      return connect.call(this, d, ...rest);
    };
    const oscStart = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (when?: number) {
      const f = this.frequency;
      if (freqSet.has(f)) {
        if (ramped.has(f)) probe.kick += 1;
        else {
          probe.bass += 1;
          probe.bassHz.push(Math.round(freqSet.get(f) ?? 0));
        }
      }
      return oscStart.call(this, when);
    };
    const srcStart = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (when?: number, offset?: number, duration?: number) {
      const d = target.get(this);
      if (d instanceof BiquadFilterNode && d.type === 'highpass') {
        if (d.frequency.value >= 5000) probe.hat += 1;
        else probe.snare += 1;
      }
      return srcStart.call(this, when, offset, duration);
    };
    /* eslint-enable @typescript-eslint/unbound-method */
  });
});

/** Press a chip until it reads the wanted state. */
async function setChip(page: Page, id: string, wanted: boolean): Promise<void> {
  const chip = page.locator(id);
  if ((await chip.getAttribute('aria-pressed')) !== String(wanted)) await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', String(wanted));
}

async function run(page: Page, label: string, comp: boolean, backing: boolean): Promise<Counts> {
  // A blank page first: a second hash route on the same document would keep
  // the first run's counters and its screen.
  await page.goto('about:blank');
  await page.goto(`/#/chart/${ITEM}`);
  await expect(page.locator('.chart-cell[data-bar="5"]')).toHaveText(/Dmi7b5/, { timeout: 20_000 });
  const bpm = page.locator('#chart-bpm');
  await bpm.fill('240');
  await bpm.dispatchEvent('change');
  // Bass + drums first, then Comp: the order that exposed the old forced comp.
  await setChip(page, '#chart-backing', backing);
  await setChip(page, '#chart-comp', comp);
  await page.locator('#chart-start').click();
  // Bars 1-4 sound in full; the run is stopped as bar 5 begins.
  await expect(page.locator('#chart-form')).toContainText('Bar 5 of 32', { timeout: 30_000 });
  await page.locator('#chart-stop').click();
  await page.waitForTimeout(300);
  const read = await page.evaluate(() => ({
    probe: (window as unknown as { __probe: Probe }).__probe,
    piano: (window as unknown as { __pianopath: { audioStarts: { piano: number } } }).__pianopath.audioStarts.piano,
    chips: {
      comp: document.querySelector('#chart-comp')?.getAttribute('aria-pressed') ?? null,
      backing: document.querySelector('#chart-backing')?.getAttribute('aria-pressed') ?? null,
    },
  }));
  const counts: Counts = { ...read.probe, piano: read.piano, chips: read.chips };
  // Only when asked: the before-and-after differential of CB1 compares these.
  const out = process.env.CB1_OUT;
  if (out) {
    mkdirSync(out, { recursive: true });
    writeFileSync(path.join(out, `${label}.json`), JSON.stringify(counts, null, 1));
  }
  return counts;
}

const rhythmSection = (c: Counts) => ({ bass: c.bass, kick: c.kick, snare: c.snare, hat: c.hat, bassHz: c.bassHz });

test.describe('Blue Bossa chart: Comp and Bass + drums are independent', () => {
  test('A: Bass + drums on, Comp on — bass, drums and the piano comp', async ({ page }) => {
    const a = await run(page, 'A backing on, comp on', true, true);
    expect(a.bass, 'no bass was scheduled').toBeGreaterThan(0);
    expect(a.kick, 'no kick was scheduled').toBeGreaterThan(0);
    expect(a.snare, 'no snare was scheduled').toBeGreaterThan(0);
    expect(a.hat, 'no hat was scheduled').toBeGreaterThan(0);
    expect(a.piano, 'the comp never sounded').toBeGreaterThan(0);
  });

  test('B: Bass + drums on, Comp off — the same bass and drums as A, no piano', async ({ page }) => {
    // Case A first, in this test, so B is compared with a run of the same
    // window rather than with a number written in the spec.
    const a = await run(page, 'A2 backing on, comp on', true, true);
    const b = await run(page, 'B backing on, comp off', false, true);
    expect(b.chips).toEqual({ comp: 'false', backing: 'true' });
    expect(b.piano, 'the piano comped with Comp off').toBe(0);
    expect(rhythmSection(b), 'Comp off changed what the rhythm section plays').toEqual(rhythmSection(a));
    expect(b.bass, 'Bass + drums read pressed and scheduled no bass').toBeGreaterThan(0);
    expect(b.kick + b.snare + b.hat, 'Bass + drums read pressed and scheduled no drums').toBeGreaterThan(0);
  });

  test('C: Comp on, Bass + drums off — the piano comp, no bass, no drums', async ({ page }) => {
    const c = await run(page, 'C comp on, backing off', true, false);
    expect(c.piano, 'the comp never sounded').toBeGreaterThan(0);
    expect(c.bass + c.kick + c.snare + c.hat, 'the rhythm section played with Bass + drums off').toBe(0);
  });

  test('D: both off — the click alone', async ({ page }) => {
    const d = await run(page, 'D both off', false, false);
    expect(d.piano, 'the piano sounded with Comp off').toBe(0);
    expect(d.bass + d.kick + d.snare + d.hat, 'the rhythm section played with Bass + drums off').toBe(0);
  });
});
