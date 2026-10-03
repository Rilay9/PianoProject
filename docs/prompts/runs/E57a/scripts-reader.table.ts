/**
 * E57a: E57's scripts-reader.table.ts, copied unchanged but for this line (its environment variables keep E57's names).
 *
 * E57's reader dump (run artifact generator, not a test; X42's census, extended): built scores read through the
 * app's own unzip (`toMusicXml`) and reader (`tempoEvents`), one JSON line per row, so the same dump of the build
 * before the fix and of the build after it gives two files whose diff is every tempo position the fix moves, read
 * the way the app reads it. Nothing here resolves a tempo itself.
 *
 * PIANOPATH_E57_CONTENT names a built content folder (every row of its catalog.json with a file is read), or
 * PIANOPATH_E57_FILES a JSON list of [id, absolute path] pairs (single converted files, for the mutants);
 * PIANOPATH_E57_OUT the JSONL to write.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { toMusicXml } from '../../../../app/src/score/mxl';
import { tempoEvents } from '../../../../app/src/score/tempoFromXml';

interface Row {
  id: string;
  file?: string;
  tags?: string[];
}

const SOURCES = ['musetrainer', 'kern', 'pdmx', 'generated', 'mutopia', 'openscore', 'excerpt'];

function line(id: string, source: string, path: string): string {
  const xml = toMusicXml(new Uint8Array(readFileSync(path)));
  const events = tempoEvents(xml).map((e) => ({ at: `${String(e.measure)}:${String(e.offset)}`, bpm: e.bpm, from: e.from, mark: e.mark?.quarters ?? null }));
  return JSON.stringify({ id, source, events });
}

it('reads the built scores through the app reader', () => {
  const content = process.env.PIANOPATH_E57_CONTENT ?? '';
  const files = process.env.PIANOPATH_E57_FILES ?? '';
  const out = process.env.PIANOPATH_E57_OUT ?? '';
  const lines: string[] = [];
  if (files) {
    for (const [id, path] of JSON.parse(files) as [string, string][]) lines.push(line(id, 'file', path));
  } else {
    expect(existsSync(join(content, 'catalog.json'))).toBe(true);
    const raw = JSON.parse(readFileSync(join(content, 'catalog.json'), 'utf8')) as Row[] | { items: Row[] };
    const items = Array.isArray(raw) ? raw : raw.items;
    for (const item of items) {
      if (!item.file) continue;
      const tags = item.tags ?? [];
      const source = SOURCES.find((tag) => tags.includes(tag)) ?? (item.id.includes('.excerpt') ? 'excerpt' : 'other');
      lines.push(line(item.id, source, join(content, item.file)));
    }
  }
  writeFileSync(out, lines.join('\n') + '\n');
  expect(lines.length).toBeGreaterThan(0);
});
