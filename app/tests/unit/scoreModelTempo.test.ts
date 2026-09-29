// @vitest-environment jsdom
/**
 * The score model's tempo map is the file's (X3d; the X3c review's required change,
 * `docs/review/responses/b71a55ca.md`): built through the real extraction — OSMD loads the score and
 * `extractScoreModel` makes the model the Score screen, the engine and the measurement read — every case
 * asks four things of one map, each in quarter notes a minute:
 *
 * - **map**: the tempo map itself, the first entry being the tempo the piece opens at;
 * - **labels**: `bpmAt(map, first step's onset)`, what `ScoreScreen.writtenBpm` puts in the tempo label at
 *   100 % (`bpmNow` is it times the percentage);
 * - **plays**: the engine's timetable (`prepareSession` at 100 %) read back between its first two steps —
 *   the quarter notes between their onsets over the milliseconds between their times;
 * - **countsIn**: the count-in's length (`countInMs`, one bar) read back the same way — the quarter notes in
 *   the bar over its milliseconds.
 *
 * All four are computed from the map; nothing here is timed. Each case compares one object, so a red run
 * shows every value the committed map gave.
 *
 * X3c's probe (`docs/prompts/runs/X3c/probe-player-tempo.txt`) found the committed map taking a
 * `<metronome>`'s `<per-minute>` as quarter notes whatever its note, letting it replace the `<sound tempo>`
 * beside it, and taking the first mark anywhere as the opening. The six adversaries are the reviewer's;
 * the two bundled pieces are X3c's `probe-bundled-tempo.txt`.
 *
 * **A timewise file reads as its partwise twin** (X3e; the X3d review's required change,
 * `docs/review/responses/5e6eceba.md`): the import door accepts `<score-timewise>` as well as
 * `<score-partwise>`. Each adversary shape goes through the door (`addImport`, as the Library's picker hands a
 * file over) in both forms — the timewise one its fixture re-nested (`helpers/timewise.ts`) — and the stored
 * score is asked what it reads as: the tempo events, then the map, the label, the timetable and the
 * count-in through the real extraction; E48's statement goes through `stateImportTempo`. On the committed
 * door the timewise score was stored as it came, the reader found no events in it, and the engraver
 * refused to load it (X3e's probe, `docs/prompts/runs/X3e/probe-timewise-committed.json`).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addImport, stateImportTempo, textTempoOf, withOpeningTempo } from '../../src/data/importStore';
import { prepareSession } from '../../src/engine/prepareSession';
import { DEFAULT_BPM } from '../../src/score/extractScoreModel';
import { toMusicXml } from '../../src/score/mxl';
import { tempoEvents } from '../../src/score/tempoFromXml';
import { bpmAt, type ScoreModel, type TempoMapEntry } from '../../src/score/types';
import { clearFakeIndexedDb, fakeFile, useFakeIndexedDb } from './helpers/idb';
import { installTextMeasurer } from './helpers/scoreCatalog';
import { timewiseTwin } from './helpers/timewise';

// A bundled score with chord symbols needs a text measurer in jsdom (X3c's probe found it on Row, Row, Row).
beforeEach(() => installTextMeasurer());

const QUARTER = '<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>';

/**
 * Three bars (or `bars.length`) of quarter notes, `divisions` 1, in the metre given; `bars[i]` is written at
 * the start of bar i + 1, before its notes. A bar of 2/2 is four quarters, 6/8 three.
 */
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
  return (
    '<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>' +
    `<part id="P1">${measures.join('')}</part></score-partwise>`
  );
}
const metronome = (unit: string, perMinute: string, dots = 0): string =>
  `<metronome><beat-unit>${unit}</beat-unit>${'<beat-unit-dot/>'.repeat(dots)}<per-minute>${perMinute}</per-minute></metronome>`;
const direction = (types: string, sound = ''): string => `<direction placement="above"><direction-type>${types}</direction-type>${sound}</direction>`;
const sound = (bpm: number | string): string => `<sound tempo="${String(bpm)}"/>`;

