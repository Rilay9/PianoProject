/**
 * The import experience, through the real UI callers (X3; E21, U72; the brief approved with one
 * required change, `responses/ef80e86.md`).
 *
 * The learner's path, end to end on the production build: the Library's picker imports a MIDI
 * file → the row `addImport` returned opens the import sheet (the UI opens it; the store opens
 * nothing) → what the app read and what it guessed, each guess with whose it is → *Swap the hands*,
 * saved through the store, which measures the corrected score again → the conversion note and the
 * demands follow the row → no rung → the Library row says the import's state → the row's *Assign*
 * opens the same sheet on the stored row → the learner opens the piece and the Score screen
 * engraves it. Importing, correcting, assigning and viewing write no progress; a run is what
 * playing it would record.
 *
 * **The fixture** (`tests/fixtures/imports/left-hand-first.mid`, written by the script beside it):
 * two tracks, the left hand's first, so the converter — which keeps a file's two tracks in file
 * order — puts the bass line on the treble staff and the tune on the bass staff, both under ledger
 * lines, and the swap is the correction a learner would make. It states no tempo.
 *
 * And the share door (`takeSharedFiles`): a file Android parked in the share cache is imported by
 * the Library on its way in, and the Library opens the sheet from the row it got back.
 *
 * And the learner's stated tempo (X3a; E48): on the same fixture, whose file states no tempo, the
 * learner types the tempo on the sheet's tempo line and presses *Use this tempo*; the store writes it
 * into the score and measures it again, the line and the Library row say the tempo is theirs, and the
 * Score screen's tempo label, at 100 %, reads the stated tempo rather than the app's 100. A slip has a
 * way back (X3b, `responses/564e8e5f.md`): the control stays after a statement, and a second statement
 * on the same sheet goes through the same store operation — the line, the stored score, the fact and
 * the Score screen then carry the second number, and the first is nowhere.
 *
 * And the tempo a marked file states, played (X3d; the X3c review's required change,
 * `responses/b71a55ca.md`): a file whose metronome mark counts half notes — cut time, half note = 60
 * with `<sound tempo="120">`, MuseScore's export shape, made in memory — is said on the sheet as 120
 * quarter notes a minute and opens on the Score screen at 120, the one tempo map the label, the clock
 * and the count-in read (the dev harness's model summary: its tempo and the length its clock gives four
 * bars, computed from the map); and the learner's stated 100 on that file is what the Score screen
 * then says. On the committed map the screen said 60 and, after the statement, 50.
 *
 * And the same file in MusicXML's timewise form (X3e; the X3d review's required change,
 * `responses/5e6eceba.md`), which the door accepts: its sheet says what the partwise file's says and the
 * Score screen opens it at the same 120. On the committed door the sheet said the app chose ♩ = 100 and
 * the Score screen could not open the score, the engraver refusing the timewise form.
 */
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDevScore } from './fixtures/devScore';
import { setTempoPercent } from './scoreControls';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'imports');
const LEFT_HAND_FIRST = path.join(FIXTURES, 'left-hand-first.mid');
const ITEM = 'import.left-hand-first';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

interface StoredRow {
  data?: string;
  demands?: string[] | 'unmeasured';
  lessonIds?: string[];
  provenance?: { facts: Record<string, { kind: string; via?: string } | undefined> };
}

/** One object store's row, read back out of IndexedDB. */
async function stored<T>(page: Page, store: string, key: string): Promise<T | null> {
  return page.evaluate(
    ([name, wanted]) =>
      new Promise<T | null>((resolve, reject) => {
        const request = indexedDB.open('pianopath');
        request.onerror = () => {
          reject(new Error('could not open the database'));
        };
        request.onsuccess = () => {
          const read = request.result.transaction(name).objectStore(name).get(wanted);
          read.onsuccess = () => {
            resolve((read.result as T | undefined) ?? null);
          };
          read.onerror = () => {
            reject(new Error('could not read the row'));
          };
        };
      }),
    [store, key] as const,
  );
}

