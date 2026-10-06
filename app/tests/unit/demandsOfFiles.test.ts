// @vitest-environment jsdom
/**
 * One definition of each demand, run over files as the content build will run
 * it (C2 item 4; reviewer decision 4).
 *
 * The detectors read the score model, and the model is what OSMD makes of a
 * file — so "what demands does this file have?" has to mean "what the app
 * measures on it", the render check's reason for being a Playwright test
 * (`tools/content/render_check.py`). This file is the build's way in: with
 * `PIANOPATH_DEMANDS_IN` naming a JSON list of score paths and
 * `PIANOPATH_DEMANDS_OUT` a place to write, it measures each file with the
 * app's own loader, extractor and detectors and writes the demand ids per file
 * (`tools/content/demands.py` calls it). Without them it is the proof on one
 * quarried piece: Anh. 113, whose demands were read from its MusicXML by hand
 * and by an independent ElementTree pass (the C2 record lists both).
 *
 * **Counts as well as ids (D0).** A family contract asks for an opportunity at
 * a useful density, not only for its presence, so each file's row also carries
 * how many places each detector located (`opportunities`, the length of its
 * `at`), and the bars, steps and sounded notes of the model to divide by. The
 * same detectors produce both: the ids are `measuredDemands`, the counts are
 * `detect` over the same model, and nothing here decides a demand itself.
 *
 * **The declared hand (HD1).** A listing entry may be `{ path, declaredHand }` instead of a bare path:
 * the catalogue row's `hands` where the build holds it authoritative, which a one-staff file's notes
 * take (`extractScoreModel`'s `declaredHand`), so a left-hand cut is measured as the left hand's, as
 * the Score screen plays it. The report stays keyed by path.
 *
 * **The bridge regression (D0).** The generated items pinned in
 * `tools/content/tests/fixtures/bridge_regression.json` are read here directly,
 * from the built files, and `tools/content/tests/test_measured_demands.py` sends
 * the same items through `demands.py`: both are held to the same pinned ids, so
 * the build's way in returns exactly what the detectors say.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import { toMusicXml } from '../../src/score/mxl';
import { timeSignatureAt, type ScoreModel, type ScoreModelData, type ScoreNote } from '../../src/score/types';
import { detect, measuredDemands, soundedNotes, type DetectorId } from '../../src/demands/detect';
import type { DemandsFile } from '../../src/demands/vocabulary';
import type { DeclaredHand } from '../../src/score/types';
import { installTextMeasurer } from './helpers/scoreCatalog';

const REPO = join(process.cwd(), '..');
const { demands } = JSON.parse(readFileSync(join(REPO, 'content', 'curriculum', 'vocabulary', 'demands.json'), 'utf8')) as DemandsFile;

async function modelOfFile(path: string, declaredHand?: DeclaredHand): Promise<ScoreModel> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  try {
    const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
    const musicXml = toMusicXml(new Uint8Array(readFileSync(path)));
    await osmd.load(musicXml);
    return extractScoreModel(osmd, { id: path, musicXml, ...(declaredHand === undefined ? {} : { declaredHand }) });
  } finally {
    container.remove();
  }
}

const IN = process.env.PIANOPATH_DEMANDS_IN;
const OUT = process.env.PIANOPATH_DEMANDS_OUT;

/** One file's measurement, as the build reads it back. */
interface Measured {
  demands: string[];
  /** Per vocabulary demand, how many places its detector located (0 where it located none). */
  opportunities: Record<string, number>;
  measures: number;
  steps: number;
  notes: number;
  /**
   * E1: per demand, per printed bar (1-based, the pickup as bar 1), how many located places on
   * the upper staff and on the lower — each printed note once, however many passes the repeats
   * make. Only the bars with one.
   */
  positions: Record<string, Record<string, [number, number]>>;
  /** E1: the printed bars where each every-bar detector's condition holds, asked of that bar alone. */
  everyBar: Record<string, number[]>;
  /** E1: per printed bar, each hand's lowest and highest sounded pitch (grace notes left out). */
  hands: Record<string, { R?: [number, number]; L?: [number, number] }>;
  /** The printed bar count (`sourceMeasureCount`): what the bars above are counted in. */
  printedBars: number;
}

