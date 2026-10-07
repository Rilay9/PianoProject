/**
 * The Chord chart counts each bar in its written metre (MT1; the reviewer's ruling,
 * `docs/review/responses/ph1-g6a-landing.md` §4; brief `docs/prompts/runs/curriculum-review-2026-10-05/briefs/
 * seam-chart-metre.md`, red case 6).
 *
 * Before MT1 every chart clicked four quarter beats to a bar whatever its score wrote. Each bundled fixture here is
 * opened through the app's own route, counted off at the field's 240 maximum, stopped a few bars in, and what was
 * scheduled on the audio clock is read back:
 *
 * - clicks between consecutive accents = the bar's felt beats (2/4 two, 3/4 three, 5/4 five, 6/8 two, 12/8 four,
 *   2/2 two), the count-in included, and the accent on beat 1 alone;
 * - successive clicks `60 / field` seconds apart on the audio clock;
 * - the form's "Bar n" changing on the accented click and on no other;
 * - the tempo field's opening value and its unit;
 * - Bass + drums disabled with its sentence, and no bass or drum scheduled.
 *
 * Mr Lawrence changes from 3/4 to 4/4 at bar 17: the first beat of bar 17 is the accent and its bar has four.
 *
 * Instrumentation, an init script and nothing in the app (CB1's, `chart-backing.spec.ts`, extended): a click is a
 * buffer source played through a *bandpass* filter (the metronome's wood click, `Metronome.ts`), accented at
 * 2400 Hz; the kit's tones set their frequency with `setValueAtTime` (a kick also ramps it), its snare and hat
 * are noise through a *highpass*. Every start's audio-clock `when` is recorded, and with each click the form's
 * text at that moment: the metronome starts a click before it tells the screen about that beat, so the text
 * recorded with click k+1 is the screen after beat k. Nothing here is heard.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

interface Event {
  kind: 'click' | 'bass' | 'kick' | 'snare' | 'hat';
  accent: boolean;
  when: number;
  form: string;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const freqSet = new WeakMap<AudioParam, number>();
    const ramped = new WeakSet<AudioParam>();
    const target = new WeakMap<AudioNode, AudioNode>();
    const events: Event[] = [];
    (window as unknown as { __events: Event[] }).__events = events;
    const form = (): string => document.querySelector('#chart-form')?.textContent ?? '';
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
    (AudioNode.prototype as unknown as { connect: unknown }).connect = function (this: AudioNode, d: unknown, ...rest: unknown[]) {
      if (d instanceof AudioNode && !target.has(this)) target.set(this, d);
      return connect.call(this, d, ...rest);
    };
    const oscStart = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (when?: number) {
      const f = this.frequency;
      if (freqSet.has(f)) events.push({ kind: ramped.has(f) ? 'kick' : 'bass', accent: false, when: when ?? 0, form: form() });
      return oscStart.call(this, when);
    };
    const srcStart = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (when?: number, offset?: number, duration?: number) {
      const d = target.get(this);
      if (d instanceof BiquadFilterNode && d.type === 'highpass') {
        events.push({ kind: d.frequency.value >= 5000 ? 'hat' : 'snare', accent: false, when: when ?? 0, form: form() });
      } else if (d instanceof BiquadFilterNode && d.type === 'bandpass') {
        events.push({ kind: 'click', accent: d.frequency.value === 2400, when: when ?? 0, form: form() });
      }
      return srcStart.call(this, when, offset, duration);
    };
    /* eslint-enable @typescript-eslint/unbound-method */
  });
});

interface Fixture {
  name: string;
  id: string;
  /** The felt beats of the bars run, in order from bar 1 (the count-in is in bar 1's). */
  beats: (bar: number) => number;
  /** The field's opening value and label. */
  field: string;
  label: string;
  /** The time signature the refusal names. */
  metre: string;
  /** Stop when the form reaches this bar. */
  until: number;
}

const FIXTURES: Fixture[] = [
  { name: 'Skating, 3/4', id: 'song.jazz.vince-guaraldi-skating.pdmx', beats: () => 3, field: '192', label: 'bpm', metre: '3/4', until: 5 },
  { name: 'Take Five, 5/4', id: 'song.jazz.the-dave-brubeck-quartet-take-five.pdmx', beats: () => 5, field: '136', label: 'bpm', metre: '5/4', until: 4 },
  { name: 'Row, Row, Row Your Boat, 6/8', id: 'song.folk.row-row-row-your-boat', beats: () => 2, field: '54', label: 'bpm (dotted quarters)', metre: '6/8', until: 5 },
  { name: 'Corcovado, 2/2', id: 'song.pop.corcovado.pdmx', beats: () => 2, field: '48', label: 'bpm (half notes)', metre: '2/2', until: 5 },
  { name: 'Ah vous dirai-je, 2/4', id: 'song.classical.ah-vous-dirais-je-maman.pdmx', beats: () => 2, field: '132', label: 'bpm', metre: '2/4', until: 5 },
  { name: 'Twelve-eight exercise, 12/8', id: 'exercise.meter.12-8', beats: () => 4, field: '50.667', label: 'bpm (dotted quarters)', metre: '12/8', until: 4 },
];

