/**
 * Chord symbols out of MusicXML, for the chord-chart view (docs/04 §3b).
 *
 * `extractScoreModel` deliberately does not carry these: it models *notes*,
 * and the follow engine has no use for a chord symbol. The chart view has no
 * use for anything else, so it reads the file again for just this.
 *
 * Parsed with regexes rather than a DOM, for the same reason `score/mxl.ts`
 * is: this has to run in Node tests, and `<harmony>` is a flat, fixed shape.
 *
 * **Where a symbol stands (PH1).** Each symbol carries its place in its bar,
 * read by the one position walk the tempo reader stands on (`measureWalk.ts`),
 * never a second parser, and the bar becomes an ordered list of segments
 * (`chartSegments`). The rulings it follows are the reviewer's
 * (`docs/review/responses/g6-ph-briefs-cb1.md` §2-§4): a harmony's `<offset>`
 * always moves it; every event at a different offset is kept; only an exact
 * duplicate at one offset merges; a conflict at one offset is reported, never
 * settled by part order; a bar's length is its time signature's, a pickup's its
 * notated length, an unexplained mismatch reported.
 *
 * **Which bar a symbol is in (the reviewer, `docs/review/responses/ph1-g6a-landing.md` §2).** By the source
 * measure's ordinal in its part (`source`, the walk's own `measure`), never by the written number: two successive
 * measures can print the same number, and a suffixed or lettered label (`7X1`, `A`) is not the integer it starts
 * with. The written number survives as display metadata (`label` as printed, `measure` as the integer the legacy
 * `chartBars` still counts by) and keys nothing here.
 */

import { attribute, walkMeasures, type WalkMeasure } from './measureWalk';

export interface ChordSymbol {
  /**
   * The source measure's ordinal in its part, from 0: the stable identity of the bar the symbol stands in (the
   * walk's `measure`). Parts of a score are aligned by it. This, not `measure`, says which bar.
   */
  source: number;
  /** The measure's `number` attribute as printed ("7", "7X1", "A"): display metadata, never an identity. */
  label: string;
  /**
   * The written number read as an integer (`Number.parseInt`, so "7X1" is 7 and "A" is `NaN`): what the legacy
   * `chartBars` still counts by. Display metadata only: two measures can share it and a label can fold onto it.
   */
  measure: number;
  /**
   * Quarter notes from the measure's start: the shared walk's position at the
   * `<harmony>`, plus its `<offset>` in divisions whatever its `sound`
   * attribute. Not clamped: a file can place one before 0 or at or after the
   * bar's end, and `chartSegments` reports each.
   */
  offset: number;
  /** "C", "Am7", "G7/B" — what is printed above the stave. */
  text: string;
  /** Pitch classes 0–11 for the notes of the chord, for matching what is played. */
  pitchClasses: number[];
  root: number;
  bass?: number;
}

const STEP_TO_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * MusicXML `<kind>` -> the suffix printed and the intervals above the root.
 *
 * Not exhaustive — MusicXML defines about forty kinds and a lead sheet uses a
 * dozen. Anything unlisted keeps its own name and is matched on the triad,
 * which is better than dropping the bar.
 */
const KINDS: Record<string, { suffix: string; intervals: number[] }> = {
  major: { suffix: '', intervals: [0, 4, 7] },
  minor: { suffix: 'm', intervals: [0, 3, 7] },
  augmented: { suffix: '+', intervals: [0, 4, 8] },
  diminished: { suffix: '°', intervals: [0, 3, 6] },
  dominant: { suffix: '7', intervals: [0, 4, 7, 10] },
  'major-seventh': { suffix: 'maj7', intervals: [0, 4, 7, 11] },
  'minor-seventh': { suffix: 'm7', intervals: [0, 3, 7, 10] },
  'diminished-seventh': { suffix: '°7', intervals: [0, 3, 6, 9] },
  'half-diminished': { suffix: 'ø7', intervals: [0, 3, 6, 10] },
  'major-sixth': { suffix: '6', intervals: [0, 4, 7, 9] },
  'minor-sixth': { suffix: 'm6', intervals: [0, 3, 7, 9] },
  'suspended-fourth': { suffix: 'sus4', intervals: [0, 5, 7] },
  'suspended-second': { suffix: 'sus2', intervals: [0, 2, 7] },
  'dominant-ninth': { suffix: '9', intervals: [0, 4, 7, 10, 2] },
  'minor-ninth': { suffix: 'm9', intervals: [0, 3, 7, 10, 2] },
  'major-ninth': { suffix: 'maj9', intervals: [0, 4, 7, 11, 2] },
  'minor-11th': { suffix: 'm11', intervals: [0, 3, 7, 10, 2, 5] },
  'dominant-11th': { suffix: '11', intervals: [0, 4, 7, 10, 2, 5] },
  'dominant-13th': { suffix: '13', intervals: [0, 4, 7, 10, 2, 5, 9] },
  power: { suffix: '5', intervals: [0, 7] },
};