/** The detectors that locate nothing unless every bar of the model qualifies. */
const EVERY_BAR: readonly DetectorId[] = ['leftHandPattern', 'walkingBass'];

/** A printed note, the same on every pass through a repeat (`printedNoteKey`'s fields). */
const printedKey = (note: ScoreNote): string =>
  `${String(note.sourceMeasureIndex)}:${String(note.staff)}:${String(note.voice)}:${String(note.sourceOnset)}:${String(note.midi)}`;

/**
 * One printed bar of the model alone, on its first pass: its steps as bar 0 of a one-bar model,
 * with the time signature in force there. The every-bar detectors read their per-bar condition
 * from exactly this (a bar's own notes, its metre, the tune above it), so asking the detector of
 * the slice is asking it of the bar; nothing here restates a condition.
 */
function barSlice(model: ScoreModelData, printedIndex: number): ScoreModelData | undefined {
  const first = model.steps.find((step) => step.sourceMeasureIndex === printedIndex);
  if (first === undefined) return undefined;
  const unrolled = first.measureIndex;
  const steps = model.steps
    .filter((step) => step.measureIndex === unrolled)
    .map((step, index) => ({
      ...step,
      index,
      measureIndex: 0,
      notes: step.notes.map((note) => ({ ...note, measureIndex: 0 })),
    }));
  const metre = timeSignatureAt(model.timeSigMap, unrolled);
  return {
    id: model.id,
    title: model.title,
    steps,
    tempoMap: model.tempoMap,
    timeSigMap: metre ? [{ ...metre, atMeasure: 0 }] : [],
    measureCount: 1,
    sourceMeasureCount: 1,
    ...(model.keySig === undefined ? {} : { keySig: model.keySig }),
    handsPresent: model.handsPresent,
  };
}

function measure(model: ScoreModel): Measured {
  const opportunities: Record<string, number> = {};
  const positions: Record<string, Record<string, [number, number]>> = {};
  const byId = new Map(model.steps.flatMap((step) => step.notes).map((note) => [note.id, note]));
  for (const demand of demands) {
    const at = detect(model, demand.detector).at;
    opportunities[demand.id] = at.length;
    const seen = new Set<string>();
    const perBar: Record<string, [number, number]> = {};
    for (const place of at) {
      const note = byId.get(place.noteId);
      if (note === undefined || seen.has(printedKey(note))) continue;
      seen.add(printedKey(note));
      const bar = (perBar[String(note.sourceMeasureIndex + 1)] ??= [0, 0]);
      bar[note.staff === 2 ? 1 : 0] += 1;
    }
    if (Object.keys(perBar).length > 0) positions[demand.id] = perBar;
  }
  const everyBar: Record<string, number[]> = {};
  for (const demand of demands) {
    if (!EVERY_BAR.includes(demand.detector)) continue;
    const bars: number[] = [];
    for (let index = 0; index < model.sourceMeasureCount; index += 1) {
      const slice = barSlice(model, index);
      if (slice !== undefined && detect(slice, demand.detector).present) bars.push(index + 1);
    }
    everyBar[demand.id] = bars;
  }
  const hands: Record<string, { R?: [number, number]; L?: [number, number] }> = {};
  const seenNotes = new Set<string>();
  for (const note of soundedNotes(model)) {
    if (seenNotes.has(printedKey(note))) continue;
    seenNotes.add(printedKey(note));
    const bar = (hands[String(note.sourceMeasureIndex + 1)] ??= {});
    const range = bar[note.hand];
    bar[note.hand] = range === undefined ? [note.midi, note.midi] : [Math.min(range[0], note.midi), Math.max(range[1], note.midi)];
  }
  return {
    demands: measuredDemands(model, demands),
    opportunities,
    measures: model.measureCount,
    steps: model.steps.length,
    notes: soundedNotes(model).length,
    positions,
    everyBar,
    hands,
    printedBars: model.sourceMeasureCount,
  };
}

