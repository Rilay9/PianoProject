/**
 * X3d's corpus probe (not a test of the suite; run from app/tests/unit/ as x3dCorpusReader.test.ts after the
 * change, then moved to docs/prompts/runs/X3d/ as scripts-corpus-reader.test.ts). For every score the
 * bundled catalogue names, the reader alone (`tempoFromXml`, no engraver): the tempo the file opens at, the
 * number of tempo events, and the catalogue's `tempoBpm` — the content build's own reading (music21's
 * quarter-note tempo of the first mark, `tools/content/convert.py`), an independent implementation. Writes a
 * summary and every score where the two differ to the file `X3D_CORPUS_OUT` names. Asserts nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'vitest';
import { toMusicXml } from '../../src/score/mxl';
import { openingTempoEvent, tempoEvents } from '../../src/score/tempoFromXml';

const CONTENT = join(process.cwd(), 'public', 'content');

it('reads every bundled score’s tempo', { timeout: 600_000 }, () => {
  // The catalogue is a list of items (its first run here assumed an `items` field and failed on it).
  const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as { id: string; file?: string; tempoBpm?: number | null }[];
  const rows: string[] = [];
  let read = 0;
  let opensWithTempo = 0;
  let agree = 0;
  let noCatalogueTempo = 0;
  const differ: string[] = [];
  const failed: string[] = [];
  const carried: string[] = [];
  for (const item of catalog) {
    if (!item.file || !/\.(mxl|musicxml|xml)$/.test(item.file)) continue;
    let xml: string;
    try {
      xml = toMusicXml(new Uint8Array(readFileSync(join(CONTENT, item.file))));
    } catch (cause) {
      failed.push(`${item.id}: ${String(cause).slice(0, 80)}`);
      continue;
    }
    read += 1;
    const opening = openingTempoEvent(xml);
    const all = tempoEvents(xml);
    const events = all.length;
    if (opening) opensWithTempo += 1;
    // An opening the reader carried from a later place (the module note's two shapes): the same event twice.
    const twin = all[1];
    if (opening && twin && twin.bpm === opening.bpm && twin.mark === opening.mark && (twin.measure > 0 || twin.offset > 0)) {
      const upbeat = /<measure\b[^>]*\bimplicit="yes"/.test(/<measure\b[^>]*>/.exec(xml)?.[0] ?? '') && twin.measure === 1 && twin.offset === 0;
      carried.push(`${item.id}\t${upbeat ? 'pickup' : 'nothing sounds before it'}\tfrom measure ${String(twin.measure + 1)} (ordinal), ${String(twin.offset)} quarters in\t${String(Math.round(opening.bpm * 1000) / 1000)}`);
    }
    const catalogue = item.tempoBpm ?? null;
    if (catalogue === null) noCatalogueTempo += 1;
    else if (opening && Math.abs(opening.bpm - catalogue) < 0.01) agree += 1;
    else differ.push(`${item.id}\topens ${opening ? String(Math.round(opening.bpm * 1000) / 1000) : 'at the default (none at the opening)'}\tevents ${String(events)}\tcatalogue ${String(catalogue)}${opening?.mark ? `\tmark ${opening.mark.beatUnit}${'.'.repeat(opening.mark.dots)} = ${String(opening.mark.perMinute)}` : ''}`);
  }
  rows.push(`scores read: ${String(read)}; opening with a tempo the file states: ${String(opensWithTempo)}`);
  rows.push(`the reader's opening tempo equals the catalogue's tempoBpm (to a hundredth): ${String(agree)}; the catalogue has none: ${String(noCatalogueTempo)}; differ: ${String(differ.length)}; unreadable: ${String(failed.length)}`);
  rows.push(`openings carried from a later place: ${String(carried.length)}`);
  rows.push('', 'differ (id, the reader, events, the catalogue, the mark at the opening):', ...differ, '', 'openings carried (id, the rule, from where, the tempo):', ...carried, '', 'unreadable:', ...failed);
  const out = process.env.X3D_CORPUS_OUT;
  if (out) writeFileSync(out, `${rows.join('\n')}\n`);
  console.log(rows.slice(0, 2).join('\n'));
});
