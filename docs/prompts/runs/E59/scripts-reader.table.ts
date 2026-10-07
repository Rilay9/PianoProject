/**
 * E59's reader dump (E57's, its names moved; a run artifact generator, not a test): built scores read through the app's
 * own unzip (`toMusicXml`) and reader (`tempoEvents`), one JSON line per row — each event's position, its bpm, where the
 * bpm came from (`sound` or `mark`) and the printed mark's quarters where one stands — so a dump of the build before the
 * fix and one after it give every tempo position, and every printed mark, the fix moves, read the way the app reads it.
 * Nothing here resolves a tempo itself.
 *
 * PIANOPATH_E59_CONTENT names a built content folder (every row of its catalog.json with a file is read), or
 * PIANOPATH_E59_FILES a JSON list of [id, absolute path] pairs (single converted files, for the mutants);
 * PIANOPATH_E59_OUT the JSONL to write.
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
  const content = process.env.PIANOPATH_E59_CONTENT ?? '';
  const files = process.env.PIANOPATH_E59_FILES ?? '';
  const out = process.env.PIANOPATH_E59_OUT ?? '';
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