describe.runIf(IN !== undefined && OUT !== undefined)('the build asks for the demands of its files', () => {
  it('measures every file it is given and writes the demand ids, or why it could not', async () => {
    installTextMeasurer();
    // A bare path, or a path with the row's declared hand (HD1).
    const listed = JSON.parse(readFileSync(IN as string, 'utf8')) as (string | { path: string; declaredHand?: DeclaredHand })[];
    const paths = listed.map((entry) => (typeof entry === 'string' ? { path: entry } : entry));
    const out: Record<string, Measured | { error: string }> = {};
    for (const { path, declaredHand } of paths) {
      try {
        out[path] = measure(await modelOfFile(path, declaredHand));
      } catch (error) {
        out[path] = { error: String(error).slice(0, 300) };
      }
    }
    writeFileSync(OUT as string, JSON.stringify(out, null, 2));
    expect(Object.keys(out)).toHaveLength(paths.length);
  }, 3_600_000);
});

/**
 * The generated half of the bridge regression: the pinned items read directly,
 * from the files the content build wrote (`app/public/content/scores/generated`,
 * which CI builds before this suite runs). The Python half sends the same items
 * through `demands.py` and is held to the same ids.
 */
describe.runIf(IN === undefined)('generated items, measured directly, give the ids the bridge regression pins', () => {
  const FIXTURE = join(REPO, 'tools', 'content', 'tests', 'fixtures', 'bridge_regression.json');
  // Read only in this mode: a skipped block is still collected, and the build's run of
  // this file (the other block) must not depend on the fixture.
  const pinned = (IN === undefined ? JSON.parse(readFileSync(FIXTURE, 'utf8')) : { items: [] }) as {
    items: { id: string; demands: string[] }[];
  };
  const GENERATED = join(process.cwd(), 'public', 'content', 'scores', 'generated');

  it('pins items from more than one family', () => {
    expect(new Set(pinned.items.map((item) => item.id.split('.')[1])).size).toBeGreaterThan(4);
  });

  for (const item of pinned.items) {
    it(`${item.id}: the detectors find exactly the pinned demands`, async () => {
      const file = join(GENERATED, `${item.id}.mxl`);
      expect(existsSync(file), `${file} — run the content build first`).toBe(true);
      installTextMeasurer();
      expect(measuredDemands(await modelOfFile(file), demands)).toEqual(item.demands);
    });
  }
});

describe.runIf(IN === undefined)('Anh. 113, a quarried piece, measured by the app’s detectors', () => {
  const FILE = join(REPO, 'content', 'scores', 'pdmx', 'QmZzbCrrGH19zjfe766mDvw9C1cXYXSa5ApF7MRnRhpqjL.mxl');

  it('finds what the page has and nothing it has not', async () => {
    installTextMeasurer();
    const found = new Set(measuredDemands(await modelOfFile(FILE), demands));
    // Read from the file: two staves, treble over bass, no clef change; F major
    // throughout, with E♭, B♮, C♯ and F♯ written in; sixteenths in bar 1;
    // twelve triplet eighths; C6 at the top of the right hand and E2 at the
    // bottom of the left; leaps to the octave; the hands together.
    for (const id of [
      'clef.bass',
      'pitch.ledger',
      'interval.step',
      'interval.skip',
      'interval.leap',
      'rhythm.eighths',
      'rhythm.shorter-than-quarter',
      'rhythm.sixteenths',
      'rhythm.triplets',
      'key.signature',
      'pitch.chromatic',
      'range.beyond-position',
      'texture.hands-together',
    ]) {
      expect(found, `Anh. 113 has ${id}`).toContain(id);
    }
    // No tie, no dotted quarter (its long notes are halves and dotted halves),
    // 3/4 throughout; no note of a beat or more off the beat and no right-hand
    // bar that opens late; and bars 12, 29, 30 and 32 give the left hand one
    // note, so neither a pattern in every bar nor a walk.
    for (const id of [
      'rhythm.ties',
      'rhythm.dotted-quarter',
      'metre.compound',
      'rhythm.syncopation',
      'texture.left-hand-pattern',
      'texture.walking-bass',
    ]) {
      expect(found, `Anh. 113 has no ${id}`).not.toContain(id);
    }
  });
});