// The shapes the reviewer named.
/** (1) MuseScore's export shape in cut time: a half note = 60, playing 120 quarter notes a minute. */
const HALF_60_SOUND_120 = score([direction(metronome('half', '60'), sound(120))], 2, 2);
/** (1) The same mark with no `<sound tempo>`: the mark alone, normalised. */
const HALF_60 = score([direction(metronome('half', '60'))], 2, 2);
/** (2) A compound metre's mark: a dotted quarter = 60, playing 90. */
const DOTTED_60_SOUND_90 = score([direction(metronome('quarter', '60', 1), sound(90))], 6, 8);
/**
 * (3) An opening `<sound tempo="100">` standing in the bar, not in a direction — X3c's shape, and the form
 * E48 and E32 write — and a quarter = 132 only in bar 2.
 */
const OPENS_100_MARK_IN_BAR_2 = score([sound(100), direction(metronome('quarter', '132'), sound(132))]);
/** (3) The same with the opening `<sound tempo="100">` in a tempo word's direction ("Moderato"). */
const OPENS_100_IN_A_WORD_MARK_IN_BAR_2 = score([direction('<words>Moderato</words>', sound(100)), direction(metronome('quarter', '132'), sound(132))]);
/** (3), E48's form: nothing at the opening, a quarter = 132 only in bar 2. */
const MARK_ONLY_IN_BAR_2 = score(['', direction(metronome('quarter', '132'), sound(132))]);

async function modelOf(xml: string, defaultBpm?: number): Promise<ScoreModel> {
  const [{ OpenSheetMusicDisplay }, { extractScoreModel }] = await Promise.all([import('opensheetmusicdisplay'), import('../../src/score/extractScoreModel')]);
  const osmd = new OpenSheetMusicDisplay(document.createElement('div'), { autoResize: false });
  await osmd.load(xml);
  return extractScoreModel(osmd, { id: 'tempo', musicXml: xml, ...(defaultBpm === undefined ? {} : { defaultBpm }) });
}

const round3 = (value: number): number => Math.round(value * 1000) / 1000;
/** The map to a thousandth of a beat a minute: a dotted mark's numbers can be thirds. */
const rounded = (map: readonly TempoMapEntry[]): TempoMapEntry[] => map.map(({ atBeat, bpm }) => ({ atBeat, bpm: round3(bpm) }));

interface Readings {
  map: TempoMapEntry[];
  labels: number;
  plays: number;
  countsIn: number;
}

/** The map, the label, the timetable and the count-in, as the module note says; each from the model. */
function readings(model: ScoreModel): Readings {
  const prepared = prepareSession(model, { mode: 'tempo', tempoPct: 100, countInBars: 1 });
  const [first, second] = prepared.steps;
  const quarters = (model.steps[1]?.onset ?? 0) - (model.steps[0]?.onset ?? 0);
  const time = model.timeSigMap[0];
  const barQuarters = ((time?.beats ?? 4) * 4) / (time?.beatType ?? 4);
  return {
    map: rounded(model.tempoMap),
    labels: round3(bpmAt(model.tempoMap, model.steps[0]?.onset ?? 0)),
    plays: round3((quarters * 60_000) / ((second?.tMs ?? 0) - (first?.tMs ?? 0))),
    countsIn: round3((barQuarters * 60_000) / prepared.countInMs),
  };
}
/** What every reading says for a piece that holds one tempo from its first note. */
const at = (bpm: number): Readings => ({ map: [{ atBeat: 0, bpm }], labels: bpm, plays: bpm, countsIn: bpm });