/** How many runs the store holds, of any piece. */
async function runsStored(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const request = indexedDB.open('pianopath');
        request.onerror = () => {
          reject(new Error('could not open the database'));
        };
        request.onsuccess = () => {
          const count = request.result.transaction('sessions').objectStore('sessions').count();
          count.onsuccess = () => {
            resolve(count.result);
          };
          count.onerror = () => {
            reject(new Error('could not count the runs'));
          };
        };
      }),
  );
}

test.describe('the import experience', () => {
  test('import a MIDI file, see what was read and guessed, swap the hands, assign to no rung, find it in the Library with its state, and open it', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(LEFT_HAND_FIRST);
    await expect(page.locator('#library-status')).toContainText('Imported 1:');

    // The UI caller opened the sheet from the row it got back.
    const sheet = page.locator('#assign-sheet[data-sheet="import"]');
    await expect(sheet).toBeVisible();

    // What the app read.
    const read = sheet.locator('#import-read');
    await expect(read).toContainText('4 bars');
    await expect(read).toContainText('no sharps or flats');
    await expect(sheet.locator('#assign-conversion-check')).toContainText('every bar adds up');

    // What the app guessed, each with whose it is.
    await expect(sheet.locator('#import-hands')).toContainText('from the file');
    await expect(sheet.locator('#assign-conversion-hands')).toContainText('the first (Left hand) is the upper staff');
    await expect(sheet.locator('#import-tempo')).toContainText('the app’s guess');
    await expect(sheet.locator('#import-tempo')).toContainText('The file states no tempo, so the app chose ♩ = 100.');
    // The tempo is the app's guess, so the line offers the learner's own (X3a; stated in the case below).
    await expect(sheet.locator('#import-tempo-use')).toBeVisible();

    // What the notes ask, before: the bass line under the treble staff and the tune over the bass.
    const demands = sheet.locator('#assign-demands');
    await expect(demands).toContainText('the ledger-line notes');
    const before = await stored<StoredRow>(page, 'imports', ITEM);
    expect(before?.demands).toContain('pitch.ledger');

    // The swap, saved through the store.
    await sheet.locator('#import-swap').click();
    await expect(sheet.locator('#import-swap-said')).toContainText('Swapped');
    await expect(sheet.locator('#import-hands')).toContainText('yours');
    await expect(sheet.locator('#assign-conversion-hands')).toContainText('the hands are yours');
    await expect(sheet.locator('#assign-conversion-hands')).not.toContainText('kept as recorded');
    await expect(demands).not.toContainText('the ledger-line notes');
    const after = await stored<StoredRow>(page, 'imports', ITEM);
    expect(after?.data).not.toBe(before?.data);
    expect(after?.provenance?.facts.hands?.via).toMatch(/learner/);
    expect(after?.provenance?.facts.demands?.via).toMatch(/corrected/);
    expect(after?.demands).not.toContain('pitch.ledger');

    // Where does it belong: no rung.
    await expect(sheet.locator('#assign-lesson')).toHaveValue('');
    await sheet.locator('#assign-save').click();
    await expect(sheet).toBeHidden();
    expect((await stored<StoredRow>(page, 'imports', ITEM))?.lessonIds).toEqual([]);

    // The Library row says the import's state in words: where its notes came from beside the level,
    // and under it whose the hands are, measured, and the tempo the app chose.
    const row = page.locator(`.list-row[data-item="${ITEM}"]`);
    await expect(row.locator('.list-row__metatext')).toContainText('converted from MIDI');
    await expect(row.locator('.library-import-state')).toHaveText('hands corrected · measured · tempo guessed');

    // Nothing so far is evidence: no run, no progress for the piece.
    expect(await runsStored(page)).toBe(0);
    expect(await stored(page, 'progress', ITEM)).toBeNull();

    // The row's Assign opens the same sheet on the stored row: the hands are still the learner's.
    await row.getByRole('button', { name: 'Assign' }).click();
    await expect(sheet.locator('#import-hands')).toContainText('yours');
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(sheet).toBeHidden();

    // The learner opens it: the Score screen engraves the corrected score.
    await row.click();
    await expect(page).toHaveURL(new RegExp(`#/score/${ITEM.replace('.', '\\.')}`));
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 30_000 });
  });

  test('state the tempo on the sheet, then state it again: the line, the stored score, the fact, the row and the Score screen’s tempo label carry the second statement', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(LEFT_HAND_FIRST);
    const sheet = page.locator('#assign-sheet[data-sheet="import"]');
    await expect(sheet).toBeVisible();
    const tempo = sheet.locator('#import-tempo');
    const field = sheet.locator('#import-tempo-bpm');
    await expect(tempo).toContainText('The file states no tempo, so the app chose ♩ = 100.');

    // The learner means 160 and drops the 1: 60, which the store takes (it is between 20 and 400).
    await field.fill('60');
    await sheet.locator('#import-tempo-use').click();
    await expect(tempo).toContainText('yours');
    await expect(tempo).toContainText('You stated ♩ = 60.');
    await expect(tempo).not.toContainText('the app’s guess');
    // The control stays (X3b), starting at the tempo the score now opens at.
    await expect(sheet.locator('#import-tempo-use')).toBeEnabled();
    await expect(field).toHaveValue('60');

    // The store's change: the score opens at 60, and the fact names the learner.
    const first = await stored<StoredRow>(page, 'imports', ITEM);
    expect(first?.data).toContain('<sound tempo="60"/>');
    expect(first?.provenance?.facts.tempo?.kind).toBe('authored');
    expect(first?.provenance?.facts.tempo?.via).toMatch(/learner.*\b60 quarter notes a minute/);

    // The way back: on the same sheet, without closing it or importing again, the tempo meant.
    await field.fill('160');
    await sheet.locator('#import-tempo-use').click();
    await expect(tempo).toContainText('You stated ♩ = 160.');
    await expect(tempo).not.toContainText('♩ = 60.');
    await expect(field).toHaveValue('160');

    // The stored score opens at 160 and sounds no 60; the fact is the learner's, the second number.
    const second = await stored<StoredRow>(page, 'imports', ITEM);
    expect(second?.data).toContain('<sound tempo="160"/>');
    expect(second?.data).not.toContain('tempo="60"');
    expect(second?.provenance?.facts.tempo?.kind).toBe('authored');
    expect(second?.provenance?.facts.tempo?.via).toMatch(/learner.*\b160 quarter notes a minute/);
    expect(second?.provenance?.facts.tempo?.via).not.toMatch(/\b60 quarter notes/);

    // No rung; the Library row says the tempo is the learner's (the hands are the file's, so no hands word).
    await sheet.locator('#assign-save').click();
    await expect(sheet).toBeHidden();
    const row = page.locator(`.list-row[data-item="${ITEM}"]`);
    await expect(row.locator('.library-import-state')).toHaveText('measured · tempo yours');

    // The Score screen plays it at the second statement: at 100 % the label reads 160, not 60 or the app's 100.
    await row.click();
    await expect(page).toHaveURL(new RegExp(`#/score/${ITEM.replace('.', '\\.')}`));
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 30_000 });
    await setTempoPercent(page, 100);
    await expect(page.locator('#score-tempo-label')).toHaveText(/\b160 bpm$/);
  });

  test('a file shared into the app opens the sheet from the row the Library got back', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/#/today');
    // What the service worker does with a share: parks the file in the share cache, keyed by its name.
    const bytes = [...readFileSync(LEFT_HAND_FIRST)];
    await page.evaluate(async (data) => {
      const cache = await caches.open('pianopath-shared');
      await cache.put(new Request(new URL('shared/left-hand-first.mid', location.href).href), new Response(new Uint8Array(data)));
    }, bytes);
    await page.goto('/#/library');
    const sheet = page.locator('#assign-sheet[data-sheet="import"]');
    await expect(sheet).toBeVisible({ timeout: 30_000 });
    await expect(sheet.locator('#import-read')).toContainText('4 bars');
    await expect(page.locator('#library-status')).toContainText('Shared in: left hand first');
  });
});

