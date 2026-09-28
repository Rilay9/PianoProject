/**
 * What the sight-reading generator writes over hundreds of seeds, per level
 * and per shipped row, reported and bounded (D1; Part 15 §12, G22, Q41 cases
 * 12 and 13).
 *
 * A level can pass every single-phrase invariant with a terrible
 * distribution: every phrase legal, and most of them stopping on an eighth, or
 * rocking between two notes. So this measures the phrases as written — the
 * MusicXML read back (`helpers/sightReadingPage.ts`), the scorer's own predicates
 * (`sightReadingScore.ts`) — over a deterministic seed set per configuration:
 * each level's own table, and each of the nine rows as the app writes it at
 * each rung listing it (`readingOptions` held to what the rung has taught,
 * C4c). It measures the newest version (`SIGHT_READING_LATEST`), the one D1
 * built, which since D1a is also the one the app writes
 * (`SIGHT_READING_IN_FORCE`, Entry 97; D1 kept the app on version 1 until the
 * history kept the version, Entry 94).
 *
 * **The bounds are hypotheses with their reasons** (`BOUNDS`, `GUARDS`), set
 * from the distributions of version 1 (the committed generator, note for note)
 * and version 2, and never so loose that version 1 passes the ones D1 claims to
 * move: phrase ending, contour, and S26's leaps and off-beat ties, which are
 * red on the committed generator (Entry 94's red lines). The rest are guards
 * that version 1 passes too: the key and metre as asked, every promise on the
 * page, the level's density kept, no degeneration into repeated notes, the
 * strong beats' harmony kept at 5–7, and no collapse into the same few
 * phrases. No bound asks for one form: an arch, a valley, an ascent and a
 * descent all count as one contour.
 *
 * **The report** (`D1_TABLE=<file> npx vitest run tests/unit/sightReadingDistribution.test.ts`)
 * writes every measure per configuration as a table; `D1_VERSION=1` measures
 * version 1 instead, for the table's "before" column (never set in CI). The
 * numbers are this generator's, from these seeds: a report of what it writes,
 * not a product fact.
 *
 * **Budget.** A configuration writes its phrases once, in its own `beforeAll`
 * — 200 (a level) or 150 (a row at a rung) phrases, each chosen from sixteen
 * valid candidates — and every case reads those. The work is fixed; the time
 * is the machine's share of a processor, which under a full parallel run on a
 * loaded machine has been many times the file alone (H0, Entry 87). So each
 * configuration owns {@link CONFIG_BUDGET_MS}, never a global timeout.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  generateSightReading,
  levelFacts,
  maxFifthsFor,
  phraseRules,
  sightReadingReport,
  SIGHT_READING_LATEST,
  type SightReadingOptions,
  type TimeSig,
} from '../../src/engine/sightReading';
import {
  arrives,
  arrivesOnStrongBeat,
  contourShapes,
  endsOnTonic,
  harmony,
  hardViolations,
  isCompound,
  landsOnBeatOne,
  motifFacts,
  oneContour,
  oscillating,
  scorePhrase,
  sounded,
  type PhraseModel,
} from '../../src/engine/sightReadingScore';
import { readingOptions, taughtAtRung } from '../../src/curriculum/session';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import { phraseFromXml, readWritten, type WrittenPhrase } from './helpers/sightReadingPage';

const CONFIG_BUDGET_MS = 120_000;
const VERSION = process.env.D1_VERSION === '1' ? 1 : SIGHT_READING_LATEST;
const LEVEL_SEEDS = Array.from({ length: 200 }, (_, i) => 1 + i * 7919);
const ROW_SEEDS = Array.from({ length: 150 }, (_, i) => 3 + i * 6271);

const CONTENT = join(process.cwd(), 'public', 'content');
const SOURCE = join(process.cwd(), '..', 'content');
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const authored = (JSON.parse(readFileSync(join(SOURCE, 'catalog.static.json'), 'utf8')) as CatalogItem[]).filter(
  (row) => row.drill?.kind === 'sight-reading',
);
const ORDER: string[] = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.map((lesson: Lesson) => lesson.id)));
const rungsListing = (id: string): string[] =>
  ORDER.filter((rungId) =>
    curriculum.stages.some((stage) =>
      stage.units.some((unit) =>
        unit.lessons.some((lesson) => lesson.id === rungId && (lesson.exerciseOptions.includes(id) || lesson.songOptions.includes(id))),
      ),
    ),
  );

interface Config {
  name: string;
  /** `level N`, or the row's short id: the key of its bounds. */
  key: string;
  level: number;
  seeds: readonly number[];
  options: (seed: number) => SightReadingOptions;
}

