/**
 * X3e's pictures (run from app/tests/e2e/ as x3e-pictures.spec.ts through playwright.x3e-4383.config.ts,
 * then removed): the half-note file of import-experience.spec.ts in the timewise form, imported through the
 * Library at 342 x 740 — the import sheet, then the Score screen at 100 % — so the screen a learner meets is
 * looked at, not only asserted. Writes the PNGs and the texts read off them beside this script.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { setTempoPercent } from './scoreControls';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'prompts', 'runs', 'X3e', 'pictures');

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

function timewise(partwise: string): string {
  const [, head = '', part = '', inner = ''] = /^([\s\S]*?)<part (id="[^"]*")>([\s\S]*)<\/part><\/score-partwise>$/.exec(partwise) ?? [];
  const measures = [...inner.matchAll(/<measure( [^>]*)>([\s\S]*?)<\/measure>/g)].map(([, attributes = '', content = '']) => `<measure${attributes}><part ${part}>${content}</part></measure>`);
  return `${head.replace('<score-partwise', '<score-timewise')}${measures.join('')}</score-timewise>`;
}

test.use({ viewport: { width: 342, height: 740 } });

test('the timewise half-note file: its import sheet and its Score screen at 342 x 740', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
  const title = 'Half note timewise';
  await page.goto('/#/library');
  await page.locator('#library-file').setInputFiles({ name: `${title}.musicxml`, mimeType: 'application/vnd.recordare.musicxml+xml', buffer: Buffer.from(timewise(halfNoteMarked(title)), 'utf8') });
  await expect(page.locator('#library-status')).toContainText('Imported 1:');
  await page.locator('.list-row', { hasText: title }).getByRole('button', { name: 'Assign' }).click();
  const sheet = page.locator('#assign-sheet[data-sheet="import"]');
  await expect(sheet).toBeVisible({ timeout: 30_000 });
  await sheet.screenshot({ path: path.join(OUT, 'import-sheet-timewise-after-342x740.png') });
  const read = { sheetTempo: await sheet.locator('#import-tempo').textContent(), sheetField: await sheet.locator('#import-tempo-bpm').inputValue(), sheetRead: await sheet.locator('#import-read').textContent() };
  await page.getByRole('button', { name: 'Not now' }).click();
  await page.locator('.list-row', { hasText: title }).click();
  await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 30_000 });
  await setTempoPercent(page, 100);
  await expect(page.locator('#score-tempo-label')).toHaveText(/bpm$/);
  await page.screenshot({ path: path.join(OUT, 'score-timewise-after-342x740.png') });
  const shown = { ...read, scoreLabel: await page.locator('#score-tempo-label').textContent(), scoreStatus: await page.locator('#score-status').textContent(), bpmField: await page.locator('#score-bpm').inputValue() };
  writeFileSync(path.join(OUT, 'x3e-pictures.json'), `${JSON.stringify(shown, null, 2)}\n`);
});