/** Four bars of cut time on a piano's two staves, a half note = 60 playing 120 quarter notes a minute (X3c's picture file). */
function halfNoteMarked(title: string): string {
  const note = (step: string, octave: number, staff: 1 | 2): string =>
    `<note><pitch><step>${step}</step><octave>${String(octave)}</octave></pitch><duration>2</duration><voice>${staff === 1 ? '1' : '5'}</voice><type>half</type><staff>${String(staff)}</staff></note>`;
  const attributes =
    '<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time symbol="cut"><beats>2</beats><beat-type>2</beat-type></time><staves>2</staves>' +
    '<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>';
  const mark =
    '<direction placement="above"><direction-type><metronome parentheses="no"><beat-unit>half</beat-unit><per-minute>60</per-minute></metronome></direction-type><staff>1</staff><sound tempo="120"/></direction>';
  const steps = ['C', 'D', 'E', 'F', 'G', 'F', 'E', 'D'];
  const bar = (n: number): string =>
    `<measure number="${String(n)}">${n === 1 ? attributes + mark : ''}` +
    `${note(steps[(n - 1) * 2] ?? 'C', 5, 1)}${note(steps[(n - 1) * 2 + 1] ?? 'C', 5, 1)}<backup><duration>4</duration></backup>${note('C', 3, 2)}${note('G', 2, 2)}</measure>`;
  return (
    `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>${title}</work-title></work>` +
    `<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${bar(1)}${bar(2)}${bar(3)}${bar(4)}</part></score-partwise>`
  );
}