/** Each level's own table at the hands and length of the rows that use it. */
const LEVEL_SHAPES: Record<number, { hands: 'R' | 'both'; bars: number }> = {
  1: { hands: 'R', bars: 4 },
  2: { hands: 'both', bars: 4 },
  3: { hands: 'both', bars: 8 },
  4: { hands: 'both', bars: 8 },
  5: { hands: 'both', bars: 8 },
  6: { hands: 'both', bars: 8 },
  7: { hands: 'both', bars: 8 },
};

const CONFIGS: Config[] = [
  ...[1, 2, 3, 4, 5, 6, 7].map((level): Config => ({
    name: `level ${String(level)}`,
    key: `level ${String(level)}`,
    level,
    seeds: LEVEL_SEEDS,
    options: (seed) => ({ level: level as SightReadingOptions['level'], ...(LEVEL_SHAPES[level] as object), seed }),
  })),
  ...authored.flatMap((row) =>
    rungsListing(row.id).map((rung): Config => ({
      name: `${row.id.replace('drill.reading.', '')}@${rung}`,
      key: row.id.replace('drill.reading.', ''),
      level: Number(row.drill?.params?.level ?? 1),
      seeds: ROW_SEEDS,
      options: (seed) => readingOptions(row, undefined, seed, taughtAtRung(curriculum, rung)),
    })),
  ),
];

// --- one phrase, measured -------------------------------------------------------------

const CONTROL_PROMISES = ['skips', 'eighths', 'syncopation', 'triplets', 'accidentals', 'ties', 'dottedQuarters', 'ledger', 'leaps', 'sixteenths'] as const;
type Promised = (typeof CONTROL_PROMISES)[number];

/**
 * How often each promisable demand is on the page of one phrase, counted on
 * the written notes (the detectors, `detect.ts`, read the engine's model and are
 * what the promise suite holds the rows to; this is the report's density).
 */
function promisedCounts(p: PhraseModel, leftHandMelody: boolean): Record<Promised, number> {
  const events = sounded(p);
  const steps = events.map((e) => e.step);
  const sizes = steps.slice(1).map((step, i) => Math.abs(step - (steps[i] as number)));
  const notes = p.melody.filter((n) => n.midi !== null);
  const beat = 12;
  const key = new Set([0, 2, 4, 5, 7, 9, 11].map((pc) => (pc + (((p.fifths * 7) % 12) + 12)) % 12));
  return {
    skips: sizes.filter((s) => s === 2).length,
    leaps: sizes.filter((s) => s >= 3).length,
    eighths: notes.filter((n) => n.duration === 6 && !n.tuplet).length,
    triplets: notes.filter((n) => n.tuplet).length,
    sixteenths: notes.filter((n) => n.duration === 3 && !n.tuplet).length,
    dottedQuarters: isCompound(p.metre) ? 0 : notes.filter((n) => n.duration === 18 && !n.tuplet).length,
    ties: p.melody.filter((n) => n.tie === 'start').length,
    // Below level 5 the eighth–quarter–eighth figure (a quarter on an "and"); from 5 a bar opening on its eighth rest.
    syncopation:
      p.level >= 5
        ? p.melody.filter((n) => n.designed).length
        : notes.filter((n) => n.duration === beat && n.at % beat === beat / 2 && !n.tuplet).length,
    accidentals: notes.filter((n) => !key.has((n.midi as number) % 12)).length,
    ledger: notes.filter((n) => (leftHandMelody ? (n.midi as number) >= 62 : (n.midi as number) <= 59)).length,
  };
}