describe('the score model’s tempo map is the file’s, in quarter notes a minute (X3d)', () => {
  it('(1) a half-note mark of 60 with <sound tempo="120"> opens, labels, plays and counts in at 120; the mark alone reads 120 too', async () => {
    expect({ withSound: readings(await modelOf(HALF_60_SOUND_120)), alone: readings(await modelOf(HALF_60)) }).toEqual({ withSound: at(120), alone: at(120) });
  });

  it('(2) a dotted-quarter mark of 60 with <sound tempo="90"> opens, labels, plays and counts in at 90', async () => {
    expect(readings(await modelOf(DOTTED_60_SOUND_90))).toEqual(at(90));
  });

  it('(3) an opening <sound tempo="100"> is not displaced by a mark only in bar 2, which is a change at bar 2', async () => {
    const changes = [
      { atBeat: 0, bpm: 100 },
      { atBeat: 4, bpm: 132 },
    ];
    expect({
      opensAt100: readings(await modelOf(OPENS_100_MARK_IN_BAR_2)),
      opensAt100InAWord: readings(await modelOf(OPENS_100_IN_A_WORD_MARK_IN_BAR_2)),
      // With nothing at the opening the piece opens at the default, and the bar-2 mark is still bar 2's.
      nothingAtTheOpening: (await modelOf(MARK_ONLY_IN_BAR_2)).tempoMap,
    }).toEqual({
      opensAt100: { ...at(100), map: changes },
      opensAt100InAWord: { ...at(100), map: changes },
      nothingAtTheOpening: [
        { atBeat: 0, bpm: DEFAULT_BPM },
        { atBeat: 4, bpm: 132 },
      ],
    });
  });

  it('(4) the learner’s stated 100 and 72 (E48, withOpeningTempo) open the half-note and dotted-quarter shapes at the number stated, and a file whose only mark is in bar 2 at 72 until bar 2', async () => {
    const got: Record<string, Readings | TempoMapEntry[]> = {};
    const wanted: Record<string, Readings | TempoMapEntry[]> = {};
    for (const [shape, xml] of [
      ['half = 60, sound 120', HALF_60_SOUND_120],
      ['dotted quarter = 60, sound 90', DOTTED_60_SOUND_90],
    ] as const) {
      for (const stated of [100, 72]) {
        got[`${shape}, stated ${String(stated)}`] = readings(await modelOf(withOpeningTempo(xml, stated)));
        wanted[`${shape}, stated ${String(stated)}`] = at(stated);
      }
    }
    // The learner states the opening; a later change is the file's (E48's rule), and stays at bar 2.
    got['a mark only in bar 2, stated 72'] = (await modelOf(withOpeningTempo(MARK_ONLY_IN_BAR_2, 72))).tempoMap;
    wanted['a mark only in bar 2, stated 72'] = [
      { atBeat: 0, bpm: 72 },
      { atBeat: 4, bpm: 132 },
    ];
    expect(got).toEqual(wanted);
  });

  it('(5) a genuine later tempo change stays later, at its own position: a bar-2 mark, a half-note mark in bar 2, a change in the middle of a bar', async () => {
    const quarter60 = direction(metronome('quarter', '60'), sound(60));
    // A change two quarters into bar 2 stands at beat 6, not at the bar's start.
    const midBar = score([quarter60]).replace(
      '<measure number="2">' + QUARTER.repeat(4),
      `<measure number="2">${QUARTER.repeat(2)}${direction(metronome('quarter', '90'), sound(90))}${QUARTER.repeat(2)}`,
    );
    const mid = await modelOf(midBar);
    expect({
      // Quarter = 60, then quarter = 144 in bar 2 (the tempo-change fixture's shape).
      quarterInBar2: (await modelOf(score([quarter60, direction(metronome('quarter', '144'), sound(144))]))).tempoMap,
      // A half-note mark as the later change is normalised where it stands.
      halfInBar2: (await modelOf(score([quarter60, direction(metronome('half', '60'))]))).tempoMap,
      midBar: mid.tempoMap,
      // The label follows the cursor (`writtenBpm` reads the map at the step's onset).
      labelBeforeAndAtTheChange: [bpmAt(mid.tempoMap, 5), bpmAt(mid.tempoMap, 6)],
    }).toEqual({
      quarterInBar2: [
        { atBeat: 0, bpm: 60 },
        { atBeat: 4, bpm: 144 },
      ],
      halfInBar2: [
        { atBeat: 0, bpm: 60 },
        { atBeat: 4, bpm: 120 },
      ],
      midBar: [
        { atBeat: 0, bpm: 60 },
        { atBeat: 6, bpm: 90 },
      ],
      labelBeforeAndAtTheChange: [60, 90],
    });
  });

  it('(5) a change inside a repeated section plays again on every pass, where the file writes it', async () => {
    // Bar 1 at 60; bars 2–3 repeated, bar 2 at 90 and bar 3 at 120; bar 4 after. Played: 1 2 3 2 3 4.
    const repeated = score([
      direction(metronome('quarter', '60'), sound(60)),
      `<barline location="left"><repeat direction="forward"/></barline>${direction(metronome('quarter', '90'), sound(90))}`,
      direction(metronome('quarter', '120'), sound(120)),
      '',
    ]).replace(/(<measure number="3">[\s\S]*?)(<\/measure>)/, '$1<barline location="right"><bar-style>light-heavy</bar-style><repeat direction="backward"/></barline>$2');
    const model = await modelOf(repeated);
    expect({ measures: model.measureCount, map: model.tempoMap }).toEqual({
      measures: 6,
      map: [
        { atBeat: 0, bpm: 60 },
        { atBeat: 4, bpm: 90 },
        { atBeat: 8, bpm: 120 },
        { atBeat: 12, bpm: 90 },
        { atBeat: 16, bpm: 120 },
      ],
    });
  });

  it('(5) a bar repeated on its own plays its changes again: its opening tempo, then its change two quarters in, on each pass', async () => {
    // Bar 1 at 60; bar 2 repeated alone, 90 at its start and 120 two quarters in; bar 3 after. Played: 1 2 2 3.
    const bar2 = `<barline location="left"><repeat direction="forward"/></barline>${sound(90)}${QUARTER.repeat(2)}${sound(120)}${QUARTER.repeat(2)}<barline location="right"><bar-style>light-heavy</bar-style><repeat direction="backward"/></barline>`;
    const once = score([direction(metronome('quarter', '60'), sound(60)), '', '']).replace(`<measure number="2">${QUARTER.repeat(4)}`, `<measure number="2">${bar2}`);
    const model = await modelOf(once);
    expect({ steps: model.steps.length, map: model.tempoMap }).toEqual({
      steps: 16,
      map: [
        { atBeat: 0, bpm: 60 },
        { atBeat: 4, bpm: 90 },
        { atBeat: 6, bpm: 120 },
        { atBeat: 8, bpm: 90 },
        // Bar 3 writes no tempo: 120 holds.
        { atBeat: 10, bpm: 120 },
      ],
    });
  });

  it('(6) an undotted quarter mark and a fractional value read as before: 60, and 90.00009000009 unchanged', async () => {
    const stamped = readFileSync(join(process.cwd(), 'tests', 'fixtures', 'imports', 'stamped-by-the-converter.musicxml'), 'utf8');
    expect({
      quarter: readings(await modelOf(score([direction(metronome('quarter', '60'), sound(60))]))),
      // The command-line converter's fixture: the file's number kept, not rounded.
      fractional: (await modelOf(stamped)).tempoMap[0]?.bpm,
      // A bare score the learner stated 72.5 for (X3c's last control).
      stated: (await modelOf(withOpeningTempo(score([]), 72.5))).tempoMap,
    }).toEqual({ quarter: at(60), fractional: 90.00009000009, stated: [{ atBeat: 0, bpm: 72.5 }] });
  });

  it('a text mark the door read after the first bar (E32) is a tempo change where it stands, not ignored', async () => {
    // "= 96" printed as words in bar 2 of 4/4, its note missing: the door reads a quarter and writes a
    // <sound tempo> beside the direction, in the bar (X3c follow-up 4).
    const read = textTempoOf(score(['', direction('<words>= 96</words>')]));
    expect(read?.bpm).toBe(96);
    expect((await modelOf(read?.xml ?? '')).tempoMap).toEqual([
      { atBeat: 0, bpm: DEFAULT_BPM },
      { atBeat: 4, bpm: 96 },
    ]);
  });

  it('a tempo hung on the first note after an opening rest opens the piece, and the count-in counts in at it (Beethoven’s Fifth’s shape)', async () => {
    // The bundled edition of the Fifth prints "Allegro con brio" (<sound tempo="164">) on the first G, after
    // the eighth rest (corpus-reader.txt); here a quarter rest in 2/4. Nothing sounds before the tempo, so it
    // opens the piece rather than the app's default opening it for the length of a rest.
    const rest = '<note><rest/><duration>1</duration><voice>1</voice><type>quarter</type></note>';
    const fifth = score(['', '', ''], 2, 4).replace(
      /(<measure number="1"><attributes>[\s\S]*?<\/attributes>)(?:<note>[\s\S]*?<\/note>){2}/,
      `$1${rest}${direction('<words>Allegro con brio</words>', sound(164))}${QUARTER}`,
    );
    const model = await modelOf(fifth);
    const prepared = prepareSession(model, { mode: 'tempo', tempoPct: 100, countInBars: 1 });
    expect({ map: model.tempoMap, countsIn: round3((2 * 60_000) / prepared.countInMs) }).toEqual({ map: [{ atBeat: 0, bpm: 164 }], countsIn: 164 });
  });

  it('a file with no tempo opens at the default, or at the defaultBpm asked for', async () => {
    expect({ default: (await modelOf(score([]))).tempoMap, asked: (await modelOf(score([]), 72)).tempoMap }).toEqual({
      default: [{ atBeat: 0, bpm: DEFAULT_BPM }],
      asked: [{ atBeat: 0, bpm: 72 }],
    });
  });

  describe('two bundled pieces whose mark counts another note (X3c’s probe-bundled-tempo.txt)', () => {
    const SCORES = join(process.cwd(), 'public', 'content', 'scores');
    for (const [file, bpm, mark] of [
      ['authored/song.folk.row-row-row-your-boat.mxl', 81, 'a dotted quarter = 54 with <sound tempo="81">'],
      ['imported/song.classical.pachelbel-canon-d.easy.mxl', 100, 'a half note = 50 with <sound tempo="100">'],
    ] as const) {
      it(`${file} (${mark}) opens, labels, plays and counts in at ${String(bpm)}`, async () => {
        const path = join(SCORES, file);
        expect(existsSync(path), `${path} — run the content build first`).toBe(true);
        const read = readings(await modelOf(toMusicXml(new Uint8Array(readFileSync(path)))));
        expect({ opens: read.map[0]?.bpm, labels: read.labels, plays: read.plays, countsIn: read.countsIn }).toEqual({ opens: bpm, labels: bpm, plays: bpm, countsIn: bpm });
      });
    }
  });
});