/** Imports one MusicXML file on the Library and opens its sheet from the row's Assign (a plain import opens none). */
async function importMarked(page: Page, title: string, xml: string): Promise<void> {
  await page.goto('/#/library');
  await page.locator('#library-file').setInputFiles({ name: `${title}.musicxml`, mimeType: 'application/vnd.recordare.musicxml+xml', buffer: Buffer.from(xml, 'utf8') });
  await expect(page.locator('#library-status')).toContainText('Imported 1:');
  await page.locator('.list-row', { hasText: title }).getByRole('button', { name: 'Assign' }).click();
  await expect(page.locator('#assign-sheet[data-sheet="import"]')).toBeVisible({ timeout: 30_000 });
}

/** Opens the piece from its Library row and waits for the engraving, the tempo at 100 %. */
async function openAtFullTempo(page: Page, title: string): Promise<void> {
  await page.locator('.list-row', { hasText: title }).click();
  await expect(page).toHaveURL(/#\/score\//);
  await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 30_000 });
  await setTempoPercent(page, 100);
}

test.describe('the tempo a marked file states, played (X3d)', () => {
  test('a half-note mark of 60 with a playback tempo of 120: the sheet says 120 quarter notes a minute, and the Score screen and its clock run at 120', async ({ page }) => {
    test.setTimeout(120_000);
    const title = 'Half note mark';
    await importMarked(page, title, halfNoteMarked(title));
    const sheet = page.locator('#assign-sheet[data-sheet="import"]');
    await expect(sheet.locator('#import-tempo')).toContainText('(120 quarter notes a minute)');
    await expect(sheet.locator('#import-tempo-bpm')).toHaveValue('120');
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(sheet).toBeHidden();

    // The Score screen's label and its bpm field at 100 %: the map's tempo at the cursor.
    await openAtFullTempo(page, title);
    await expect(page.locator('#score-tempo-label')).toHaveText(/\b120 bpm$/);
    await expect(page.locator('#score-bpm')).toHaveValue('120');

    // The clock: the same file's model in the dev harness — its tempo, and the length the map gives its
    // four bars of cut time (sixteen quarters) at 100 %, computed, not timed.
    await openDevScore(page);
    await page.evaluate(async (source) => {
      await window.__pianopathDevScore?.loadMusicXml(source, 'half-note-mark');
    }, halfNoteMarked(title));
    expect(await page.evaluate(() => window.__pianopathDevScore?.lastError())).toBeFalsy();
    const summary = await page.evaluate(() => window.__pianopathDevScore?.modelSummary());
    expect({ tempoBpm: summary?.tempoBpm, durationSec: summary?.durationSec }).toEqual({ tempoBpm: 120, durationSec: (16 * 60) / 120 });
  });

  test('the learner states 100 on the half-note-marked file: the line and the Score screen say 100', async ({ page }) => {
    test.setTimeout(120_000);
    const title = 'Half note stated';
    await importMarked(page, title, halfNoteMarked(title));
    const sheet = page.locator('#assign-sheet[data-sheet="import"]');
    await sheet.locator('#import-tempo-bpm').fill('100');
    await sheet.locator('#import-tempo-use').click();
    await expect(sheet.locator('#import-tempo')).toContainText('You stated ♩ = 100.');
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(sheet).toBeHidden();

    // E48 wrote 100 into the score's opening <sound tempo> and the half note at 50; the Score screen reads
    // the sound, so at 100 % it says 100 — not the 50 the committed map took from the mark.
    await openAtFullTempo(page, title);
    await expect(page.locator('#score-tempo-label')).toHaveText(/\b100 bpm$/);
    await expect(page.locator('#score-bpm')).toHaveValue('100');
  });
});