/** The left hand's pattern, read from its first bar. */
function leftHandPattern(page: WrittenPhrase): string {
  if (page.staves === 1) return 'none';
  const bar = page.lines[1][0] ?? [];
  const struck = bar.filter((n) => n.midi !== null && n.chord !== true);
  if (struck.length === 0) return 'none';
  if (bar.some((n) => n.chord === true)) return 'chord';
  if (struck.length === 1) return 'whole';
  if (struck.every((n) => n.duration === 6)) return 'alberti';
  if (struck.length >= 4 && struck[1]?.midi === struck[3]?.midi) return 'broken';
  return 'walking';
}

/** What the generator's own report says of one phrase: the search and the choice. */
interface Internals {
  firstValid: number;
  attempts: number;
  /** The kept phrase's score, from the page. */
  total: number;
  /** The kept phrase's score as the generator had it when it chose. */
  reported: number | undefined;
  violations: number;
}

interface Measured {
  asked: boolean;
  fifths: number;
  metre: string;
  intervals: number[];
  eventsPerBar: number;
  rests: number;
  written: number;
  repeats: number;
  moves: number;
  oneContour: boolean;
  units: number;
  unitsOne: number;
  oscillating: boolean;
  arrives: boolean;
  strong: boolean;
  beatOne: boolean;
  tonic: boolean;
  harmony: number | undefined;
  motif: boolean;
  promised: Partial<Record<Promised, number>>;
  bars: number;
  chromatic: boolean;
  span: number;
  leftHand: string;
  fingerprint: string;
  internals: Internals | undefined;
}

function measure(config: Config, seed: number): Measured {
  const options = { ...config.options(seed), version: VERSION } as SightReadingOptions;
  const facts = levelFacts(config.level);
  const leftHandMelody = options.hands === 'L' && facts.hands === 'R';
  // The committed generator has no report: its phrases are measured from the
  // page alone, and the machinery's case says what is missing.
  const report = typeof sightReadingReport === 'function' ? sightReadingReport(options) : undefined;
  const xml = report ? report.result.musicXml : generateSightReading(options).musicXml;
  // The page measures need none of the generator's rules: its cap and its rests only weigh the score (below).
  const p = phraseFromXml(xml, { level: config.level, maxLeap: 99, restsAllowed: false, leftHandMelody });
  const page = readWritten(xml);
  const events = sounded(p);
  const steps = events.map((e) => e.step);
  const sizes = steps.slice(1).map((step, i) => Math.abs(step - (steps[i] as number)));
  const intervals = [0, 0, 0, 0, 0, 0];
  for (const size of sizes) intervals[Math.min(5, size)] = (intervals[Math.min(5, size)] ?? 0) + 1;
  const keys = Array.isArray(options.fifths) ? [...(options.fifths as readonly number[])] : [(options.fifths as number | undefined) ?? 0];
  const clamp = (k: number): number => Math.max(-maxFifthsFor(config.level), Math.min(maxFifthsFor(config.level), k));
  const metres = (Array.isArray(options.timeSig) ? options.timeSig : [options.timeSig ?? { beats: 4, beatType: 4 }]) as TimeSig[];
  const shapes = contourShapes(p);
  const counts = promisedCounts(p, leftHandMelody);
  const compound = isCompound(p.metre);
  const promised: Partial<Record<Promised, number>> = {};
  for (const name of CONTROL_PROMISES) {
    if (options[name] !== true) continue;
    if (compound && (name === 'syncopation' || name === 'triplets' || name === 'dottedQuarters')) continue;
    promised[name] = counts[name];
  }
  let internals: Internals | undefined;
  if (report) {
    const rules = phraseRules(options);
    const ruled: PhraseModel = { ...p, maxLeap: rules.maxLeap, restsAllowed: rules.restsAllowed };
    const valid = report.candidates.filter((c) => c.valid).map((c) => c.attempt);
    internals = {
      firstValid: (valid.length > 0 ? Math.min(...valid) : report.chosen) + 1,
      attempts: report.attempts,
      total: scorePhrase(ruled).total,
      reported: report.candidates.find((c) => c.attempt === report.chosen)?.total,
      violations: hardViolations(ruled, rules).length,
    };
  }
  const midis = events.map((e) => e.midi);
  return {
    asked: keys.map(clamp).includes(p.fifths) && metres.some((m) => m.beats === p.metre.beats && m.beatType === p.metre.beatType),
    fifths: p.fifths,
    metre: `${String(p.metre.beats)}/${String(p.metre.beatType)}`,
    intervals,
    eventsPerBar: events.length / p.bars,
    rests: p.melody.filter((n) => n.midi === null).length,
    written: p.melody.length,
    repeats: sizes.filter((s, i) => s === 0 && (events[i + 1]?.midi ?? -1) === (events[i]?.midi ?? -2)).length,
    moves: sizes.length,
    oneContour: oneContour(p),
    units: shapes.length,
    unitsOne: shapes.filter((s) => s === 'ascent' || s === 'descent' || s === 'arch' || s === 'valley').length,
    oscillating: oscillating(p),
    arrives: arrives(p),
    strong: arrivesOnStrongBeat(p),
    beatOne: landsOnBeatOne(p),
    tonic: endsOnTonic(p),
    harmony: harmony(p),
    motif: motifFacts(p).transformed,
    promised,
    bars: p.bars,
    chromatic: counts.accidentals > 0,
    span: midis.length > 0 ? Math.max(...midis) - Math.min(...midis) : 0,
    leftHand: leftHandPattern(page),
    fingerprint: JSON.stringify([page.fifths, page.metre, page.lines]),
    internals,
  };
}

