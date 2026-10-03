// @vitest-environment jsdom
/**
 * X3c's throwaway probe (deleted after the run; its source kept as
 * `docs/prompts/runs/X3c/scripts-probe-player-tempo.test.ts`): the orchestrator's hypothesis is that
 * "the first <sound tempo> in the stored score is the tempo the player uses". The player's tempo is the
 * model's first tempo, as the Score screen reads it (`importMeasuredTruth.test.ts`'s `playedBpm`). Each
 * case prints the tempo map; the assertions are what the hypothesis predicts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { withOpeningTempo } from '../../src/data/importStore';

function score(bar1: string, bar2 = '', beats = 4, beatType = 4): string {
  const notes = (n: number) => '<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>'.repeat(n);
  const per = beatType === 2 ? beats * 2 : beatType === 8 ? beats / 2 : beats;
  return (
    '<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">' +
    `<measure number="1"><attributes><divisions>1</divisions><time><beats>${String(beats)}</beats><beat-type>${String(beatType)}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>${bar1}${notes(per)}</measure>` +
    `<measure number="2">${bar2}${notes(per)}</measure>` +
    `<measure number="3">${notes(per)}</measure>` +
    '</part></score-partwise>'
  );
}
const metronome = (unit: string, perMinute: string, dot = false) =>
  `<metronome><beat-unit>${unit}</beat-unit>${dot ? '<beat-unit-dot/>' : ''}<per-minute>${perMinute}</per-minute></metronome>`;
const direction = (types: string, sound = '') => `<direction placement="above"><direction-type>${types}</direction-type>${sound}</direction>`;

async function tempoMap(xml: string): Promise<{ atBeat: number; bpm: number }[]> {
  const [{ OpenSheetMusicDisplay }, { extractScoreModel }] = await Promise.all([import('opensheetmusicdisplay'), import('../../src/score/extractScoreModel')]);
  const osmd = new OpenSheetMusicDisplay(document.createElement('div'), { autoResize: false });
  await osmd.load(xml);
  return extractScoreModel(osmd, { id: 'probe', defaultBpm: 1 }).tempoMap;
}

const cases: [string, string, number][] = [
  ['quarter = 60 with <sound tempo="60">', score(direction(metronome('quarter', '60'), '<sound tempo="60"/>')), 60],
  ['half = 60 with <sound tempo="120"> (MuseScore’s export shape, cut time)', score(direction(metronome('half', '60'), '<sound tempo="120"/>'), '', 2, 2), 120],
  ['half = 60, no <sound tempo>', score(direction(metronome('half', '60')), '', 2, 2), 120],
  ['dotted quarter = 60 with <sound tempo="90"> (6/8)', score(direction(metronome('quarter', '60', true), '<sound tempo="90"/>'), '', 6, 8), 90],
  ['<sound tempo="100"> at the opening, quarter = 132 only in bar 2', score('<sound tempo="100"/>', direction(metronome('quarter', '132'), '<sound tempo="132"/>')), 100],
  ['E48 on half = 60 / <sound 120>: withOpeningTempo(…, 100)', withOpeningTempo(score(direction(metronome('half', '60'), '<sound tempo="120"/>'), '', 2, 2), 100), 100],
  ['E32’s shape: "= 60" in 2/2 as words, a measure-level <sound tempo="120"> beside it', score(`${direction('<words>= 60</words>')}<sound tempo="120"/>`, '', 2, 2), 120],
  ['quarter = 96 with <sound tempo="96"> (the sheet test’s AUTHORED shape)', score(direction(metronome('quarter', '96'), '<sound tempo="96"/>')), 96],
  ['E48 on a mark only in bar 2 (quarter = 132): withOpeningTempo(…, 72)', withOpeningTempo(score('', direction(metronome('quarter', '132'), '<sound tempo="132"/>')), 72), 72],
  ['"Allegro" as words with <sound tempo="132"> in one direction', score(direction('<words>Allegro</words>', '<sound tempo="132"/>')), 132],
  ['the fixture stamped-by-the-converter.musicxml (quarter = 90.00009000009, <sound tempo="90.00009000009">)', readFileSync(join(process.cwd(), 'tests', 'fixtures', 'imports', 'stamped-by-the-converter.musicxml'), 'utf8'), 90.00009000009],
  ['E48 on a score with no tempo: withOpeningTempo(…, 72.5)', withOpeningTempo(score(''), 72.5), 72.5],
];

describe('X3c probe: the player’s tempo against the first <sound tempo>', () => {
  for (const [name, xml, predicted] of cases) {
    it(name, async () => {
      const map = await tempoMap(xml);
      console.log(`${name}\n  first <sound tempo>: ${/<sound\b[^>]*\btempo="([^"]*)"/.exec(xml)?.[1] ?? 'none'}\n  tempo map: ${JSON.stringify(map)}`);
      expect(map[0]?.bpm, name).toBe(predicted);
    });
  }
});
