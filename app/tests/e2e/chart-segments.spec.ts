/**
 * More than one chord in a bar, on the Chord chart's grid (PH2, brief test 5; the reviewer's rulings,
 * `docs/review/responses/g6-ph-briefs-cb1.md` §3 and `ph1-g6a-landing.md` §2).
 *
 * The grid draws every positioned harmony of a bar as its own segment, each as wide as its share of the bar
 * (`chartSegments`: duration over the bar's length), in the order written. A bar of one chord at its start is
 * drawn exactly as before: one cell, its text, no segments. The bars are the score's own measures in source
 * order, none past the last.
 *
 * - Blue Bossa bar 16 (Dmi7b5 then G7 at beat 3) and Insensatez bar 22 (Bmi7b5 then E7 at beat 3): two segments,
 *   1 : 1, with their texts. Both are A7b.1's charts (`docs/pending-review.md` Entry 266).
 * - Czerny, The School of Velocity No. 8, bar 1: C for a beat and a half, G7 for half a beat, twice: 3 : 1 : 3 : 1.
 *
 * Widths are measured on the segment boxes, which keep their proportions in either of the two layouts a split bar
 * can take (`ChordChartScreen.ts`, `fitSplitCells`). Nothing here is heard.
 */
import { expect, test, type Page } from '@playwright/test';

const BLUE_BOSSA = 'song.jazz.kenny-dorham-blue-bossa.pdmx';
const INSENSATEZ = 'song.folk.insensatez-how-insensitive-jobim.pdmx';
const CZERNY_8 = 'song.classical.czerny-the-school-of-velocity-op-299-no-8.pdmx';

async function open(page: Page, id: string): Promise<void> {
  await page.goto('about:blank');
  await page.goto(`/#/chart/${id}`);
  await expect(page.locator('.chart-cell[data-bar="1"]')).toBeVisible({ timeout: 20_000 });
}

/** A bar's segments as drawn: each label's text and each box's width. */
async function segments(page: Page, bar: number): Promise<{ texts: string[]; widths: number[] }> {
  const cell = page.locator(`#chart-grid .chart-cell[data-bar="${String(bar)}"]`);
  await expect(cell).toHaveAttribute('data-split', 'true');
  return cell.evaluate((node) => {
    const boxes = [...node.querySelectorAll<HTMLElement>('.chart-seg')];
    const labels = [...node.querySelectorAll<HTMLElement>('.chart-seg-label')].sort((a, b) => Number(a.dataset.seg) - Number(b.dataset.seg));
    return {
      texts: labels.map((label) => label.textContent ?? ''),
      widths: boxes.map((box) => box.getBoundingClientRect().width),
    };
  });
}

function ratios(widths: number[]): number[] {
  const unit = Math.min(...widths);
  return widths.map((w) => Math.round((w / unit) * 100) / 100);
}

test.describe('a bar with more than one chord shows every one, as wide as it lasts', () => {
  test('Blue Bossa bar 16: Dmi7b5 then G7, half and half; bar 15 is drawn as before', async ({ page }) => {
    await open(page, BLUE_BOSSA);
    const bar16 = await segments(page, 16);
    expect(bar16.texts).toEqual(['Dmi7b5', 'G7']);
    expect(ratios(bar16.widths)).toEqual([1, 1]);
    // A one-chord bar: one cell, its text, nothing inside.
    const bar15 = page.locator('#chart-grid .chart-cell[data-bar="15"]');
    await expect(bar15).not.toHaveAttribute('data-split', /.*/);
    await expect(bar15.locator('.chart-seg')).toHaveCount(0);
    expect((await bar15.textContent())?.length).toBeGreaterThan(0);
    // The score's own 32 measures, none past the end.
    await expect(page.locator('#chart-grid .chart-cell')).toHaveCount(32);
  });

  test('Insensatez bar 22: Bmi7b5 then E7, half and half', async ({ page }) => {
    await open(page, INSENSATEZ);
    const bar22 = await segments(page, 22);
    expect(bar22.texts).toEqual(['Bmi7b5', 'E7']);
    expect(ratios(bar22.widths)).toEqual([1, 1]);
  });

  test('Czerny No. 8 bar 1: C, G7, C, G7 at three to one', async ({ page }) => {
    // (The boxes keep their proportions whether the symbols sit in them or hang over them as a rule.)
    await open(page, CZERNY_8);
    const bar1 = await segments(page, 1);
    expect(bar1.texts).toEqual(['C', 'G7', 'C', 'G7']);
    const r = ratios(bar1.widths);
    expect(r.map((x) => Math.round(x))).toEqual([3, 1, 3, 1]);
    for (const [i, expected] of [3, 1, 3, 1].entries()) expect(Math.abs((r[i] ?? 0) - expected)).toBeLessThan(0.05);
  });
});