// --- the distribution --------------------------------------------------------------------

interface Distribution {
  n: number;
  asked: number;
  keys: string;
  metres: string;
  intervals: number[];
  eventsPerBar: number;
  restDensity: number;
  repeatedNotes: number;
  oneContour: number;
  unitsOne: number;
  oscillating: number;
  arrives: number;
  strong: number;
  beatOne: number;
  tonic: number;
  harmony: number | null;
  motif: number;
  promisedPresent: Partial<Record<Promised, number>>;
  promisedPerBar: Partial<Record<Promised, number>>;
  chromatic: number;
  spanMedian: number;
  spanMax: number;
  leftHand: string;
  nearDuplicates: number;
  /** Absent where the generator reports no search (the committed generator). */
  firstValidMedian?: number;
  firstValidMax?: number;
  attemptsMedian?: number;
  attemptsMax?: number;
  scoreMedian?: number;
  scoreWorst?: number;
  violations?: number;
}

const share = (xs: readonly boolean[]): number => (xs.length === 0 ? 0 : xs.filter(Boolean).length / xs.length);
const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
const median = (xs: readonly number[]): number => {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted.length === 0 ? 0 : (sorted[Math.floor((sorted.length - 1) / 2)] as number);
};
const tally = (xs: readonly string[]): string => {
  const counts = new Map<string, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${String(Math.round((100 * v) / xs.length))}%`)
    .join(', ');
};

function distributionOf(all: readonly Measured[]): Distribution {
  const intervals = [0, 1, 2, 3, 4, 5].map((i) => all.reduce((sum, m) => sum + (m.intervals[i] ?? 0), 0));
  const totalIntervals = intervals.reduce((a, b) => a + b, 0) || 1;
  const promisedNames = [...new Set(all.flatMap((m) => Object.keys(m.promised)))] as Promised[];
  const seen = new Map<string, number>();
  for (const m of all) seen.set(m.fingerprint, (seen.get(m.fingerprint) ?? 0) + 1);
  const harmonies = all.map((m) => m.harmony).filter((h): h is number => h !== undefined);
  const inside = all.map((m) => m.internals).filter((i): i is Internals => i !== undefined);
  return {
    n: all.length,
    asked: share(all.map((m) => m.asked)),
    keys: tally(all.map((m) => String(m.fifths))),
    metres: tally(all.map((m) => m.metre)),
    intervals: intervals.map((c) => c / totalIntervals),
    eventsPerBar: mean(all.map((m) => m.eventsPerBar)),
    restDensity: all.reduce((s, m) => s + m.rests, 0) / (all.reduce((s, m) => s + m.written, 0) || 1),
    repeatedNotes: all.reduce((s, m) => s + m.repeats, 0) / (all.reduce((s, m) => s + m.moves, 0) || 1),
    oneContour: share(all.map((m) => m.oneContour)),
    unitsOne: all.reduce((s, m) => s + m.unitsOne, 0) / (all.reduce((s, m) => s + m.units, 0) || 1),
    oscillating: share(all.map((m) => m.oscillating)),
    arrives: share(all.map((m) => m.arrives)),
    strong: share(all.map((m) => m.strong)),
    beatOne: share(all.map((m) => m.beatOne)),
    tonic: share(all.map((m) => m.tonic)),
    harmony: harmonies.length === 0 ? null : mean(harmonies),
    motif: share(all.map((m) => m.motif)),
    promisedPresent: Object.fromEntries(
      promisedNames.map((name) => [name, share(all.filter((m) => m.promised[name] !== undefined).map((m) => (m.promised[name] ?? 0) > 0))]),
    ),
    promisedPerBar: Object.fromEntries(
      promisedNames.map((name) => [name, median(all.filter((m) => m.promised[name] !== undefined).map((m) => (m.promised[name] ?? 0) / m.bars))]),
    ),
    chromatic: share(all.map((m) => m.chromatic)),
    spanMedian: median(all.map((m) => m.span)),
    spanMax: Math.max(...all.map((m) => m.span)),
    leftHand: tally(all.map((m) => m.leftHand)),
    nearDuplicates: share(all.map((m) => (seen.get(m.fingerprint) ?? 0) > 1)),
    ...(inside.length === all.length
      ? {
          firstValidMedian: median(inside.map((i) => i.firstValid)),
          firstValidMax: Math.max(...inside.map((i) => i.firstValid)),
          attemptsMedian: median(inside.map((i) => i.attempts)),
          attemptsMax: Math.max(...inside.map((i) => i.attempts)),
          scoreMedian: median(inside.map((i) => i.total)),
          scoreWorst: Math.min(...inside.map((i) => i.total)),
          violations: share(inside.map((i) => i.violations > 0)),
        }
      : {}),
  };
}

// --- the bounds ----------------------------------------------------------------------------

interface Bound {
  /** Least share arriving by the rule (the final event on the last downbeat, or begun there and held a felt beat). */
  arrives?: number;
  /** Least share arriving on a strong beat (level 1, where every note is a beat long and every phrase arrives by the rule). */
  strong?: number;
  /** Least share of four-bar units with one contour. */
  unitsOne: number;
  /** Most rocking between two notes for five notes or more (claimed at levels 1–2 only). */
  oscillatingAtMost?: number;
  /** Least melody notes per bar: nine tenths of version 1's, so the scorer never makes the level easier. */
  eventsPerBarAtLeast: number;
  /** Most near-duplicate pages. */
  nearDuplicatesAtMost: number;
  /** Least share of strong beats on a chord tone (5–7, where the level targets them). */
  chordTonesAtLeast?: number;
}

/**
 * The bounds, per level and per row, each between version 1's value on these
 * seeds and version 2's (Entry 94 has both columns), with its reason.
 *
 * - **arrives** (levels 2–7): version 1 ends wherever the bar ran out —
 *   about three phrases in five arrive at levels 2–4, one to two in five at
 *   5–7, one in five at level 7's own table. Version 2 arrives in nineteen of
 *   twenty or more (87 % at level 7's own, whose sixteenths and triplets make an
 *   arriving candidate rarer). Each bound sits under version 2's value by
 *   several points (seed-set noise at 150–200 phrases is two to three) and
 *   far above version 1's.
 * - **strong** (level 1 and its two rows): every level-1 note is a beat or
 *   longer, so every phrase arrives by the rule at either version, and D1
 *   claims no change there; the claim is where the last note falls — on the
 *   downbeat or from beat three, against a quarter on beat four: about seven in
 *   ten at version 1, all at version 2.
 * - **unitsOne**: one contour in each four bars. Version 1's walk manages it
 *   in four to nine units in ten at level 1, half at level 2, a fifth to a
 *   third at 3–5, a tenth at 6–7; version 2 in all at 1–2 and roughly twice
 *   version 1's at 3–7. The walk, not the candidate count, is the ceiling at
 *   6–7 (three times the candidates moved level 7's own from 13 % to 14 % and
 *   level 6's from 22 % to 26 %), so those bounds are modest and say so. Row 3's 6/8 phrases and row 7's
 *   sixteenths kept out give those rows their own values.
 * - **oscillatingAtMost** (levels 1–2): a line rocking a b a b a is a drill,
 *   not a phrase; version 1 does it in a fifth of its level-1 and a quarter of
 *   its level-2 phrases, version 2 in almost none at level 1 and a tenth at 2.
 *   Not claimed at 3–7, where a five-note neighbour figure inside a long line is
 *   ordinary and both versions sit between one and two in ten. On 2.2 the
 *   right-hand row is held inside C position, five notes, and a line of five
 *   notes kept from sitting on one of them rocks more often: 27 % at version 1,
 *   18 % at version 2, bounded at 22 %.
 * - **eventsPerBarAtLeast**: the guard that found the scorer drifting to
 *   sparser phrases (level 2 fell to 3.5 notes a bar before the choice kept
 *   the level's density, `chooseCandidate`); version 2 is within a twentieth
 *   of version 1 on every level's own table and within a tenth on every row
 *   (1.5's and the level-2 rows' lose most, about a note in four bars).
 * - **nearDuplicatesAtMost**: two seeds writing the same page. None at levels
 *   2–7 at either version. Level 1's space is small (four bars of three lengths
 *   over five notes): version 1 repeats a page in 7 % (13 % on the left-hand
 *   row), version 2 in 17 % and 13 % — the cost of shaping so small a space,
 *   bounded so it cannot grow, and named in Entry 94.
 * - **chordTonesAtLeast** (5–7): the strong beats on chord tones, which version
 *   1's snap did at every strong beat and version 2's move within the cap still
 *   does; the guard that the leap cap was not bought with the harmony.
 */
const BOUNDS: Record<string, Bound> = {
  'level 1': { strong: 0.95, unitsOne: 0.95, oscillatingAtMost: 0.06, eventsPerBarAtLeast: 2.07, nearDuplicatesAtMost: 0.2 },
  'level 2': { arrives: 0.9, unitsOne: 0.9, oscillatingAtMost: 0.15, eventsPerBarAtLeast: 3.69, nearDuplicatesAtMost: 0.02 },
  'level 3': { arrives: 0.9, unitsOne: 0.32, eventsPerBarAtLeast: 3.6, nearDuplicatesAtMost: 0.02 },
  'level 4': { arrives: 0.9, unitsOne: 0.24, eventsPerBarAtLeast: 3.51, nearDuplicatesAtMost: 0.02 },
  'level 5': { arrives: 0.88, unitsOne: 0.28, eventsPerBarAtLeast: 2.88, nearDuplicatesAtMost: 0.02, chordTonesAtLeast: 0.95 },
  'level 6': { arrives: 0.85, unitsOne: 0.18, eventsPerBarAtLeast: 4.14, nearDuplicatesAtMost: 0.02, chordTonesAtLeast: 0.95 },
  'level 7': { arrives: 0.8, unitsOne: 0.1, eventsPerBarAtLeast: 5.22, nearDuplicatesAtMost: 0.02, chordTonesAtLeast: 0.95 },
  'sight-reading-1': { strong: 0.95, unitsOne: 0.95, oscillatingAtMost: 0.04, eventsPerBarAtLeast: 2.16, nearDuplicatesAtMost: 0.2 },
  'sight-reading-1-left': { strong: 0.95, unitsOne: 0.95, oscillatingAtMost: 0.06, eventsPerBarAtLeast: 2.07, nearDuplicatesAtMost: 0.2 },
  'sight-reading-2': { arrives: 0.9, unitsOne: 0.9, oscillatingAtMost: 0.18, eventsPerBarAtLeast: 3.78, nearDuplicatesAtMost: 0.02 },
  'sight-reading-2-right': { arrives: 0.9, unitsOne: 0.9, oscillatingAtMost: 0.22, eventsPerBarAtLeast: 3.78, nearDuplicatesAtMost: 0.02 },
  'sight-reading-3': { arrives: 0.9, unitsOne: 0.46, eventsPerBarAtLeast: 3.6, nearDuplicatesAtMost: 0.02 },
  'sight-reading-4': { arrives: 0.9, unitsOne: 0.29, eventsPerBarAtLeast: 3.6, nearDuplicatesAtMost: 0.02 },
  'sight-reading-5': { arrives: 0.88, unitsOne: 0.29, eventsPerBarAtLeast: 2.79, nearDuplicatesAtMost: 0.02, chordTonesAtLeast: 0.95 },
  'sight-reading-6': { arrives: 0.85, unitsOne: 0.19, eventsPerBarAtLeast: 4.23, nearDuplicatesAtMost: 0.02, chordTonesAtLeast: 0.95 },
  'sight-reading-7': { arrives: 0.85, unitsOne: 0.15, eventsPerBarAtLeast: 4.23, nearDuplicatesAtMost: 0.02, chordTonesAtLeast: 0.95 },
};

/**
 * On every configuration:
 * - `repeatedNotesAtMost`: repeated notes are a reading pattern, and past a
 *   third of the moves they are the "excessive arbitrary repetition" Part 15
 *   §9 names; version 1's worst configuration is near a quarter (2.2's row,
 *   held inside C position), version 2's near three tenths;
 * - `scoreFloor`: no configuration's worst chosen phrase below 0.3 (version
 *   1's worst sit near 0.2 at levels 3–7; version 2's lowest near 0.35);
 * - `attemptsAtMost`: the search within the redraw budget (C4d's 4096).
 */
const GUARDS = { repeatedNotesAtMost: 1 / 3, scoreFloor: 0.3, attemptsAtMost: 4096 };

// --- the suite -----------------------------------------------------------------------------

const REPORT: Record<string, Distribution> = {};

describe(`the sight-reading generator's distribution (version ${String(VERSION ?? 'as committed')})`, () => {
  for (const config of CONFIGS) {
    describe(config.name, () => {
      let measured: Measured[] = [];
      let d: Distribution;
      const bound = BOUNDS[config.key] as Bound;
      beforeAll(() => {
        measured = config.seeds.map((seed) => measure(config, seed));
        d = distributionOf(measured);
        REPORT[config.name] = d;
      }, CONFIG_BUDGET_MS);

      it('has its bounds', () => {
        expect(bound, `no bounds for ${config.key}`).toBeDefined();
      });

      it('the key and the metre are the ones asked, in every phrase', () => {
        expect(d.asked).toBe(1);
      });

      it('every promised demand is on the page of every phrase it is asked of', () => {
        for (const [name, present] of Object.entries(d.promisedPresent)) expect(present, name).toBe(1);
      });

      it('phrase ending: the phrases arrive', () => {
        if (bound.arrives !== undefined) expect(d.arrives, `${config.name}: arriving by the rule`).toBeGreaterThanOrEqual(bound.arrives);
        if (bound.strong !== undefined) expect(d.strong, `${config.name}: arriving on a strong beat`).toBeGreaterThanOrEqual(bound.strong);
      });

      it('contour: one line in each four bars, and no rocking between two notes', () => {
        expect(d.unitsOne, `${config.name}: four-bar units with one contour`).toBeGreaterThanOrEqual(bound.unitsOne);
        if (bound.oscillatingAtMost !== undefined) expect(d.oscillating, `${config.name}: rocking`).toBeLessThanOrEqual(bound.oscillatingAtMost);
      });

      it('the level’s density kept, no degeneration into repeated notes, no collapse into a few pages', () => {
        expect(d.eventsPerBar, `${config.name}: notes a bar`).toBeGreaterThanOrEqual(bound.eventsPerBarAtLeast);
        expect(d.repeatedNotes, `${config.name}: repeated notes`).toBeLessThanOrEqual(GUARDS.repeatedNotesAtMost);
        expect(d.nearDuplicates, `${config.name}: near-duplicate pages`).toBeLessThanOrEqual(bound.nearDuplicatesAtMost);
      });

      it('the strong beats agree with the left hand where the level targets them', () => {
        if (bound.chordTonesAtLeast !== undefined) expect(d.harmony, `${config.name}: strong beats on chord tones`).toBeGreaterThanOrEqual(bound.chordTonesAtLeast);
      });

      /** The generator's report of each phrase, which the committed generator does not make. */
      const reported = (): Internals[] => {
        const inside = measured.map((m) => m.internals);
        expect(inside.every((i) => i !== undefined), 'the generator reports its search (the committed generator reports none)').toBe(true);
        return inside as Internals[];
      };

      it('S26: no leap past the cap, and no tie off the beat where syncopation is not taught, in any phrase', () => {
        expect(share(reported().map((i) => i.violations > 0)), 'phrases breaking a hard constraint').toBe(0);
      });

      it('the search stays in the redraw budget, and the page is the phrase the generator chose', () => {
        const known = reported();
        expect(Math.max(...known.map((i) => i.attempts))).toBeLessThanOrEqual(GUARDS.attemptsAtMost);
        // The page read back scores as the generator scored the phrase it kept.
        for (const i of known) if (i.reported !== undefined) expect(i.total).toBeCloseTo(i.reported, 9);
      });

      it('a floor under the chosen phrase: no configuration’s worst below 0.3', () => {
        expect(Math.min(...reported().map((i) => i.total)), 'the worst chosen phrase').toBeGreaterThanOrEqual(GUARDS.scoreFloor);
      });
    });
  }
});

