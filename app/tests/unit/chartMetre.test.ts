/**
 * The chord chart counts each bar in its written metre (MT1; the reviewer's ruling,
 * `docs/review/responses/ph1-g6a-landing.md` §4; brief `docs/prompts/runs/curriculum-review-2026-10-05/briefs/
 * seam-chart-metre.md`).
 *
 * Before MT1 the chart clicked four quarter beats to every bar whatever the score wrote: 3/4 a beat late every
 * bar, 6/8 and 2/2 clicked in quarters. This file pins the pure half:
 *
 * - the per-metre reading against the field's definitions (music21's `beatCount`, `beatDuration`, the witness
 *   values written beside each row; the corpus comparison is `docs/prompts/runs/MT1/witness.txt`), with 3/8
 *   pinned to the app's own L120b ruling, the one disagreement;
 * - `ChartMeasure` carrying the written signature, keyed by the source-measure identity PH1a added;
 * - the legacy grid's bars getting the count of the measure their chord came from;
 * - the tempo field's unit and default, the comp's hold, Bass + drums offered in 4/4 only;
 * - the scheduler HYPOTHESIS the brief handed over, refuted (below), and the additive `barShape` that replaces it.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { chartBars, readHarmony } from '../../src/score/harmony';
import { toMusicXml } from '../../src/score/mxl';
import { openingTempo } from '../../src/score/tempoFromXml';
import {
  chartBarCounts,
  chartTiming,
  compHoldQuarters,
  countOf,
  isFourFour,
  tempoFieldDefault,
  UNMETRED_COUNT,
  type BarCount,
} from '../../src/score/metre';
import { BeatScheduler } from '../../src/audio/BeatScheduler';
import { Metronome, type MetronomeBeat } from '../../src/audio/Metronome';

/** A part of whole bars, each `[number, beats, beatType?]`: a time signature where `beatType` is given, a chord and a bar-long note. */
function score(bars: [string, number, number?][]): string {
  let quarters = 4;
  const measures = bars.map(([number, beats, beatType]) => {
    let attributes = '';
    if (beatType !== undefined) {
      quarters = (beats * 4) / beatType;
      attributes = `<attributes><divisions>2</divisions><time><beats>${String(beats)}</beats><beat-type>${String(beatType)}</beat-type></time></attributes>`;
    }
    const duration = Math.round(quarters * 2);
    return `<measure number="${number}">${attributes}<harmony><root><root-step>C</root-step></root><kind>major</kind></harmony><note><pitch><step>C</step><octave>4</octave></pitch><duration>${String(duration)}</duration></note></measure>`;
  });
  return `<score-partwise><part-list><score-part id="P1"/></part-list><part id="P1">${measures.join('')}</part></score-partwise>`;
}

const brief = (c: BarCount) => [c.beats, c.beatQuarters, c.barQuarters, c.written];

describe('the per-metre reading (red case 1)', () => {
  // [signature, beats, beatType, beats clicked, beat in quarters, bar in quarters, music21 beatCount / beatDuration / beatDivisionCount]
  const TABLE: [string, number, number, number, number, number, string][] = [
    ['2/4', 2, 4, 2, 1, 2, '2 / 1.0 / 2'],
    ['3/4', 3, 4, 3, 1, 3, '3 / 1.0 / 2'],
    ['4/4', 4, 4, 4, 1, 4, '4 / 1.0 / 2'],
    ['5/4', 5, 4, 5, 1, 5, '5 / 1.0 / 2'],
    ['6/8', 6, 8, 2, 1.5, 3, '2 / 1.5 / 3'],
    ['12/8', 12, 8, 4, 1.5, 6, '4 / 1.5 / 3'],
    ['2/2', 2, 2, 2, 2, 4, '2 / 2.0 / 2'],
  ];
  it.each(TABLE)('%s: %i/%i clicks %i beats of %f quarters, a bar of %f quarters (music21: %s)', (written, beats, beatType, clicks, beat, bar) => {
    const { measures } = readHarmony(score([['1', beats, beatType]]));
    expect(measures[0]?.signature?.beats).toEqual([String(beats)]);
    expect(measures[0]?.signature?.beatTypes).toEqual([String(beatType)]);
    expect(brief(countOf(measures[0]?.signature))).toEqual([clicks, beat, bar, written]);
  });

  it('3/8 is three eighth beats, the app’s L120b ruling (music21 reads one dotted-quarter beat: the one disagreement, outside the corpus)', () => {
    const { measures } = readHarmony(score([['1', 3, 8]]));
    expect(brief(countOf(measures[0]?.signature))).toEqual([3, 0.5, 1.5, '3/8']);
  });

  it('a composite 3+2/4 counts five quarters; no signature in force is today’s four', () => {
    expect(brief(countOf({ beats: ['3+2'], beatTypes: ['4'], quarters: 5 }))).toEqual([5, 1, 5, '3+2/4']);
    expect(countOf(undefined)).toBe(UNMETRED_COUNT);
    expect(countOf({ beats: [], beatTypes: [], quarters: undefined })).toBe(UNMETRED_COUNT);
    expect(brief(UNMETRED_COUNT)).toEqual([4, 1, 4, null]);
  });
});

