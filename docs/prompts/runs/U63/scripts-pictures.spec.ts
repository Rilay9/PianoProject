// U63's pictures and measurements (Build 1's second half and Build 4): Today's card for C6's learner and
// the held line, before a session and while one runs, at every size the brief lists; the swap sheet with a
// paused piece; and every reason sentence the writers can produce laid into a real row at 342 x 740.
// Throwaway probe, not for the commit; U63_LABEL names the build (before = the committed dist, after = the
// change). Run with U63_TESTDIR=build/u63 through the lane's config copy on port 4673.
import { expect, test, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const LABEL = process.env.U63_LABEL ?? 'unlabelled';
const FACE = process.env.U63_FACE ?? '';
const PICTURES = path.resolve(here, '../../../docs/prompts/pictures/u63');
const OUT = path.join(here, 'out', LABEL + (FACE ? `-${FACE}` : ''));
mkdirSync(PICTURES, { recursive: true });
mkdirSync(OUT, { recursive: true });

test.describe.configure({ timeout: 240_000 });

const DAY = 86_400_000;
const placedAt = (unitId: string, stage: number) => ({ id: 'current', stage, unitId, trackOrder: ['core'], placement: { unitId, at: new Date().toISOString() } });

interface Learner {
  slug: string;
  rung: string;
  length?: number;
  stores: () => Record<string, unknown[]>;
}

/** C6's learner (`today.spec.ts`): 2.2, its exercise counted yesterday, a 2.1 song passed twenty days ago. */
const C6: Learner = {
  slug: 'c6',
  rung: '2.2',
  stores: () => {
    const yesterday = new Date(Date.now() - DAY).toISOString();
    const long = new Date(Date.now() - 20 * DAY).toISOString();
    return {
      plan: [placedAt('2.2', 1)],
      sessions: [
        { itemId: 'drill.rhythm.eighths', lessonId: '2.2', mode: 'drill:rhythm', tempoPct: 100, tempoMeasured: false, accuracy: 0.97, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: yesterday },
        { itemId: 'song.classical.ode-to-joy.ht', lessonId: '2.1', mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 0.95, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: long },
      ],
      progress: [
        { itemId: 'drill.rhythm.eighths', status: 'passed', bestAccuracy: 0.97, bestTempoPct: 0, attempts: 1, lastPracticedAt: yesterday, minutes: 2, passedOn: [yesterday.slice(0, 10)] },
        { itemId: 'song.classical.ode-to-joy.ht', status: 'passed', bestAccuracy: 0.95, bestTempoPct: 100, attempts: 1, lastPracticedAt: long, minutes: 2, passedOn: [long.slice(0, 10)] },
      ],
    };
  },
};

/** The held line (`projects.spec.ts`:348–366): 1.1 with every one of its songs paused, at thirty minutes. */
const SONGS_11 = ['song.folk.hot-cross-buns', 'song.folk.mary-had-a-little-lamb', 'song.folk.merrily-we-roll-along', 'song.folk.au-clair-de-la-lune', 'song.classical.ode-to-joy.rh', 'song.folk.kum-ba-yah.pdmx'];
const HELD: Learner = {
  slug: 'held',
  rung: '1.1',
  length: 30,
  stores: () => {
    const long = new Date(Date.now() - 20 * DAY).toISOString();
    const at = new Date().toISOString();
    return {
      plan: [placedAt('1.1', 0)],
      sessions: [{ itemId: SONGS_11[0], lessonId: '0.3', mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 0.98, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: long }],
      progress: [{ itemId: SONGS_11[0], status: 'mastered', bestAccuracy: 0.98, bestTempoPct: 100, attempts: 3, lastPracticedAt: long, minutes: 6, passedOn: [long.slice(0, 10)] }],
      projects: SONGS_11.map((itemId) => ({ id: `id:${itemId}`, material: { kind: 'id', itemId }, itemId, state: 'paused', since: at, history: [{ state: 'paused', at, why: 'pause' }] })),
    };
  },
};

/** Waiting for its reads (entry-80's intermediate on 3.4): an exercise and a song counted for 3.4 yesterday, no reads. */
const WAITS: Learner = {
  slug: 'waits',
  rung: '3.4',
  stores: () => {
    const yesterday = new Date(Date.now() - DAY).toISOString();
    const run = (itemId: string) => ({ itemId, lessonId: '3.4', mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 0.97, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: yesterday });
    return {
      // The core path and ragtime, as `transfer-offer.spec.ts` places its learner at 3.4: the tracks switched on by
      // default would give the new row to a track's rung.
      plan: [{ ...placedAt('3.4', 3), trackOrder: ['core', 'ragtime'] }],
      sessions: [run('exercise.interval-reading.c-position.right.05'), run('song.classical.beethoven-fur-elise.beginner')],
      progress: ['exercise.interval-reading.c-position.right.05', 'song.classical.beethoven-fur-elise.beginner'].map((itemId) => ({ itemId, status: 'passed', bestAccuracy: 0.97, bestTempoPct: 100, attempts: 1, lastPracticedAt: yesterday, minutes: 2, passedOn: [yesterday.slice(0, 10)] })),
    };
  },
};

interface Size {
  slug: string;
  width: number;
  height: number;
  dark?: boolean;
  text115?: boolean;
}
/** The primary target, at device scale 2 as C6's pictures were taken. */
const PHONES: Size[] = [{ slug: '342x740', width: 342, height: 740 }];
/** The rest at device scale 1: the pictures' weight in the repository, not their reading. */
const TABLETS: Size[] = [
  { slug: '342x740-dark', width: 342, height: 740, dark: true },
  { slug: '342x740-115', width: 342, height: 740, text115: true },
  { slug: '390x844', width: 390, height: 844 },
  { slug: '740x342', width: 740, height: 342 },
  { slug: '768x1024', width: 768, height: 1024 },
  { slug: '900x1200', width: 900, height: 1200 },
];

async function prepare(page: Page, size: Size): Promise<void> {
  await page.setViewportSize({ width: size.width, height: size.height });
  await page.emulateMedia({ colorScheme: size.dark ? 'dark' : 'light' });
  if (size.text115) {
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.style.fontSize = '115%';
      });
    });
  }
  if (FACE === 'verdana') {
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";
        document.head.append(style);
      });
    });
  }
}

