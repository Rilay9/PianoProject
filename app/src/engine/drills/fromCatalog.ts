/**
 * Building a runnable drill from a catalog item (docs/05 §7, P8).
 *
 * The catalog describes drills the way a curriculum author would; the engine
 * needs MIDI numbers and prompt lists. This is the one place that knows both,
 * so a new drill in `content/` is a data change and not a code change.
 *
 * Two rules it follows:
 *
 * - **A drill with parameters honours them.** The factories in `factories.ts`
 *   have sensible defaults, but a drill that says "C, F and G" and then asks
 *   for B♭m7 is worse than no drill at all — the learner cannot tell whether
 *   they are wrong or the app is.
 * - **It returns null rather than guessing.** An unrecognised kind or a
 *   parameter it cannot read means the screen says so, instead of silently
 *   drilling something else.
 */
import type { CatalogItem } from '../../curriculum/types';
import { makeRng } from '../sightReading';
import { systemClock, type Clock } from '../types';
import { PromptDrill } from './PromptDrill';
import {
  BackingTrackDrill,
  DynamicsDrill,
  PedalDrill,
  RhythmDrill,
} from './special';
import {
  ChordDictationDrill,
  chordScaleDrill,
  earTuneDrill,
  extendedChordDrill,
  modeDrill,
  romanNumeralDrill,
  transpositionDrill,
} from './harmony';
import {
  callResponseDrill,
  chordDrill,
  earChordDrill,
  earIntervalDrill,
  earProgressionDrill,
  findKeyDrill,
  inversionDrill,
  noteFlashDrill,
} from './factories';
import {
  anyRomanToChord,
  buildRhythm,
  intervalNameToSemitones,
  noteNameToMidi,
  noteNameToPitchClass,
  parseChordSymbol,
  parseModeName,
  parseTimeSignature,
  romanToChord,
  type ParsedChord,
} from './theory';
import { noteLabel, type Drill, type DrillKind, type DrillPrompt } from './types';

/** Kinds that have a screen in P8. `sight-reading` is notation and is not one. */
export const RUNTIME_DRILL_KINDS: readonly DrillKind[] = [
  'note-flash',
  'find-key',
  'chord',
  'inversion',
  'ear-interval',
  'ear-chord',
  'ear-progression',
  'rhythm',
  'pedal',
  'dynamics',
  'call-response',
  'backing-track',
  'mode',
  'chord-scale',
  'extended-chord',
  'harmonic-dictation',
  'transposition',
  'roman-numeral',
  'ear-tune',
];

export interface BuildOptions {
  count?: number;
  seed?: number;
  clock?: Clock;
}

type Params = Record<string, unknown>;

