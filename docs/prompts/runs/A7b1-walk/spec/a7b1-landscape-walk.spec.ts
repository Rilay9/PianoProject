// acceptance-ability: A7b.1
/**
 * A7b.1's acceptance journey (minor ii-V-i with shells, Blue Bossa as its tune), automated on a phone held
 * sideways: `docs/chains/A7b.1.yaml`, every step in the record's order, at 780 x 360 with touch and mobile
 * emulation on. A7c.1's walk (`a7c1-phone-walk.spec.ts`) covered the upright phone. The owner's choice,
 * 2026-10-07; the ruling that sets what this journey proves is `docs/review/responses/pf2-landing.md`: it
 * proves the ability's own named evidence (one counted run of `drill.jazz.minor-ii-v-i-shells` moving jazz.6's
 * counts to "1 of 2") and asserts no rung completion.
 *
 * One test, one browser context, the steps in the record's order. Each step is recorded PASS or STOP with what was
 * done, what the record expects, what the page showed, and a screenshot under `docs/prompts/runs/A7b1-walk/`; a STOP
 * is recorded and the walk goes on, and the test fails at the end (`expect.soft`) if any step stopped. The record is
 * written to `results.json` in that folder after every step.
 *
 * Input: the MIDI mock (`fixtures/midiMock.ts`) for the learner's piano; `fixtures/playInTime.ts` for the Keep tempo
 * runs; the chart's shells are struck from inside the page on its own frames (`compAlong`), reading each bar's chord
 * symbol off the chart as the learner does and voicing its shell. Taps are touch taps. Nothing is heard: a *Hear it*
 * or *Play it to me* step is read from the screen's state and the app's own count of piano notes scheduled, and
 * every sentence about sound is "unverified as music".
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock, type MidiMock } from './fixtures/midiMock';
import { playInTime } from './fixtures/playInTime';

const PHONE_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36';

test.use({
  viewport: { width: 780, height: 360 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: PHONE_UA,
  actionTimeout: 15_000,
  navigationTimeout: 30_000,
});

const RUN_DIR = resolve(process.env.WALK_OUT ?? resolve(process.cwd(), '..', 'docs/prompts/runs/A7b1-walk'));
const SHOT_PREFIX = 'docs/prompts/runs/A7b1-walk';

const RUNG = 'jazz.6';
const DRILL_TITLE = 'Minor ii-V-i with shell voicings';
const DRILL_ID = 'drill.jazz.minor-ii-v-i-shells';
const EAR_TITLE = 'Ear drill — seventh-chord qualities';
const EAR_ID = 'drill.ear.seventh-qualities';
const BLUE_BOSSA = 'Blue Bossa';
const INSENSATEZ = 'Insensatez (How Insensitive)';
const INSENSATEZ_ID = 'song.folk.insensatez-how-insensitive-jobim.pdmx';

type Verdict = 'PASS' | 'STOP';
interface StepRecord {
  step: string;
  did: string;
  expected: string;
  observed: string[];
  verdict: Verdict;
  cause?: string;
  shots: string[];
}
const record: StepRecord[] = [];
const trace = (line: string): void => {
  if (process.env.WALK_TRACE) console.log(`[walk ${new Date().toISOString().slice(11, 19)}] ${line}`);
};

function save(): void {
  mkdirSync(RUN_DIR, { recursive: true });
  writeFileSync(resolve(RUN_DIR, 'results.json'), JSON.stringify({ record }, null, 2));
}

type Run = { step: number; expected: number[]; bar: number; paused: boolean; armed: boolean } | null;
type Hooked = Window & {
  __pianopath?: { scoreRun?: () => Run; audioStarts?: { piano: number; metronome: number } };
};

// ---------------------------------------------------------------------------------------------
// Small helpers: taps, the bar, the ⋯ sheet, the lesson page.
// ---------------------------------------------------------------------------------------------

const screen = (page: Page) => page.locator('section[data-screen="score"]');

async function revealBar(page: Page): Promise<void> {
  if ((await page.locator('#score-bar[data-visible="false"]').count()) === 0) return;
  await page.locator('#score-stage').tap({ position: { x: 20, y: 20 } });
  await page.waitForTimeout(200);
}

async function openMenu(page: Page): Promise<void> {
  const sheet = page.locator('#score-more-sheet');
  if (await sheet.isVisible()) return;
  await revealBar(page);
  try {
    await page.locator('#score-more').tap({ timeout: 4_000 });
  } catch {
    await revealBar(page);
    await page.locator('#score-more').tap({ timeout: 4_000 });
  }
  await expect(sheet).toBeVisible();
}

async function closeMenu(page: Page): Promise<void> {
  const sheet = page.locator('#score-more-sheet');
  if (!(await sheet.isVisible())) return;
  await page.locator('#score-more-sheet-close').tap();
  await expect(sheet).toBeHidden();
}

/** Taps a control on the bar, or behind ⋯ where the bar has sent it. */
async function tapControl(page: Page, selector: string, obs?: string[]): Promise<void> {
  await revealBar(page);
  const control = page.locator(selector);
  if (await control.isVisible()) {
    try {
      await control.tap({ timeout: 2_000 });
    } catch {
      await revealBar(page);
      await control.tap({ timeout: 4_000 });
    }
    return;
  }
  obs?.push(`${selector} is behind ⋯ at this width`);
  await openMenu(page);
  await control.tap({ timeout: 4_000 });
  await closeMenu(page);
}

async function setMode(page: Page, mode: 'wait' | 'tempo' | 'listen', obs: string[]): Promise<void> {
  await revealBar(page);
  await page.locator('#score-mode').selectOption(mode);
  await expect(screen(page)).toHaveAttribute('data-mode', mode);
  obs.push(`mode ${mode}`);
}

async function settled(page: Page): Promise<void> {
  await expect(screen(page)).toHaveAttribute('data-mode', /\w+/, { timeout: 60_000 });
  await page.waitForSelector('.score-view[data-measured]', { timeout: 60_000 });
  await expect(page.locator('#score-stage')).toHaveAttribute('data-settled', 'true', { timeout: 30_000 });
}

async function shot(page: Page, name: string): Promise<string> {
  mkdirSync(RUN_DIR, { recursive: true });
  const file = resolve(RUN_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true, scale: 'css' }).catch(async () => {
    await page.screenshot({ path: file, scale: 'css' });
  });
  return `${SHOT_PREFIX}/${name}.png`;
}

async function pianoStarts(page: Page): Promise<number> {
  return page.evaluate(() => (window as Hooked).__pianopath?.audioStarts?.piano ?? Number.NaN);
}

async function summaryText(page: Page): Promise<string> {
  const sheet = page.locator('#score-summary');
  await expect(sheet, 'the summary sheet came up').toBeVisible({ timeout: 180_000 });
  await page.waitForTimeout(1_200);
  return ((await sheet.innerText()) ?? '').replace(/\s+/g, ' ').trim();
}

async function play(page: Page): Promise<void> {
  await tapControl(page, '#score-play');
  await expect(screen(page)).toHaveAttribute('data-running', 'true', { timeout: 15_000 });
}

/** Plays a Keep tempo run in time through the mock to its summary; returns the summary's text. */
async function playToSummary(page: Page, obs: string[]): Promise<string> {
  await play(page);
  const struck = await playInTime(page, 'midi', 240_000);
  const text = await summaryText(page);
  obs.push(`played in time through the MIDI mock: ${String(struck)} notes struck`);
  obs.push(`summary: "${text.slice(0, 360)}"`);
  return text;
}

