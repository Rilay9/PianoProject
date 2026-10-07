/**
 * jazz.6's minor ii-V-i shell drill as a learner meets it (G6b; the brief
 * `docs/prompts/runs/curriculum-review-2026-10-05/briefs/g6-minor-shells.md`, lane G6b, tests 5-6;
 * the chain record `docs/chains/A7b.1.yaml`, step 4).
 *
 * The learner opens jazz.6, reads the new section, opens *Minor ii-V-i with shell voicings* from the
 * page's exercise row, and plays one run through the MIDI mock: the nine cards in their order, then the
 * first again, each card naming its chord symbol, numeral and key, each answered with the shell's three
 * notes. After each answer the staff is drawn in the key the card names (three flats for C minor, none for
 * A minor, two for G minor). The run passes, the set is stored against jazz.6 (R3: `lessonId: "jazz.6"`, read
 * from the store), and back on the page *What the app counts* has moved from 0 of 2 to 1 of 2: the
 * requirement naming the drill holds, the generic one (two distinct exercises) does not yet.
 *
 * Reads the built content (run the content build first). Nothing heard: the screen's facts, not a
 * judgement of the music.
 */
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock, type MidiMock } from './fixtures/midiMock';

const RUNG = 'jazz.6';
const DRILL = 'drill.jazz.minor-ii-v-i-shells';
const TITLE = 'Minor ii-V-i with shell voicings';

/** The ten cards of a run, in order, and the signature each card's staff is written in. */
const CARDS: [string, 'flats' | 'none', number][] = [
  ['Dm7♭5 — iiø7 in C minor', 'flats', 3],
  ['G7 — V7 in C minor', 'flats', 3],
  ['Cm6 — i in C minor', 'flats', 3],
  ['Bm7♭5 — iiø7 in A minor', 'none', 0],
  ['E7 — V7 in A minor', 'none', 0],
  ['Am7 — i in A minor', 'none', 0],
  ['Am7♭5 — iiø7 in G minor', 'flats', 2],
  ['D7 — V7 in G minor', 'flats', 2],
  ['Gm7 — i in G minor', 'flats', 2],
  ['Dm7♭5 — iiø7 in C minor', 'flats', 3],
];

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

async function countsLine(page: Page): Promise<string> {
  const summary = page.locator('#lesson-counts summary');
  await expect(summary).toBeVisible({ timeout: 15_000 });
  return ((await summary.textContent()) ?? '').replace(/\s+/g, ' ').trim();
}

/** The pitches the card is waiting for, as the screen publishes them. */
async function expects(page: Page): Promise<number[]> {
  const text = await page.locator('[data-screen="drill"]').getAttribute('data-expects');
  return (text ?? '').split(',').filter(Boolean).map(Number);
}

async function playChord(midi: MidiMock, pitches: number[]): Promise<void> {
  for (const pitch of pitches) await midi.noteOn(pitch, 90);
  for (const pitch of pitches) await midi.noteOff(pitch);
}

/** The key signature drawn on the answer staff: how many glyphs, and whether they are flats or sharps. */
async function answerSignature(page: Page): Promise<{ count: number; kinds: string[] }> {
  return page.evaluate(() => {
    const host = document.querySelector('#drill-answer');
    const sig = host?.querySelector('.vf-keysignature') ?? null;
    if (!sig) return { count: 0, kinds: [] };
    const kinds: string[] = [];
    for (const path of sig.querySelectorAll('path')) {
      const box = path.getBBox();
      const rows = 24;
      const cols = 16;
      const fill: number[] = [];
      for (let r = 0; r < rows; r += 1) {
        let n = 0;
        for (let c = 0; c < cols; c += 1) {
          const pt = new DOMPoint(box.x + ((c + 0.5) * box.width) / cols, box.y + ((r + 0.5) * box.height) / rows);
          if (path.isPointInFill(pt)) n += 1;
        }
        fill.push(n);
      }
      const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
      const top = fill.slice(0, 10);
      const bottom = fill.slice(14);
      const peakTop = Math.max(...fill.slice(0, 12));
      const peakBottom = Math.max(...fill.slice(12));
      kinds.push(
        mean(bottom) > 2 * mean(top) && peakTop <= 4 ? 'flat' : peakTop >= 12 && peakBottom >= 12 ? 'sharp' : 'unread',
      );
    }
    return { count: kinds.length, kinds };
  });
}

