/**
 * X31a's corpus probe on the app's side (X31's, env names changed; not a test of the suite; run from app/tests/unit/ as
 * x31aCorpusApp.test.ts, then removed and kept here as scripts-corpus-app.test.ts). For every score the built
 * catalogue names (the directory `X31A_CONTENT` names), the app's one tempo reader (`tempoFromXml`, X3d): the
 * tempo the file opens at (`openingTempo`; the model's map opens at `DEFAULT_BPM` = 100 where it is undefined),
 * the opening event's source and mark, and the file's first event anywhere. One JSON line per score to the file
 * `X31A_OUT` names. Asserts nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'vitest';
import { toMusicXml } from '../../src/score/mxl';
import { openingTempoEvent, tempoEvents, writesTempo } from '../../src/score/tempoFromXml';

it('reads every bundled score’s opening tempo', { timeout: 600_000 }, () => {
  const content = process.env.X31A_CONTENT ?? join(process.cwd(), 'public', 'content');
  const catalog = JSON.parse(readFileSync(join(content, 'catalog.json'), 'utf8')) as { id: string; file?: string }[];
  const lines: string[] = [];
  for (const item of catalog) {
    if (!item.file || !/\.(mxl|musicxml|xml)$/i.test(item.file)) continue;
    let xml: string;
    try {
      xml = toMusicXml(new Uint8Array(readFileSync(join(content, item.file))));
    } catch (cause) {
      lines.push(JSON.stringify({ id: item.id, error: String(cause).slice(0, 120) }));
      continue;
    }
    const opening = openingTempoEvent(xml);
    const events = tempoEvents(xml);
    const first = events[0];
    lines.push(
      JSON.stringify({
        id: item.id,
        opening: opening ? opening.bpm : null,
        from: opening?.from ?? null,
        mark: opening?.mark ?? null,
        events: events.length,
        first: first ? { measure: first.measure, offset: first.offset, bpm: first.bpm, from: first.from, mark: first.mark ?? null } : null,
        writes: writesTempo(xml),
      }),
    );
  }
  const out = process.env.X31A_OUT;
  if (out) writeFileSync(out, `${lines.join('\n')}\n`);
  console.log(`scores read: ${String(lines.length)}`);
});
