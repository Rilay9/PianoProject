// @vitest-environment jsdom
/**
 * X3e's probe (run from app/tests/unit/ as x3e-probe.test.ts, then removed): what the committed app does
 * with a timewise file at each place a learner meets it. Writes X3E_PROBE_OUT (a JSON file beside this
 * script); asserts nothing but that it ran.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/score/estimateImport', () => ({
  estimateLevelFor: () => Promise.resolve(undefined),
  loadLevelModel: () => Promise.resolve(null),
}));

import type { Curriculum } from '../../src/curriculum/types';
import type { ImportRow } from '../../src/data/db';
import { addImport, stateImportTempo, withOpeningTempo } from '../../src/data/importStore';
import { tempoEvents } from '../../src/score/tempoFromXml';
import { openImportSheet, swapHands } from '../../src/ui/importSheet';
import { fakeFile, useFakeIndexedDb } from './helpers/idb';
import { installTextMeasurer } from './helpers/scoreCatalog';
import { timewiseTwin } from './helpers/timewise';

const CURRICULUM = {
  version: 1,
  tracks: [],
  stages: [{ number: 1, title: 'One', units: [{ id: 'u', title: 'U', lessons: [{ id: '1.1', title: 'First steps', concepts: [] }] }] }],
} as unknown as Curriculum;

/** X3d's browser file: four bars of cut time on two staves, half note = 60 with <sound tempo="120">. */
function halfNoteMarked(title: string): string {
  const note = (step: string, octave: number, staff: 1 | 2): string =>
    `<note><pitch><step>${step}</step><octave>${String(octave)}</octave></pitch><duration>2</duration><voice>${staff === 1 ? '1' : '5'}</voice><type>half</type><staff>${String(staff)}</staff></note>`;
  const attributes =
    '<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time symbol="cut"><beats>2</beats><beat-type>2</beat-type></time><staves>2</staves>' +
    '<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>';
  const mark =
    '<direction placement="above"><direction-type><metronome parentheses="no"><beat-unit>half</beat-unit><per-minute>60</per-minute></metronome></direction-type><staff>1</staff><sound tempo="120"/></direction>';
  const steps = ['C', 'D', 'E', 'F', 'G', 'F', 'E', 'D'];
  const bar = (n: number): string =>
    `<measure number="${String(n)}">${n === 1 ? attributes + mark : ''}` +
    `${note(steps[(n - 1) * 2] ?? 'C', 5, 1)}${note(steps[(n - 1) * 2 + 1] ?? 'C', 5, 1)}<backup><duration>4</duration></backup>${note('C', 3, 2)}${note('G', 2, 2)}</measure>`;
  return (
    `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>${title}</work-title></work>` +
    `<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${bar(1)}${bar(2)}${bar(3)}${bar(4)}</part></score-partwise>`
  );
}

async function osmdLoads(xml: string): Promise<string> {
  const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');
  const osmd = new OpenSheetMusicDisplay(document.createElement('div'), { autoResize: false, drawingParameters: 'compact' });
  try {
    await osmd.load(xml);
    return `loads: ${String(osmd.Sheet?.SourceMeasures.length)} measures`;
  } catch (cause) {
    return `refused: ${cause instanceof Error ? cause.message : String(cause)}`;
  }
}

describe('X3e probe: a timewise file on the committed app', () => {
  it('prints what each consumer does', async () => {
    useFakeIndexedDb();
    installTextMeasurer();
    const out: Record<string, unknown> = {};
    for (const [form, xml] of [
      ['partwise', halfNoteMarked('Half note partwise')],
      ['timewise', timewiseTwin(halfNoteMarked('Half note timewise'))],
    ] as const) {
      const row = await addImport(fakeFile(`${form}.musicxml`, xml));
      document.body.replaceChildren();
      openImportSheet(row, CURRICULUM);
      const stated = withOpeningTempo(row.data as string, 72);
      out[form] = {
        tempoEventsOfTheFile: tempoEvents(xml).map((e) => [e.measure, e.offset, e.bpm, e.from]),
        engraver: await osmdLoads(xml),
        storedRoot: /<score-(partwise|timewise)/.exec(row.data as string)?.[0],
        measurement: row.measurement?.status === 'measured' ? `measured, ${String(row.measurement.bars)} bars` : row.measurement,
        tempoFact: row.provenance?.facts.tempo,
        sheetTempoLine: document.querySelector('#import-tempo')?.textContent,
        sheetTempoWhose: document.querySelector('#import-tempo')?.getAttribute('data-whose'),
        sheetField: (document.getElementById('import-tempo-bpm') as HTMLInputElement | null)?.value,
        sheetRead: document.querySelector('#import-read')?.textContent,
        e48StatedWritesAt: /<measure number="1">[\s\S]{0,60}/.exec(stated)?.[0],
        e48TempoEventsAfter: tempoEvents(stated).map((e) => [e.measure, e.offset, e.bpm, e.from]),
        e48Engraver: await osmdLoads(stated),
        swap: 'refused' in swapHands(row.data as string) ? (swapHands(row.data as string) as { refused: string }).refused : 'swapped',
      } satisfies Record<string, unknown>;
      void (row satisfies ImportRow);
    }
    // E48's writer where the first bar says no tempo (item 2): on the timewise text itself, and through the
    // store (the row the door kept, then stateImportTempo), with what the reader and the engraver make of it.
    const bare = timewiseTwin(halfNoteMarked('Bare timewise').replace(/<direction[\s\S]*?<\/direction>/, ''));
    const onTheText = withOpeningTempo(bare, 72);
    const kept = await addImport(fakeFile('bare-timewise.musicxml', bare));
    const statedRow = await stateImportTempo(kept.id, 72);
    const statedText = typeof statedRow?.data === 'string' ? statedRow.data : '';
    out.e48OnATimewiseFileWithNoTempo = {
      writerOnTheTimewiseText: /<measure number="1">[\s\S]{0,40}/.exec(onTheText)?.[0],
      readerOnIt: tempoEvents(onTheText).map((e) => [e.measure, e.offset, e.bpm, e.from]),
      throughTheStoreWritesAt: /<measure number="1">[\s\S]{0,40}/.exec(statedText)?.[0],
      readerThroughTheStore: tempoEvents(statedText).map((e) => [e.measure, e.offset, e.bpm, e.from]),
      engraverThroughTheStore: await osmdLoads(statedText),
    };
    writeFileSync(join(process.cwd(), '..', 'docs', 'prompts', 'runs', 'X3e', process.env.X3E_PROBE_OUT ?? 'probe-timewise.json'), `${JSON.stringify(out, null, 2)}\n`);
    expect(Object.keys(out)).toEqual(['partwise', 'timewise', 'e48OnATimewiseFileWithNoTempo']);
  });
});