/** The drill rows the store holds, as the drill screen wrote them. */
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

test('jazz.6: the minor shell drill opens from the page, a passing run counts there, and the staff is in the card’s key', async ({ page }) => {
  test.setTimeout(180_000);
  const midi = await installMidiMock(page, { permission: 'granted' });

  // The page as the learner opens it: the new section, the drill among eight exercises, Blue Bossa among seven songs.
  await page.goto(`/#/lesson/${RUNG}`);
  await expect(page.locator('#lesson-exercises .list-row')).toHaveCount(8);
  await expect(page.locator('#lesson-songs .list-row')).toHaveCount(7);
  await expect(page.getByText('What the shell leaves out.', { exact: false })).toBeVisible();
  await expect(page.getByText('A root–3–7 shell cannot itself tell iiø7 from', { exact: false })).toBeVisible();
  expect(await countsLine(page)).toBe('What the app counts — 0 of 2');

  // The drill, from its row.
  await page.locator('#lesson-exercises').getByRole('button', { name: `Open ${TITLE}`, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#/drill/${DRILL.replace(/\./g, '\\.')}`));
  expect(page.url(), 'opened from jazz.6').toContain(`rung=${RUNG}`);
  const screen = page.locator('[data-screen="drill"]');
  await expect(screen).toHaveAttribute('data-drill', 'running', { timeout: 30_000 });
  await expect(screen).toHaveAttribute('data-kind', 'chord');

  for (const [index, [label, side, count]] of CARDS.entries()) {
    await expect(page.locator('#drill-symbol'), `card ${String(index + 1)}`).toHaveText(label, { timeout: 15_000 });
    const want = await expects(page);
    expect(want, `${label}: three notes`).toHaveLength(3);
    await playChord(midi, want);
    await expect(page.locator('#drill-counter')).toContainText(`${String(index + 1)} right`, { timeout: 10_000 });
    // After the answer the card is held with the shell on a staff, in the key the card names.
    if (index < 9) {
      await expect(page.locator('#drill-answer svg').first(), `${label}: the staff`).toBeVisible({ timeout: 30_000 });
      const sig = await answerSignature(page);
      expect(sig.count, `${label}: ${String(count)} glyphs in the signature`).toBe(count);
      if (side === 'flats') expect(sig.kinds.every((kind) => kind === 'flat'), `${label}: flats, ${sig.kinds.join(',')}`).toBe(true);
      if (index === 2) await page.screenshot({ path: test.info().outputPath('cm6-answer.png') });
    }
    // The card is held so the staff can be read; a tap on the card moves on, as a learner does.
    if (index < CARDS.length - 1) {
      await expect(screen).toHaveAttribute('data-paused', 'answer');
      await page.locator('#drill-symbol').click();
    }
  }

  // The summary: ten of ten, passed.
  await expect(screen).toHaveAttribute('data-drill', 'finished', { timeout: 30_000 });
  await page.screenshot({ path: test.info().outputPath('summary.png') });

  // R3: the stored set is jazz.6's.
  await expect.poll(async () => (await storedDrillRows(page)).filter((row) => row.itemId === DRILL).length, { timeout: 15_000 }).toBe(1);
  const rows = (await storedDrillRows(page)).filter((row) => row.itemId === DRILL);
  expect(rows[0]?.lessonId, 'the set is judged by jazz.6').toBe(RUNG);
  expect(rows[0]?.accuracy).toBe(1);

  // Back on the page: the named-drill requirement holds, the two-exercise one does not yet.
  await page.goto(`/#/lesson/${RUNG}`);
  expect(await countsLine(page)).toBe('What the app counts — 1 of 2');
  const holds = await page.locator('#lesson-counts li').evaluateAll((items) =>
    items.map((li) => ({ holds: (li as HTMLElement).dataset.holds, text: (li.textContent ?? '').replace(/\s+/g, ' ').trim() })),
  );
  expect(holds.map((h) => h.holds)).toEqual(['false', 'true']);
  expect(holds[1]?.text ?? '').toContain(TITLE);
});
