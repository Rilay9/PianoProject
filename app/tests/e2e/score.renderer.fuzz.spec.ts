/**
 * A random walk over the renderer, with invariants (the dev harness).
 *
 * `score.fuzz.spec.ts` drives the whole screen; this drives only the
 * `WindowRenderer` — steps forward, back and by jumps, turned either way up,
 * at one, two and four bars a window — and after each move checks what any
 * arrangement of the slots must satisfy:
 *
 *  - exactly one slot holds the cursor, and one or two are drawn;
 *  - every note of the current step is drawn in the cursor slot, and inside
 *    the stage;
 *  - the band is on the first of them;
 *  - no note is drawn in two slots at once;
 *  - upright the two slots are drawn at the same scale.
 */
import { expect, test } from '@playwright/test';
import { openDevScore } from './fixtures/devScore';

const UPRIGHT = { width: 390, height: 844 };
const SIDEWAYS = { width: 880, height: 412 };
const MOVES = 60;
const SEEDS = [11, 12];

type Box = { left: number; top: number; width: number; height: number };

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inside(inner: Box, outer: Box, slack = 2): boolean {
  return (
    inner.left >= outer.left - slack &&
    inner.left + inner.width <= outer.left + outer.width + slack &&
    inner.top >= outer.top - slack &&
    inner.top + inner.height <= outer.top + outer.height + slack
  );
}

function intersects(a: Box, b: Box): boolean {
  return a.left < b.left + b.width && a.left + a.width > b.left && a.top < b.top + b.height && a.top + a.height > b.top;
}

for (const seed of SEEDS) {
  test(`seed ${String(seed)}: sixty moves of the cursor, and what must still hold`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize(UPRIGHT);
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.setBars(2);
    await dev.showStep(0);
    const steps = await dev.stepCount();
    const random = mulberry32(seed);
    const trace: string[] = [];
    let step = 0;
    let sideways = false;

    for (let i = 0; i < MOVES; i += 1) {
      const r = random();
      if (r < 0.55) {
        step = Math.min(steps - 1, step + 1);
        trace.push(`+1→${String(step)}`);
      } else if (r < 0.65) {
        step = Math.max(0, step - 1);
        trace.push(`-1→${String(step)}`);
      } else if (r < 0.78) {
        step = Math.floor(random() * steps);
        trace.push(`jump→${String(step)}`);
      } else if (r < 0.88) {
        sideways = !sideways;
        await page.setViewportSize(sideways ? SIDEWAYS : UPRIGHT);
        trace.push(sideways ? 'sideways' : 'upright');
      } else if (r < 0.95) {
        const bars = [1, 2, 4][Math.floor(random() * 3)] ?? 2;
        await dev.setBars(bars);
        trace.push(`bars=${String(bars)}`);
      } else {
        const hands = (['R', 'L', 'both'] as const)[Math.floor(random() * 3)] ?? 'both';
        await dev.setHands(hands);
        trace.push(`hands=${hands}`);
      }
      await dev.showStep(step);
      // The slot the cursor left settles on idle time, at the latest 100 ms on.
      await page.waitForTimeout(200);

      const ids = await dev.currentStepNoteIds();
      const snap = await page.evaluate((wanted: string[]) => {
        const box = (el: Element): Box => {
          const b = el.getBoundingClientRect();
          return { left: b.left, top: b.top, width: b.width, height: b.height };
        };
        const stage = document.querySelector('#score-stage, .score-view');
        const slots = [...document.querySelectorAll<HTMLElement>('.score-buffer:not(.score-probe)')];
        const drawn = slots.filter((el) => el.classList.contains('is-front') && !el.hidden);
        const cursor = slots.find((el) => el.classList.contains('is-cursor')) ?? null;
        const scale = (el: HTMLElement): number => new DOMMatrixReadOnly(getComputedStyle(el).transform).a;
        const seen = new Map<string, number>();
        for (const slot of drawn) {
          for (const n of slot.querySelectorAll<HTMLElement>('.score-note')) {
            const id = n.dataset.noteId ?? '';
            seen.set(id, (seen.get(id) ?? 0) + 1);
          }
        }
        const found = wanted.map((id) => {
          const el = cursor?.querySelector(`[data-note-id="${id}"]`) ?? null;
          return { id, box: el ? box(el) : null };
        });
        const band = document.querySelector<HTMLElement>('.score-cursor:not(.score-cursor--next)');
        const matches = [...document.querySelectorAll<HTMLElement>(`[data-note-id="${wanted[0] ?? ''}"]`)].map((el) => ({
          probe: el.closest('.score-probe') !== null,
          slot: el.closest<HTMLElement>('.score-buffer')?.dataset.slot ?? null,
          connected: el.isConnected,
          box: box(el),
        }));
        return {
          matches,
          bandStyle: band ? `${band.style.left}/${band.style.top}/${band.style.width}/${band.style.height} hidden=${String(band.hidden)}` : null,
          readAhead: document.querySelector<HTMLElement>('.score-view')?.dataset.readAhead ?? null,
          slotDetail: slots.map((el) => {
            const svg = el.querySelector('svg');
            const r = svg?.getBoundingClientRect();
            return {
              slot: el.dataset.slot,
              hidden: el.hidden,
              front: el.classList.contains('is-front'),
              cursor: el.classList.contains('is-cursor'),
              transform: el.style.transform,
              svg: r ? [Math.round(r.width), Math.round(r.height)] : null,
              notes: el.querySelectorAll('.score-note').length,
            };
          }),
          cursorSlots: slots.filter((el) => el.classList.contains('is-cursor')).length,
          drawn: drawn.length,
          scales: drawn.map(scale),
          duplicates: [...seen].filter(([, n]) => n > 1).map(([id]) => id),
          stage: stage ? box(stage) : null,
          found,
          band: band && !band.hidden ? box(band) : null,
        };
      }, ids);

      const fail = (what: string): never => {
        throw new Error(`seed ${String(seed)} at step ${String(step)} after "${trace.at(-1) ?? ''}": ${what}\ntrace: ${trace.join(' ')}\n${JSON.stringify(snap)}`);
      };
      if (snap.cursorSlots !== 1) fail(`${String(snap.cursorSlots)} cursor slots`);
      if (snap.drawn < 1 || snap.drawn > 4) fail(`${String(snap.drawn)} slots drawn`);
      if (snap.readAhead === 'single' && snap.drawn !== 1) fail('sideways, more than one slot is drawn');
      if (snap.duplicates.length > 0) fail(`drawn twice: ${snap.duplicates.slice(0, 3).join(', ')}`);
      for (const f of snap.found) {
        if (!f.box) fail(`note ${f.id} of the current step is not drawn in the cursor slot`);
        if (snap.stage && f.box && f.box.width > 0 && !inside(f.box, snap.stage)) {
          fail(`note ${f.id} is drawn outside the stage (${JSON.stringify(f.box)} vs ${JSON.stringify(snap.stage)})`);
        }
      }
      const first = snap.found[0]?.box;
      if (first && snap.band && !intersects(snap.band, first)) fail('the band is not on the current step');
      if (first && !snap.band) fail('no cursor band');
      if (snap.readAhead === 'slots' && snap.scales.length >= 2) {
        const a = snap.scales[0];
        for (const b of snap.scales) {
          if (Math.abs(a - b) / a > 0.01) fail(`the slots are drawn at different scales: ${snap.scales.join(', ')}`);
        }
      }
    }
    expect(trace.length).toBe(MOVES);
  });
}
