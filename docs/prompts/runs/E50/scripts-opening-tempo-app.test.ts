/**
 * E50's product-layer probe on the app's side (X31a's `scripts-corpus-app.test.ts` pattern; not a test of the suite;
 * run from app/tests/unit/ as e50OpeningTempo.test.ts, then removed and kept here). For the seven repaired parents and
 * the Wabash cut, in each build folder `E50_BEFORE` and `E50_AFTER` name, the app's one tempo reader (`tempoFromXml`,
 * behind the label, the player and the count-in): the tempo the file opens at, its source and mark, and how many
 * tempo events it has. One JSON line per item and build to the file `E50_OUT` names. Asserts nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'vitest';
import { toMusicXml } from '../../src/score/mxl';
import { openingTempoEvent, tempoEvents } from '../../src/score/tempoFromXml';

const EIGHT = [
  'song.pop.margie.pdmx',
  'song.jazz.django-reinhardt-limehouse-blues.pdmx',
  'song.blues.singin-the-blues',
  'song.blues.weary-blues',
  'song.blues.storyville-blues',
  'song.blues.wabash-blues',
  'song.blues.tishomingo-blues',
  'excerpt.blues.wabash-blues.b1-4',
];

it('reads the eight opening tempos before and after', () => {
  const lines: string[] = [];
  for (const [label, content] of [['before', process.env.E50_BEFORE], ['after', process.env.E50_AFTER]] as const) {
    if (!content) continue;
    const catalog = JSON.parse(readFileSync(join(content, 'catalog.json'), 'utf8')) as { id: string; file?: string; tempoBpm?: number; tags?: string[] }[];
    for (const id of EIGHT) {
      const item = catalog.find((one) => one.id === id);
      if (!item?.file) continue;
      const xml = toMusicXml(new Uint8Array(readFileSync(join(content, item.file))));
      const opening = openingTempoEvent(xml);
      lines.push(
        JSON.stringify({
          build: label,
          id,
          opening: opening ? opening.bpm : null,
          from: opening?.from ?? null,
          mark: opening?.mark ?? null,
          events: tempoEvents(xml).length,
          tempoBpm: item.tempoBpm ?? null,
          defaulted: (item.tags ?? []).includes('tempo-defaulted'),
        }),
      );
    }
  }
  const out = process.env.E50_OUT;
  if (out) writeFileSync(out, `${lines.join('\n')}\n`);
  console.log(lines.join('\n'));
});