async function restore(page: Page, learner: Learner): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 60_000 });
  await page.evaluate(async (stores) => {
    const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
    if (!hooks) throw new Error('storage hooks not exposed');
    await hooks.importAll({ app: 'pianopath', version: 1, exportedAt: new Date().toISOString(), stores });
  }, learner.stores());
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', learner.rung, { timeout: 60_000 });
  if (learner.length !== undefined) {
    await page.locator(`#today-length-${String(learner.length)}`).click();
    await expect(page.locator(`#today-length-${String(learner.length)}`)).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(page.locator('#today-card [data-item]').first()).toBeVisible({ timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

/** Every session row of the card as drawn: its lines, its reason's last visible words, its height. */
async function measureCard(page: Page): Promise<Record<string, unknown>[]> {
  return page.locator('#today-card .list-row').evaluateAll((rows) =>
    rows.map((row) => {
      const box = (el: Element | null) => (el ? el.getBoundingClientRect() : null);
      const title = row.querySelector<HTMLElement>('.list-row__title');
      const sub = row.querySelector<HTMLElement>('.list-row__sub');
      const lineOf = (el: HTMLElement | null): number => {
        if (!el) return 0;
        const lh = Number.parseFloat(getComputedStyle(el).lineHeight);
        return Math.round(el.getBoundingClientRect().height / lh);
      };
      const cut = (el: HTMLElement | null): boolean => (el ? el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1 : false);
      /** The characters whose box lies inside the element's box, less an ellipsis' width where it is cut. */
      const visible = (el: HTMLElement | null): string => {
        const node = el?.firstChild;
        if (!el || !node || node.nodeType !== Node.TEXT_NODE) return el?.textContent ?? '';
        const text = node.textContent ?? '';
        const outer = el.getBoundingClientRect();
        const isCut = cut(el);
        const room = isCut ? 10 : 0;
        const range = document.createRange();
        let last = -1;
        for (let i = 0; i < text.length; i += 1) {
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          const rects = [...range.getClientRects()];
          const r = rects[rects.length - 1];
          if (!r) continue;
          if (r.bottom <= outer.bottom + 0.5 && r.right <= outer.right - room + 0.5) last = i;
        }
        const shown = text.slice(0, last + 1);
        return isCut ? `${shown}…` : shown;
      };
      const r = row.getBoundingClientRect();
      const badges = row.querySelector('.list-row__badges');
      const side = row.querySelector('.today-row__side');
      const actions = row.querySelector('.list-row__actions');
      return {
        slot: row.getAttribute('data-slot'),
        claim: row.getAttribute('data-claim'),
        state: row.getAttribute('data-state'),
        title: title?.textContent ?? '',
        titleLines: lineOf(title),
        titleCut: cut(title),
        reason: sub?.textContent ?? '',
        reasonLines: lineOf(sub),
        reasonCut: cut(sub),
        reasonShown: visible(sub),
        height: Math.round(r.height * 10) / 10,
        textWidth: Math.round((box(row.querySelector('.list-row__text'))?.width ?? 0) * 10) / 10,
        sideWidth: Math.round((box(side ?? actions)?.width ?? 0) * 10) / 10,
        badges: badges?.textContent ?? '',
        badgeBesideActions: Boolean(badges && side && side.contains(badges)),
      };
    }),
  );
}

function write(name: string, data: unknown): void {
  writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data, null, 1));
}

/**
 * The first screenful as the learner opens it (the header is sticky, so a scrolled shot hides Start session),
 * and at the primary size the card's last rows too, scrolled to its end (the app scrolls inside its frame, so a
 * full-page shot is the first screenful again).
 */
async function shoot(page: Page, name: string, scrolled: boolean): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(PICTURES, `${name}.png`), animations: 'disabled' });
  if (scrolled) {
    await page.locator('#today-card > *').last().scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(PICTURES, `${name}-end.png`), animations: 'disabled' });
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      document.querySelector('#today-card')?.closest('section')?.scrollTo?.(0, 0);
    });
  }
}