/**
 * A chord degree as semitones above the root: the major scale, continued past
 * the octave so a 9th is 14 and not 2.
 */
const DEGREE_SEMITONES: Record<number, number> = {
  1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11,
  9: 14, 11: 17, 13: 21,
};

/**
 * `<degree>` elements: what a chord adds to, alters in, or takes out of its kind.
 *
 * MusicXML writes an added ninth as `<kind>major</kind>` plus a `<degree>` of
 * add 9 — there is no "add9" kind — so a reader that stops at `<kind>` sees a
 * plain major triad. This one did, and the generator's four add9 studies
 * printed "C" over C-E-G-D in the chart view. `pitchClasses` is also what the
 * chart scores the learner against, so the ninth they were told to play was
 * not in the chord they were judged on.
 */
function applyDegrees(block: string, intervals: number[], suffix: string): {
  intervals: number[];
  suffix: string;
} {
  let out = [...intervals];
  let text = suffix;
  for (const match of block.matchAll(/<degree(?:\s[^>]*)?>([\s\S]*?)<\/degree>/g)) {
    const body = match[1] ?? '';
    const value = Number.parseInt(/<degree-value>(\d+)<\/degree-value>/.exec(body)?.[1] ?? '', 10);
    if (!Number.isFinite(value)) continue;
    const alter = Number(/<degree-alter>(-?\d+)<\/degree-alter>/.exec(body)?.[1] ?? '0');
    const type = (/<degree-type>(\w+)<\/degree-type>/.exec(body)?.[1] ?? '').trim();
    const base = DEGREE_SEMITONES[value];
    if (base === undefined) continue;
    const pc = (((base + alter) % 12) + 12) % 12;
    const name = `${alterSymbol(alter)}${String(value)}`;
    if (type === 'add') {
      if (!out.includes(pc)) out.push(pc);
      text += `add${name}`;
    } else if (type === 'subtract') {
      out = out.filter((interval) => interval !== pc);
      text += `no${String(value)}`;
    } else if (type === 'alter') {
      const plain = (((base % 12) + 12) % 12);
      out = out.filter((interval) => interval !== plain);
      if (!out.includes(pc)) out.push(pc);
      text += name;
    }
  }
  return { intervals: out, suffix: text };
}

function alterSymbol(alter: number): string {
  if (alter > 0) return '♯'.repeat(alter);
  if (alter < 0) return '♭'.repeat(-alter);
  return '';
}

function stepToPc(step: string, alter: number): number | null {
  const base = STEP_TO_PC[step.toUpperCase()];
  if (base === undefined) return null;
  return (((base + alter) % 12) + 12) % 12;
}

/** A `<harmony>` block's chord, where it names one (a root step it can read); `null` otherwise. */
function chordOf(block: string, source: number, label: string, offset: number): ChordSymbol | null {
  const step = /<root-step>([A-Ga-g])<\/root-step>/.exec(block)?.[1];
  if (!step) return null;
  const alter = Number(/<root-alter>(-?\d+)<\/root-alter>/.exec(block)?.[1] ?? '0');
  const root = stepToPc(step, alter);
  if (root === null) return null;

  const kindMatch = /<kind\b([^>]*)>([^<]*)<\/kind>/.exec(block);
  const kindName = (kindMatch?.[2] ?? 'major').trim();
  const printed = /\btext="([^"]*)"/.exec(kindMatch?.[1] ?? '')?.[1];
  const kind = KINDS[kindName] ?? { suffix: kindName === 'none' ? '' : kindName, intervals: [0, 4, 7] };

  const bassStep = /<bass-step>([A-Ga-g])<\/bass-step>/.exec(block)?.[1];
  const bassAlter = Number(/<bass-alter>(-?\d+)<\/bass-alter>/.exec(block)?.[1] ?? '0');
  const bass = bassStep ? stepToPc(bassStep, bassAlter) : null;

  const rootName = `${step.toUpperCase()}${alterSymbol(alter)}`;
  const degreed = applyDegrees(block, kind.intervals, kind.suffix);
  // An explicit `text=` on the kind is what the engraver wanted printed, so
  // it wins over anything derived — but the degrees still shape the notes.
  const suffix = printed ?? degreed.suffix;
  const bassName = bassStep ? `/${bassStep.toUpperCase()}${alterSymbol(bassAlter)}` : '';

  return {
    source,
    label,
    measure: Number.parseInt(label, 10),
    offset,
    text: `${rootName}${suffix}${bassName}`,
    pitchClasses: degreed.intervals.map((interval) => (root + interval) % 12),
    root,
    ...(bass === null ? {} : { bass }),
  };
}

