/**
 * The app's one reading of a bar's beat, and the chord chart's count of each bar by it (MT1).
 *
 * `isCompound`, `beatLength` and `barLength` moved here from `demands/detect.ts` unchanged, so the chart reads a
 * metre by the rule the demand detectors already read it by, never a second one (`docs/prompts/runs/
 * curriculum-review-2026-10-05/briefs/seam-chart-metre.md`, "Where the metre reading lives"). `detect.ts` imports
 * them from here; its behaviour and tests are unchanged.
 *
 * The chart half (`countOf`, `chartBarCounts`, `chartTiming`) is the reviewer's MT1 ruling
 * (`docs/review/responses/ph1-g6a-landing.md` §4): the click, the bar tracker and the plain chord Comp follow
 * each bar's felt beat (2/4 two quarters, 3/4 three, 4/4 four, 5/4 five, 6/8 two dotted quarters, 12/8 four
 * dotted quarters, 2/2 two halves); the accent stays on beat 1; the tempo field counts that beat and names its
 * unit whenever it is not a quarter; Bass + drums stays exactly as it was in 4/4 and is refused in every other
 * metre, because no cited groove exists for any other. music21 is the witness for every metre in a bundled chart
 * (`docs/prompts/runs/MT1/`), with one explained disagreement, 3/8, outside the corpus.
 */

import type { ChartMeasure } from './harmony';
import type { WalkTime } from './measureWalk';

/** A time signature as two numbers: the numerator's total and the beat type. */
export interface Metre {
  beats: number;
  beatType: number;
}

/**
 * Compound time: more than one beat of three eighths — 6/8, 9/8, 12/8, and the rarer 15/8 and 18/8.
 * 3/8 is one group of three eighths, commonly counted as simple triple, three eighth-note beats, and
 * is read so (L120b; the reviewer's ruling on L120a, `docs/review/responses/0bcd3be0.md`: 3/8 read
 * as compound was this rule's error). The model carries no grouping fact (`TimeSignatureEntry`), so
 * none is read here. The one reading of a bar's beat: `beatLength`, and with it `syncopation` and
 * `dottedQuarters` in `demands/detect.ts`, read 3/8 by it too. The generator's and the MIDI importer's
 * own copies of the older rule (`sightReading.ts`, `readingControls.ts`, `readMidi.ts`) include 3/8;
 * nothing the app generates is in 3/8.
 */
export function isCompound(metre: Metre): boolean {
  return metre.beatType === 8 && metre.beats > 3 && metre.beats % 3 === 0;
}

/** The felt beat, in quarter-note beats: a dotted quarter in compound time. */
export function beatLength(metre: Metre): number {
  return isCompound(metre) ? 1.5 : 4 / metre.beatType;
}

/** The bar, in quarter notes. */
export function barLength(metre: Metre): number {
  return (metre.beats * 4) / metre.beatType;
}

// --- the chord chart's count (MT1) ---------------------------------------------------------------------------

/** How the chord chart counts one bar. */
export interface BarCount {
  /** Clicks to the bar: the bar's felt beats. */
  beats: number;
  /** The felt beat, in quarter notes (1.5 a dotted quarter, 2 a half). */
  beatQuarters: number;
  /** The bar's nominal length in quarter notes (its time signature's, a pickup's too: MT1 leaves pickups alone). */
  barQuarters: number;
  /** The signature as written ("6/8", "3+2/4"); `null` where none is in force, which counts as today's 4/4. */
  written: string | null;
}

/** No time signature in force (or `<senza-misura>`): today's four quarter beats, the model's own fallback. */
export const UNMETRED_COUNT: BarCount = { beats: 4, beatQuarters: 1, barQuarters: 4, written: null };

const EPSILON = 1e-6;

/**
 * A bar's count from the signature in force over it (`ChartMeasure.signature`).
 *
 * One signature pair is read by `beatLength` over the numerator's total ("3+2" is 5). Pairs with one beat type
 * add their numerators the same way. Pairs with different beat types (no bundled chart has one) count the
 * shortest beat type. A beat count that does not come out whole (no bundled chart has one) counts quarters.
 */
export function countOf(signature: WalkTime | null | undefined): BarCount {
  const barQuarters = signature?.quarters;
  if (!signature || barQuarters === undefined) return UNMETRED_COUNT;
  const numerators = signature.beats.map((written) => written.split('+').reduce((sum, part) => sum + Number(part.trim()), 0));
  const types = signature.beatTypes.map(Number);
  const written = signature.beats.map((beats, i) => `${beats}/${signature.beatTypes[i] ?? ''}`).join(' + ');
  const uniform = types.every((type) => type === types[0]);
  const beatType = uniform ? (types[0] ?? 4) : Math.max(...types);
  const total = numerators.reduce((sum, n) => sum + n, 0);
  let beatQuarters = uniform ? beatLength({ beats: total, beatType }) : 4 / beatType;
  let beats = barQuarters / beatQuarters;
  if (Math.abs(beats - Math.round(beats)) > EPSILON || Math.round(beats) < 1) {
    beatQuarters = 1;
    beats = Math.max(1, Math.round(barQuarters));
  }
  return { beats: Math.round(beats), beatQuarters, barQuarters, written };
}