/**
 * Every layout keeps when each chord begins (the reviewer's `PH2-position-preserving-fallback`,
 * `docs/review/responses/ph2-look.md` §2). On the 342 px phone, where cells are narrowest: in every split bar of
 * the chart either each symbol sits in its own proportional box, or the boxes are a rule and each symbol has a
 * leader from its foot to the rule at its box's left edge, the place its chord starts (within a pixel). No symbol
 * overlaps another, no leader passes through another symbol and no two leaders cross, read in the rendered
 * geometry. Where no such layout exists the chart refuses, saying which bar and why,
 * and offers the Score screen; it never draws chords whose places cannot be read.
 */
test.describe('on a 342 px phone, every split bar shows where each chord starts, or the chart refuses', () => {
  test.use({ viewport: { width: 342, height: 740 } });

  async function positionsKept(page: Page): Promise<{ boxes: number; placed: number; faults: string[] }> {
    return page.evaluate(() => {
      const faults: string[] = [];
      let boxes = 0;
      let placed = 0;
      for (const cell of document.querySelectorAll<HTMLElement>('#chart-grid .chart-cell[data-split="true"]')) {
        const bar = cell.dataset.bar ?? '?';
        const segs = [...cell.querySelectorAll<HTMLElement>('.chart-seg')];
        if (cell.dataset.layout === 'fit') {
          boxes += 1;
          segs.forEach((seg, i) => {
            const label = seg.querySelector('.chart-seg-label');
            if (!label) faults.push(`bar ${bar}: segment ${String(i)} has no symbol in its box`);
          });
          continue;
        }
        if (cell.dataset.layout !== 'placed') {
          faults.push(`bar ${bar}: layout ${cell.dataset.layout ?? 'none'}`);
          continue;
        }
        placed += 1;
        const svg = cell.querySelector('.chart-leaders')?.getBoundingClientRect();
        const leaders = [...cell.querySelectorAll<SVGLineElement>('.chart-stem')]
          .sort((a, b) => Number(a.dataset.seg) - Number(b.dataset.seg))
          .map((l) => {
            const n = (name: string): number => Number(l.getAttribute(name));
            return { x1: (svg?.left ?? 0) + n('x1'), y1: (svg?.top ?? 0) + n('y1'), x2: (svg?.left ?? 0) + n('x2'), y2: (svg?.top ?? 0) + n('y2') };
          });
        const labels = [...cell.querySelectorAll<HTMLElement>('.chart-seq .chart-seg-label')].sort((a, b) => Number(a.dataset.seg) - Number(b.dataset.seg));
        if (leaders.length !== segs.length || labels.length !== segs.length) faults.push(`bar ${bar}: ${String(leaders.length)} leaders, ${String(labels.length)} symbols, ${String(segs.length)} segments`);
        const rule = cell.querySelector('.chart-segs')?.getBoundingClientRect();
        segs.forEach((seg, i) => {
          const leader = leaders[i];
          const box = seg.getBoundingClientRect();
          if (!leader) return;
          // The leader ends on the rule at the place its chord starts.
          if (Math.abs(leader.x2 - box.left) > 1) faults.push(`bar ${bar}: leader ${String(i)} meets the rule at ${leader.x2.toFixed(1)}, its chord starts at ${box.left.toFixed(1)}`);
          if (rule && Math.abs(leader.y2 - rule.top) > 2) faults.push(`bar ${bar}: leader ${String(i)} stops short of the rule`);
          // And it leaves from its own symbol.
          const own = labels[i]?.getBoundingClientRect();
          if (own && (leader.x1 < own.left - 1 || leader.x1 > own.right + 1 || Math.abs(leader.y1 - own.bottom) > 2)) faults.push(`bar ${bar}: leader ${String(i)} does not leave from its symbol`);
        });
        labels.forEach((a, i) => {
          const ra = a.getBoundingClientRect();
          // Left to right in the order the chords come.
          const next = labels[i + 1]?.getBoundingClientRect();
          if (next && next.left < ra.left + 2) faults.push(`bar ${bar}: symbol ${String(i + 1)} starts left of symbol ${String(i)}`);
          labels.forEach((b, j) => {
            if (j <= i) return;
            const rb = b.getBoundingClientRect();
            // Half a pixel of tolerance: a line's height is rounded up, a box's edge is not.
            if (ra.left < rb.right - 0.5 && rb.left < ra.right - 0.5 && ra.top < rb.bottom - 0.5 && rb.top < ra.bottom - 0.5) faults.push(`bar ${bar}: symbols ${String(i)} and ${String(j)} overlap`);
          });
          leaders.forEach((l, j) => {
            if (j === i) return;
            for (let t = 0; t <= 1; t += 0.02) {
              const x = l.x1 + (l.x2 - l.x1) * t;
              const y = l.y1 + (l.y2 - l.y1) * t;
              if (x > ra.left + 1 && x < ra.right - 1 && y > ra.top + 1 && y < ra.bottom - 1) {
                faults.push(`bar ${bar}: leader ${String(j)} crosses symbol ${String(i)}`);
                return;
              }
            }
          });
        });
        leaders.forEach((p, i) =>
          leaders.forEach((q, j) => {
            if (j <= i) return;
            const side = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
            const d1 = side(p.x1, p.y1, p.x2, p.y2, q.x1, q.y1);
            const d2 = side(p.x1, p.y1, p.x2, p.y2, q.x2, q.y2);
            const d3 = side(q.x1, q.y1, q.x2, q.y2, p.x1, p.y1);
            const d4 = side(q.x1, q.y1, q.x2, q.y2, p.x2, p.y2);
            if (d1 * d2 < 0 && d3 * d4 < 0) faults.push(`bar ${bar}: leaders ${String(i)} and ${String(j)} cross`);
          }),
        );
      }
      return { boxes, placed, faults };
    });
  }

  for (const [name, id] of [
    ['Blue Bossa', BLUE_BOSSA],
    ['Let It Snow (four chords in bar 8)', 'song.pop.frank-sinatra-let-it-snow-leadsheet.pdmx'],
    ['Hark! The Herald Angels Sing (four long symbols a bar)', 'song.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx'],
    ['Lullaby of Birdland', 'song.jazz.george-shearing-lullaby-of-birdland.pdmx'],
  ] as const) {
    test(`${name}: every split bar in boxes or with leaders to its starts`, async ({ page }) => {
      await page.goto('about:blank');
      await page.goto(`/#/chart/${id}`);
      await page.waitForFunction(() => !!document.querySelector('#chart-grid .chart-cell[data-bar="1"]') || !!document.querySelector('section[data-screen="chart"][data-refused]'), null, { timeout: 20_000 });
      await page.waitForTimeout(400);
      expect(await page.locator('section[data-screen="chart"][data-refused]').count(), (await page.locator('#chart-status').textContent()) ?? '').toBe(0);
      const result = await positionsKept(page);
      expect(result.faults).toEqual([]);
      expect(result.boxes + result.placed).toBeGreaterThan(0);
      await expect(page.locator('section[data-screen="chart"]')).not.toHaveAttribute('data-refused', /.*/);
    });
  }

  test('Blue Bossa bar 16 on the phone: Dmi7b5’s leader meets the rule at the bar’s start, G7’s at its middle', async ({ page }) => {
    await open(page, BLUE_BOSSA);
    await page.waitForTimeout(300);
    const cell = page.locator('#chart-grid .chart-cell[data-bar="16"]');
    await expect(cell).toHaveAttribute('data-layout', 'placed');
    const at = await cell.evaluate((node) => {
      const rule = node.querySelector('.chart-segs')?.getBoundingClientRect();
      const svg = node.querySelector('.chart-leaders')?.getBoundingClientRect();
      return [...node.querySelectorAll<SVGLineElement>('.chart-stem')].map((l) =>
        rule && svg ? Math.round(((svg.left + Number(l.getAttribute('x2')) - rule.left) / rule.width) * 100) / 100 : -1,
      );
    });
    expect(at).toEqual([0, 0.5]);
  });

  /**
   * A real lead sheet that cannot be drawn positionally at this width, pinned so a change either way shows. Rose
   * Room's bar 16 is A♭, A♭7, A♭dim7 and B♭m7b5, a beat each: at 342 px a beat is about fifteen pixels and the last
   * two symbols are each wider than the room from their beat to the barline, so wherever they stand, one covers
   * the other's place or the leaders cross; the chart refuses rather than draw one chord over another's place.
   * At 1366 x 1024 and 1024 x 1366 it is drawn (the census, `docs/prompts/runs/PH2/legibility.txt`).
   */
  test('Rose Room at 342 px: refused at bar 16, with the reason and the Score screen', async ({ page }) => {
    await page.goto('about:blank');
    await page.goto('/#/chart/song.pop.benny-goodman-louis-prima-rose-room.pdmx');
    await expect(page.locator('#chart-status')).toHaveText(
      'Rose Room (1917) has more chord changes in bar 16 than this screen is wide enough to show at their places in the bar.',
      { timeout: 20_000 },
    );
    await expect(page.locator('#chart-open-score')).toBeVisible();
    await expect(page.locator('#chart-start')).toHaveCount(0);
  });

  test('a bar no layout can place fails the chart closed, naming the bar, with the Score screen as the way on', async ({ page }) => {
    // Two chords whose symbols are each wider than the whole cell at the smallest size: neither can be drawn.
    const chord = (): string =>
      '<harmony><root><root-step>E</root-step><root-alter>-1</root-alter></root><kind text="m7(b5)add9">half-diminished</kind><bass><bass-step>G</bass-step><bass-alter>-1</bass-alter></bass></harmony>';
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>Dense Changes Study</work-title></work>' +
      '<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">' +
      '<measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>' +
      `${chord()}<note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><type>half</type></note>${chord()}<note><pitch><step>D</step><octave>4</octave></pitch><duration>2</duration><type>half</type></note></measure>` +
      '<measure number="2"><harmony><root><root-step>C</root-step></root><kind>major</kind></harmony><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure>' +
      '</part></score-partwise>';
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles({ name: 'dense-changes-study.musicxml', mimeType: 'application/vnd.recordare.musicxml+xml', buffer: Buffer.from(xml) });
    const row = page.locator('.list-row[data-item]').filter({ hasText: 'Dense Changes Study' }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    const id = (await row.getAttribute('data-item')) ?? '';
    await page.goto('about:blank');
    await page.goto(`/#/chart/${id}`);
    const status = page.locator('#chart-status');
    await expect(status).toHaveText(
      'Dense Changes Study has more chord changes in bar 1 than this screen is wide enough to show at their places in the bar.',
      { timeout: 20_000 },
    );
    await expect(page.locator('section[data-screen="chart"]')).toHaveAttribute('data-refused', 'too-dense');
    await expect(page.locator('#chart-open-score')).toBeVisible();
    await expect(page.locator('#chart-start')).toHaveCount(0);
    await expect(page.locator('#chart-grid')).toBeHidden();
  });
});