/**
 * How long a bar is, and why (the reviewer's §4 ruling):
 *
 * - `full`: the notated length is the time signature's; the bar is that long;
 * - `incomplete`: an explicit pickup or incomplete bar (`implicit="yes"`) keeps
 *   its notated length, never stretched to a full bar;
 * - `pickup`: the part's first bar is shorter than its time signature with no
 *   `implicit` written: an anacrusis by notation (music21 reads it so too,
 *   `padAsAnacrusis`), so it keeps its notated length as well;
 * - `empty`: nothing in it takes time (a chord-only bar); it is the time
 *   signature's length, as a bar's rest would be;
 * - `mismatch`: notated length and time signature disagree with nothing to
 *   explain it (a short bar after the first, an overfull bar); the bar is the
 *   longer of the two, so no bar is shorter than its metre and nothing written
 *   in it falls outside it; the census reports each, never clamping silently;
 * - `unmetred`: no time signature in force (or `<senza-misura>`); the bar is its
 *   notated length.
 */
export type BarStatus = 'full' | 'incomplete' | 'pickup' | 'empty' | 'mismatch' | 'unmetred';

/** A bar of the part the chord symbols stand in. */
export interface ChartMeasure {
  /** The source measure's ordinal in its part, from 0: the bar's identity (`ChordSymbol.source`). */
  source: number;
  /** The measure's `number` attribute as printed; `undefined` where it has none. Display metadata only. */
  label: string | undefined;
  /** The written number read as an integer, as `ChordSymbol.measure` reads it (`NaN` where none parses). Display metadata only. */
  measure: number;
  /** The time signature's bar in quarter notes, where one is in force. */
  nominal: number | null;
  /** The furthest the shared walk reached in the bar, in quarter notes: its notated length. */
  walked: number;
  /** The bar says `implicit="yes"`. */
  implicit: boolean;
  status: BarStatus;
  /** The bar's length in quarter notes, by `status`. */
  length: number;
}

const EPSILON = 1e-6;
const round6 = (value: number): number => Math.round(value * 1e6) / 1e6;

function chartMeasureOf(walked: WalkMeasure): ChartMeasure {
  const ordinal = walked.measure;
  const label = /\bnumber="([^"]+)"/.exec(walked.measureAttributes)?.[1];
  const measure = Number.parseInt(label ?? '', 10);
  const nominal = walked.time?.quarters ?? null;
  const implicit = attribute(walked.measureAttributes, 'implicit') === 'yes';
  const length = walked.furthest;
  const bar = (status: BarStatus, barLength: number): ChartMeasure => ({ source: ordinal, label, measure, nominal, walked: length, implicit, status, length: barLength });
  if (length <= EPSILON) return bar('empty', nominal ?? 4);
  if (implicit) return bar('incomplete', length);
  if (nominal === null) return bar('unmetred', length);
  if (Math.abs(length - nominal) <= EPSILON) return bar('full', nominal);
  if (ordinal === 0 && length < nominal) return bar('pickup', length);
  return bar('mismatch', Math.max(length, nominal));
}

/**
 * Every chord symbol in the file, in written order (parts in page order, then
 * measures, then the bar's own order), each at its place; and the bars of the
 * part the symbols stand in (the first part holding one, else the first part),
 * one per measure in that part's order.
 *
 * A measure without a `number` attribute contributes no symbol, as before PH1 (the legacy `chartBars` input
 * must not move; recorded in the PH1 census as an adjacent question, not settled here).
 */
