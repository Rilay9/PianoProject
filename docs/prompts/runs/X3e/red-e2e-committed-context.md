# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: import-experience.spec.ts >> a timewise file, as the door accepts it (X3e) >> the half-note file in the timewise form: the sheet says 120 quarter notes a minute and four bars, and the Score screen opens it at 120
- Location: tests\e2e\import-experience.spec.ts:353:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#assign-sheet[data-sheet="import"]').locator('#import-tempo')
Expected substring: "from the file — The file says 𝅗𝅥 = 60 (120 quarter notes a minute)."
Received string:    "Tempo · the app’s guess — The file states no tempo, so the app chose ♩ = 100."
Timeout: 5000ms

Call log:
  - Expect "soft toContainText" locator('#assign-sheet[data-sheet="import"]').locator('#import-tempo') with timeout 5000ms
  - waiting for locator('#assign-sheet[data-sheet="import"]').locator('#import-tempo')
    14 × locator resolved to <p id="import-tempo" data-whose="guess">…</p>
       - unexpected value "Tempo · the app’s guess — The file states no tempo, so the app chose ♩ = 100."

```

```yaml
- paragraph:
  - strong: Tempo
  - text: · the app’s guess — The file states no tempo, so the app chose ♩ = 100.
```

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  locator('#assign-sheet[data-sheet="import"]').locator('#import-tempo-bpm')
Expected: "120"
Received: "100"
Timeout:  5000ms

Call log:
  - Expect "soft toHaveValue" locator('#assign-sheet[data-sheet="import"]').locator('#import-tempo-bpm') with timeout 5000ms
  - waiting for locator('#assign-sheet[data-sheet="import"]').locator('#import-tempo-bpm')
    14 × locator resolved to <input step="1" type="number" inputmode="numeric" id="import-tempo-bpm"/>
       - unexpected value "100"

```

```yaml
- spinbutton "♩ =": "100"
```

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#assign-sheet[data-sheet="import"]').locator('#import-read')
Expected substring: "4 bars"
Received string:    "What the app readLength1 barKey signatureno sharps or flats"
Timeout: 5000ms

Call log:
  - Expect "soft toContainText" locator('#assign-sheet[data-sheet="import"]').locator('#import-read') with timeout 5000ms
  - waiting for locator('#assign-sheet[data-sheet="import"]').locator('#import-read')
    14 × locator resolved to <section class="block" id="import-read">…</section>
       - unexpected value "What the app readLength1 barKey signatureno sharps or flats"

```

```yaml
- heading "What the app read" [level=3]
- term: Length
- definition: 1 bar
- term: Key signature
- definition: no sharps or flats
```

```
Error: expect(received).not.toContain(expected) // indexOf

