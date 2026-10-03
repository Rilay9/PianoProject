"""
G1c: append the browser case (the brief's item 5) to app/tests/e2e/plan.spec.ts, keeping the file's
CRLF line endings. Idempotent: the case's marker line is checked first. Run from the repository root.
"""
from pathlib import Path

SPEC = Path("app/tests/e2e/plan.spec.ts")
MARKER = "test.describe('Plan: a project stage counts nothing (G1c)'"

CASE = r"""
/**
 * Plan reads a project stage as the lesson page does (G1c; G83, P1; L86). Stage 9 says "Nothing here
 * is a rung to pass", and its page says *A project: there is no rung to pass here.* with no count;
 * Plan counted its units in the stage line (*1 of 3 lessons*), filled a bar with them and badged a
 * row the evidence met *complete*. Here the evidence meets a Stage 9 rung (its two runs, judged by
 * it) and a Stage 8 one: Stage 9's line is the page's sentence, with no count, bar or badge, and
 * Stage 8's block reads as it always did — its count, its bar, its *complete*.
 */
test.describe('Plan: a project stage counts nothing (G1c)', () => {
  test.use({ viewport: { width: 342, height: 740 } });

  /** The lesson rows a stage draws under its head, with their badges, in order. */
  async function blockOf(page: import('@playwright/test').Page, stage: number): Promise<{ lesson: string; badges: string[] }[]> {
    return page.evaluate((n) => {
      const rows: { lesson: string; badges: string[] }[] = [];
      const head = document.querySelector(`#plan-list .list-row[data-stage="${String(n)}"]`);
      for (let node = head?.nextElementSibling; node && !node.hasAttribute('data-stage'); node = node.nextElementSibling) {
        if (node.matches('.list-row[data-lesson]')) {
          rows.push({
            lesson: node.getAttribute('data-lesson') ?? '',
            badges: [...node.querySelectorAll('.badge')].map((badge) => badge.textContent?.trim() ?? ''),
          });
        }
      }
      return rows;
    }, stage);
  }

  test('Stage 9 with a rung the evidence met: no count, bar or badge; Stage 8 as before', async ({ page }) => {
    await page.goto('/#/plan');
    await expect(page.locator('.list-row[data-stage="9"]')).toBeVisible();
    // A clean Keep tempo run of each option named, judged by its rung: classical.9's exercise and
    // song (both its requirements), technique.8's exercise (its one). Read from the built curriculum,
    // so the case follows the options wherever the curriculum moves them.
    await page.evaluate(async () => {
      type Rung = { id: string; exerciseOptions: string[]; songOptions: string[] };
      const curriculum = (await (await fetch('content/curriculum.json')).json()) as { stages: { units: { lessons: Rung[] }[] }[] };
      const rungs = new Map(curriculum.stages.flatMap((s) => s.units.flatMap((u) => u.lessons)).map((l) => [l.id, l]));
      const first = (rung: string, from: 'exercises' | 'songs'): string => {
        const found = rungs.get(rung);
        const id = (from === 'songs' ? found?.songOptions : found?.exerciseOptions)?.[0];
        if (id === undefined) throw new Error(`${rung} lists no ${from}`);
        return id;
      };
      const at = new Date().toISOString();
      const runs = ([['classical.9', 'exercises'], ['classical.9', 'songs'], ['technique.8', 'exercises']] as const).map(([rung, from]) => ({
        itemId: first(rung, from),
        lessonId: rung,
        mode: 'tempo',
        tempoPct: 100,
        tempoMeasured: true,
        accuracy: 1,
        accuracyEstimated: false,
        wrongNotes: 0,
        missed: 0,
        durationMs: 60_000,
        at,
      }));
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('pianopath');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(String(request.error)));
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('sessions', 'readwrite');
        for (const run of runs) tx.objectStore('sessions').put(run);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(new Error(String(tx.error)));
      });
      db.close();
    });
    await page.reload();

    const eight = page.locator('.list-row[data-stage="8"]');
    const nine = page.locator('.list-row[data-stage="9"]');
    // Stage 8 as it always read: the rung met counted, the bar filled by it.
    await expect(eight.locator('.list-row__metatext')).toHaveText(/^1 of \d+ lessons( · |$)/);
    await expect(eight.locator('.plan-stage-bar__fill')).toHaveCount(1);
    // Stage 9: what the stage is, in its page's words; nothing counted, drawn or badged.
    await expect(nine.locator('.list-row__metatext')).toHaveText('A project: there is no rung to pass here.');
    await expect(nine.locator('.plan-stage-bar')).toHaveCount(0);
    await expect(nine.locator('.badge')).toHaveCount(0);

    await eight.click();
    await nine.click();
    await expect(page.locator('.list-row[data-lesson="classical.9"]')).toBeVisible();
    const eightRows = await blockOf(page, 8);
    expect(eightRows.find((row) => row.lesson === 'technique.8')?.badges).toEqual(['complete']);
    const nineRows = await blockOf(page, 9);
    expect(nineRows.map((row) => row.lesson)).toContain('classical.9');
    expect(nineRows.filter((row) => row.badges.length > 0), 'a Stage 9 row wears a rung’s word').toEqual([]);
    const said = (await page.locator('#plan-list').textContent()) ?? '';
    expect(said).toContain('A project: there is no rung to pass here.');
  });
});
"""

text = SPEC.read_bytes().decode("utf-8")
if MARKER in text:
    print("already appended")
else:
    body = CASE.replace("\r\n", "\n").replace("\n", "\r\n")
    SPEC.write_bytes((text + body).encode("utf-8"))
    print("appended")