export function readHarmony(xml: string): { symbols: ChordSymbol[]; measures: ChartMeasure[] } {
  const symbols: ChordSymbol[] = [];
  const parts: WalkMeasure[][] = [];
  let harmonyPart: number | undefined;
  walkMeasures(xml, {
    child: ({ tag, inner, part, measure, measureAttributes, position, divisions }) => {
      if (tag !== 'harmony') return;
      const label = /\bnumber="([^"]+)"/.exec(measureAttributes)?.[1];
      if (label === undefined) return;
      // A harmony's offset moves it whatever its sound attribute (the reviewer, §2): a harmony has no
      // <sound> or <listening> of its own for `sound="no"` to leave behind.
      const shift = Number(/<offset(?=[\s>])[^>]*>\s*(-?[\d.]+)\s*<\/offset>/.exec(inner)?.[1] ?? '0');
      const offset = round6((position + (Number.isFinite(shift) ? shift : 0)) / divisions);
      const symbol = chordOf(inner, measure, label, offset);
      if (!symbol) return;
      harmonyPart ??= part;
      symbols.push(symbol);
    },
    measureEnd: (measure) => {
      (parts[measure.part] ??= []).push(measure);
    },
  });
  const measures = (parts[harmonyPart ?? 0] ?? []).map((measure) => chartMeasureOf(measure));
  return { symbols, measures };
}

/** Every chord symbol in the file, in written order, each at its place in its bar (`readHarmony`). */
export function parseHarmony(xml: string): ChordSymbol[] {
  return readHarmony(xml).symbols;
}

/** A stretch of a bar under one harmony. */
export interface ChartSegment {
  /** The harmony sounding; `null` before the first symbol, and where `conflict` names several. */
  symbol: ChordSymbol | null;
  /** Quarter notes from the bar's start. */
  start: number;
  /** Quarter notes. */
  duration: number;
  /** The harmony comes from before the bar (no symbol written here), not from a symbol at `start`. */
  carried: boolean;
  /** Two or more different harmonies written at one place, in written order: unresolved, never chosen by part order. */
  conflict?: ChordSymbol[];
}

/** One bar of the chart: its length and its segments in order. */
export interface ChartBar {
  /** The source measure's ordinal in its part, from 0: the bar's identity and its place in the chart's order. */
  source: number;
  /** The measure's `number` attribute as printed; `undefined` where it has none. Display metadata only. */
  label: string | undefined;
  /** The written number read as an integer (`NaN` where none parses). Display metadata only. */
  measure: number;
  length: number;
  status: BarStatus;
  segments: ChartSegment[];
}

/** What `chartSegments` could not place as written, for the census and for a disposition before a consumer uses it. */
export interface ChartReport {
  /** Exact duplicates (same root, pitch classes, bass and printed text at one place) folded into the first. */
  merged: ChordSymbol[];
  /** Different harmonies at one place. */
  conflicts: { source: number; label: string | undefined; measure: number; offset: number; symbols: ChordSymbol[] }[];
  /** Symbols before 0 or at or after the bar's end. */
  outside: { symbol: ChordSymbol; length: number }[];
  /** Symbols whose source measure the part the bars come from does not have (another part with more measures): in no bar. */
  unplaced: ChordSymbol[];
}

const sameChord = (a: ChordSymbol, b: ChordSymbol): boolean =>
  a.text === b.text && a.root === b.root && a.bass === b.bass && [...a.pitchClasses].sort((x, y) => x - y).join() === [...b.pitchClasses].sort((x, y) => x - y).join();

/**
 * One bar per source measure of the part the symbols stand in, in source order (never the written numbers'
 * order, count or uniqueness), each an ordered list of segments in quarter notes:
 *
 * - a symbol at 0 opens the bar; otherwise a `carried` segment holding the
 *   harmony sounding at the end of the bar before (nothing, in bar 1: the chart
 *   does not wrap a chorus's last chord round to the top) runs to the first
 *   symbol, or through the bar where it has none;
 * - every symbol at a different place is its own segment, an identical
 *   restatement included (it can mark harmonic rhythm or a re-strike);
 * - an exact duplicate at one place merges into the first, and is reported;
 *   different harmonies at one place make one segment naming all of them in
 *   `conflict` and no `symbol`, and are reported;
 * - a symbol outside its bar gets no segment of its own and is never clamped:
 *   one before 0 sounds before the barline, so it is what this bar carries until
 *   its first symbol; one at or after the bar's end sounds from the next
 *   barline, so it is what the next bar carries until its first symbol; both
 *   are reported in `outside`.
 *
 * A bar's length is its measure's. A symbol is placed by its `source` ordinal alone, so a repeated, suffixed
 * or non-numeric written number never merges, folds or loses a bar; a symbol whose source measure the part has
 * not is reported in `unplaced`, never drawn on a bar of its own.
 */
