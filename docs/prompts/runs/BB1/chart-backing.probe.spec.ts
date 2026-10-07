/**
 * A7b.1 probe, Station 4 (the reviewer's ruling, a7b1-bluebossa-design.md §4a): on Blue Bossa's
 * chord chart, what the app schedules on the audio clock under each Comp / Bass + drums setting.
 *
 * Instrumentation (an init script, nothing in the app changed): every oscillator and buffer source
 * start is classified by how it was built. The kit's tones set their frequency with
 * setValueAtTime (a kick also ramps it down; a bass note does not); the kit's snare and hat are
 * noise through a *highpass* filter at 1800 and 7000 Hz; the metronome's clicks set
 * `frequency.value` or go through a bandpass, so they fall in neither class. Piano note starts
 * are read from the app's own counter, `window.__pianopath.audioStarts.piano` (U67).
 *
 * It records what is scheduled, not what is heard: nothing here hears anything.
 */
import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ITEM = 'song.jazz.kenny-dorham-blue-bossa.pdmx';
const here = path.dirname(fileURLToPath(import.meta.url));
const results: Record<string, unknown> = {};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const freqSet = new WeakMap<AudioParam, number>();
    const ramped = new WeakSet<AudioParam>();
    const target = new WeakMap<AudioNode, AudioNode>();
    const probe = { bass: 0, kick: 0, snare: 0, hat: 0, other: 0, bassHz: [] as number[] };
    (window as unknown as { __probe: typeof probe }).__probe = probe;
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
    (AudioNode.prototype as unknown as { connect: unknown }).connect = function (this: AudioNode, d: unknown, ...rest: unknown[]) {
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
  });
});

async function run(page: Page, label: string, setup: (page: Page) => Promise<void>): Promise<void> {
  await page.goto(`/#/chart/${ITEM}`);
  await expect(page.locator('.chart-cell[data-bar="5"]')).toHaveText(/Dmi7b5/, { timeout: 20_000 });
  const bpm = page.locator('#chart-bpm');
  const loadedBpm = await bpm.inputValue();
  await bpm.fill('240');
  await bpm.dispatchEvent('change');
  await setup(page);
  const chips = {
    comp: await page.locator('#chart-comp').getAttribute('aria-pressed'),
    backing: await page.locator('#chart-backing').getAttribute('aria-pressed'),
  };
  const before = await page.evaluate(() => ({ ...(window as unknown as { __pianopath: { audioStarts: object } }).__pianopath.audioStarts }));
  await page.locator('#chart-start').click();
  // Bars 1-4 sound in full; the run is stopped as bar 5 begins.
  await expect(page.locator('#chart-form')).toContainText('Bar 5 of 32', { timeout: 30_000 });
  await page.locator('#chart-stop').click();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({
    probe: (window as unknown as { __probe: unknown }).__probe,
    audio: { ...(window as unknown as { __pianopath: { audioStarts: object } }).__pianopath.audioStarts },
  }));
  results[label] = { loadedBpm, chips, audioBefore: before, ...after };
}

test.describe('Blue Bossa chart: Comp and Bass + drums', () => {
  test.describe.configure({ mode: 'serial' });
  test('A: Bass + drums pressed (forces Comp on)', async ({ page }) => {
    await run(page, 'A backing on (comp forced on)', async (p) => {
      await p.locator('#chart-backing').click();
    });
  });
  test('B: Bass + drums on, then Comp turned off (the ruling\'s check)', async ({ page }) => {
    await run(page, 'B backing on, comp off', async (p) => {
      await p.locator('#chart-backing').click();
      await p.locator('#chart-comp').click();
    });
  });
  test('C: Comp on, Bass + drums off', async ({ page }) => {
    await run(page, 'C comp on, backing off', async (p) => {
      await p.locator('#chart-comp').click();
    });
  });
  test('D: both off (step 12, the learner supplies every chord)', async ({ page }) => {
    await run(page, 'D both off', async () => {});
  });
  test.afterAll(() => {
    writeFileSync(path.resolve(here, '..', '..', '..', 'build', 'A7b1-probe', 'chart-backing.json'), JSON.stringify(results, null, 1));
  });
});
