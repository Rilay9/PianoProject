// @vitest-environment node
// F3a probe, not for the commit: the tempo map the app places from each file ragtime.7 compares,
// read through the app's one reader (`tempoFromXml.tempoEvents`), and the opening tempo.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'vitest';
import { mxlToMusicXml } from '../../src/score/mxl';
import { openingTempo, tempoEvents } from '../../src/score/tempoFromXml';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as { id: string; file?: string; tempoBpm?: number }[];

it('prints the tempo events of the rows F3a names', () => {
  const out: string[] = [];
  for (const id of [
    'song.ragtime.joplin-maple-leaf-rag',
    'song.ragtime.joplin-sugar-cane',
    'song.folk.the-water-is-wide.pdmx',
    'song.ragtime.joplin-easy-winners',
    'song.ragtime.joplin-peacherine-rag',
    'song.ragtime.joplin-entertainer',
  ]) {
    const row = catalog.find((r) => r.id === id);
    if (!row?.file) {
      out.push(`${id}: no row or file`);
      continue;
    }
    const xml = mxlToMusicXml(new Uint8Array(readFileSync(join(CONTENT, row.file))));
    out.push(`${id}: catalog tempoBpm=${String(row.tempoBpm)} opening=${String(openingTempo(xml))}`);
    for (const e of tempoEvents(xml)) out.push(`  ${JSON.stringify(e)}`);
  }
  writeFileSync(join(process.cwd(), '..', 'build', 'f3a', 'tempo-probe.txt'), out.join('\n') + '\n');
});