describe('ChartMeasure carries the written signature, keyed by source measure', () => {
  it('3/4 for bars 1-2, 4/4 from bar 3: each source measure holds the signature in force over it', () => {
    const { measures } = readHarmony(score([['1', 3, 4], ['2', 3], ['3', 4, 4], ['4', 4]]));
    expect(measures.map((m) => [m.source, m.signature?.beats.join(), m.signature?.beatTypes.join()])).toEqual([
      [0, '3', '4'],
      [1, '3', '4'],
      [2, '4', '4'],
      [3, '4', '4'],
    ]);
  });

  it('two source measures printing one number keep their own signatures', () => {
    const { measures } = readHarmony(score([['1', 3, 4], ['2', 3], ['2', 4, 4]]));
    expect(measures.map((m) => [m.source, m.label, m.signature?.beats.join()])).toEqual([
      [0, '1', '3'],
      [1, '2', '3'],
      [2, '2', '4'],
    ]);
  });
});

describe('the legacy grid’s bars take the count of the measure their chord came from', () => {
  it('a metre change: bar 3 on is 4/4, and a bar past the last measure carries the last', () => {
    const { measures } = readHarmony(score([['1', 3, 4], ['2', 3], ['3', 4, 4]]));
    expect(chartBarCounts(measures, 4).map((c) => c.written)).toEqual(['3/4', '3/4', '4/4', '4/4']);
  });

  it('a pickup numbered 0 is not grid bar 1: bar 1 is the measure printed 1', () => {
    // A 4/4 pickup bar then 3/4 from bar 1 is artificial; it proves the grid reads by the number the chord does.
    const { measures } = readHarmony(score([['0', 4, 4], ['1', 3, 4], ['2', 3]]));
    expect(chartBarCounts(measures, 3).map((c) => c.written)).toEqual(['3/4', '3/4', '3/4']);
  });

  it('a file with no time signature counts today’s four quarters', () => {
    const xml = '<score-partwise><part id="P1"><measure number="1"><harmony><root><root-step>C</root-step></root><kind>major</kind></harmony></measure></part></score-partwise>';
    const { measures } = readHarmony(xml);
    expect(chartBarCounts(measures, 2)).toEqual([UNMETRED_COUNT, UNMETRED_COUNT]);
  });
});