/** What a stored score reads as: its tempo events ([measure, offset, bpm, from]) and the four readings through the real extraction, or the engraver's refusal to load it. */
interface Stored {
  events: [number, number, number, string][];
  readings: Readings | { refused: string };
}

async function storedAs(xml: string): Promise<Stored> {
  const events = tempoEvents(xml).map((event): [number, number, number, string] => [event.measure, event.offset, round3(event.bpm), event.from]);
  try {
    return { events, readings: readings(await modelOf(xml)) };
  } catch (cause) {
    return { events, readings: { refused: cause instanceof Error ? cause.message : String(cause) } };
  }
}

/**
 * A file through the import door in both forms — as written, and its timewise twin — and, where `stated` is
 * given, the learner's tempo stated on each stored row (E48's `stateImportTempo`): what each stored score
 * reads as.
 */
async function throughTheDoor(name: string, partwise: string, stated?: number): Promise<{ partwise: Stored; timewise: Stored }> {
  const read = async (form: string, xml: string): Promise<Stored> => {
    const row = await addImport(fakeFile(`${name} ${form}.musicxml`, xml));
    const kept = stated === undefined ? row : await stateImportTempo(row.id, stated);
    return storedAs(typeof kept?.data === 'string' ? kept.data : '');
  };
  return { partwise: await read('partwise', partwise), timewise: await read('timewise', timewiseTwin(partwise)) };
}
/** What both forms should read as: the same. */
const both = (stored: Stored): { partwise: Stored; timewise: Stored } => ({ partwise: stored, timewise: stored });

