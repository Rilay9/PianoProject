/**
 * X3c's product look (Entry 129), not a test of the suite: the import sheet's tempo line for a file whose
 * printed mark is a half note (cut time, "half note = 60", playing 120 quarter notes a minute, MuseScore's
 * export shape), for a file whose mark is printed only as text ("= 60" in cut time, its note missing: E32's
 * reading), and for the command-line converter's fixture whose tempo is 90.00009000009 (the fractional
 * policy), at 342 × 740, with the text each showed and the field's value. Run once with the X3c override on
 * port 4353 and moved to docs/prompts/runs/X3c/ afterwards. Files are made in memory: no fixture is added.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', '..', 'docs', 'prompts', 'pictures', 'x3c');
const STAMPED = path.join(HERE, '..', 'fixtures', 'imports', 'stamped-by-the-converter.musicxml');
const W = 342;
const H = 740;

test.use({ viewport: { width: W, height: H } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

/** Four bars of cut time on a piano's two staves, with `direction` at the start of the first bar. */
function cutTime(title: string, direction: string): string {
  const note = (step: string, octave: number, staff: 1 | 2): string =>
    `<note><pitch><step>${step}</step><octave>${String(octave)}</octave></pitch><duration>2</duration><voice>${staff === 1 ? '1' : '5'}</voice><type>half</type><staff>${String(staff)}</staff></note>`;
  const attributes =
    '<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time symbol="cut"><beats>2</beats><beat-type>2</beat-type></time><staves>2</staves>' +
    '<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>';
  const steps = ['C', 'D', 'E', 'F', 'G', 'F', 'E', 'D'];
  const bar = (n: number): string =>
    `<measure number="${String(n)}">${n === 1 ? attributes + direction : ''}` +
    `${note(steps[(n - 1) * 2] ?? 'C', 5, 1)}${note(steps[(n - 1) * 2 + 1] ?? 'C', 5, 1)}<backup><duration>4</duration></backup>${note('C', 3, 2)}${note('G', 2, 2)}</measure>`;
  return (
    `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>${title}</work-title></work>` +
    `<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${bar(1)}${bar(2)}${bar(3)}${bar(4)}</part></score-partwise>`
  );
}

const HALF_MARK = cutTime(
  'Half note mark',
  '<direction placement="above"><direction-type><metronome parentheses="no"><beat-unit>half</beat-unit><per-minute>60</per-minute></metronome></direction-type><staff>1</staff><sound tempo="120"/></direction>',
);
const TEXT_MARK = cutTime('Text mark', '<direction placement="above"><direction-type><words font-family="MuseJazz Text">= 60</words></direction-type><staff>1</staff></direction>');

async function shot(page: Page, what: string): Promise<void> {
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${what}-${String(W)}x${String(H)}.png`) });
}

/**
 * Imports one file on the Library and opens its import sheet: by itself where the app guessed something
 * (the converter's stamp), else from the row's *Assign*, as a learner does after a plain Library import.
 */
async function importFile(page: Page, name: string, title: string, xml: string, opensItself: boolean): Promise<void> {
  await page.goto('/#/library');
  await page.locator('#library-file').setInputFiles({ name, mimeType: 'application/vnd.recordare.musicxml+xml', buffer: Buffer.from(xml, 'utf8') });
  await expect(page.locator('#library-status')).toContainText('Imported 1:');
  const sheet = page.locator('#assign-sheet[data-sheet="import"]');
  if (!opensItself) await page.locator('.list-row', { hasText: title }).getByRole('button', { name: 'Assign' }).click();
  await expect(sheet).toBeVisible({ timeout: 30_000 });
  await expect(sheet.locator('#assign-demands')).toContainText('Measured');
  await sheet.locator('#import-guessed').evaluate((node) => {
    node.scrollIntoView({ block: 'start' });
  });
}

/** What the tempo line and its control show, and whether the line fits the width. */
async function tempoLine(page: Page): Promise<Record<string, unknown>> {
  const sheet = page.locator('#assign-sheet[data-sheet="import"]');
  return {
    line: await sheet.locator('#import-tempo').innerText(),
    field: await sheet.locator('#import-tempo-bpm').inputValue(),
    fits: await sheet.locator('#import-tempo').evaluate((node) => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, right: node.getBoundingClientRect().right, viewport: window.innerWidth })),
  };
}

test('the file’s own tempo line: a half-note mark, a text mark, a fractional tempo', async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(OUT, { recursive: true });
  const texts: Record<string, unknown> = {};

  await importFile(page, 'half-note-mark.musicxml', 'Half note mark', HALF_MARK, false);
  texts.halfNoteMark = await tempoLine(page);
  await shot(page, 'sheet-tempo-half-note-mark');

  await importFile(page, 'text-mark.musicxml', 'Text mark', TEXT_MARK, false);
  texts.textMark = await tempoLine(page);
  await shot(page, 'sheet-tempo-text-mark');

  await importFile(page, 'stamped-by-the-converter.musicxml', '', readFileSync(STAMPED, 'utf8'), true);
  texts.fractional = await tempoLine(page);
  await shot(page, 'sheet-tempo-fractional');

  writeFileSync(path.join(OUT, 'x3c-pictures.json'), `${JSON.stringify(texts, null, 2)}\n`);
});
