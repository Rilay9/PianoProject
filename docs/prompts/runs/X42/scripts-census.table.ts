/**
 * X42's corpus census (run artifact generator, not a test): every built score in the catalogue read through the
 * app's own unzip (`toMusicXml`) and reader (`tempoEvents`), one JSON line per row, so the same script run on the
 * committed reader and on the amended one gives two files whose diff is every position the amendment moves.
 * Nothing here resolves a tempo itself.
 *
 * PIANOPATH_X42_CONTENT names the built content folder; PIANOPATH_X42_OUT the JSONL to write.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { toMusicXml } from '../../../app/src/score/mxl';
import { tempoEvents } from '../../../app/src/score/tempoFromXml';

interface Row {
  id: string;
  file?: string;
  tags?: string[];
}

const SOURCES = ['musetrainer', 'kern', 'pdmx', 'generated', 'mutopia', 'openscore'];

it('reads every built score in the catalogue through the app reader', () => {
  const content = process.env.PIANOPATH_X42_CONTENT ?? '';
  const out = process.env.PIANOPATH_X42_OUT ?? '';
  expect(existsSync(join(content, 'catalog.json'))).toBe(true);
  const raw = JSON.parse(readFileSync(join(content, 'catalog.json'), 'utf8')) as Row[] | { items: Row[] };
  const items = Array.isArray(raw) ? raw : raw.items;
  const lines: string[] = [];
  for (const item of items) {
    if (!item.file) continue;
    const tags = item.tags ?? [];
    const source = SOURCES.find((tag) => tags.includes(tag)) ?? 'other';
    const xml = toMusicXml(new Uint8Array(readFileSync(join(content, item.file))));
    const events = tempoEvents(xml).map((e) => ({ at: `${String(e.measure)}:${String(e.offset)}`, bpm: e.bpm, from: e.from, mark: e.mark?.quarters ?? null }));
    lines.push(JSON.stringify({ id: item.id, source, mtOrKern: tags.includes('musetrainer') || tags.includes('kern'), events }));
  }
  writeFileSync(out, lines.join('\n') + '\n');
  expect(lines.length).toBeGreaterThan(0);
});