/**
 * The positions the bridge writes (E1 item 5): the proposer scores a window of printed bars from
 * where each demand was located, without cutting the window. Per demand, per printed bar
 * (1-based, the pickup as bar 1, as `sections.json` and the Score loop count), each printed note
 * once however many passes the repeats make: `detect`'s own located places, read through the
 * note's `sourceMeasureIndex` (`DemandAt` carries only the unrolled measure). The two every-bar
 * detectors (left-hand pattern, walking bass) locate nothing unless every bar of the piece
 * qualifies, so their places cannot tell a window: the bridge asks each of them of every printed
 * bar alone, the detector itself on that bar's slice of the model. And each hand's lowest and
 * highest pitch per printed bar, for the window's span (the shift detector widens from the start
 * of the piece, so its places do not compose into a window either).
 */
describe.runIf(IN === undefined)('the positions the bridge writes, by printed bar (E1)', () => {
  const FIXTURES = join(REPO, 'tools', 'content', 'tests', 'fixtures', 'excerpts');

  it('are detect.ts’s located places, by printed bar, each printed note once', async () => {
    installTextMeasurer();
    const model = await modelOfFile(join(FIXTURES, 'pickup-and-repeat.musicxml'));
    // Five printed bars, a pickup and a repeat over bars 2-3: seven bars unrolled.
    expect(model.sourceMeasureCount).toBe(5);
    expect(model.measureCount).toBe(7);
    const row = measure(model);
    expect(row.printedBars).toBe(5);
    // Read independently from `at`: the printed bar and staff of each located note, each printed
    // note once — [upper staff, lower staff], so a one-hand window counts its own staff.
    const notes = new Map(model.steps.flatMap((step) => step.notes).map((note) => [note.id, note]));
    for (const demand of demands) {
      const perBar: Record<string, [number, number]> = {};
      const seen = new Set<string>();
      for (const at of detect(model, demand.detector).at) {
        const note = notes.get(at.noteId);
        expect(note, `${demand.id}: a located note the model has`).toBeDefined();
        if (!note) continue;
        const key = `${String(note.sourceMeasureIndex)}:${String(note.staff)}:${String(note.voice)}:${String(note.sourceOnset)}:${String(note.midi)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const bar = (perBar[String(note.sourceMeasureIndex + 1)] ??= [0, 0]);
        bar[note.staff === 2 ? 1 : 0] += 1;
      }
      expect(row.positions[demand.id] ?? {}, demand.id).toEqual(perBar);
    }
    // Read from the page: the leaps are G4-C5 into bar 2, C5-G4 in bar 3 (the upper staff), and
    // the lower staff's fourths C3-G2 (bar 3), G2-C3 back into bar 2 on the repeat, C3-G2 and
    // G2-C3 in bar 4 and into bar 5 — seven printed notes, where the unrolled model locates more.
    expect(row.positions['interval.leap']).toEqual({ '2': [1, 1], '3': [1, 1], '4': [0, 2], '5': [0, 1] });
    expect(row.positions['rhythm.eighths']).toEqual({ '4': [4, 0] });
    expect(row.opportunities['interval.leap']).toBeGreaterThan(7);
  });

  it('reads an every-bar detector bar by bar, and each hand’s range per bar', async () => {
    installTextMeasurer();
    const model = await modelOfFile(join(FIXTURES, 'walk-in-two-bars.musicxml'));
    const row = measure(model);
    // The whole piece: no walk (bar 2 holds a whole note), so the detector locates nothing.
    expect(row.demands).not.toContain('texture.walking-bass');
    expect(row.opportunities['texture.walking-bass']).toBe(0);
    // Bar by bar: bars 1 and 3 walk, and a pattern (more than one left-hand note under a tune) is there too.
    expect(row.everyBar['texture.walking-bass']).toEqual([1, 3]);
    expect(row.everyBar['texture.left-hand-pattern']).toEqual([1, 3]);
    expect(row.hands['1']).toEqual({ R: [72, 72], L: [48, 53] });
    expect(row.hands['2']).toEqual({ R: [71, 71], L: [43, 43] });
    expect(row.hands['3']).toEqual({ R: [72, 72], L: [43, 48] });
  });
});