// --- the report ------------------------------------------------------------------------------

describe('the report', () => {
  it('writes the table where asked (D1_TABLE)', () => {
    const path = process.env.D1_TABLE;
    if (!path) return;
    const pct = (x: number | null | undefined): string => (x === null || x === undefined ? '—' : `${String(Math.round(x * 100))} %`);
    const num = (x: number | undefined, digits = 2): string => (x === undefined ? '—' : x.toFixed(digits));
    const columns: [string, (d: Distribution) => string][] = [
      ['n', (d) => String(d.n)],
      ['key and metre as asked', (d) => pct(d.asked)],
      ['keys (fifths)', (d) => d.keys],
      ['metres', (d) => d.metres],
      ['intervals: unison/2nd/3rd/4th/5th/6th+ (%)', (d) => d.intervals.map((x) => String(Math.round(x * 100))).join('/')],
      ['notes a bar', (d) => num(d.eventsPerBar, 1)],
      ['rest density', (d) => pct(d.restDensity)],
      ['repeated notes', (d) => pct(d.repeatedNotes)],
      ['one contour: phrases', (d) => pct(d.oneContour)],
      ['one contour: 4-bar units', (d) => pct(d.unitsOne)],
      ['oscillating', (d) => pct(d.oscillating)],
      ['arrives (rule)', (d) => pct(d.arrives)],
      ['arrives on a strong beat', (d) => pct(d.strong)],
      ['on the last downbeat', (d) => pct(d.beatOne)],
      ['ends on the tonic', (d) => pct(d.tonic)],
      ['strong beats on chord tones', (d) => pct(d.harmony)],
      ['a motif recurs, varied', (d) => pct(d.motif)],
      ['promised: in every phrase', (d) => Object.entries(d.promisedPresent).map(([k, v]) => `${k} ${pct(v)}`).join(', ') || '—'],
      ['promised: median a bar', (d) => Object.entries(d.promisedPerBar).map(([k, v]) => `${k} ${num(v)}`).join(', ') || '—'],
      ['accidentals', (d) => pct(d.chromatic)],
      ['span in semitones, median/max', (d) => `${String(d.spanMedian)}/${String(d.spanMax)}`],
      ['left hand', (d) => d.leftHand],
      ['draws to the first valid, median/max', (d) => `${num(d.firstValidMedian, 0)}/${num(d.firstValidMax, 0)}`],
      ['draws made, median/max', (d) => `${num(d.attemptsMedian, 0)}/${num(d.attemptsMax, 0)}`],
      ['score of the kept phrase, median/worst', (d) => `${num(d.scoreMedian)}/${num(d.scoreWorst)}`],
      ['near-duplicates', (d) => pct(d.nearDuplicates)],
      ['hard violations', (d) => pct(d.violations)],
    ];
    const lines = [
      `| config | ${columns.map(([name]) => name).join(' | ')} |`,
      `| --- | ${columns.map(() => '---').join(' | ')} |`,
      ...Object.entries(REPORT).map(([name, d]) => `| ${name} | ${columns.map(([, cell]) => cell(d)).join(' | ')} |`),
    ];
    writeFileSync(path, `${lines.join('\n')}\n`, 'utf8');
  });
});