/** Four quarter beats to a four-quarter bar: the one count Bass + drums has a pattern for (`barSchedule`, 4/4). */
export function isFourFour(count: BarCount): boolean {
  return count.beats === 4 && count.beatQuarters === 1 && count.barQuarters === 4;
}

/**
 * The count of each bar the chart draws today.
 *
 * The chart still draws the legacy `chartBars` grid until PH2: bar `i` shows the first chord symbol written in a
 * measure numbered `i + 1`. Its count is therefore the signature in force at the first source measure of the
 * harmony part printed with that number (the same measure the chord came from); a bar with no such measure (the
 * grid's bars past the end, a gap in the numbering) carries the bar before's, and a first bar with none takes the
 * part's first measure's. The signature itself lives on `ChartMeasure`, keyed by the source-measure identity
 * PH1a added; the printed number only picks which source measure a legacy bar is, as `chartBars` does. When PH2
 * draws one bar per source measure, this becomes `countOf(measure.signature)` per measure.
 */
export function chartBarCounts(measures: readonly ChartMeasure[], barCount: number): BarCount[] {
  const byNumber = new Map<number, ChartMeasure>();
  for (const measure of measures) if (Number.isFinite(measure.measure) && !byNumber.has(measure.measure)) byNumber.set(measure.measure, measure);
  const counts: BarCount[] = [];
  let carried = countOf(measures[0]?.signature);
  for (let i = 0; i < barCount; i += 1) {
    const measure = byNumber.get(i + 1);
    if (measure) carried = countOf(measure.signature);
    counts.push(carried);
  }
  return counts;
}

/** The beat's unit, in words, for the tempo field; `null` for a quarter, where the field says "bpm" as it always has. */
export function beatUnitWords(beatQuarters: number): string | null {
  const words: Record<string, string> = {
    '0.25': 'sixteenth notes',
    '0.5': 'eighth notes',
    '0.75': 'dotted eighths',
    '1.5': 'dotted quarters',
    '2': 'half notes',
    '3': 'dotted halves',
    '4': 'whole notes',
  };
  if (Math.abs(beatQuarters - 1) <= EPSILON) return null;
  return words[String(beatQuarters)] ?? `beats of ${String(beatQuarters)} quarter notes`;
}

/** Everything the chart's timing reads from its bars (MT1): one pure answer, so the corpus can be checked without a browser. */
export interface ChartTiming {
  counts: BarCount[];
  /** The first bar's beat, in quarter notes: the tempo field counts it. */
  beatUnit: number;
  /** The tempo field's label: "bpm", or "bpm (dotted quarters)" where the beat is not a quarter. */
  tempoLabel: string;
  /** The field's accessible name. */
  tempoName: string;
  /** Bass + drums offered: every bar counted in 4/4 (or with no signature, today's 4/4). */
  backingOffered: boolean;
  /** The time signatures, as written, that refuse it, in order of first appearance. */
  refusedBy: string[];
}

export function chartTiming(counts: BarCount[]): ChartTiming {
  const first = counts[0] ?? UNMETRED_COUNT;
  const unit = beatUnitWords(first.beatQuarters);
  const refusedBy: string[] = [];
  for (const count of counts) {
    if (isFourFour(count) || count.written === null) continue;
    if (!refusedBy.includes(count.written)) refusedBy.push(count.written);
  }
  return {
    counts,
    beatUnit: first.beatQuarters,
    tempoLabel: unit === null ? 'bpm' : `bpm (${unit})`,
    tempoName: unit === null ? 'Tempo' : `Tempo, in ${unit} a minute`,
    backingOffered: refusedBy.length === 0,
    refusedBy,
  };
}

/**
 * The tempo field's opening value: the catalog's quarter notes a minute in the first bar's beat, clamped to the
 * field's 40-240 as a typed value is. In a quarter-note beat it is exactly today's value; a converted value is
 * rounded to three places, so 81 quarters in 6/8 reads 54 and not 53.99999999999999.
 */
export function tempoFieldDefault(tempoBpm: number, beatUnit: number): number {
  const perBeat = beatUnit === 1 ? tempoBpm : Math.round((tempoBpm / beatUnit) * 1000) / 1000;
  return Math.min(240, Math.max(40, perBeat));
}

/** The comp's hold, in quarter notes: three quarters of the bar (4/4's three beats exactly), so it ends before the next downbeat. */
export function compHoldQuarters(count: BarCount): number {
  return 0.75 * count.barQuarters;
}
