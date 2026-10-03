// U80's measurement (temporary; kept under docs/prompts/runs/U80/ after the run).
// For the pieces side-panel-prose.spec.ts's sweep picks, on a tablet: when the side panel is
// decided (filled, or left out where the tree marks it) relative to the score's first draw and
// to `data-settled`, and whether the stage's box changes when the panel arrives. Every frame is
// recorded by the page itself from before the navigation; the output is relationships and the
// stage's box, never a time. U80_WHEN names the build (before: the committed tree; after: U80's).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const WHEN = `${process.env.U80_WHEN ?? 'after'}${process.env.U80_LATE_MS ? ' lessons-late' : ''}`;

function onePiecePerTrack(): { track: string; lesson: string; piece: string }[] {
  const content = (name: string): unknown => JSON.parse(readFileSync(join('public', 'content', name), 'utf8'));
  const curriculum = content('curriculum.json') as {
    stages: { units: { track: string; lessons: { id: string; songOptions?: string[]; exerciseOptions?: string[] }[] }[] }[];
  };
  const catalog = content('catalog.json') as { id: string; file?: string | null; type?: string }[];
  const playable = new Map(catalog.map((row) => [row.id, row]));
  const out = new Map<string, { track: string; lesson: string; piece: string }>();
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      if (out.has(unit.track)) continue;
      for (const lesson of unit.lessons) {
        const options = [...(lesson.songOptions ?? []), ...(lesson.exerciseOptions ?? [])];
        const found = options.find((id) => {
          const row = playable.get(id);
          return row?.file != null && row.type !== 'drill';
        });
        if (found) {
          out.set(unit.track, { track: unit.track, lesson: lesson.id, piece: found });
          break;
        }
      }
    }
  }
  return [...out.values()];
}

const PER_TRACK = onePiecePerTrack();