/** The lesson page's own address, reached from wherever the walk is; Done on a summary sheet first. */
async function toLesson(page: Page, obs: string[], rung = RUNG): Promise<void> {
  const here = new RegExp(`#/lesson/${rung.replace('.', '\\.')}`);
  if (here.test(page.url())) {
    await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible({ timeout: 30_000 });
    return;
  }
  const done = page.locator('#summary-done');
  if (await done.isVisible().catch(() => false)) {
    await done.tap();
    await page.waitForTimeout(300);
  }
  const back = page.locator('#score-back, #drill-back, #chart-back, #lab-back, #play-back').first();
  if (await back.isVisible().catch(() => false)) {
    await back.tap();
    await page.waitForTimeout(400);
  }
  if (!here.test(page.url())) {
    obs.push(`← Back went to ${page.url().replace(/^.*#/, '#')}; the lesson page reopened by address`);
    await page.evaluate((r) => {
      window.location.hash = `#/lesson/${r}`;
    }, rung);
  }
  await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible({ timeout: 30_000 });
}

/** The lesson page's *What the app counts* summary line. */
async function countsLine(page: Page, rung = RUNG): Promise<string> {
  await toLesson(page, [], rung);
  const summary = page.locator('#lesson-counts summary');
  await expect(summary).toBeVisible({ timeout: 15_000 });
  return ((await summary.textContent()) ?? '').replace(/\s+/g, ' ').trim();
}

/** Opens a score row of the lesson page with its ▶ and waits for the Score screen to settle. */
async function openRow(page: Page, title: string, obs: string[]): Promise<void> {
  await toLesson(page, obs);
  const button = page.getByRole('button', { name: `Open ${title}`, exact: true });
  await expect(button, `the lesson page has a row for ${title}`).toHaveCount(1);
  await button.scrollIntoViewIfNeeded();
  await button.tap();
  await expect(page).toHaveURL(/#\/score\//, { timeout: 30_000 });
  await settled(page);
  obs.push(`opened ${title} (${page.url().replace(/^.*#/, '#')})`);
}

/** Opens a song row's *Chart* door on the lesson page. */
async function openChartFromRow(page: Page, title: string, obs: string[]): Promise<void> {
  await toLesson(page, obs);
  const button = page.getByRole('button', { name: `Open the chord chart for ${title}`, exact: true });
  await expect(button, `the lesson page has a Chart door on ${title}'s row`).toHaveCount(1);
  await button.scrollIntoViewIfNeeded();
  await button.tap();
  await expect(page.locator('section[data-screen="chart"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#chart-start')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.chart-cell').first()).toBeVisible({ timeout: 30_000 });
  obs.push(`opened ${title}'s chord chart from its row (${page.url().replace(/^.*#/, '#')})`);
}

/** Plan → (jazz on) → Stage `stage` → the rung's row → its lesson page. */
async function viaPlan(page: Page, stage: number, rung: string, obs: string[]): Promise<void> {
  await page.goto('/#/plan');
  await page.locator('#plan-tracks-open').tap();
  await expect(page.locator('#plan-tracks-sheet')).toBeVisible();
  const chip = page.locator('#plan-track-jazz');
  if ((await chip.getAttribute('aria-pressed')) !== 'true') await chip.tap();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#plan-tracks-sheet-close').tap();
  await expect(page.locator('#plan-tracks-sheet')).toBeHidden();
  const stageRow = page.locator(`.list-row[data-stage="${String(stage)}"]`);
  if ((await stageRow.getAttribute('data-open')) !== 'true') await stageRow.tap();
  const rungRow = page.locator(`.list-row[data-lesson="${rung}"]`);
  await expect(rungRow).toBeVisible();
  obs.push(`Plan Stage ${String(stage)} row: "${((await rungRow.innerText()) ?? '').replace(/\s+/g, ' ').trim()}"`);
  await rungRow.tap();
  await expect(page).toHaveURL(new RegExp(`#/lesson/${rung.replace('.', '\\.')}`));
  await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible({ timeout: 30_000 });
}

// ---------------------------------------------------------------------------------------------
// Drills through the MIDI mock.
// ---------------------------------------------------------------------------------------------

async function storedDrillRows(page: Page): Promise<{ itemId: string; lessonId?: string; accuracy: number; mode: string }[]> {
  return page.evaluate(
    () =>
      new Promise((done, fail) => {
        const open = indexedDB.open('pianopath');
        open.onerror = () => fail(new Error(String(open.error)));
        open.onsuccess = () => {
          const db = open.result;
          const read = db.transaction('sessions', 'readonly').objectStore('sessions').getAll();
          read.onerror = () => fail(new Error(String(read.error)));
          read.onsuccess = () => {
            db.close();
            done(
              (read.result as { itemId: string; lessonId?: string; accuracy: number; mode: string }[])
                .filter((row) => row.mode.startsWith('drill:'))
                .map(({ itemId, lessonId, accuracy, mode }) => ({ itemId, lessonId, accuracy, mode })),
            );
          };
        };
      }),
  );
}

async function openDrillRow(page: Page, title: string, obs: string[], rung = RUNG): Promise<void> {
  await toLesson(page, obs, rung);
  const button = page.locator('#lesson-exercises').getByRole('button', { name: `Open ${title}`, exact: true });
  await expect(button, `${rung} lists ${title} among its exercises`).toHaveCount(1);
  await button.scrollIntoViewIfNeeded();
  await button.tap();
  await expect(page).toHaveURL(/#\/drill\//, { timeout: 30_000 });
  await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', { timeout: 30_000 });
  obs.push(`opened ${title} from ${rung} (${page.url().replace(/^.*#/, '#')})`);
}

/**
 * Plays every card of the open drill with the pitches the card publishes (`data-expects`), leaving a held card
 * with a tap on it, as the learner does. `onCard` sees each card before it is answered.
 */
async function playDrillToFinish(
  page: Page,
  midi: MidiMock,
  onCard?: (index: number, expects: number[]) => void | Promise<void>,
  onAnswered?: (index: number) => void | Promise<void>,
): Promise<number> {
  const drill = page.locator('[data-screen="drill"]');
  let cards = 0;
  for (let guard = 0; guard < 200 && (await drill.getAttribute('data-drill')) !== 'finished'; guard += 1) {
    if (await drill.getAttribute('data-paused')) {
      await page.locator('#drill-symbol, #drill-counter').first().tap();
      await expect
        .poll(async () => !(await drill.getAttribute('data-paused')) || (await drill.getAttribute('data-drill')) === 'finished')
        .toBe(true);
      continue;
    }
    const want = ((await drill.getAttribute('data-expects')) ?? '').split(',').filter(Boolean).map(Number);
    if (want.length === 0) {
      await page.waitForTimeout(100);
      continue;
    }
    if (onCard) await onCard(cards, want);
    const before = (await page.locator('#drill-counter').textContent()) ?? '';
    for (const pitch of want) await midi.noteOn(pitch, 90);
    for (const pitch of want) await midi.noteOff(pitch);
    cards += 1;
    if (onAnswered) await onAnswered(cards - 1);
    await expect
      .poll(async () => (await drill.getAttribute('data-drill')) === 'finished' || ((await page.locator('#drill-counter').textContent()) ?? '') !== before, {
        timeout: 15_000,
      })
      .toBe(true);
  }
  await expect(drill).toHaveAttribute('data-drill', 'finished', { timeout: 30_000 });
  return cards;
}

// ---------------------------------------------------------------------------------------------
// The Chord chart: shells struck from inside the page on its own frames.
// ---------------------------------------------------------------------------------------------

interface ChordLog {
  bar: number;
  seg: number;
  symbol: string;
  shell: number[];
  match: string;
  /** The sounding cell lay wholly inside the 780 x 360 window at its downbeat, with no scrolling. */
  visible: boolean;
}

/** The log's bars that were not wholly on screen at their downbeat, with the sentence that says so. */
function unseen(log: ChordLog[]): { bars: number[]; note: string } {
  const bars = [...new Set(log.filter((l) => !l.visible).map((l) => l.bar))];
  const shown = [...new Set(log.filter((l) => l.visible).map((l) => l.bar))];
  const first = bars[0];
  const last = bars[bars.length - 1];
  return {
    bars,
    note: `the sounding bar's cell wholly inside the 780 x 360 window at its downbeat, with no scrolling: bars ${shown.join(',') || 'none'}; not on screen: ${bars.length === 0 ? 'none' : `bars ${String(first)} to ${String(last)} (${String(bars.length)} of ${String(new Set(log.map((l) => l.bar)).size)})`}`,
  };
}

/** What stops a comped chorus from being the learner's: a shell the cell did not read yes, or a bar the learner could not see. */
function problems(notYes: ChordLog[], off: { bars: number[] }): string[] {
  return [
    ...notYes.map((l) => `bar ${String(l.bar)} ${l.symbol}: the cell read ${l.match} under the shell ${l.shell.join('-')}`),
    ...(off.bars.length > 0 ? [`${String(off.bars.length)} bars were off the screen at their downbeat (${off.bars.join(',')})`] : []),
  ];
}

/** Whether the chart's sounding cell lies wholly inside the window right now. */
async function currentCellVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const box = document.querySelector('#chart-grid .chart-cell[data-current="true"]')?.getBoundingClientRect();
    return !!box && box.top >= 0 && box.bottom <= window.innerHeight && box.left >= 0 && box.right <= window.innerWidth;
  });
}

