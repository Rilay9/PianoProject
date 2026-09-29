// @vitest-environment jsdom
/**
 * X3d's table probe (not a test of the suite; run from app/tests/unit/ as x3dAdversaryTable.test.ts, once on
 * the committed code and once after the change, then moved to docs/prompts/runs/X3d/ as
 * scripts-adversary-table.test.ts). For each of the reviewer's shapes and the two bundled pieces it prints one
 * JSON line: what the model opens at, what the Score screen's label says at 100 % (`bpmAt` at the first
 * step, rounded as the label rounds it), what the engine's timetable plays between its first two steps, and
 * what the count-in clicks at — each in quarter notes a minute, each computed from the model, none timed.
 * It asserts nothing; `X3D_TABLE_OUT` names the file the lines are written to.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'vitest';
import { withOpeningTempo } from '../../src/data/importStore';
import { prepareSession } from '../../src/engine/prepareSession';
import { toMusicXml } from '../../src/score/mxl';
import { bpmAt, type ScoreModel } from '../../src/score/types';
import { installTextMeasurer } from './helpers/scoreCatalog';

const QUARTER = '<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>';
function score(bars: string[], beats = 4, beatType = 4): string {
  const quarters = (beats * 4) / beatType;
  const all = bars.length >= 3 ? bars : [...bars, ...Array<string>(3 - bars.length).fill('')];
  const measures = all.map((opening, i) => {
    const attributes =
      i === 0
        ? `<attributes><divisions>1</divisions><time><beats>${String(beats)}</beats><beat-type>${String(beatType)}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`
        : '';
    return `<measure number="${String(i + 1)}">${attributes}${opening}${QUARTER.repeat(quarters)}</measure>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${measures.join('')}</part></score-partwise>`;
}
const metronome = (unit: string, perMinute: string, dots = 0): string =>
  `<metronome><beat-unit>${unit}</beat-unit>${'<beat-unit-dot/>'.repeat(dots)}<per-minute>${perMinute}</per-minute></metronome>`;
const direction = (types: string, sound = ''): string => `<direction placement="above"><direction-type>${types}</direction-type>${sound}</direction>`;
const sound = (bpm: number | string): string => `<sound tempo="${String(bpm)}"/>`;

const HALF = score([direction(metronome('half', '60'), sound(120))], 2, 2);
const DOTTED = score([direction(metronome('quarter', '60', 1), sound(90))], 6, 8);
const BAR2 = score(['', direction(metronome('quarter', '132'), sound(132))]);
const SCORES = join(process.cwd(), 'public', 'content', 'scores');
const bundled = (file: string): string => toMusicXml(new Uint8Array(readFileSync(join(SCORES, file))));

const SHAPES: [string, string, string][] = [
  ['1', 'half = 60, <sound tempo="120"> (2/2)', HALF],
  ['1', 'half = 60, no <sound tempo> (2/2)', score([direction(metronome('half', '60'))], 2, 2)],
  ['2', 'dotted quarter = 60, <sound tempo="90"> (6/8)', DOTTED],
  ['3', '<sound tempo="100"> in bar 1, quarter = 132 only in bar 2', score([sound(100), direction(metronome('quarter', '132'), sound(132))])],
  ['4', 'E48 100 on (1)', withOpeningTempo(HALF, 100)],
  ['4', 'E48 72 on (1)', withOpeningTempo(HALF, 72)],
  ['4', 'E48 100 on (2)', withOpeningTempo(DOTTED, 100)],
  ['4', 'E48 72 on (2)', withOpeningTempo(DOTTED, 72)],
  ['4', 'E48 72 on a mark only in bar 2 (quarter = 132)', withOpeningTempo(BAR2, 72)],
  ['5', 'quarter = 60, then half = 60 in bar 2', score([direction(metronome('quarter', '60'), sound(60)), direction(metronome('half', '60'))])],
  ['5', 'quarter = 60, then quarter = 144 in bar 2', score([direction(metronome('quarter', '60'), sound(60)), direction(metronome('quarter', '144'), sound(144))])],
  ['6', 'quarter = 60, <sound tempo="60">', score([direction(metronome('quarter', '60'), sound(60))])],
  ['6', 'the converter’s fixture, quarter = 90.00009000009', readFileSync(join(process.cwd(), 'tests', 'fixtures', 'imports', 'stamped-by-the-converter.musicxml'), 'utf8')],
  ['bundled', 'Row, Row, Row Your Boat (dotted quarter = 54, <sound tempo="81">)', bundled('authored/song.folk.row-row-row-your-boat.mxl')],
  ['bundled', 'Canon in D, easy (half = 50, <sound tempo="100">)', bundled('imported/song.classical.pachelbel-canon-d.easy.mxl')],
  // The three rags ragtime.6's lesson names with their tempos (70, 100, 72: "the app takes its default tempo from them").
  ['lesson', 'The Entertainer (ragtime.6: 70)', bundled('imported/song.ragtime.joplin-entertainer.mxl')],
  ['lesson', 'Peacherine Rag (ragtime.6: 100)', bundled('imported/song.ragtime.joplin-peacherine-rag.mxl')],
  ['lesson', 'The Easy Winners (ragtime.6: 72)', bundled('imported/song.ragtime.joplin-easy-winners.mxl')],
];

async function modelOf(xml: string): Promise<ScoreModel> {
  const [{ OpenSheetMusicDisplay }, { extractScoreModel }] = await Promise.all([import('opensheetmusicdisplay'), import('../../src/score/extractScoreModel')]);
  const osmd = new OpenSheetMusicDisplay(document.createElement('div'), { autoResize: false });
  await osmd.load(xml);
  return extractScoreModel(osmd, { id: 'table', musicXml: xml });
}

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

it('prints the table', async () => {
  installTextMeasurer();
  const lines: string[] = [];
  for (const [adversary, shape, xml] of SHAPES) {
    const model = await modelOf(xml);
    const prepared = prepareSession(model, { mode: 'tempo', tempoPct: 100, countInBars: 1 });
    const [first, second] = prepared.steps;
    const quarters = (model.steps[1]?.onset ?? 0) - (model.steps[0]?.onset ?? 0);
    const time = model.timeSigMap[0];
    const barQuarters = ((time?.beats ?? 4) * 4) / (time?.beatType ?? 4);
    const row = {
      adversary,
      shape,
      map: model.tempoMap.slice(0, 3).map(({ atBeat, bpm }) => ({ atBeat, bpm: round3(bpm) })),
      opens: round3(model.tempoMap[0]?.bpm ?? Number.NaN),
      label: `${String(Math.round(bpmAt(model.tempoMap, model.steps[0]?.onset ?? 0)))} bpm`,
      plays: round3((quarters * 60_000) / ((second?.tMs ?? 0) - (first?.tMs ?? 0))),
      countsIn: round3((barQuarters * 60_000) / prepared.countInMs),
    };
    lines.push(JSON.stringify(row));
    console.log(JSON.stringify(row));
  }
  const out = process.env.X3D_TABLE_OUT;
  if (out) writeFileSync(out, `${lines.join('\n')}\n`);
});