Expected substring: not "Could not open"
Received string:        "Could not open this score: OpenSheetMusicDisplay: Document is not a valid 'partwise' MusicXML"
```

# Test source

```ts
  271 |     '<direction placement="above"><direction-type><metronome parentheses="no"><beat-unit>half</beat-unit><per-minute>60</per-minute></metronome></direction-type><staff>1</staff><sound tempo="120"/></direction>';
  272 |   const steps = ['C', 'D', 'E', 'F', 'G', 'F', 'E', 'D'];
  273 |   const bar = (n: number): string =>
  274 |     `<measure number="${String(n)}">${n === 1 ? attributes + mark : ''}` +
  275 |     `${note(steps[(n - 1) * 2] ?? 'C', 5, 1)}${note(steps[(n - 1) * 2 + 1] ?? 'C', 5, 1)}<backup><duration>4</duration></backup>${note('C', 3, 2)}${note('G', 2, 2)}</measure>`;
  276 |   return (
  277 |     `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>${title}</work-title></work>` +
  278 |     `<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${bar(1)}${bar(2)}${bar(3)}${bar(4)}</part></score-partwise>`
  279 |   );
  280 | }
  281 | 
  282 | /** Imports one MusicXML file on the Library and opens its sheet from the row's Assign (a plain import opens none). */
  283 | async function importMarked(page: Page, title: string, xml: string): Promise<void> {
  284 |   await page.goto('/#/library');
  285 |   await page.locator('#library-file').setInputFiles({ name: `${title}.musicxml`, mimeType: 'application/vnd.recordare.musicxml+xml', buffer: Buffer.from(xml, 'utf8') });
  286 |   await expect(page.locator('#library-status')).toContainText('Imported 1:');
  287 |   await page.locator('.list-row', { hasText: title }).getByRole('button', { name: 'Assign' }).click();
  288 |   await expect(page.locator('#assign-sheet[data-sheet="import"]')).toBeVisible({ timeout: 30_000 });
  289 | }
  290 | 
  291 | /** Opens the piece from its Library row and waits for the engraving, the tempo at 100 %. */
  292 | async function openAtFullTempo(page: Page, title: string): Promise<void> {
  293 |   await page.locator('.list-row', { hasText: title }).click();
  294 |   await expect(page).toHaveURL(/#\/score\//);
  295 |   await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 30_000 });
  296 |   await setTempoPercent(page, 100);
  297 | }
  298 | 
  299 | test.describe('the tempo a marked file states, played (X3d)', () => {
  300 |   test('a half-note mark of 60 with a playback tempo of 120: the sheet says 120 quarter notes a minute, and the Score screen and its clock run at 120', async ({ page }) => {
  301 |     test.setTimeout(120_000);
  302 |     const title = 'Half note mark';
  303 |     await importMarked(page, title, halfNoteMarked(title));
  304 |     const sheet = page.locator('#assign-sheet[data-sheet="import"]');
  305 |     await expect(sheet.locator('#import-tempo')).toContainText('(120 quarter notes a minute)');
  306 |     await expect(sheet.locator('#import-tempo-bpm')).toHaveValue('120');
  307 |     await page.getByRole('button', { name: 'Not now' }).click();
  308 |     await expect(sheet).toBeHidden();
  309 | 
  310 |     // The Score screen's label and its bpm field at 100 %: the map's tempo at the cursor.
  311 |     await openAtFullTempo(page, title);
  312 |     await expect(page.locator('#score-tempo-label')).toHaveText(/\b120 bpm$/);
  313 |     await expect(page.locator('#score-bpm')).toHaveValue('120');
  314 | 
  315 |     // The clock: the same file's model in the dev harness — its tempo, and the length the map gives its
  316 |     // four bars of cut time (sixteen quarters) at 100 %, computed, not timed.
  317 |     await openDevScore(page);
  318 |     await page.evaluate(async (source) => {
  319 |       await window.__pianopathDevScore?.loadMusicXml(source, 'half-note-mark');
  320 |     }, halfNoteMarked(title));
  321 |     expect(await page.evaluate(() => window.__pianopathDevScore?.lastError())).toBeFalsy();
  322 |     const summary = await page.evaluate(() => window.__pianopathDevScore?.modelSummary());
  323 |     expect({ tempoBpm: summary?.tempoBpm, durationSec: summary?.durationSec }).toEqual({ tempoBpm: 120, durationSec: (16 * 60) / 120 });
  324 |   });
  325 | 
  326 |   test('the learner states 100 on the half-note-marked file: the line and the Score screen say 100', async ({ page }) => {
  327 |     test.setTimeout(120_000);
  328 |     const title = 'Half note stated';
  329 |     await importMarked(page, title, halfNoteMarked(title));
  330 |     const sheet = page.locator('#assign-sheet[data-sheet="import"]');
  331 |     await sheet.locator('#import-tempo-bpm').fill('100');
  332 |     await sheet.locator('#import-tempo-use').click();
  333 |     await expect(sheet.locator('#import-tempo')).toContainText('You stated ♩ = 100.');
  334 |     await page.getByRole('button', { name: 'Not now' }).click();
  335 |     await expect(sheet).toBeHidden();
  336 | 
  337 |     // E48 wrote 100 into the score's opening <sound tempo> and the half note at 50; the Score screen reads
  338 |     // the sound, so at 100 % it says 100 — not the 50 the committed map took from the mark.
  339 |     await openAtFullTempo(page, title);
  340 |     await expect(page.locator('#score-tempo-label')).toHaveText(/\b100 bpm$/);
  341 |     await expect(page.locator('#score-bpm')).toHaveValue('100');
  342 |   });
  343 | });
  344 | 
  345 | /** A one-part partwise file in MusicXML's timewise form: the same measures, each holding the part (X3e). */
  346 | function timewise(partwise: string): string {
  347 |   const [, head = '', part = '', inner = ''] = /^([\s\S]*?)<part (id="[^"]*")>([\s\S]*)<\/part><\/score-partwise>$/.exec(partwise) ?? [];
  348 |   const measures = [...inner.matchAll(/<measure( [^>]*)>([\s\S]*?)<\/measure>/g)].map(([, attributes = '', content = '']) => `<measure${attributes}><part ${part}>${content}</part></measure>`);
  349 |   return `${head.replace('<score-partwise', '<score-timewise')}${measures.join('')}</score-timewise>`;
  350 | }
  351 | 
  352 | test.describe('a timewise file, as the door accepts it (X3e)', () => {
  353 |   test('the half-note file in the timewise form: the sheet says 120 quarter notes a minute and four bars, and the Score screen opens it at 120', async ({ page }) => {
  354 |     test.setTimeout(120_000);
  355 |     const title = 'Half note timewise';
  356 |     const xml = timewise(halfNoteMarked(title));
  357 |     expect(xml).toContain('<score-timewise version="4.0">');
  358 |     await importMarked(page, title, xml);
  359 |     const sheet = page.locator('#assign-sheet[data-sheet="import"]');
  360 |     await expect.soft(sheet.locator('#import-tempo')).toContainText('from the file — The file says \u{1D15E} = 60 (120 quarter notes a minute).');
  361 |     await expect.soft(sheet.locator('#import-tempo-bpm')).toHaveValue('120');
  362 |     await expect.soft(sheet.locator('#import-read')).toContainText('4 bars');
  363 |     await page.getByRole('button', { name: 'Not now' }).click();
  364 |     await expect(sheet).toBeHidden();
  365 | 
  366 |     // The Score screen, settled one way or the other: the engraving drawn, or its sentence that it could not open the score.
  367 |     await page.locator('.list-row', { hasText: title }).click();
  368 |     await expect(page).toHaveURL(/#\/score\//);
  369 |     const drawn = page.locator('#score-stage .is-front svg').first();
  370 |     await expect(drawn.or(page.locator('#score-status', { hasText: 'Could not open' })).first()).toBeVisible({ timeout: 30_000 });
> 371 |     expect(await page.locator('#score-status').textContent()).not.toContain('Could not open');
      |                                                                   ^ Error: expect(received).not.toContain(expected) // indexOf
  372 |     await setTempoPercent(page, 100);
  373 |     await expect(page.locator('#score-tempo-label')).toHaveText(/\b120 bpm$/);
  374 |     await expect(page.locator('#score-bpm')).toHaveValue('120');
  375 |   });
  376 | });
  377 | 
```