/** Arms a watcher on the chart's bar label: the first change after Count off is bar 1's downbeat. */
async function armChart(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __chartWatch?: { downbeat: boolean; obs: MutationObserver } };
    w.__chartWatch?.obs.disconnect();
    const form = document.getElementById('chart-form');
    const state = { downbeat: false, obs: new MutationObserver(() => { state.downbeat = true; }) };
    if (form) state.obs.observe(form, { childList: true, characterData: true, subtree: true });
    w.__chartWatch = state;
  });
}

/**
 * From bar 1's downbeat, each time the chart's sounding bar (or segment) changes within `from`..`to`, reads the
 * chord symbol printed in it, strikes the shell the symbol asks for through the MIDI mock (root, third, and the
 * seventh or, for a sixth chord, the sixth), waits a few frames, and reads the cell's verdict. Returns the log.
 */
async function compAlong(page: Page, from: number, to: number, budgetMs: number): Promise<ChordLog[]> {
  return page.evaluate(
    async ({ from: first, to: last, budget }) => {
      const deliver = (down: boolean, midi: number): void => {
        const mock = (window as unknown as { __midiMock?: { deliver(id: string | null, bytes: number[]): void } }).__midiMock;
        mock?.deliver(null, down ? [0x90, midi, 90] : [0x80, midi, 0]);
      };
      const frame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));
      const pause = (ms: number): Promise<void> => new Promise((r) => window.setTimeout(r, ms));
      const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
      /** A chart symbol's shell, as pitches: root, third, and the seventh (or the sixth where the symbol is a sixth chord). */
      const shellOf = (text: string): number[] => {
        const m = /^([A-G])([b♭#♯]?)(.*)$/.exec(text.trim());
        if (!m) throw new Error(`cannot read the chord symbol "${text}"`);
        const accidental = m[2] === 'b' || m[2] === '♭' ? -1 : m[2] === '#' || m[2] === '♯' ? 1 : 0;
        const root = PC[m[1]] + accidental;
        const q = m[3];
        const base = 48 + (((root % 12) + 12) % 12);
        const minor = /^(mi|m(?!a))/.test(q);
        const third = minor ? 3 : 4;
        let top: number;
        if (/^(mi|ma|m)?6/.test(q)) top = 9;
        else if (/^(ma|maj|M)\d/.test(q)) top = 11;
        else if (/\d/.test(q)) top = 10;
        else if (/dim/.test(q)) top = 9;
        else top = 7;
        return [base, base + third, base + top];
      };
      const w = window as unknown as { __chartWatch?: { downbeat: boolean } };
      const until = performance.now() + budget;
      while (performance.now() < until && !w.__chartWatch?.downbeat) await frame();
      const log: ChordLog[] = [];
      let key = '';
      let held: number[] = [];
      const release = (): void => {
        for (const p of held) deliver(false, p);
        held = [];
      };
      while (performance.now() < until) {
        const cell = document.querySelector<HTMLElement>('#chart-grid .chart-cell[data-current="true"]');
        const bar = Number(cell?.dataset.bar ?? '0');
        const sounding = cell?.querySelector<HTMLElement>('.chart-seg[data-sounding="true"]') ?? null;
        const seg = sounding ? Number(sounding.dataset.seg ?? '0') : 0;
        const now = `${String(bar)}:${String(seg)}`;
        // The chart goes round again after its last bar: the first lap is the walk.
        if (cell && (bar > last || (log.length > 0 && bar < log[log.length - 1].bar))) break;
        if (cell && now !== key) {
          key = now;
          release();
          if (bar >= first && bar <= last) {
            const label = sounding ? (cell.querySelector(`.chart-seg-label[data-seg="${String(seg)}"] .chart-chord`)?.textContent ?? '') : (cell.textContent ?? '');
            const shell = shellOf(label);
            for (const p of shell) deliver(true, p);
            held = shell;
            await pause(140);
            const read = sounding ?? cell;
            const box = cell.getBoundingClientRect();
            const visible = box.top >= 0 && box.bottom <= window.innerHeight && box.left >= 0 && box.right <= window.innerWidth;
            log.push({ bar, seg, symbol: label.trim(), shell, match: read.dataset.match ?? cell.dataset.match ?? '(none)', visible });
          }
        }
        await frame();
      }
      release();
      return log;
    },
    { from, to, budget: budgetMs },
  );
}

async function setChip(page: Page, id: string, on: boolean, obs: string[], label: string): Promise<void> {
  const chip = page.locator(id);
  await chip.scrollIntoViewIfNeeded();
  const was = await chip.getAttribute('aria-pressed');
  if (was !== String(on)) await chip.tap();
  await expect(chip).toHaveAttribute('aria-pressed', String(on));
  obs.push(`${label}: ${was === 'true' ? 'on' : 'off'} → ${on ? 'on' : 'off'}`);
}

async function chartBar(page: Page): Promise<number> {
  const text = (await page.locator('#chart-form').textContent()) ?? '';
  const m = /Bar (\d+) of/.exec(text);
  return m ? Number(m[1]) : Number.NaN;
}

/** The symbols the grid prints, cell by cell (a split cell: its segments joined with " | "). */
async function gridSymbols(page: Page): Promise<string[]> {
  return page.locator('#chart-grid .chart-cell').evaluateAll((cells) =>
    cells.map((cell) => {
      const segs = [...cell.querySelectorAll<HTMLElement>('.chart-seg-label')].sort((a, b) => Number(a.dataset.seg) - Number(b.dataset.seg));
      return segs.length > 0 ? segs.map((s) => (s.textContent ?? '').trim()).join(' | ') : (cell.textContent ?? '').trim();
    }),
  );
}

async function stopChart(page: Page): Promise<void> {
  await page.locator('#chart-stop').scrollIntoViewIfNeeded();
  await page.locator('#chart-stop').tap();
  await expect(page.locator('section[data-screen="chart"]')).toHaveAttribute('data-running', 'false', { timeout: 10_000 });
}

/** Records the page's bass and drum starts (oscillators with a set frequency; noise through a highpass), as an init script. */
async function installRhythmProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const freqSet = new WeakMap<AudioParam, number>();
    const ramped = new WeakSet<AudioParam>();
    const target = new WeakMap<AudioNode, AudioNode>();
    const probe = { bass: 0, kick: 0, snare: 0, hat: 0 };
    (window as unknown as { __rhythm: typeof probe }).__rhythm = probe;
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
      if (freqSet.has(this.frequency)) {
        if (ramped.has(this.frequency)) probe.kick += 1;
        else probe.bass += 1;
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
}