export function chartSegments(symbols: readonly ChordSymbol[], measures: readonly ChartMeasure[]): { bars: ChartBar[]; report: ChartReport } {
  const report: ChartReport = { merged: [], conflicts: [], outside: [], unplaced: [] };
  const bars: ChartBar[] = [];
  const bySource = new Map<number, ChordSymbol[]>();
  for (const symbol of symbols) {
    const here = bySource.get(symbol.source);
    if (here) here.push(symbol);
    else bySource.set(symbol.source, [symbol]);
  }
  const known = new Set(measures.map((measure) => measure.source));
  for (const symbol of symbols) if (!known.has(symbol.source)) report.unplaced.push(symbol);
  let sounding: { symbol: ChordSymbol | null; conflict?: ChordSymbol[] } = { symbol: null };
  for (const info of measures) {
    const length = info.length;
    // One event per place: exact duplicates merged, different harmonies a conflict.
    const places = new Map<number, ChordSymbol[]>();
    let before: ChordSymbol | undefined;
    let after: ChordSymbol | undefined;
    for (const symbol of bySource.get(info.source) ?? []) {
      if (symbol.offset < -EPSILON) {
        // Sounds before this barline: the latest such symbol is what this bar opens on until its own first symbol.
        report.outside.push({ symbol, length });
        if (!before || symbol.offset >= before.offset) before = symbol;
        continue;
      }
      if (symbol.offset >= length - EPSILON) {
        // Sounds from the next barline: the latest such symbol is what the next bar carries.
        report.outside.push({ symbol, length });
        if (!after || symbol.offset >= after.offset) after = symbol;
        continue;
      }
      const at = Math.max(0, symbol.offset);
      const here = places.get(at);
      if (here) here.push(symbol);
      else places.set(at, [symbol]);
    }
    if (before) sounding = { symbol: before };
    const events = [...places.entries()]
      .sort(([a], [b]) => a - b)
      .map(([start, written]) => {
        const distinct: ChordSymbol[] = [];
        for (const symbol of written) {
          if (distinct.some((kept) => sameChord(kept, symbol))) report.merged.push(symbol);
          else distinct.push(symbol);
        }
        if (distinct.length > 1) report.conflicts.push({ source: info.source, label: info.label, measure: info.measure, offset: start, symbols: distinct });
        return { start, harmony: distinct.length > 1 ? { symbol: null, conflict: distinct } : { symbol: distinct[0] ?? null } };
      });
    const segments: ChartSegment[] = [];
    const firstStart = events[0]?.start ?? length;
    if (firstStart > EPSILON) segments.push({ ...sounding, start: 0, duration: round6(firstStart), carried: true });
    events.forEach((event, i) => {
      const end = events[i + 1]?.start ?? length;
      segments.push({ ...event.harmony, start: event.start, duration: round6(end - event.start), carried: false });
    });
    const last = segments[segments.length - 1];
    sounding = after ? { symbol: after } : last ? { symbol: last.symbol, ...(last.conflict ? { conflict: last.conflict } : {}) } : sounding;
    bars.push({ source: info.source, label: info.label, measure: info.measure, length, status: info.status, segments });
  }
  return { bars, report };
}

/**
 * One entry per bar, so the chart is a grid and not a ragged list.
 *
 * A bar with no `<harmony>` of its own repeats the last one — which is what
 * the printed page means by leaving it blank.
 */
export function chartBars(symbols: ChordSymbol[], measureCount: number): (ChordSymbol | null)[] {
  const bars: (ChordSymbol | null)[] = [];
  let current: ChordSymbol | null = null;
  for (let measure = 1; measure <= measureCount; measure += 1) {
    const here = symbols.filter((symbol) => symbol.measure === measure);
    if (here.length > 0) current = here[0] as ChordSymbol;
    bars.push(current);
  }
  return bars;
}

/** How much of the chart chord is in what was played, 0–1. */
export function chordMatch(expected: ChordSymbol | null, playedPitchClasses: readonly number[]): number {
  if (!expected || playedPitchClasses.length === 0) return 0;
  const played = new Set(playedPitchClasses.map((pitch) => ((pitch % 12) + 12) % 12));
  const hits = expected.pitchClasses.filter((pitchClass) => played.has(pitchClass)).length;
  return hits / expected.pitchClasses.length;
}