describe('the tempo field, the comp’s hold and Bass + drums (red cases 4 and 5, the pure half)', () => {
  const of = (signatures: [number, number][]): BarCount[] =>
    signatures.map(([beats, beatType]) => countOf({ beats: [String(beats)], beatTypes: [String(beatType)], quarters: (beats * 4) / beatType }));

  it('names the beat whenever it is not a quarter; 4/4 and 3/4 keep today’s “bpm”', () => {
    expect(chartTiming(of([[6, 8]])).tempoLabel).toBe('bpm (dotted quarters)');
    expect(chartTiming(of([[12, 8]])).tempoLabel).toBe('bpm (dotted quarters)');
    expect(chartTiming(of([[2, 2]])).tempoLabel).toBe('bpm (half notes)');
    expect(chartTiming(of([[4, 4]])).tempoLabel).toBe('bpm');
    expect(chartTiming(of([[3, 4]])).tempoLabel).toBe('bpm');
    expect(chartTiming(of([[4, 4]])).tempoName).toBe('Tempo');
    expect(chartTiming(of([[6, 8]])).tempoName).toBe('Tempo, in dotted quarters a minute');
  });

  it('opens at the catalog’s quarter-note tempo in the beat: Row, Row 81 → 54, Corcovado 96 → 48, a 4/4 96 stays 96', () => {
    expect(tempoFieldDefault(81, 1.5)).toBe(54);
    // The catalog's own float noise for Row, Row, Row (adjacent finding in the brief): still 54.
    expect(tempoFieldDefault(80.99999999999999, 1.5)).toBe(54);
    expect(tempoFieldDefault(96, 2)).toBe(48);
    expect(tempoFieldDefault(96, 1)).toBe(96);
    // In a quarter beat, exactly today's value: no rounding, the clamp as before.
    expect(tempoFieldDefault(80.99999999999999, 1)).toBe(80.99999999999999);
    expect(tempoFieldDefault(264, 1)).toBe(240);
    expect(tempoFieldDefault(31, 1)).toBe(40);
  });

  it('holds the comp three beats in 4/4 exactly, and ends it before the next downbeat in every metre', () => {
    for (const count of of([[2, 4], [3, 4], [4, 4], [5, 4], [6, 8], [12, 8], [2, 2]])) {
      expect(compHoldQuarters(count)).toBeLessThan(count.barQuarters);
    }
    expect(compHoldQuarters(of([[4, 4]])[0] as BarCount)).toBe(3);
    expect(of([[2, 4], [3, 4], [6, 8], [2, 2], [5, 4]]).map(compHoldQuarters)).toEqual([1.5, 2.25, 2.25, 3, 3.75]);
  });

  it('offers Bass + drums in 4/4 alone: 2/4, 3/4, 5/4, 6/8, 12/8 and 2/2 refuse it; the "jazz waltz" comment authorises nothing', () => {
    expect(chartTiming(of([[4, 4], [4, 4]])).backingOffered).toBe(true);
    expect(chartTiming([UNMETRED_COUNT]).backingOffered).toBe(true);
    for (const metre of [[2, 4], [3, 4], [5, 4], [6, 8], [12, 8], [2, 2]] as [number, number][]) {
      const timing = chartTiming(of([metre]));
      expect(timing.backingOffered, `${String(metre[0])}/${String(metre[1])}`).toBe(false);
      expect(timing.refusedBy).toEqual([`${String(metre[0])}/${String(metre[1])}`]);
    }
    // A chart that changes metre (Mr Lawrence: 3/4, then 4/4) refuses it too, naming the metre that has no pattern.
    const mixed = chartTiming(of([[3, 4], [3, 4], [4, 4]]));
    expect([mixed.backingOffered, mixed.refusedBy]).toEqual([false, ['3/4']]);
  });
});

// --- the scheduler -------------------------------------------------------------------------------------------