function params(item: CatalogItem): Params {
  return item.drill?.params ?? {};
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Clef name → the MIDI range a note-flash drill should draw from. */
const CLEF_RANGE: Record<string, [number, number]> = {
  treble: [60, 81], // C4–A5
  bass: [41, 60], // F2–C4
  grand: [41, 81],
};

/**
 * `sight-reading` is generated notation, not a prompt loop: it opens on the
 * Score screen in Tempo mode (docs/05 §8). Callers check this before building.
 */
export function isSightReading(item: CatalogItem): boolean {
  return item.drill?.kind === 'sight-reading';
}

/** Kinds the catalog uses for *generated exercises*, which have a file. */
function isNotationKind(kind: string): boolean {
  return [
    'scale', 'hanon', 'arpeggio', 'five-finger', 'accompaniment', 'cadence',
    'inversion-exercise', 'interval-reading', 'coordination', 'position-shift',
  ].includes(kind);
}

/**
 * A drill for this item, or null when there is nothing to run.
 *
 * Null means one of three things and the caller should say which: the item is
 * not a drill, it is generated notation (open the Score screen), or its kind
 * has no runtime implementation.
 */
export function drillFromCatalog(item: CatalogItem, options: BuildOptions = {}): Drill | null {
  const kind = item.drill?.kind;
  if (!kind || isSightReading(item)) return null;

  const p = params(item);
  const clock = options.clock ?? systemClock;
  // The item id seeds the drill, so "the same drill" is the same every time
  // until the learner asks to shuffle it.
  const seed = options.seed ?? hashSeed(item.id);
  const count = options.count ?? 10;
  const rng = makeRng(seed);
  const base = { count, seed, clock };

  switch (kind) {
    case 'note-flash':
      return buildNoteFlash(p, base);
    case 'find-key':
      return buildFindKey(p, base);
    case 'chord':
      return buildChord(p, base, rng);
    case 'inversion':
      return buildInversion(p, base);
    case 'ear-interval':
      return buildEarInterval(p, base);
    case 'ear-chord':
      return buildEarChord(p, base, rng);
    case 'ear-progression':
      return buildEarProgression(p, base, rng);
    case 'rhythm':
      return buildRhythmDrill(p, seed);
    case 'pedal':
      return buildPedal(p);
    case 'dynamics':
      return buildDynamics(p);
    case 'call-response':
      return callResponseDrill({ ...base, count: Math.min(count, 6) });
    case 'backing-track':
      return buildBackingTrack(p);
    case 'mode':
      return buildMode(p, base);
    case 'chord-scale':
      return buildChordScale(p, base);
    case 'extended-chord':
      return buildExtendedChord(p, base);
    case 'harmonic-dictation':
      return buildHarmonicDictation(p, base);
    case 'transposition':
      return buildTransposition(p, base);
    case 'roman-numeral':
      return buildRomanNumeral(p, base);
    case 'ear-tune':
      return buildEarTune(p, base);
    default:
      // A five-finger walk or an accompaniment pattern with no file is a
      // technique pattern: demonstrate it, then play it back. See the P8
      // decision note — these two items look like data mistakes (the same
      // patterns exist as generated notation), but a drill that works is
      // better than a dead row while that is confirmed.
      if (isNotationKind(kind)) return buildTechniquePattern(item, p, base);
      return null;
  }
}

/** A stable 32-bit seed from an id, so a drill is the same on every visit. */
export function hashSeed(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// --- per kind ---------------------------------------------------------------

function buildNoteFlash(p: Params, base: Required<BuildOptions>): Drill {
  const clef = typeof p.clef === 'string' ? p.clef : 'treble';
  const [defaultLow, defaultHigh] = CLEF_RANGE[clef] ?? CLEF_RANGE.treble ?? [60, 81];
  const low = (typeof p.low === 'string' ? noteNameToMidi(p.low) : null) ?? defaultLow;
  const high = (typeof p.high === 'string' ? noteNameToMidi(p.high) : null) ?? defaultHigh;
  return noteFlashDrill({ ...base, low: Math.min(low, high), high: Math.max(low, high) });
}

function buildFindKey(p: Params, base: Required<BuildOptions>): Drill {
  const targets = strings(p.targets)
    .map(noteNameToPitchClass)
    .filter((pitchClass): pitchClass is number => pitchClass !== null);
  if (targets.length === 0) {
    // "Find the key" over the whole keyboard, or the finger-number and
    // build-a-scale modes, all reduce to naming a key and playing it.
    return findKeyDrill({ ...base, low: 48, high: 72 });
  }
  // A drill that names three keys must ask for those three, in some order.
  const rng = makeRng(base.seed);
  const prompts: DrillPrompt[] = Array.from({ length: base.count }, (_, index) => {
    const pitchClass = targets[Math.floor(rng() * targets.length)] ?? 0;
    const midi = 60 + pitchClass;
    return { index, label: noteLabel(midi).replace(/-?\d+$/, ''), expected: [midi] };
  });
  return new PromptDrill({ kind: 'find-key', prompts, anyOctave: true, clock: base.clock });
}

/** Chord symbols, or roman numerals in a set of keys, or the defaults. */
function chordsFromParams(p: Params, rng: () => number): ParsedChord[] {
  const symbols = strings(p.chords)
    .map((symbol) => parseChordSymbol(symbol))
    .filter((chord): chord is ParsedChord => chord !== null);
  if (symbols.length > 0) return symbols;

  const keys = strings(p.keys)
    .map(noteNameToPitchClass)
    .filter((pitchClass): pitchClass is number => pitchClass !== null);
  const degrees = strings(p.degrees).length > 0 ? strings(p.degrees) : romanSequence(p.progression);
  if (keys.length > 0 && degrees.length > 0) {
    const out: ParsedChord[] = [];
    for (const key of keys) {
      for (const degree of degrees) {
        const chord = romanToChord(degree, key);
        if (chord) {
          const keyName = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'][key] ?? 'C';
          out.push({ ...chord, label: `${chord.label} in ${keyName}` });
        }
      }
    }
    if (out.length > 0) return out;
  }
  // Shell voicings and the plain symbol-flash drill: a spread of triads and
  // sevenths the learner will meet, chosen by the seed.
  const roots = [0, 2, 4, 5, 7, 9, 11];
  const qualities = ['', 'm', '7', 'm7', 'maj7'];
  return Array.from({ length: 8 }, () => {
    const root = roots[Math.floor(rng() * roots.length)] ?? 0;
    const quality = qualities[Math.floor(rng() * qualities.length)] ?? '';
    const name = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'][root] ?? 'C';
    return parseChordSymbol(`${name}${quality}`) as ParsedChord;
  }).filter(Boolean);
}

/** `"ii-V-I"` → `["ii", "V", "I"]`; a list stays a list. */
function romanSequence(value: unknown): string[] {
  if (Array.isArray(value)) return strings(value);
  if (typeof value === 'string') return value.split(/[-–]/).map((part) => part.trim()).filter(Boolean);
  return [];
}

function buildChord(p: Params, base: Required<BuildOptions>, rng: () => number): Drill {
  const chords = chordsFromParams(p, rng);
  if (chords.length === 0) return chordDrill(base);
  const prompts: DrillPrompt[] = Array.from({ length: base.count }, (_, index) => {
    const chord = chords[index % chords.length] as ParsedChord;
    return { index, label: chord.label, expected: chord.pitches };
  });
  return new PromptDrill({ kind: 'chord', prompts, anyOctave: true, clock: base.clock });
}

function buildInversion(p: Params, base: Required<BuildOptions>): Drill {
  const qualities = strings(p.qualities)
    .map((quality) => (quality === 'major' ? 'maj' : quality === 'minor' ? 'min' : quality))
    .filter((quality): quality is 'maj' | 'min' | 'dim' | 'aug' | 'dom7' =>
      ['maj', 'min', 'dim', 'aug', 'dom7'].includes(quality),
    );
  return inversionDrill({ ...base, ...(qualities.length > 0 ? { qualities } : {}) });
}

function buildEarInterval(p: Params, base: Required<BuildOptions>): Drill {
  const intervals = strings(p.intervals)
    .map(intervalNameToSemitones)
    .filter((semitones): semitones is number => semitones !== null);
  return earIntervalDrill({ ...base, ...(intervals.length > 0 ? { intervals } : {}) });
}

function buildEarChord(p: Params, base: Required<BuildOptions>, rng: () => number): Drill {
  const qualities = strings(p.qualities);
  const simple = qualities
    .map((quality) => (quality === 'major' ? 'maj' : quality === 'minor' ? 'min' : quality))
    .filter((quality): quality is 'maj' | 'min' => quality === 'maj' || quality === 'min');
  // The seventh-chord drill names qualities the shared factory does not have,
  // so those prompts are built here from the chord table.
  if (qualities.length > 0 && simple.length !== qualities.length) {
    const roots = [0, 2, 4, 5, 7, 9];
    const prompts: DrillPrompt[] = Array.from({ length: base.count }, (_, index) => {
      const root = roots[Math.floor(rng() * roots.length)] ?? 0;
      const quality = qualities[Math.floor(rng() * qualities.length)] ?? '7';
      const name = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'][root] ?? 'C';
      const chord = parseChordSymbol(`${name}${quality}`) ?? parseChordSymbol(`${name}7`);
      const pitches = chord?.pitches ?? [60, 64, 67, 70];
      return {
        index,
        label: chord?.label ?? `${name}${quality}`,
        expected: pitches,
        playback: [{ midi: pitches, atMs: 0 }],
      };
    });
    return new PromptDrill({ kind: 'ear-chord', prompts, anyOctave: true, clock: base.clock });
  }
  return earChordDrill({ ...base, ...(simple.length > 0 ? { qualities: simple } : {}) });
}

/** The four cadences by name, as roman-numeral sequences. */
const CADENCES: Record<string, string[]> = {
  authentic: ['V', 'I'],
  perfect: ['V', 'I'],
  half: ['I', 'V'],
  plagal: ['IV', 'I'],
  deceptive: ['V', 'vi'],
};

function buildEarProgression(p: Params, base: Required<BuildOptions>, rng: () => number): Drill {
  const named = strings(p.cadences).map((name) => ({ label: name, degrees: CADENCES[name] ?? [] }));
  const written = strings(p.progressions).map((text) => ({ label: text, degrees: romanSequence(text) }));
  const sequences = [...named, ...written].filter((entry) => entry.degrees.length > 0);
  if (sequences.length === 0) return earProgressionDrill(base);

  const prompts: DrillPrompt[] = Array.from({ length: base.count }, (_, index) => {
    const sequence = sequences[Math.floor(rng() * sequences.length)] ?? sequences[0];
    const chords = (sequence?.degrees ?? [])
      // `anyRomanToChord`, so a sequence may name a secondary dominant: the
      // whole point of "I – V/V – V" is the chord that is not in the key.
      .map((degree) => anyRomanToChord(degree, 0))
      .filter((chord): chord is ParsedChord => chord !== null);
    return {
      index,
      label: sequence?.label ?? '',
      expected: chords.flatMap((chord) => chord.pitches),
      ordered: true,
      playback: chords.map((chord, i) => ({ midi: chord.pitches, atMs: i * 800 })),
    };
  });
  return new PromptDrill({ kind: 'ear-progression', prompts, anyOctave: true, clock: base.clock });
}

/**
 * `["D", "G"]` → `[2, 7]`; anything unreadable is dropped rather than guessed.
 */
function pitchClasses(value: unknown): number[] {
  return strings(value)
    .map(noteNameToPitchClass)
    .filter((pitchClass): pitchClass is number => pitchClass !== null);
}

function buildMode(p: Params, base: Required<BuildOptions>): Drill {
  const modes = strings(p.modes)
    .map(parseModeName)
    .filter((mode): mode is string => mode !== null);
  const roots = pitchClasses(p.roots);
  return modeDrill({
    ...base,
    ...(modes.length > 0 ? { modes } : {}),
    ...(roots.length > 0 ? { roots } : {}),
  });
}

function buildChordScale(p: Params, base: Required<BuildOptions>): Drill {
  const chords = strings(p.chords);
  return chordScaleDrill({ ...base, ...(chords.length > 0 ? { chords } : {}) });
}

function buildExtendedChord(p: Params, base: Required<BuildOptions>): Drill {
  const qualities = strings(p.qualities);
  const roots = pitchClasses(p.roots);
  return extendedChordDrill({
    ...base,
    ...(qualities.length > 0 ? { qualities } : {}),
    ...(roots.length > 0 ? { roots } : {}),
  });
}

function buildRomanNumeral(p: Params, base: Required<BuildOptions>): Drill {
  const degrees = strings(p.degrees);
  const keys = pitchClasses(p.keys);
  return romanNumeralDrill({
    ...base,
    ...(degrees.length > 0 ? { degrees } : {}),
    ...(keys.length > 0 ? { keys } : {}),
  });
}

function buildEarTune(p: Params, base: Required<BuildOptions>): Drill {
  const key = pitchClasses(p.keys)[0];
  return earTuneDrill({
    ...base,
    bars: num(p.bars, 4),
    barsPerPhrase: num(p.barsPerPhrase, 2),
    ...(key !== undefined ? { key } : {}),
    ...(typeof p.bpm === 'number' ? { bpm: p.bpm } : {}),
  });
}

function buildTransposition(p: Params, base: Required<BuildOptions>): Drill {
  const level = Math.max(1, Math.min(4, Math.round(num(p.level, 2)))) as 1 | 2 | 3 | 4;
  // "up a tone", "to F" — the catalog names intervals, so the drill takes them
  // as semitones and the labels are derived from them, not the other way round.
  const targets = Array.isArray(p.targets)
    ? p.targets.filter((value): value is number => typeof value === 'number')
    : [];
  return transpositionDrill({
    ...base,
    level,
    bars: num(p.bars, 4),
    ...(targets.length > 0 ? { targets } : {}),
  });
}

/**
 * Progressions for harmonic dictation, as `"key:numeral"` tokens.
 *
 * `["C:I", "C:V7/V", "G:V", "G:I"]` is a modulation written the way an analysis
 * writes one — the key changes partway and the numerals restart. A plain
 * numeral inherits the previous token's key, so the common case stays short.
 */
function dictationChords(tokens: string[]): number[][] {
  let key = 0;
  const chords: number[][] = [];
  for (const token of tokens) {
    const [left, right] = token.includes(':') ? token.split(':') : [undefined, token];
    if (left !== undefined) {
      const parsed = noteNameToPitchClass(left);
      if (parsed !== null) key = parsed;
    }
    const chord = anyRomanToChord((right ?? '').trim(), key, 48);
    if (chord) chords.push(chord.pitches);
  }
  return chords;
}

function buildHarmonicDictation(p: Params, base: Required<BuildOptions>): Drill {
  const written = Array.isArray(p.progressions)
    ? p.progressions
        .map((entry) => (Array.isArray(entry) ? strings(entry) : romanSequence(entry)))
        .map((tokens) => ({ label: tokens.join(' – '), chords: dictationChords(tokens) }))
        .filter((entry) => entry.chords.length > 1)
    : [];
  return new ChordDictationDrill({
    ...base,
    ...(written.length > 0 ? { progressions: written } : {}),
    ...(typeof p.boundaryMs === 'number' ? { boundaryMs: p.boundaryMs } : {}),
  });
}

function buildRhythmDrill(p: Params, seed: number): Drill {
  const timeSig = parseTimeSignature(typeof p.timeSig === 'string' ? p.timeSig : undefined);
  const bars = num(p.bars, 4);
  const bpm = num(p.bpm, 80);
  const values = strings(p.values);
  const events = buildRhythm(
    values.length > 0 ? values : ['quarter', 'half'],
    // In 6/8 the pulse the learner taps is the dotted quarter, but the values
    // are written in eighths, so the bar is six of them.
    timeSig.beats,
    bars,
    makeRng(seed),
  );
  const beatMs = 60_000 / bpm / (timeSig.beatType === 8 ? 2 : 1);
  const pattern = events.filter((event) => !event.rest).map((event) => event.beat * beatMs);
  return new RhythmDrill({ pattern, bpm, seed });
}

function buildPedal(p: Params): Drill {
  const degrees = romanSequence(p.progression);
  const chords = degrees
    .map((degree) => romanToChord(degree, 0, 48))
    .filter((chord): chord is ParsedChord => chord !== null)
    .map((chord) => chord.pitches);
  return new PedalDrill({
    ...(chords.length > 0 ? { chords } : {}),
    ...(typeof p.maxOverlapMs === 'number' ? { liftWindowMs: [0, p.maxOverlapMs] as [number, number] } : {}),
  });
}

function buildDynamics(p: Params): Drill {
  return new DynamicsDrill({ ...(typeof p.ratio === 'number' ? { targetRatio: p.ratio } : {}) });
}

function buildBackingTrack(p: Params): Drill {
  const symbols = strings(p.progression)
    .map((symbol) => parseChordSymbol(symbol, 48))
    .filter((chord): chord is ParsedChord => chord !== null);
  const twelveBar = p.form === '12-bar';
  const key = strings(p.keys)[0] ?? 'C';
  const loop = symbols.length > 0 ? symbols.map((chord) => chord.pitches) : twelveBarLoop(key, twelveBar);
  const bpm = num(p.bpm, 84);
  return new BackingTrackDrill({ loop, barMs: (60_000 / bpm) * 4 });
}

/** The twelve-bar blues in a key, or a plain I–IV–V–I when it is not asked for. */
function twelveBarLoop(key: string, twelveBar: boolean): number[][] {
  const tonic = noteNameToPitchClass(key) ?? 0;
  const chord = (degree: string): number[] =>
    romanToChord(degree, tonic, 48)?.pitches ?? [48, 52, 55];
  if (!twelveBar) return [chord('I'), chord('IV'), chord('V'), chord('I')];
  return [
    chord('I7'), chord('I7'), chord('I7'), chord('I7'),
    chord('IV7'), chord('IV7'), chord('I7'), chord('I7'),
    chord('V7'), chord('IV7'), chord('I7'), chord('V7'),
  ];
}

/**
 * A five-finger walk or an accompaniment pattern that has no notation file:
 * play it, then play it back.
 */
function buildTechniquePattern(item: CatalogItem, p: Params, base: Required<BuildOptions>): Drill {
  const tonic = 60 + (noteNameToPitchClass(typeof p.key === 'string' ? p.key : 'C') ?? 0);
  const hands = typeof p.hands === 'string' ? p.hands : 'right';
  const root = hands === 'left' ? tonic - 12 : tonic;
  const walk = [0, 2, 4, 5, 7, 5, 4, 2, 0].map((offset) => root + offset);
  const prompts: DrillPrompt[] = Array.from({ length: Math.min(base.count, 4) }, (_, index) => ({
    index,
    label: `${item.title} — ${index + 1}`,
    expected: walk,
    ordered: true,
    playback: walk.map((midi, i) => ({ midi: [midi], atMs: i * 400 })),
  }));
  return new PromptDrill({
    kind: 'call-response',
    prompts,
    anyOctave: false,
    clock: base.clock,
  });
}