// U80_LATE_MS: every lesson file answered that late, the service worker blocked so the route sees
// the reads — the bound's path (the first draw no longer waits; the panel arrives after it).
const LATE_MS = Number(process.env.U80_LATE_MS ?? '0');
if (LATE_MS > 0) test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  if (LATE_MS > 0) {
    await page.route('**/content/lessons/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, LATE_MS));
      await route.continue();
    });
  }
  await page.addInitScript(() => {
    window.localStorage.setItem('pianopath.firstSight', '["*"]');
    type Frame = {
      opening: number;
      hash: string;
      side: string | null;
      panel: boolean;
      drawn: boolean;
      settled: boolean;
      stage: string;
    };
    type Mark = { opening: number; what: string; value: string; stage: string; drawnBefore: boolean };
    const record = { frames: [] as Frame[], marks: [] as Mark[] };
    (window as unknown as { __u80: typeof record }).__u80 = record;
    const openings = new WeakMap<Element, number>();
    let count = 0;
    const openingOf = (screen: Element | null): number => {
      if (!screen) return -1;
      let n = openings.get(screen);
      if (n === undefined) {
        count += 1;
        n = count;
        openings.set(screen, n);
      }
      return n;
    };
    const stageBox = (): string => {
      const stage = document.getElementById('score-stage');
      if (!stage) return '-';
      const box = stage.getBoundingClientRect();
      return `${String(Math.round(box.width))}x${String(Math.round(box.height))}`;
    };
    const drawn = (): boolean => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    };
    const frame = (): void => {
      const screen = document.querySelector('[data-screen="score"]');
      if (screen) {
        const panel = document.getElementById('score-side');
        const stage = document.getElementById('score-stage');
        record.frames.push({
          opening: openingOf(screen),
          hash: location.hash,
          side: screen.getAttribute('data-side'),
          panel: panel instanceof HTMLElement && !panel.hidden && panel.getBoundingClientRect().width > 0,
          drawn: drawn(),
          settled: stage?.dataset.settled === 'true',
          stage: stageBox(),
        });
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    new MutationObserver((records) => {
      for (const one of records) {
        const el = one.target;
        if (!(el instanceof HTMLElement)) continue;
        const screen = document.querySelector('[data-screen="score"]');
        if (one.attributeName === 'data-side' && el.matches('[data-screen="score"]')) {
          record.marks.push({ opening: openingOf(el), what: 'side', value: el.getAttribute('data-side') ?? '(absent)', stage: stageBox(), drawnBefore: drawn() });
        }
        if (one.attributeName === 'hidden' && el.id === 'score-side') {
          record.marks.push({ opening: openingOf(screen), what: 'panel', value: el.hidden ? 'hidden' : 'shown', stage: stageBox(), drawnBefore: drawn() });
        }
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-side', 'hidden'] });
  });
});

/** What one opening's frames and marks say, as relationships and boxes. */
async function summarise(page: Page, label: string, sweepRead: string): Promise<string> {
  return page.evaluate(
    ({ label, sweepRead }) => {
      const record = (window as unknown as { __u80: { frames: { opening: number; hash: string; side: string | null; panel: boolean; drawn: boolean; settled: boolean; stage: string }[]; marks: { opening: number; what: string; value: string; stage: string; drawnBefore: boolean }[] } }).__u80;
      const last = record.frames[record.frames.length - 1];
      const opening = last?.opening ?? -1;
      const frames = record.frames.filter((f) => f.opening === opening);
      const marks = record.marks.filter((m) => m.opening === opening);
      const first = (test: (f: (typeof frames)[number]) => boolean): number => frames.findIndex(test);
      const fDraw = first((f) => f.drawn);
      const fPanel = first((f) => f.panel);
      const fSettled = first((f) => f.settled);
      const initialSide = frames[0]?.side ?? '(no frame)';
      const decided = marks.filter((m) => m.what === 'side');
      const panelShown = marks.find((m) => m.what === 'panel' && m.value === 'shown');
      const order = (a: number, b: number): string => (a < 0 ? 'never' : b < 0 ? 'before (never drawn)' : a < b ? 'before' : a === b ? 'same frame' : 'after');
      const finalStage = last?.stage ?? '-';
      const drawnFrames = frames.filter((f) => f.drawn);
      const drawnStages = [...new Set(drawnFrames.map((f) => f.stage))];
      const firstDrawStage = fDraw < 0 ? '-' : frames[fDraw]?.stage ?? '-';
      return [
        `${label}`,
        `  side at the screen's first frame: ${initialSide ?? '(absent)'}; side marks: ${decided.map((m) => `${m.value} (drawn before: ${String(m.drawnBefore)}; stage ${m.stage})`).join(', ') || 'none'}`,
        `  what the sweep reads when the screen is visible: panel ${sweepRead}`,
        `  panel shown: ${panelShown ? `yes, ${panelShown.drawnBefore ? 'AFTER the first draw' : 'before the first draw'} (stage at the mark ${panelShown.stage})` : 'no (left out)'}`,
        `  first frame with the panel against the first frame with music: ${order(fPanel, fDraw)}; data-settled against the panel: ${fSettled < 0 ? 'never settled' : fPanel < 0 ? 'no panel' : fPanel < fSettled ? 'panel first' : fPanel === fSettled ? 'same frame' : 'panel after settled'}`,
        `  stage at the first draw: ${firstDrawStage}; at the end: ${finalStage}; stage boxes music was drawn on: ${drawnStages.join(' then ')}`,
      ].join('\n');
    },
    { label, sweepRead },
  );
}

async function openAndRead(page: Page, piece: string): Promise<string> {
  await page.goto(`/#/score/${piece}`);
  await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  // Exactly the sweep's read on the committed spec.
  const panel = page.locator('#score-side');
  const read = (await panel.count()) === 0 ? 'absent' : (await panel.isHidden()) ? 'hidden' : 'visible';
  await expect(page.locator('#score-stage[data-settled="true"]')).toHaveCount(1, { timeout: 60_000 });
  // The panel's decision may land after the fit settled on the committed tree: give it room,
  // then require the stage to be settled again (a late panel takes the word back and refits).
  await page.waitForTimeout(2_500);
  await expect(page.locator('#score-stage[data-settled="true"]')).toHaveCount(1, { timeout: 60_000 });
  return read;
}

for (const size of [
  { width: 1000, height: 1000 },
  { width: 1024, height: 1366 },
  { width: 1366, height: 1024 },
]) {
  test.describe(`${String(size.width)}x${String(size.height)}`, () => {
    test.use({ viewport: size });

    test(`the sweep's order (${WHEN})`, async ({ page }) => {
      test.setTimeout(600_000);
      const lines: string[] = [];
      for (const entry of PER_TRACK) {
        const read = await openAndRead(page, entry.piece);
        lines.push(await summarise(page, `[${WHEN} ${String(size.width)}x${String(size.height)} sweep] ${entry.track} ${entry.piece} (${entry.lesson})`, read));
      }
      console.log(lines.join('\n'));
    });

    test(`each piece on a fresh load (${WHEN})`, async ({ page }) => {
      test.setTimeout(600_000);
      const lines: string[] = [];
      for (const entry of PER_TRACK) {
        await page.goto('about:blank');
        const read = await openAndRead(page, entry.piece);
        lines.push(await summarise(page, `[${WHEN} ${String(size.width)}x${String(size.height)} fresh] ${entry.track} ${entry.piece} (${entry.lesson})`, read));
      }
      console.log(lines.join('\n'));
    });
  });
}
