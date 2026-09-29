/**
 * X3d's product look (Entry 133), not a test of the suite: the Score screen at 342 × 740 on *Row, Row, Row
 * Your Boat* (dotted quarter = 54, `<sound tempo="81">`) and on an imported half-note file (cut time, half
 * note = 60, `<sound tempo="120">`, made in memory), each at 100 % so the label says the written tempo, with
 * the label's text, the bpm field and the sheet's tempo line recorded beside each picture. Run once on the
 * committed code's build (`X3D_PHASE=before`) and once after the change (`X3D_PHASE=after`), with the X3d
 * override on port 4363, then moved to docs/prompts/runs/X3d/ as scripts-x3d-pictures.spec.ts.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTempoPercent } from './scoreControls';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', '..', 'docs', 'prompts', 'pictures', 'x3d');
const PHASE = process.env.X3D_PHASE ?? 'after';
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

async function shot(page: Page, what: string): Promise<Record<string, string>> {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `${what}-${PHASE}-${String(W)}x${String(H)}.png`) });
  return {
    label: (await page.locator('#score-tempo-label').textContent()) ?? '',
    bpmField: await page.locator('#score-bpm').inputValue(),
  };
}

test('the Score screen’s tempo on Row, Row, Row Your Boat and on an imported half-note file', async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(OUT, { recursive: true });
  const record = path.join(OUT, 'x3d-pictures.json');
  const texts: Record<string, unknown> = existsSync(record) ? (JSON.parse(readFileSync(record, 'utf8')) as Record<string, unknown>) : {};

  await page.goto('/#/score/song.folk.row-row-row-your-boat');
  await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
  await setTempoPercent(page, 100);
  texts[`rowYourBoat-${PHASE}`] = await shot(page, 'score-row-row-row-your-boat');

  const title = 'Half note mark';
  await page.goto('/#/library');
  await page.locator('#library-file').setInputFiles({ name: 'half-note-mark.musicxml', mimeType: 'application/vnd.recordare.musicxml+xml', buffer: Buffer.from(halfNoteMarked(title), 'utf8') });
  await expect(page.locator('#library-status')).toContainText('Imported 1:');
  await page.locator('.list-row', { hasText: title }).getByRole('button', { name: 'Assign' }).click();
  const sheet = page.locator('#assign-sheet[data-sheet="import"]');
  await expect(sheet).toBeVisible({ timeout: 30_000 });
  const sheetLine = await sheet.locator('#import-tempo').innerText();
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(sheet).toBeHidden();
  await page.locator('.list-row', { hasText: title }).click();
  await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
  await setTempoPercent(page, 100);
  texts[`halfNoteImport-${PHASE}`] = { ...(await shot(page, 'score-half-note-import')), sheetLine };

  writeFileSync(record, `${JSON.stringify(texts, null, 2)}\n`);
});