async function rhythm(page: Page): Promise<{ bass: number; kick: number; snare: number; hat: number }> {
  return page.evaluate(() => ({ ...(window as unknown as { __rhythm: { bass: number; kick: number; snare: number; hat: number } }).__rhythm }));
}

// ---------------------------------------------------------------------------------------------
// The walk.
// ---------------------------------------------------------------------------------------------

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', at: '2026-09-09T00:00:00.000Z', version: 1 }));
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

test('A7b.1: the landscape-phone walk of jazz.6, Blue Bossa and Insensatez, every record step in order', async ({ page }) => {
  test.setTimeout(120 * 60_000);
  const midi = await installMidiMock(page, { permission: 'granted' });
  await installRhythmProbe(page);
  const only = (process.env.WALK_ONLY ?? '').split(',').filter((s) => s !== '');

  async function step(
    id: string,
    did: string,
    expected: string,
    body: (obs: string[], shots: string[]) => Promise<void>,
  ): Promise<void> {
    if (only.length > 0 && !only.includes(id)) return;
    const obs: string[] = [];
    const push = obs.push.bind(obs);
    obs.push = (...items: string[]): number => {
      for (const item of items) trace(`  ${item.slice(0, 300)}`);
      return push(...items);
    };
    const shots: string[] = [];
    trace(`step ${id}`);
    let verdict: Verdict = 'PASS';
    let cause: string | undefined;
    try {
      await body(obs, shots);
    } catch (error) {
      verdict = 'STOP';
      cause = String(error instanceof Error ? error.message : error)
        .replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g'), '')
        .split('\n')
        .filter((l) => l.trim() !== '')
        .slice(0, 6)
        .join(' / ');
    }
    if (shots.length === 0 || verdict === 'STOP') shots.push(await shot(page, `${id}${shots.length > 0 ? '-stop' : ''}`).catch(() => '(no screenshot)'));
    record.push({ step: id, did, expected, observed: obs, verdict, ...(cause ? { cause } : {}), shots });
    save();
  }

  // -------------------------------------------------------------------------------------------
  // Getting there: Plan → the tracks sheet → jazz on → Stage 6 → jazz.6.
  // -------------------------------------------------------------------------------------------
  await step(
    'route',
    'Plan → the tracks sheet → Jazz on → Stage 6 → Comping, walking bass, and hearing the changes',
    'the lesson page lists eight exercise rows and eight song rows; What the app counts reads 0 of 2',
    async (obs, shots) => {
      await viaPlan(page, 6, RUNG, obs);
      await expect(page.locator('#lesson-exercises .list-row')).toHaveCount(8);
      await expect(page.locator('#lesson-songs .list-row')).toHaveCount(8);
      const counts = await countsLine(page);
      obs.push(`lesson page: 8 exercise rows, 8 song rows; "${counts}"`);
      expect(counts).toBe('What the app counts — 0 of 2');
      shots.push(await shot(page, 'route'));
    },
  );

  // -------------------------------------------------------------------------------------------
  // Record step 1: the lesson.
  // -------------------------------------------------------------------------------------------
  await step(
    '1',
    'Reads the jazz.6 lesson: the minor ii-V-i, its chords, the shell, what the shell leaves out, Blue Bossa\'s Cm6',
    'the page names Dm7♭5 – G7 – Cm, the shell as root, third and seventh, the omitted flat fifth, and Cm6 with its sixth in the seventh\'s place',
    async (obs, shots) => {
      await toLesson(page, obs);
      const text = ((await page.locator('#lesson-text').innerText()) ?? '').replace(/\s+/g, ' ');
      for (const needle of [
        'The minor ii–V–i.',
        'Dm7♭5 – G7 – Cm',
        'Cm6',
        'a minor triad with a major sixth added above the root',
        'Shells in minor.',
        'The shell is root, third and seventh',
        'Cm6 is C, E♭ and A',
        'What the shell leaves out.',
        'A root–3–7 shell cannot itself tell iiø7 from',
        'the flat fifth that makes the chord half-diminished is the note the shell leaves out',
      ]) {
        expect(text, `the lesson says "${needle}"`).toContain(needle);
      }
      obs.push('the lesson text carries the minor ii–V–i line, the shell line, the sixth-chord shell line and the omitted-fifth sentence');
      // Read down the page, as a learner scrolls it, to the last paragraph.
      await page.locator('#lesson-text p').last().scrollIntoViewIfNeeded();
      const last = ((await page.locator('#lesson-text p').last().innerText()) ?? '').replace(/\s+/g, ' ').trim();
      obs.push(`the page's last paragraph begins "${last.slice(0, 70)}"`);
      expect(last).toMatch(/^The answer for Insensatez\. Bars 13 to 15 are a minor ii–V–i in A minor/);
      shots.push(await shot(page, '01'));
    },
  );

  // -------------------------------------------------------------------------------------------
  // Record step 2: Free play.
  // -------------------------------------------------------------------------------------------
  await step(
    '2',
    'Today → Free play: holds D-F-A♭-C, then D-F-A-C, then lifts the fifth to D-F-C; also G-B-F, C-E♭-B♭ and C-E♭-A',
    'the four-note chords are named (half-diminished 7th, minor 7th); D-F-C gets no name',
    async (obs, shots) => {
      await page.goto('/#/today');
      await expect(page.locator('#today-play')).toBeVisible({ timeout: 60_000 });
      await page.locator('#today-play').scrollIntoViewIfNeeded();
      await page.locator('#today-play').tap();
      const free = page.locator('section[data-screen="play"]');
      await expect(free).toBeVisible({ timeout: 60_000 });
      await expect(page.locator('#play-strip .key[data-midi="60"]')).toBeVisible({ timeout: 60_000 });
      const fits = await page.evaluate(() =>
        ['#play-chord', '#play-notes', '#play-strip'].map((sel) => {
          const box = document.querySelector(sel)?.getBoundingClientRect();
          return `${sel} ${box ? `top ${String(Math.round(box.top))} bottom ${String(Math.round(box.bottom))}` : 'absent'} (viewport ${String(window.innerHeight)})`;
        }),
      );
      obs.push(`Free play at 780 x 360: ${fits.join('; ')}`);
      const hold = async (label: string, pitches: number[], total = pitches.length): Promise<{ chord: string; notes: string }> => {
        for (const p of pitches) await midi.noteOn(p, 90);
        await expect(free).toHaveAttribute('data-held', String(total), { timeout: 15_000 });
        const chord = ((await page.locator('#play-chord').textContent()) ?? '').trim();
        const notes = ((await page.locator('#play-notes').textContent()) ?? '').trim();
        obs.push(`${label}: notes "${notes}", chord line "${chord}"`);
        return { chord, notes };
      };
      const release = async (pitches: number[]): Promise<void> => {
        for (const p of pitches) await midi.noteOff(p);
      };
      // D4 F4 Ab4 C5, then the A-flat raised to A, then the fifth lifted in each.
      const halfDim = await hold('D-F-A♭-C held', [62, 65, 68, 72]);
      expect(halfDim.chord, 'the four-note iiø7 is named half-diminished').toMatch(/half-diminished/i);
      shots.push(await shot(page, '02-half-diminished'));
      await release([68]);
      const m7 = await hold('A♭ raised to A: D-F-A-C held', [69], 4);
      expect(m7.chord, 'D-F-A-C is named a minor 7th').toMatch(/minor 7th/i);
      shots.push(await shot(page, '02-minor-seventh'));
      await release([69]);
      await expect(free).toHaveAttribute('data-held', '3');
      const shell = await page.locator('#play-chord').textContent();
      obs.push(`fifth lifted: D-F-C held, notes "${((await page.locator('#play-notes').textContent()) ?? '').trim()}", chord line "${(shell ?? '').trim()}"`);
      expect((shell ?? '').trim(), 'the three-note shell D-F-C gets no name').toBe('');
      shots.push(await shot(page, '02-shell'));
      await release([62, 65, 72]);
      await expect(free).toHaveAttribute('data-held', '0');
      // The other shells the lesson and the record mention.
      for (const [label, pitches] of [
        ['G7 shell G-B-F', [55, 59, 65]],
        ['Cm7 shell C-E♭-B♭', [60, 63, 70]],
        ['Cm6 shell C-E♭-A', [60, 63, 69]],
      ] as [string, number[]][]) {
        await hold(label, pitches);
        await release(pitches);
        await expect(free).toHaveAttribute('data-held', '0');
      }
    },
  );

  // -------------------------------------------------------------------------------------------
  // Record step 3: the ear drill, opened from jazz.5 as review.
  // -------------------------------------------------------------------------------------------
  await step(
    '3',
    'Plan → Stage 5 → Swing, shell voicings and ii-V-I → the ear drill for seventh chords; plays each echo back',
    'right or wrong per card; the stored row is jazz.5\'s; jazz.6\'s counts do not move',
    async (obs, shots) => {
      await viaPlan(page, 5, 'jazz.5', obs);
      await openDrillRow(page, EAR_TITLE, obs, 'jazz.5');
      expect(page.url(), 'opened from jazz.5').toContain('rung=jazz.5');
      const drill = page.locator('[data-screen="drill"]');
      obs.push(`drill kind "${(await drill.getAttribute('data-kind')) ?? ''}"; Hear it again button ${(await page.locator('#drill-replay').count()) > 0 ? 'present' : 'absent'}`);
      shots.push(await shot(page, '03-card'));
      const cards = await playDrillToFinish(page, midi, (index, expects) => {
        if (index === 0) obs.push(`first card expects ${String(expects.length)} notes`);
      });
      obs.push(`${String(cards)} cards answered through the mock (the spoken quality is not stored and not asserted)`);
      shots.push(await shot(page, '03-summary'));
      await expect
        .poll(async () => (await storedDrillRows(page)).filter((r) => r.itemId === EAR_ID).length, { timeout: 15_000 })
        .toBeGreaterThan(0);
      const rows = (await storedDrillRows(page)).filter((r) => r.itemId === EAR_ID);
      obs.push(`stored ear-drill rows: ${JSON.stringify(rows)}`);
      expect(rows[0]?.lessonId, 'the row is jazz.5\'s').toBe('jazz.5');
      const counts = await countsLine(page, RUNG);
      obs.push(`jazz.6 counts after the ear run: "${counts}"`);
      expect(counts).toBe('What the app counts — 0 of 2');
    },
  );

  // -------------------------------------------------------------------------------------------
  // Record step 4: the counted run of the minor shell drill.
  // -------------------------------------------------------------------------------------------
  await step(
    '4',
    'jazz.6 → Minor ii-V-i with shell voicings: the ten cards, each answered with its shell; back on the page',
    'the staff in the key the card names; the stored row is jazz.6\'s; What the app counts reads 1 of 2',
    async (obs, shots) => {
      await toLesson(page, obs);
      await openDrillRow(page, DRILL_TITLE, obs);
      expect(page.url(), 'opened from jazz.6').toContain(`rung=${RUNG}`);
      const drill = page.locator('[data-screen="drill"]');
      await expect(drill).toHaveAttribute('data-kind', 'chord');
      const labels: string[] = [];
      const cards = await playDrillToFinish(page, midi, async (_index, expects) => {
        const label = ((await page.locator('#drill-symbol').textContent()) ?? '').trim();
        labels.push(label);
        expect(expects, `${label}: three notes`).toHaveLength(3);
      }, async (index) => {
        // Once answered, the card is held with the shell drawn on a staff in the key the card names.
        if (index === 2) {
          await expect(page.locator('#drill-answer svg').first(), 'the answer staff is drawn').toBeVisible({ timeout: 30_000 });
          shots.push(await shot(page, '04-card-3-answered'));
        }
        if (index === 3) {
          await expect(page.locator('#drill-answer svg').first(), 'the answer staff is drawn').toBeVisible({ timeout: 30_000 });
          shots.push(await shot(page, '04-card-4-answered'));
        }
      });
      obs.push(`${String(cards)} cards: ${labels.join(' / ')}`);
      expect(labels[0]).toBe('Dm7♭5 — iiø7 in C minor');
      expect(labels[2]).toBe('Cm6 — i in C minor');
      shots.push(await shot(page, '04-summary'));
      await expect
        .poll(async () => (await storedDrillRows(page)).filter((r) => r.itemId === DRILL_ID).length, { timeout: 15_000 })
        .toBe(1);
      const rows = (await storedDrillRows(page)).filter((r) => r.itemId === DRILL_ID);
      obs.push(`stored rows: ${JSON.stringify(rows)}`);
      expect(rows[0]?.lessonId).toBe(RUNG);
      expect(rows[0]?.accuracy).toBe(1);
      await page.goto(`/#/lesson/${RUNG}`);
      const counts = await countsLine(page);
      obs.push(`What the app counts: "${counts}"`);
      expect(counts).toBe('What the app counts — 1 of 2');
      shots.push(await shot(page, '04-counts'));
    },
  );

  // -------------------------------------------------------------------------------------------
  // The Lab (record steps 5-8).
  // -------------------------------------------------------------------------------------------
  async function openLab(obs: string[]): Promise<void> {
    await toLesson(page, obs);
    const door = page.locator('#lesson-tool-lab');
    await expect(door, 'the lesson page offers the Accompaniment lab').toHaveCount(1);
    await door.scrollIntoViewIfNeeded();
    await door.tap();
    await expect(page.locator('section[data-screen="lab"]')).toBeVisible({ timeout: 30_000 });
    obs.push(`Accompaniment lab opened from the lesson (${page.url().replace(/^.*#/, '#')})`);
  }
  async function setLab(key: string, bpm: number | null, obs: string[]): Promise<void> {
    await page.locator('#lab-key').selectOption(key);
    if (bpm !== null) {
      await page.locator('#lab-bpm').fill(String(bpm));
      await page.locator('#lab-bpm').dispatchEvent('change');
    }
    const summary = ((await page.locator('#lab-summary').textContent()) ?? '').trim();
    obs.push(`Lab set: "${summary}"`);
  }

  await step(
    '5',
    'jazz.6 → Accompaniment lab → ii–V–I in C minor → Read it, then Play it to me',
    'the lab names the ii–V–I in C minor; Read it opens the score; Play it to me runs and the app schedules piano notes',
    async (obs, shots) => {
      await openLab(obs);
      const preset = ((await page.locator('#lab-preset').textContent()) ?? '').replace(/\s+/g, ' ').trim();
      obs.push(`preset: "${preset.slice(0, 120)}"`);
      await setLab('c-minor', null, obs);
      const summary = ((await page.locator('#lab-summary').textContent()) ?? '').trim();
      expect(summary).toContain('C minor');
      expect(summary).toContain('ii–V–I');
      shots.push(await shot(page, '05-lab'));
      await page.locator('#lab-read').scrollIntoViewIfNeeded();
      await page.locator('#lab-read').tap();
      await expect(page).toHaveURL(/#\/score\/import\.lab-/, { timeout: 60_000 });
      await settled(page);
      obs.push(`Read it opened ${((await page.locator('#score-title').textContent()) ?? '').trim()}`);
      await setMode(page, 'listen', obs);
      const before = await pianoStarts(page);
      await play(page);
      await expect.poll(() => pianoStarts(page), { timeout: 30_000 }).toBeGreaterThan(before);
      obs.push(`Play it to me: running, piano notes scheduled ${String(before)} → ${String(await pianoStarts(page))}`);
      shots.push(await shot(page, '05-listen'));
      await tapControl(page, '#score-play');
      await page.waitForTimeout(500);
    },
  );

  await step(
    '6',
    'Read it in C minor, Keep tempo, played in time on the Score screen',
    'a summary with accuracy; jazz.6\'s counts unchanged',
    async (obs, shots) => {
      const before = await countsLine(page);
      await openLab(obs);
      await setLab('c-minor', null, obs);
      await page.locator('#lab-read').scrollIntoViewIfNeeded();
      await page.locator('#lab-read').tap();
      await expect(page).toHaveURL(/#\/score\/import\.lab-/, { timeout: 60_000 });
      await settled(page);
      await setMode(page, 'tempo', obs);
      const text = await playToSummary(page, obs);
      shots.push(await shot(page, '06'));
      expect(text).toMatch(/accuracy|%/i);
      const after = await countsLine(page);
      obs.push(`What the app counts: "${before}" → "${after}"`);
      expect(after).toBe(before);
    },
  );

  await step(
    '7',
    'The same progression in A minor and in G minor (the keys the lesson names), at a lower tempo (70), Read it, Keep tempo',
    'each plays to a summary; jazz.6\'s counts unchanged',
    async (obs, shots) => {
      const before = await countsLine(page);
      for (const [key, id] of [
        ['a-minor', '07-a-minor'],
        ['g-minor', '07-g-minor'],
      ] as const) {
        await openLab(obs);
        await setLab(key, 70, obs);
        await page.locator('#lab-read').scrollIntoViewIfNeeded();
        await page.locator('#lab-read').tap();
        await expect(page).toHaveURL(/#\/score\/import\.lab-/, { timeout: 60_000 });
        await settled(page);
        await setMode(page, 'tempo', obs);
        const text = await playToSummary(page, obs);
        expect(text).toMatch(/accuracy|%/i);
        shots.push(await shot(page, id));
      }
      const after = await countsLine(page);
      obs.push(`What the app counts: "${before}" → "${after}"`);
      expect(after).toBe(before);
    },
  );

  await step(
    '8',
    'Lab → C minor → Jam it with Play the tune: the learner comps shells for iiø7 and V7 and the C minor triad as the bars go by',
    'the bars are shown with the bed running; the lab counts the chord tones per time round, stores nothing',
    async (obs, shots) => {
      await openLab(obs);
      await setLab('c-minor', null, obs);
      const tune = page.locator('#lab-bed-tune');
      await tune.scrollIntoViewIfNeeded();
      obs.push(`Play the tune chip aria-pressed ${(await tune.getAttribute('aria-pressed')) ?? '(none)'}`);
      if ((await tune.getAttribute('aria-pressed')) !== 'true') await tune.tap();
      await expect(tune).toHaveAttribute('aria-pressed', 'true');
      await page.locator('#lab-jam-start').scrollIntoViewIfNeeded();
      await page.locator('#lab-jam-start').tap();
      const cells = page.locator('#lab-jam-grid .chart-cell');
      await expect(cells.first()).toBeVisible({ timeout: 30_000 });
      const labels = await cells.evaluateAll((all) => all.map((c) => `${(c as HTMLElement).dataset.roman ?? ''} ${(c.textContent ?? '').trim()}`));
      obs.push(`the jam grid: ${labels.join(' / ')}`);
      shots.push(await shot(page, '08-jam'));
      // Comp each bar as it comes round: iiø7 and V7 as shells (root, third, seventh), the tonic as a C minor triad.
      const shells: Record<string, number[]> = {
        iiø7: [50, 53, 60],
        V7: [43, 47, 53],
        i: [48, 51, 55],
      };
      const struck: string[] = [];
      let lastBar = -1;
      const deadline = Date.now() + 120_000;
      let held: number[] = [];
      while (Date.now() < deadline) {
        const cur = await page.evaluate(() => {
          const cell = document.querySelector<HTMLElement>('#lab-jam-grid .chart-cell[data-current="true"]');
          return cell ? { bar: Number(cell.dataset.bar), roman: cell.dataset.roman ?? '' } : null;
        });
        const form = (await page.locator('#lab-jam-form').textContent()) ?? '';
        const pass = /pass (\d+)/.exec(form);
        if (pass && Number(pass[1]) >= 2) break;
        if (cur && cur.bar !== lastBar) {
          lastBar = cur.bar;
          for (const p of held) await midi.noteOff(p);
          const shell = shells[cur.roman] ?? shells.i;
          held = shell ?? [];
          for (const p of held) await midi.noteOn(p, 90);
          struck.push(`bar ${String(cur.bar)} ${cur.roman}`);
        }
        await page.waitForTimeout(60);
      }
      for (const p of held) await midi.noteOff(p);
      obs.push(`struck: ${struck.join(', ')}`);
      const verdict = ((await page.locator('#lab-bed-verdict').textContent()) ?? '').trim();
      obs.push(`the lab's one-line count: "${verdict}"`);
      shots.push(await shot(page, '08-verdict'));
      await page.locator('#lab-jam-stop').tap();
      expect(verdict, 'the lab counted a time round').not.toBe('');
    },
  );

  // -------------------------------------------------------------------------------------------
  // Record steps 9-13: Blue Bossa.
  // -------------------------------------------------------------------------------------------
  await step(
    '9',
    'Optional: Blue Bossa ▶ → Keep tempo, played in time',
    'a summary; jazz.6\'s counts unchanged',
    async (obs, shots) => {
      const before = await countsLine(page);
      await openRow(page, BLUE_BOSSA, obs);
      await setMode(page, 'tempo', obs);
      const text = await playToSummary(page, obs);
      shots.push(await shot(page, '09'));
      expect(text).toMatch(/accuracy|%/i);
      const after = await countsLine(page);
      obs.push(`What the app counts: "${before}" → "${after}"`);
      expect(after).toBe(before);
    },
  );

  await step(
    '10',
    'Blue Bossa → Chart; Comp on, Bass + drums on, Count off; follows bars 5 to 7 (and 13 to 15) as the app plays them',
    'the chart plays; the sounding bar moves; the app schedules piano, bass and drums; bars 5-7 print Dmi7b5, G7, Cmi6',
    async (obs, shots) => {
      await openChartFromRow(page, BLUE_BOSSA, obs);
      const symbols = await gridSymbols(page);
      obs.push(`32 cells: ${symbols.map((s, i) => `${String(i + 1)} ${s}`).join(' ; ')}`);
      expect(symbols).toHaveLength(32);
      expect(symbols.slice(4, 7)).toEqual(['Dmi7b5', 'G7', 'Cmi6']);
      expect(symbols.slice(12, 15)).toEqual(['Dmi7b5', 'G7', 'Cmi6']);
      expect(symbols[15]).toBe('Dmi7b5 | G7');
      await setChip(page, '#chart-comp', true, obs, 'Comp');
      await setChip(page, '#chart-backing', true, obs, 'Bass + drums');
      const before = await pianoStarts(page);
      const rBefore = await rhythm(page);
      shots.push(await shot(page, '10-chart'));
      await page.locator('#chart-start').tap();
      await expect(page.locator('section[data-screen="chart"]')).toHaveAttribute('data-running', 'true', { timeout: 15_000 });
      const seen = new Set<number>();
      const sight: Record<number, boolean> = {};
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline) {
        const bar = await chartBar(page);
        if (Number.isFinite(bar)) {
          seen.add(bar);
          if (!(bar in sight)) sight[bar] = await currentCellVisible(page);
        }
        if (bar >= 8) break;
        if (bar === 6 && shots.length < 2) shots.push(await shot(page, '10-bar-6'));
        await page.waitForTimeout(120);
      }
      const after = await pianoStarts(page);
      const rAfter = await rhythm(page);
      await stopChart(page);
      obs.push(`bars seen: ${[...seen].join(',')}; piano notes scheduled ${String(before)} → ${String(after)}; bass ${String(rBefore.bass)} → ${String(rAfter.bass)}, kick ${String(rBefore.kick)} → ${String(rAfter.kick)}, snare ${String(rBefore.snare)} → ${String(rAfter.snare)}, hat ${String(rBefore.hat)} → ${String(rAfter.hat)}`);
      obs.push(`the sounding cell on screen at its downbeat, bars seen: ${Object.entries(sight).map(([b, v]) => `${b} ${v ? 'yes' : 'no'}`).join(', ')}`);
      for (const b of [5, 6, 7]) expect(seen.has(b), `the chart marked bar ${String(b)}`).toBe(true);
      expect(after).toBeGreaterThan(before);
      expect(rAfter.bass).toBeGreaterThan(rBefore.bass);
      expect(rAfter.kick).toBeGreaterThan(rBefore.kick);
    },
  );

  await step(
    '11',
    'Blue Bossa chart, Comp off and Bass + drums on: every bar voiced in shells from the printed symbol (bars 5-7 and 13-17 named, bar 16 split)',
    'a live cell yes for each bar; the rhythm section sounds with no app comp',
    async (obs, shots) => {
      await openChartFromRow(page, BLUE_BOSSA, obs);
      await setChip(page, '#chart-comp', false, obs, 'Comp');
      await setChip(page, '#chart-backing', true, obs, 'Bass + drums');
      const rBefore = await rhythm(page);
      await armChart(page);
      await page.locator('#chart-start').tap();
      const log = await compAlong(page, 1, 32, 240_000);
      const rAfter = await rhythm(page);
      shots.push(await shot(page, '11-end'));
      await stopChart(page);
      obs.push(`bass ${String(rBefore.bass)} → ${String(rAfter.bass)}, kick ${String(rBefore.kick)} → ${String(rAfter.kick)} with Comp off`);
      obs.push(`log: ${log.map((l) => `${String(l.bar)}${l.seg > 0 || l.symbol.includes('G7') && l.bar === 16 ? `.${String(l.seg)}` : ''} ${l.symbol} ${l.match}`).join('; ')}`);
      const bar16 = log.filter((l) => l.bar === 16);
      obs.push(`bar 16 segments struck: ${bar16.map((l) => `${l.symbol} (${l.match})`).join(' then ')}`);
      expect(log.map((l) => l.bar), 'a shell was struck in every bar').toEqual(expect.arrayContaining(Array.from({ length: 32 }, (_, i) => i + 1)));
      expect(bar16.map((l) => l.symbol), 'bar 16 showed both its chords as the clock reached them').toEqual(['Dmi7b5', 'G7']);
      const notYes = log.filter((l) => l.match !== 'yes');
      obs.push(`cells not reading yes: ${notYes.length === 0 ? 'none' : notYes.map((l) => `${String(l.bar)}:${String(l.seg)} ${l.symbol} ${l.match}`).join(', ')}`);
      const off = unseen(log);
      obs.push(off.note);
      const found = problems(notYes, off);
      expect(found.length, `the chorus cannot be comped from the chart on this phone: ${found.join(' | ')}`).toBe(0);
      expect(rAfter.bass).toBeGreaterThan(rBefore.bass);
    },
  );

  await step(
    '12',
    'Blue Bossa chart, Comp off and Bass + drums off: the whole chorus in shells, nothing from the app but the click',
    'a live cell yes for each bar; the app schedules no bass and no drums',
    async (obs, shots) => {
      await openChartFromRow(page, BLUE_BOSSA, obs);
      await setChip(page, '#chart-comp', false, obs, 'Comp');
      await setChip(page, '#chart-backing', false, obs, 'Bass + drums');
      const rBefore = await rhythm(page);
      await armChart(page);
      await page.locator('#chart-start').tap();
      const log = await compAlong(page, 1, 32, 240_000);
      const rAfter = await rhythm(page);
      shots.push(await shot(page, '12-end'));
      await stopChart(page);
      obs.push(`bass ${String(rBefore.bass)} → ${String(rAfter.bass)}, kick ${String(rBefore.kick)} → ${String(rAfter.kick)}, snare ${String(rBefore.snare)} → ${String(rAfter.snare)}, hat ${String(rBefore.hat)} → ${String(rAfter.hat)}`);
      const notYes = log.filter((l) => l.match !== 'yes');
      obs.push(`${String(log.length)} chords struck over the chorus; cells not reading yes: ${notYes.length === 0 ? 'none' : notYes.map((l) => `${String(l.bar)}:${String(l.seg)} ${l.symbol} ${l.match}`).join(', ')}`);
      expect(log.map((l) => l.bar)).toEqual(expect.arrayContaining(Array.from({ length: 32 }, (_, i) => i + 1)));
      const off = unseen(log);
      obs.push(off.note);
      const found = problems(notYes, off);
      expect(found.length, `the chorus cannot be comped from the chart on this phone: ${found.join(' | ')}`).toBe(0);
      expect(rAfter.bass, 'no bass with Bass + drums off').toBe(rBefore.bass);
      expect(rAfter.kick, 'no kick with Bass + drums off').toBe(rBefore.kick);
    },
  );

  await step(
    '13',
    'Optional (A7c.3 L7): Blue Bossa with the left hand on the bossa bass, root and fifth, while the app comps',
    'the step is offered once A7c.3\'s bossa bass is on the learner\'s path, and the lesson says to ignore the cell for the bass',
    async (obs, shots) => {
      // Read first what the record says to read before offering it: does Comp sound with Bass + drums off?
      await openChartFromRow(page, BLUE_BOSSA, obs);
      await setChip(page, '#chart-comp', true, obs, 'Comp');
      await setChip(page, '#chart-backing', false, obs, 'Bass + drums');
      const before = await pianoStarts(page);
      await page.locator('#chart-start').tap();
      await expect.poll(() => pianoStarts(page), { timeout: 60_000 }).toBeGreaterThan(before);
      obs.push(`Comp on, Bass + drums off: piano notes scheduled ${String(before)} → ${String(await pianoStarts(page))} (the app comps with no rhythm section)`);
      await stopChart(page);
      shots.push(await shot(page, '13-comp-only'));
      // Is the bossa bass on this learner's path? The lesson that teaches it, and the jazz.6 page that is to offer it.
      await toLesson(page, obs);
      const lesson = ((await page.locator('#lesson-text').innerText()) ?? '').replace(/\s+/g, ' ');
      const mentions = /bossa (bass|nova bass|pattern)|root and (the )?fifth|ignore the cell/i.test(lesson);
      obs.push(`jazz.6's lesson mentions a bossa bass, a root-and-fifth bass, or ignoring the cell: ${mentions ? 'yes' : 'no'}`);
      expect(mentions, 'jazz.6 offers the optional bossa-bass step and tells the learner to ignore the cell for the bass').toBe(true);
    },
  );

  // -------------------------------------------------------------------------------------------
  // Record steps 14-16: Insensatez.
  // -------------------------------------------------------------------------------------------
  await step(
    '14',
    'jazz.6 → Insensatez row → Chart: the decision on bars 13 to 15 before playback with Comp off, before the lesson\'s answer',
    'the chart is open and silent, Comp and Bass + drums off, bars 13-15 printed; the answer is on the lesson page\'s last paragraph, not on the chart',
    async (obs, shots) => {
      await toLesson(page, obs);
      await expect(page.getByText('This page gives the answer at its very end', { exact: false })).toBeVisible({ timeout: 15_000 });
      obs.push('the lesson says it gives the answer at its very end');
      await openChartFromRow(page, INSENSATEZ, obs);
      expect(new URL(page.url()).hash).toContain(encodeURIComponent(INSENSATEZ_ID));
      const chart = page.locator('section[data-screen="chart"]');
      await expect(chart).not.toHaveAttribute('data-running', 'true');
      await expect(page.locator('#chart-comp')).toHaveAttribute('aria-pressed', 'false');
      await expect(page.locator('#chart-backing')).toHaveAttribute('aria-pressed', 'false');
      const symbols = await gridSymbols(page);
      obs.push(`32 cells: ${symbols.map((s, i) => `${String(i + 1)} ${s}`).join(' ; ')}`);
      expect(symbols).toHaveLength(32);
      expect(symbols.slice(12, 15)).toEqual(['Bmi7b5', 'E7', 'Ami7']);
      const text = ((await chart.innerText()) ?? '').replace(/\s+/g, ' ');
      const gives = /A minor|ii.?V.?i|half-diminished/i.test(text);
      obs.push(`the chart screen's own words name the progression or the key: ${gives ? 'yes' : 'no'}`);
      expect(gives, 'the chart does not give the answer away').toBe(false);
      const matches = await page.locator('#chart-grid .chart-cell').evaluateAll((cells) => cells.map((c) => (c as HTMLElement).dataset.match ?? '(idle)').filter((m) => m !== '(idle)' && m !== 'idle'));
      obs.push(`live cells reading before playback: ${matches.length === 0 ? 'none (idle)' : matches.join(',')}`);
      expect(matches).toEqual([]);
      shots.push(await shot(page, '14'));
    },
  );

  await step(
    '15',
    'Insensatez chart: Comp on, Count off, listens through bars 13 to 15; Stop; Comp off, Count off, voices them as shells; back to the lesson for the answer',
    'the app comps through 13-15; the shells read yes in 13-15; the answer is the lesson\'s last paragraph',
    async (obs, shots) => {
      await openChartFromRow(page, INSENSATEZ, obs);
      await setChip(page, '#chart-comp', true, obs, 'Comp');
      const before = await pianoStarts(page);
      await page.locator('#chart-start').tap();
      const seen = new Set<number>();
      let during = 0;
      const deadline = Date.now() + 180_000;
      while (Date.now() < deadline) {
        const bar = await chartBar(page);
        if (Number.isFinite(bar)) {
          seen.add(bar);
          if (bar === 13) during = await pianoStarts(page);
        }
        if (bar >= 16) break;
        await page.waitForTimeout(150);
      }
      const after = await pianoStarts(page);
      await stopChart(page);
      obs.push(`listened: bars 13-15 seen ${[13, 14, 15].map((b) => `${String(b)} ${seen.has(b) ? 'yes' : 'no'}`).join(', ')}; piano notes scheduled ${String(before)} → ${String(during)} at bar 13 → ${String(after)} by bar 16`);
      for (const b of [13, 14, 15]) expect(seen.has(b)).toBe(true);
      expect(after).toBeGreaterThan(during);
      await setChip(page, '#chart-comp', false, obs, 'Comp');
      await armChart(page);
      await page.locator('#chart-start').tap();
      // The learner scrolls the chart's second row into view during the count-in; their hands are busy after it.
      await page.locator('.chart-cell[data-bar="14"]').scrollIntoViewIfNeeded();
      const transport = await page.evaluate(() =>
        ['#chart-start', '#chart-stop'].map((sel) => {
          const box = document.querySelector(sel)?.getBoundingClientRect();
          return `${sel} ${box && box.top >= 0 && box.bottom <= window.innerHeight ? 'on screen' : 'scrolled off'}`;
        }),
      );
      obs.push(`with bars 9-16 scrolled into view: ${transport.join('; ')}`);
      const log = await compAlong(page, 13, 15, 180_000);
      shots.push(await shot(page, '15-shells'));
      await stopChart(page);
      obs.push(`shells struck: ${log.map((l) => `${String(l.bar)} ${l.symbol} [${l.shell.join(',')}] ${l.match}`).join('; ')}`);
      expect(log.map((l) => l.symbol)).toEqual(['Bmi7b5', 'E7', 'Ami7']);
      expect(log.map((l) => l.match)).toEqual(['yes', 'yes', 'yes']);
      obs.push(unseen(log).note);
      expect(unseen(log).bars, 'bars 13-15 were on screen as they sounded, after the learner scrolled to them').toEqual([]);
      await toLesson(page, obs);
      await page.locator('#lesson-text p').last().scrollIntoViewIfNeeded();
      const last = ((await page.locator('#lesson-text p').last().innerText()) ?? '').replace(/\s+/g, ' ');
      obs.push(`the lesson's last paragraph: "${last.slice(0, 160)}..."`);
      expect(last).toContain('minor ii–V–i in A minor');
      expect(last).toContain('Bmi7b5, E7 and Ami7');
      shots.push(await shot(page, '15-answer'));
    },
  );

  await step(
    '16',
    'Independence (a later rung, no lesson naming it): Insensatez whole, finds the minor ii-V-i at bars 13-15 and 22-23 and voices each in shells; then the A10.1 standard on jazz.9',
    'bars 22 (split) and 23 print Bmi7b5 | E7 and Ami7 and read yes under shells; the A10.1 standard is on jazz.9',
    async (obs, shots) => {
      await openChartFromRow(page, INSENSATEZ, obs);
      const symbols = await gridSymbols(page);
      obs.push(`bars 13-15: ${symbols.slice(12, 15).join(' ; ')}; bars 22-23: ${symbols.slice(21, 23).join(' ; ')}; look-alike bars 29-31: ${symbols.slice(28, 31).join(' ; ')}`);
      expect(symbols[21]).toBe('Bmi7b5 | E7');
      expect(symbols[22]).toBe('Ami7');
      await setChip(page, '#chart-comp', false, obs, 'Comp');
      await setChip(page, '#chart-backing', false, obs, 'Bass + drums');
      await armChart(page);
      await page.locator('#chart-start').tap();
      // The learner scrolls the chart's third row into view during the count-in.
      await page.locator('.chart-cell[data-bar="23"]').scrollIntoViewIfNeeded();
      const log = await compAlong(page, 22, 23, 240_000);
      await stopChart(page);
      obs.push(unseen(log).note);
      expect(unseen(log).bars, 'bars 22-23 were on screen as they sounded, after the learner scrolled to them').toEqual([]);
      obs.push(`shells struck: ${log.map((l) => `${String(l.bar)}.${String(l.seg)} ${l.symbol} [${l.shell.join(',')}] ${l.match}`).join('; ')}`);
      expect(log.map((l) => `${String(l.bar)} ${l.symbol}`)).toEqual(['22 Bmi7b5', '22 E7', '23 Ami7']);
      expect(log.map((l) => l.match)).toEqual(['yes', 'yes', 'yes']);
      shots.push(await shot(page, '16'));
      // The second half of the record's step: the A10.1 standard, once admitted, on jazz.9.
      await page.goto('/#/lesson/jazz.9');
      await expect(page.locator('#lesson-songs .list-row').first()).toBeVisible({ timeout: 30_000 });
      const songs = await page.locator('#lesson-songs .list-row').evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.item ?? ''));
      obs.push(`jazz.9's songs: ${songs.join(', ')}`);
      // The record names "the A10.1 standard on jazz.9 once it is admitted": the standard is named by A10.1's chain record.
      const named = existsSync(resolve(process.cwd(), '..', 'docs/chains/A10.1.yaml'));
      obs.push(`docs/chains/A10.1.yaml (the record that would name the standard): ${named ? 'present' : 'absent'}`);
      expect(named, 'the A10.1 standard is named and admitted on jazz.9 (docs/chains/A10.1.yaml)').toBe(true);
    },
  );

  const stops = record.filter((r) => r.verdict === 'STOP');
  for (const r of stops) expect.soft(r.verdict, `step ${r.step} stopped: ${r.cause ?? ''}`).toBe('PASS');
});
