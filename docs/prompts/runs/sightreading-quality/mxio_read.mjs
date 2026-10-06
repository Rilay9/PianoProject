// The second reader (brief §3): musicxml-io 0.10.3 (npm, MIT), installed under
// <worktree>/build/sr-quality/readers, never in app/. It shares no code with the app's
// writer (`musicXmlWriter.ts`) or with partitura.
//
//   node mxio_read.mjs <readers dir> <items dir> <out.json>
//
// Per file: each measure's divisions, time and key as the reader parsed them, and every
// note with its measure-relative position (`getAllNotes`' own `position`), duration,
// staff, voice, pitch (step, alter, octave), rest, ties, time modification, and the
// counts of articulations and slurs. The checks (check_corpus.py) compare these with
// partitura's events; nothing here judges.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [readers, itemsDir, outPath] = process.argv.slice(2);
const lib = await import(pathToFileURL(join(readers, 'node_modules', 'musicxml-io', 'dist', 'index.mjs')).href);

const out = {};
for (const name of readdirSync(itemsDir).filter((n) => n.endsWith('.musicxml')).sort()) {
  const id = name.replace(/\.musicxml$/, '');
  try {
    const score = lib.parse(readFileSync(join(itemsDir, name), 'utf8'));
    const part = score.parts[0];
    let divisions = null;
    let time = null;
    let fifths = null;
    const measures = part.measures.map((m) => {
      const attrs = [m.attributes, ...m.entries.filter((e) => e.type === 'attributes').map((e) => e.attributes)].filter(Boolean);
      for (const a of attrs) {
        if (a.divisions !== undefined) divisions = a.divisions;
        const t = a.time ?? (a.times ? a.times[0] : undefined);
        if (t) time = { beats: Number(t.beats), beatType: t.beatType };
        const k = a.key ?? (a.keys ? a.keys[0] : undefined);
        if (k) fifths = k.fifths;
      }
      return { number: m.number, divisions, time, fifths };
    });
    let articulations = 0;
    let slurs = 0;
    const notes = lib.getAllNotes(score).map(({ measure, note, position }) => {
      for (const n of note.notations ?? []) {
        if (n.type === 'articulation') articulations += 1;
        if (n.type === 'slur' && n.slurType === 'start') slurs += 1;
      }
      const ties = [...(note.tie ? [note.tie] : []), ...(note.ties ?? [])].map((t) => t.type);
      return {
        m: part.measures.indexOf(measure),
        pos: position,
        dur: note.duration,
        staff: note.staff ?? 1,
        voice: note.voice ?? '1',
        chord: note.chord === true,
        rest: note.rest !== undefined,
        step: note.pitch?.step ?? null,
        alter: note.pitch?.alter ?? 0,
        octave: note.pitch?.octave ?? null,
        tieStart: ties.includes('start'),
        tieStop: ties.includes('stop'),
        tm: note.timeModification ? [note.timeModification.actualNotes, note.timeModification.normalNotes] : null,
        type: note.noteType ?? null,
        dots: note.dots ?? 0,
      };
    });
    out[id] = { measures, notes, articulations, slurs };
  } catch (error) {
    out[id] = { error: String(error) };
  }
}
writeFileSync(outPath, JSON.stringify(out));
console.log(Object.keys(out).length);