const FIELD = 240;

async function open(page: Page, id: string): Promise<void> {
  await page.goto('about:blank');
  await page.goto(`/#/chart/${id}`);
  await expect(page.locator('.chart-cell[data-bar="1"]')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#chart-start')).toBeVisible();
}

/** Count off at 240 with Comp on, run until the form reaches bar `until`, stop; the events scheduled. */
async function run(page: Page, until: number): Promise<Event[]> {
  const bpm = page.locator('#chart-bpm');
  await bpm.fill(String(FIELD));
  await bpm.dispatchEvent('change');
  const comp = page.locator('#chart-comp');
  if ((await comp.getAttribute('aria-pressed')) !== 'true') await comp.click();
  await page.locator('#chart-start').click();
  await expect(page.locator('#chart-form')).toContainText(`Bar ${String(until)} of`, { timeout: 60_000 });
  await page.locator('#chart-stop').click();
  await page.waitForTimeout(300);
  return page.evaluate(() => (window as unknown as { __events: Event[] }).__events);
}

/** The clicks grouped into bars from each accent; the last, cut short by Stop, dropped. */
function barsOf(clicks: Event[]): Event[][] {
  const bars: Event[][] = [];
  for (const click of clicks) {
    if (click.accent || bars.length === 0) bars.push([click]);
    else bars[bars.length - 1]?.push(click);
  }
  return bars.slice(0, -1);
}

function keep(name: string, data: unknown): void {
  const out = process.env.MT1_OUT;
  if (!out) return;
  mkdirSync(out, { recursive: true });
  writeFileSync(path.join(out, `${name.replace(/[^\w.-]+/g, '_')}.json`), JSON.stringify(data, null, 1));
}

/** The checks every fixture shares: beats per bar, spacing, the form on the accent. `beats(0)` is the count-in. */
function checkClicks(clicks: Event[], beats: (bar: number) => number): { bars: number[]; accents: number } {
  expect(clicks.length, 'no click was scheduled').toBeGreaterThan(0);
  const bars = barsOf(clicks);
  // Bar 0 is the count-in (one bar, the default), in bar 1's metre.
  bars.forEach((bar, i) => {
    expect(bar.length, `clicks in ${i === 0 ? 'the count-in' : `bar ${String(i)}`}`).toBe(beats(Math.max(1, i)));
  });
  // 60 / field apart on the audio clock (the first may be nudged to "now"; every one after is exact arithmetic).
  for (let i = 2; i < clicks.length; i += 1) {
    expect(Math.abs((clicks[i]?.when ?? 0) - (clicks[i - 1]?.when ?? 0) - 60 / FIELD), `click ${String(i)}`).toBeLessThan(1e-6);
  }
  // The form after beat k is what was on screen when click k+1 started. It changes on an accent and nowhere else,
  // from bar 2 on (the count-in and bar 1 both read "Bar 1").
  const countIn = bars[0]?.length ?? 0;
  for (let k = countIn + 1; k + 1 < clicks.length; k += 1) {
    const before = clicks[k]?.form;
    const after = clicks[k + 1]?.form;
    if (clicks[k]?.accent) expect(after, `click ${String(k)} is a downbeat`).not.toBe(before);
    else expect(after, `click ${String(k)} is not a downbeat`).toBe(before);
  }
  return { bars: bars.map((bar) => bar.length), accents: clicks.filter((c) => c.accent).length };
}

test.describe('the chord chart counts each bar in its written metre', () => {
  for (const fixture of FIXTURES) {
    test(`${fixture.name}: the click, the tracker, the tempo field and Bass + drums`, async ({ page }) => {
      await open(page, fixture.id);
      const field = page.locator('#chart-bpm');
      // Soft, so a run on code without MT1 goes on to count its clicks and reports every red at once.
      await expect.soft(field).toHaveValue(fixture.field);
      await expect.soft(page.locator('label[for="chart-bpm"]')).toHaveText(fixture.label);
      const chip = page.locator('#chart-backing');
      await expect.soft(chip).toBeDisabled();
      await expect.soft(chip).toHaveAttribute('aria-disabled', 'true');
      await expect.soft(page.locator('#chart-backing-note')).toHaveText(
        `Bass + drums plays only in 4/4, and this chart is in ${fixture.metre}. Count off for the click and turn on Comp for the chords: both follow the ${fixture.metre}.`,
      );
      const events = await run(page, fixture.until);
      const clicks = events.filter((e) => e.kind === 'click');
      const summary = checkClicks(clicks, fixture.beats);
      const kit = events.filter((e) => e.kind !== 'click');
      expect(kit, 'a bass or drum was scheduled with Bass + drums refused').toEqual([]);
      await expect(chip).toHaveAttribute('aria-pressed', 'false');
      keep(fixture.name, { id: fixture.id, field: await field.inputValue(), ...summary, kit: kit.length });
    });
  }

  test('Skating, 3/4: the unsourced “jazz waltz” comment does not switch on chart backing', async ({ page }) => {
    await open(page, 'song.jazz.vince-guaraldi-skating.pdmx');
    await expect.soft(page.locator('#chart-backing')).toBeDisabled();
    // Pressed if it can be (code without MT1): the run then shows what the old chip scheduled in 3/4.
    if (await page.locator('#chart-backing').isEnabled()) await page.locator('#chart-backing').click();
    const events = await run(page, 4);
    expect(events.filter((e) => e.kind !== 'click').map((e) => e.kind)).toEqual([]);
  });

  test('Bella Ciao, 4/4 with a pickup: today’s four-beat bars, Bass + drums offered and playing (the 4/4 differential)', async ({ page }) => {
    await open(page, 'song.folk.bella-ciao');
    await expect(page.locator('label[for="chart-bpm"]')).toHaveText('bpm');
    await expect(page.locator('#chart-bpm')).toHaveValue('96');
    await expect(page.locator('#chart-backing-note')).toHaveCount(0);
    const chip = page.locator('#chart-backing');
    await expect(chip).toBeEnabled();
    if ((await chip.getAttribute('aria-pressed')) !== 'true') await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    const events = await run(page, 6);
    const clicks = events.filter((e) => e.kind === 'click');
    const summary = checkClicks(clicks, () => 4);
    const count = (kind: Event['kind']) => events.filter((e) => e.kind === kind).length;
    expect(count('bass'), 'no bass was scheduled').toBeGreaterThan(0);
    expect(count('kick') + count('snare') + count('hat'), 'no drums were scheduled').toBeGreaterThan(0);
    const first = clicks[0]?.when ?? 0;
    keep('Bella Ciao 4-4', {
      ...summary,
      counts: { click: clicks.length, accent: summary.accents, bass: count('bass'), kick: count('kick'), snare: count('snare'), hat: count('hat') },
      starts: events.map((e) => [e.kind === 'click' && e.accent ? 'accent' : e.kind, Math.round((e.when - first) * 1e6) / 1e6]),
    });
  });

  test('Mr Lawrence, 3/4 then 4/4 from bar 17: the first beat of bar 17 is the accent and its bar has four', async ({ page }) => {
    test.setTimeout(120_000);
    await open(page, 'song.beautiful.merry-christmas-mr-lawrence');
    await expect.soft(page.locator('#chart-backing')).toBeDisabled();
    await expect.soft(page.locator('#chart-backing-note')).toHaveText(
      'Bass + drums plays only in 4/4, and this chart has bars in 3/4. Count off for the click and turn on Comp for the chords: both follow each bar’s time signature.',
    );
    await expect.soft(page.locator('label[for="chart-bpm"]')).toHaveText('bpm');
    const events = await run(page, 19);
    const clicks = events.filter((e) => e.kind === 'click');
    const summary = checkClicks(clicks, (bar) => (bar >= 17 ? 4 : 3));
    expect(summary.bars.slice(15, 19), 'bars 15-18').toEqual([3, 3, 4, 4]);
    // Bar 17's downbeat: the screen moves to bar 17 on it.
    const bars = barsOf(clicks);
    const downbeat17 = bars[17]?.[0];
    const index = downbeat17 ? clicks.indexOf(downbeat17) : -1;
    expect(index, 'bar 17 has no downbeat').toBeGreaterThan(0);
    expect(downbeat17?.accent).toBe(true);
    expect(clicks[index + 1]?.form).toMatch(/^Bar 17 of/);
    expect(events.filter((e) => e.kind !== 'click')).toEqual([]);
    keep('Mr Lawrence', { ...summary });
  });
});