describe('a timewise file reads as its partwise twin, through the import door (X3e)', () => {
  beforeEach(() => useFakeIndexedDb());
  afterEach(() => clearFakeIndexedDb());

  const quarter60 = direction(metronome('quarter', '60'), sound(60));
  const bar2 = [
    { atBeat: 0, bpm: 60 },
    { atBeat: 4, bpm: 120 },
  ];

  it('an opening mark with its <sound tempo>, a mark alone, a compound metre’s dotted mark: the same events, map, label, timetable and count-in', async () => {
    expect({
      halfWithSound: await throughTheDoor('half with sound', HALF_60_SOUND_120),
      halfAlone: await throughTheDoor('half alone', HALF_60),
      dotted: await throughTheDoor('dotted', DOTTED_60_SOUND_90),
    }).toEqual({
      halfWithSound: both({ events: [[0, 0, 120, 'sound']], readings: at(120) }),
      halfAlone: both({ events: [[0, 0, 120, 'mark']], readings: at(120) }),
      dotted: both({ events: [[0, 0, 90, 'sound']], readings: at(90) }),
    });
  }, 60_000);

  it('an opening <sound tempo> a bar-2 mark does not displace, and genuine later changes where they stand: a bar-2 half-note mark, a change in the middle of bar 2, a second part’s change at its own divisions', async () => {
    const midBar = score([quarter60]).replace(
      '<measure number="2">' + QUARTER.repeat(4),
      `<measure number="2">${QUARTER.repeat(2)}${direction(metronome('quarter', '90'), sound(90))}${QUARTER.repeat(2)}`,
    );
    // Two parts, the second counting two divisions a quarter from its first bar: its change two quarters
    // into bar 2 is four of its divisions in, and stands at beat 6 only if its divisions carry across bars
    // within the part — the nesting timewise inverts.
    const half = '<note><pitch><step>C</step><octave>3</octave></pitch><duration>4</duration><voice>1</voice><type>half</type></note>';
    const twoParts = score([quarter60])
      .replace('</score-part></part-list>', '</score-part><score-part id="P2"><part-name>Bass</part-name></score-part></part-list>')
      .replace(
        '</part></score-partwise>',
        '</part><part id="P2">' +
          `<measure number="1"><attributes><divisions>2</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>F</sign><line>4</line></clef></attributes>${half}${half}</measure>` +
          `<measure number="2">${half}${direction(metronome('quarter', '90'), sound(90))}${half}</measure>` +
          `<measure number="3">${half}${half}</measure></part></score-partwise>`,
      );
    const change = [
      { atBeat: 0, bpm: 60 },
      { atBeat: 6, bpm: 90 },
    ];
    expect({
      opensAt100: await throughTheDoor('opens at 100', OPENS_100_MARK_IN_BAR_2),
      halfInBar2: await throughTheDoor('half in bar 2', score([quarter60, direction(metronome('half', '60'))])),
      midBar: await throughTheDoor('mid bar', midBar),
      twoParts: await throughTheDoor('two parts', twoParts),
    }).toEqual({
      opensAt100: both({
        events: [
          [0, 0, 100, 'sound'],
          [1, 0, 132, 'sound'],
        ],
        readings: {
          ...at(100),
          map: [
            { atBeat: 0, bpm: 100 },
            { atBeat: 4, bpm: 132 },
          ],
        },
      }),
      halfInBar2: both({
        events: [
          [0, 0, 60, 'sound'],
          [1, 0, 120, 'mark'],
        ],
        readings: { ...at(60), map: bar2 },
      }),
      midBar: both({
        events: [
          [0, 0, 60, 'sound'],
          [1, 2, 90, 'sound'],
        ],
        readings: { ...at(60), map: change },
      }),
      twoParts: both({
        events: [
          [0, 0, 60, 'sound'],
          [1, 2, 90, 'sound'],
        ],
        readings: { ...at(60), map: change },
      }),
    });
  }, 60_000);

  it('the learner’s stated tempo written into the file (E48): the same opening on the half-note shape, on a file whose only mark is in bar 2, and on a file with no tempo at all', async () => {
    expect({
      halfWithSound: await throughTheDoor('stated half', HALF_60_SOUND_120, 72),
      markOnlyInBar2: await throughTheDoor('stated bar 2', MARK_ONLY_IN_BAR_2, 72),
      noTempo: await throughTheDoor('stated bare', score([]), 72),
    }).toEqual({
      halfWithSound: both({ events: [[0, 0, 72, 'sound']], readings: at(72) }),
      markOnlyInBar2: both({
        events: [
          [0, 0, 72, 'sound'],
          [1, 0, 132, 'sound'],
        ],
        readings: {
          ...at(72),
          map: [
            { atBeat: 0, bpm: 72 },
            { atBeat: 4, bpm: 132 },
          ],
        },
      }),
      noTempo: both({ events: [[0, 0, 72, 'sound']], readings: at(72) }),
    });
  }, 60_000);
});
