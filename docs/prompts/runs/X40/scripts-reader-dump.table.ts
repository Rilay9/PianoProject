/**
 * X40's reader dump (run artifact generator, not a test): every built MuseTrainer and kern score read
 * through the app's own reader (`tempoEvents`, `openingTempo`) and the app's own unzip (`toMusicXml`),
 * written as JSON lines for the table's join. Nothing here resolves a tempo itself.
 *
 * PIANOPATH_X40_CONTENT names the built content folder; PIANOPATH_X40_OUT the JSONL to write.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { toMusicXml } from '../../app/src/score/mxl';
import { openingTempo, tempoEvents } from '../../app/src/score/tempoFromXml';
import { DEFAULT_BPM } from '../../app/src/score/extractScoreModel';

interface Row {
  id: string;
  file?: string;
  tags?: string[];
  tempoBpm?: number | null;
}

it('dumps the reader over every built MT and kern score', () => {
  const content = process.env.PIANOPATH_X40_CONTENT ?? '';
  const out = process.env.PIANOPATH_X40_OUT ?? '';
  expect(existsSync(join(content, 'catalog.json'))).toBe(true);
  const raw = JSON.parse(readFileSync(join(content, 'catalog.json'), 'utf8')) as Row[] | { items: Row[] };
  const items = Array.isArray(raw) ? raw : raw.items;
  const lines: string[] = [];
  for (const item of items) {
    const tags = item.tags ?? [];
    const source = tags.includes('musetrainer') ? 'MT' : tags.includes('kern') ? 'kern' : undefined;
    if (!source || !item.file) continue;
    const xml = toMusicXml(new Uint8Array(readFileSync(join(content, item.file))));
    const events = tempoEvents(xml).map((e) => ({ ...e, ...(e.mark ? { mark: { ...e.mark } } : {}) }));
    const opening = openingTempo(xml);
    lines.push(
      JSON.stringify({
        id: item.id,
        source,
        file: item.file,
        catalogueTempoBpm: item.tempoBpm ?? null,
        events,
        opening: opening ?? null,
        openingPlays: opening ?? DEFAULT_BPM,
      }),
    );
  }
  writeFileSync(out, lines.join('\n') + '\n');
  expect(lines.length).toBeGreaterThan(0);
});