/** Start session, then back to Today: the running card, its current row wearing Next. */
async function toRunningCard(page: Page): Promise<void> {
  await page.locator('#today-start').click();
  await expect(page).toHaveURL(/#\/(drill|score)\/.+session=/, { timeout: 60_000 });
  await page.goto('/#/today');
  await page.reload();
  await expect(page.locator('#today-continue')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#today-card .list-row.today-row--current')).toHaveCount(1, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

for (const [group, sizes, scale] of [['phones', PHONES, 2], ['tablets', TABLETS, 1]] as const) {
  test.describe(`U63 pictures (${group})`, () => {
    test.use({ deviceScaleFactor: scale });
    for (const size of sizes) {
      for (const learner of [C6, HELD, WAITS]) {
        test(`${learner.slug} at ${size.slug}`, async ({ page }) => {
          if (FACE && size.slug !== '342x740') test.skip();
          await prepare(page, size);
          await restore(page, learner);
          const tag = `${learner.slug}-${size.slug}${FACE ? `-${FACE}` : ''}-${LABEL}`;
          // The waiting learner is measured everywhere and pictured at the primary size only.
          const pictured = !FACE && (learner !== WAITS || size.slug === '342x740');
          const full = size.slug === '342x740';
          write(`${learner.slug}-card-${size.slug}`, await measureCard(page));
          if (pictured) await shoot(page, `${learner.slug}-card-${size.slug}-${LABEL}`, full);
          await toRunningCard(page);
          write(`${learner.slug}-running-${size.slug}`, await measureCard(page));
          if (pictured) await shoot(page, `${learner.slug}-running-${size.slug}-${LABEL}`, full);
          expect(tag).toBeTruthy();
        });
      }
    }
  });
}

test.describe('U63 the swap sheet with a paused piece', () => {
  test.use({ deviceScaleFactor: 2 });
  test('placed at 1.1 with one song paused: the new row’s sheet', async ({ page }) => {
    await prepare(page, PHONES[0] as Size);
    const at = new Date().toISOString();
    const learner: Learner = {
      slug: 'swap',
      rung: '1.1',
      stores: () => ({
        plan: [placedAt('1.1', 0)],
        projects: [{ id: 'id:song.folk.merrily-we-roll-along', material: { kind: 'id', itemId: 'song.folk.merrily-we-roll-along' }, itemId: 'song.folk.merrily-we-roll-along', state: 'paused', since: at, history: [{ state: 'paused', at, why: 'pause' }] }],
      }),
    };
    await restore(page, learner);
    const row = page.locator('#today-card .list-row[data-slot="new"]').first();
    await row.getByRole('button', { name: 'Swap' }).click();
    const sheet = page.locator('#today-swap');
    await expect(sheet.locator('[data-swap]').first()).toBeVisible();
    const options = await sheet.locator('[data-swap]').evaluateAll((rows) =>
      rows.map((one) => ({ swap: one.getAttribute('data-swap'), tier: one.getAttribute('data-tier'), title: one.querySelector('.list-row__title')?.textContent, badges: [...one.querySelectorAll<HTMLElement>('.badge')].map((b) => `${b.textContent ?? ''}${b.dataset.project ? ` [${b.dataset.project}]` : ''}`) })),
    );
    write('swap-sheet-342x740', { row: await row.getAttribute('data-item'), options });
    const paused = sheet.locator('[data-swap="song.folk.merrily-we-roll-along"]');
    if ((await paused.count()) > 0) await paused.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(PICTURES, `swap-sheet-paused-342x740-${LABEL}.png`), animations: 'disabled' });
  });
});

/**
 * Every sentence the writers can produce (`scripts-reason-lengths.test.ts` wrote them) laid into real rows of
 * Today's card at 342 x 740: a row without a badge and the review row with its ✓ passed, each with a one-line
 * and a two-line title, the reason's text replaced. Per sentence: its lines and whether it is whole; per row
 * shape and line count: the row's height.
 */
test.describe('U63 every reason in a real row', () => {
  test.use({ deviceScaleFactor: 2 });
  test('at 342 x 740', async ({ page }) => {
    const file = path.join(here, 'out', 'sentences.json');
    test.skip(!existsSync(file), 'run scripts-reason-lengths.test.ts first');
    const sentences = JSON.parse(readFileSync(file, 'utf8')) as { claim: string; slot: string; text: string }[];
    await prepare(page, PHONES[0] as Size);
    await restore(page, C6);
    const result = await page.evaluate(
      ({ sentences }) => {
        const card = document.querySelector('#today-card') as HTMLElement;
        const rows = [...card.querySelectorAll<HTMLElement>('.list-row')];
        const plain = rows.find((row) => !row.querySelector('.list-row__badges') && row.querySelector('.list-row__actions button'));
        const badged = rows.find((row) => row.querySelector('.list-row__badges') && row.querySelector('.list-row__actions button'));
        if (!plain || !badged) throw new Error(`rows missing: plain ${String(Boolean(plain))}, badged ${String(Boolean(badged))}`);
        const shapes: { name: string; row: HTMLElement }[] = [];
        for (const [name, source] of [['plain', plain], ['badged', badged]] as const) {
          for (const [lines, title] of [['1', 'Scales'], ['2', 'Sight-reading generator, level 2, right hand']] as const) {
            const row = source.cloneNode(true) as HTMLElement;
            (row.querySelector('.list-row__title') as HTMLElement).textContent = title;
            card.append(row);
            shapes.push({ name: `${name}, ${lines}-line title`, row });
          }
        }
        const lh = (el: HTMLElement) => Number.parseFloat(getComputedStyle(el).lineHeight);
        const measure = (row: HTMLElement, text: string) => {
          const sub = row.querySelector('.list-row__sub') as HTMLElement;
          sub.textContent = text;
          const title = row.querySelector('.list-row__title') as HTMLElement;
          return {
            reasonLines: Math.round(sub.getBoundingClientRect().height / lh(sub)),
            whole: !(sub.scrollWidth > sub.clientWidth + 1 || sub.scrollHeight > sub.clientHeight + 1),
            naturalLines: Math.round(sub.scrollHeight / lh(sub)),
            titleLines: Math.round(title.getBoundingClientRect().height / lh(title)),
            height: Math.round(row.getBoundingClientRect().height * 10) / 10,
            textWidth: Math.round((row.querySelector('.list-row__text') as HTMLElement).getBoundingClientRect().width * 10) / 10,
          };
        };
        const perSentence = sentences.map((one) => ({ ...one, ...measure(shapes[0]?.row as HTMLElement, one.text) }));
        // Heights per shape, for a sentence of each natural line count found.
        const byLines = new Map<number, string>();
        for (const one of perSentence) if (!byLines.has(one.naturalLines)) byLines.set(one.naturalLines, one.text);
        const heights = shapes.map((shape) => ({
          shape: shape.name,
          byLines: [...byLines.entries()].sort((a, b) => a[0] - b[0]).map(([lines, text]) => ({ naturalLines: lines, ...measure(shape.row, text) })),
        }));
        for (const shape of shapes) shape.row.remove();
        return { perSentence, heights };
      },
      { sentences },
    );
    write('every-reason-342x740', result);
    const cut = result.perSentence.filter((one) => !one.whole);
    const lines = [
      `build: ${LABEL}${FACE ? ` (${FACE})` : ''}; ${String(result.perSentence.length)} sentences, ${String(cut.length)} not whole in the row at 342 x 740 (text column ${String(result.perSentence[0]?.textWidth ?? 0)} px, as measured in this run)`,
      `by natural lines: ${[1, 2, 3, 4, 5].map((n) => `${String(n)}: ${String(result.perSentence.filter((one) => one.naturalLines === n).length)}`).join(', ')}`,
      '',
      'row heights per shape (as measured in this run, this machine and face):',
      ...result.heights.flatMap((shape) => [`  ${shape.shape}:`, ...shape.byLines.map((one) => `    natural ${String(one.naturalLines)} line(s) -> drawn ${String(one.reasonLines)}, title ${String(one.titleLines)}, row ${String(one.height)} px`)]),
      '',
      'per claim kind: sentences composed, whole in the row, not whole; the longest whole and the shortest not whole (characters):',
      ...[...new Set(result.perSentence.map((one) => one.claim))]
        .map((claim) => {
          const all = result.perSentence.filter((one) => one.claim === claim);
          const whole = all.filter((one) => one.whole);
          const over = all.filter((one) => !one.whole);
          const longest = whole.reduce<(typeof all)[number] | undefined>((a, b) => (!a || b.text.length > a.text.length ? b : a), undefined);
          const shortest = over.reduce<(typeof all)[number] | undefined>((a, b) => (!a || b.text.length < a.text.length ? b : a), undefined);
          return { claim, line: `  ${claim.padEnd(18)} ${String(all.length).padStart(4)} ${String(whole.length).padStart(4)} ${String(over.length).padStart(4)}  longest whole: ${longest ? `${String(longest.text.length)} “${longest.text}”` : '-'}  shortest cut: ${shortest ? `${String(shortest.text.length)} “${shortest.text}” (${String(shortest.naturalLines)} lines)` : '-'}`, over: over.length };
        })
        .sort((a, b) => b.over - a.over)
        .map((one) => one.line),
    ];
    writeFileSync(path.join(OUT, 'every-reason-342x740.txt'), `${lines.join('\n')}\n`);
    expect(result.perSentence.length).toBe(sentences.length);
  });
});