/** A one-part partwise file in MusicXML's timewise form: the same measures, each holding the part (X3e). */
function timewise(partwise: string): string {
  const [, head = '', part = '', inner = ''] = /^([\s\S]*?)<part (id="[^"]*")>([\s\S]*)<\/part><\/score-partwise>$/.exec(partwise) ?? [];
  const measures = [...inner.matchAll(/<measure( [^>]*)>([\s\S]*?)<\/measure>/g)].map(([, attributes = '', content = '']) => `<measure${attributes}><part ${part}>${content}</part></measure>`);
  return `${head.replace('<score-partwise', '<score-timewise')}${measures.join('')}</score-timewise>`;
}

test.describe('a timewise file, as the door accepts it (X3e)', () => {
  test('the half-note file in the timewise form: the sheet says 120 quarter notes a minute and four bars, and the Score screen opens it at 120', async ({ page }) => {
    test.setTimeout(120_000);
    const title = 'Half note timewise';
    const xml = timewise(halfNoteMarked(title));
    expect(xml).toContain('<score-timewise version="4.0">');
    await importMarked(page, title, xml);
    const sheet = page.locator('#assign-sheet[data-sheet="import"]');
    await expect.soft(sheet.locator('#import-tempo')).toContainText('from the file — The file says \u{1D15E} = 60 (120 quarter notes a minute).');
    await expect.soft(sheet.locator('#import-tempo-bpm')).toHaveValue('120');
    await expect.soft(sheet.locator('#import-read')).toContainText('4 bars');
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(sheet).toBeHidden();

    // The Score screen, settled one way or the other: the engraving drawn, or its sentence that it could not open the score.
    await page.locator('.list-row', { hasText: title }).click();
    await expect(page).toHaveURL(/#\/score\//);
    const drawn = page.locator('#score-stage .is-front svg').first();
    await expect(drawn.or(page.locator('#score-status', { hasText: 'Could not open' })).first()).toBeVisible({ timeout: 30_000 });
    expect(await page.locator('#score-status').textContent()).not.toContain('Could not open');
    await setTempoPercent(page, 100);
    await expect(page.locator('#score-tempo-label')).toHaveText(/\b120 bpm$/);
    await expect(page.locator('#score-bpm')).toHaveValue('120');
  });
});