function fakeContext() {
  const started: number[] = [];
  const param = () => ({ value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  const node = () => ({ connect: vi.fn(), disconnect: vi.fn() });
  const source = () => ({ ...node(), buffer: null, frequency: param(), type: '', start: vi.fn((when: number) => started.push(when)), stop: vi.fn(), onended: null });
  const ctx = {
    currentTime: 0,
    sampleRate: 48_000,
    destination: node(),
    createGain: vi.fn(() => ({ ...node(), gain: param() })),
    createBiquadFilter: vi.fn(() => ({ ...node(), type: '', frequency: param(), Q: param() })),
    createOscillator: vi.fn(source),
    createBufferSource: vi.fn(source),
    createBuffer: vi.fn((_ch: number, length: number) => ({ getChannelData: () => new Float32Array(length) })),
  };
  return ctx as unknown as BaseAudioContext & typeof ctx;
}

/**
 * Runs a metronome at 240 bpm from t = 0, a 3-beat bar then 4-beat bars, on a clock that keeps up except for one
 * wake-up `stallSec` late just before the last beat of bar 1 (t = 0.5 s) is pulled. Returns the beats heard.
 */
function runAcrossChange(wire: (m: Metronome) => void, stallSec: number): MetronomeBeat[] {
  const ctx = fakeContext();
  const m = new Metronome(ctx, { bpm: 240, beatsPerBar: 3, countInBars: 0, sound: 'beep' });
  const heard: MetronomeBeat[] = [];
  m.onTick((beat) => heard.push(beat));
  wire(m);
  m.start(0);
  let t = 0;
  let stalled = false;
  while (t < 3) {
    // One wake-up arrives `stallSec` late instead of 25 ms, just before bar 1's last beat is pulled.
    const late: boolean = !stalled && t >= 0.37;
    stalled ||= late;
    t += late ? stallSec : 0.025;
    ctx.currentTime = t;
    vi.advanceTimersByTime(25);
  }
  m.dispose();
  return heard;
}

describe('the bar boundary across a metre change (the brief’s scheduler HYPOTHESIS)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const accents = (beats: MetronomeBeat[]) => beats.filter((b) => b.isAccent).map((b) => b.timeSec);

  it('REFUTED: calling setBeatsPerBar from the tick listener on a bar’s last beat misplaces the accent after a stall', () => {
    // The hypothesis: the chart calls setBeatsPerBar(4) when it hears bar 1's last beat. Without a stall it works.
    const steady = runAcrossChange((m) => m.onTick((b) => b.bar === 1 && b.beatInBar === 3 && m.setBeatsPerBar(4)), 0.025);
    expect(accents(steady).slice(0, 3)).toEqual([0, 0.75, 1.75]);
    // A wake-up 0.3 s late: at 240 bpm the last beat of bar 1 is then too late to play and is dropped
    // (SCHEDULER_STALE_MS), so the listener never hears it, and bar 2 is counted in threes: the accent falls at
    // 1.5 s, beat 4 of bar 2, instead of 1.75 s. At the field's 240 maximum a pull holding two beats always drops
    // the first (a beat is 0.25 s; the look-ahead and the stale bound are 0.1 s each), so no listener-side call can
    // be relied on at a bar's end.
    const stalled = runAcrossChange((m) => m.onTick((b) => b.bar === 1 && b.beatInBar === 3 && m.setBeatsPerBar(4)), 0.3);
    expect(stalled.some((b) => b.timeSec === 0.5), 'the stall did not drop bar 1’s last beat').toBe(false);
    expect(accents(stalled).slice(0, 3)).toEqual([0, 0.75, 1.5]);
  });

  it('the additive per-bar shape keeps the accent on each bar’s beat 1 through the same stall', () => {
    const shape = (bar: number) => ({ beats: bar <= 1 ? 3 : 4 });
    for (const stall of [0.025, 0.3]) {
      const beats = runAcrossChange((m) => m.setBarShape(shape), stall);
      expect(accents(beats).slice(0, 3), `stall ${String(stall)} s`).toEqual([0, 0.75, 1.75]);
      expect(beats.filter((b) => b.bar === 2).map((b) => b.beatInBar)).toEqual([1, 2, 3, 4]);
    }
  });
});

describe('BeatScheduler’s per-bar shape (additive)', () => {
  it('numbers each bar by its own beat count, counts in in bar 1’s, and spaces each bar’s beats by its scale', () => {
    // Bar 1 and 2 in 3, bar 3 in 2 beats of 1.5 the reference beat (a 6/8 bar in a 3/4 chart, say).
    const shapes: Record<number, { beats: number; beatScale?: number }> = { 1: { beats: 3 }, 2: { beats: 3 }, 3: { beats: 2, beatScale: 1.5 } };
    const s = new BeatScheduler({ bpm: 60, countInBars: 1, startTimeSec: 0, barShape: (bar) => shapes[bar] ?? { beats: 4 } });
    expect(s.countInBeatCount).toBe(3);
    const beats = s.pull(0, 14.9);
    expect(beats.map((b) => [b.bar, b.beatInBar, b.isAccent, b.isCountIn, b.timeSec])).toEqual([
      [0, 1, true, true, 0],
      [0, 2, false, true, 1],
      [0, 3, false, true, 2],
      [1, 1, true, false, 3],
      [1, 2, false, false, 4],
      [1, 3, false, false, 5],
      [2, 1, true, false, 6],
      [2, 2, false, false, 7],
      [2, 3, false, false, 8],
      [3, 1, true, false, 9],
      [3, 2, false, false, 10.5],
      [4, 1, true, false, 12],
      [4, 2, false, false, 13],
      [4, 3, false, false, 14],
    ]);
  });

  it('a constant 4-beat shape numbers exactly as the fixed meter does', () => {
    const fixed = new BeatScheduler({ bpm: 133, beatsPerBar: 4, countInBars: 2, startTimeSec: 1.25 });
    const shaped = new BeatScheduler({ bpm: 133, beatsPerBar: 4, countInBars: 2, startTimeSec: 1.25, barShape: () => ({ beats: 4 }) });
    expect(shaped.pull(1.25, 30)).toEqual(fixed.pull(1.25, 30));
  });
});

// --- the bundled charts --------------------------------------------------------------------------------------

/**
 * Every bundled chart, read as the screen reads it (`readHarmony`, the legacy `chartBars` grid and its bar count,
 * `chartBarCounts`, `chartTiming`): the 4/4 half of the differential at unit level, and the census of what changes.
 * With `MT1_CENSUS` set to a directory it also writes the census and the per-source-measure reading the music21
 * witness (`docs/prompts/runs/MT1/witness.py`) compares against. Reads the built content (`npm run content:build`).
 */
interface CatalogRow {
  id: string;
  file?: string;
  tempoBpm?: number;
  notation?: { chordCount?: number };
}

const CONTENT = resolve('public/content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogRow[];

function chartOf(xml: string): { counts: BarCount[]; measures: ReturnType<typeof readHarmony>['measures']; symbols: number } {
  const { symbols, measures } = readHarmony(xml);
  // As `ChordChartScreen` counts the grid's bars.
  const measureCount = new Set([...xml.matchAll(/<measure\b[^>]*\bnumber="([^"]+)"/g)].map((m) => m[1])).size;
  const bars = chartBars(symbols, Math.max(measureCount, symbols.length));
  return { counts: chartBarCounts(measures, bars.length), measures, symbols: symbols.length };
}

const xmlCache = new Map<string, string>();
function xmlOf(file: string): string {
  let xml = xmlCache.get(file);
  if (xml === undefined) {
    xml = toMusicXml(new Uint8Array(readFileSync(join(CONTENT, file))));
    xmlCache.set(file, xml);
  }
  return xml;
}

const fileOf = (id: string): string => {
  const file = catalog.find((row) => row.id === id)?.file;
  expect(file, `${id} is not bundled`).toBeDefined();
  return file as string;
};

describe('the bundled charts', () => {
  const rows = catalog.filter((row) => row.file !== undefined && (row.notation?.chordCount ?? 0) > 0);

  it('every chart whose harmony part is 4/4 alone keeps today’s count, tempo field, comp hold and Bass + drums', () => {
    const census: unknown[] = [];
    const perMeasure: unknown[] = [];
    let fourFour = 0;
    let other = 0;
    for (const row of rows) {
      const file = row.file as string;
      const chart = chartOf(xmlOf(file));
      if (chart.symbols === 0) continue;
      for (const measure of chart.measures) {
        const count = countOf(measure.signature);
        perMeasure.push([file, measure.source, count.written, count.beats, count.beatQuarters, count.barQuarters, measure.status]);
      }
      const timing = chartTiming(chart.counts);
      const fourFourAlone = chart.measures.every((m) => m.signature === null || isFourFour(countOf(m.signature)));
      if (fourFourAlone) {
        fourFour += 1;
        for (const count of chart.counts) expect(isFourFour(count) || count.written === null, `${row.id}: a 4/4 chart’s bar counted otherwise`).toBe(true);
        expect([timing.beatUnit, timing.tempoLabel, timing.tempoName, timing.backingOffered], row.id).toEqual([1, 'bpm', 'Tempo', true]);
        for (const count of chart.counts) expect(compHoldQuarters(count)).toBe(3);
        if (row.tempoBpm !== undefined) expect(tempoFieldDefault(row.tempoBpm, timing.beatUnit)).toBe(Math.min(240, Math.max(40, row.tempoBpm)));
      } else {
        other += 1;
        census.push({
          id: row.id,
          file,
          metres: [...new Set(chart.measures.map((m) => countOf(m.signature).written ?? 'none'))],
          beatsPerBar: [...new Set(chart.counts.map((c) => c.beats))],
          beatUnits: [...new Set(chart.counts.map((c) => c.beatQuarters))],
          tempoBpm: row.tempoBpm ?? null,
          fieldDefault: row.tempoBpm === undefined ? null : tempoFieldDefault(row.tempoBpm, timing.beatUnit),
          label: timing.tempoLabel,
          backingOffered: timing.backingOffered,
        });
        // The brief's stop conditions: one beat unit per chart, a whole number of beats in every bar.
        expect(new Set(chart.counts.map((c) => c.beatQuarters)).size, `${row.id} mixes beat units`).toBe(1);
        for (const count of chart.counts) expect(Number.isInteger(count.barQuarters / count.beatQuarters), row.id).toBe(true);
      }
    }
    expect(fourFour).toBeGreaterThan(0);
    expect(other).toBeGreaterThan(0);
    const out = process.env.MT1_CENSUS;
    if (out) {
      mkdirSync(out, { recursive: true });
      writeFileSync(join(out, 'census.json'), JSON.stringify({ rows: rows.length, fourFourAlone: fourFour, other, census }, null, 1));
      writeFileSync(join(out, 'per-measure.json'), JSON.stringify(perMeasure));
    }
  });

  it('the tempo-unit HYPOTHESIS: each fixture’s catalog tempo is its file’s opening tempo, in quarter notes a minute', () => {
    for (const id of [
      'song.jazz.vince-guaraldi-skating.pdmx',
      'song.jazz.the-dave-brubeck-quartet-take-five.pdmx',
      'song.folk.row-row-row-your-boat',
      'song.pop.corcovado.pdmx',
      'song.classical.ah-vous-dirais-je-maman.pdmx',
      'exercise.meter.12-8',
      'song.beautiful.merry-christmas-mr-lawrence',
      'song.jazz.kenny-dorham-blue-bossa.pdmx',
      'song.folk.bella-ciao',
    ]) {
      const opening = openingTempo(xmlOf(fileOf(id)));
      const listed = catalog.find((row) => row.id === id)?.tempoBpm;
      expect(opening, `${id} states no opening tempo`).toBeDefined();
      expect(Math.abs((listed ?? Number.NaN) - (opening ?? Number.NaN)), id).toBeLessThan(1e-6);
    }
  });

  it('the browser fixtures are in the metres the brief named; Mr Lawrence changes at bar 17', () => {
    for (const [id, written] of [
      ['song.jazz.vince-guaraldi-skating.pdmx', ['3/4']],
      ['song.jazz.the-dave-brubeck-quartet-take-five.pdmx', ['5/4']],
      ['song.folk.row-row-row-your-boat', ['6/8']],
      ['song.pop.corcovado.pdmx', ['2/2']],
      ['song.classical.ah-vous-dirais-je-maman.pdmx', ['2/4']],
      ['exercise.meter.12-8', ['12/8']],
      ['song.beautiful.merry-christmas-mr-lawrence', ['3/4', '4/4']],
    ] as [string, string[]][]) {
      expect([...new Set(chartOf(xmlOf(fileOf(id))).counts.map((c) => c.written))], id).toEqual(written);
    }
    const lawrence = chartOf(xmlOf(fileOf('song.beautiful.merry-christmas-mr-lawrence')));
    expect(lawrence.counts.slice(14, 18).map((c) => c.beats)).toEqual([3, 3, 4, 4]);
    expect(existsSync(CONTENT)).toBe(true);
  });
});
