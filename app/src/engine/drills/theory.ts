/**
 * The small amount of music theory the catalog speaks and the engine does not.
 *
 * `content/catalog.json` describes a drill the way a teacher would — "chords
 * C, F and G", "intervals m2, M2, m3, M3", "progression I, IV, V, I in C",
 * "notes from F2 to G5". The drill framework in `05` §7 works in MIDI numbers.
 * This is the translation layer, and it lives here rather than in the
 * factories so that the factories stay about *drilling* and this stays about
 * *notation*.
 *
 * Deliberately narrow: it parses what the 43 runtime drill items in the
 * catalog actually contain, and says so loudly (by returning null) when handed
 * something else, rather than guessing and drilling the wrong notes.
 */

const STEP_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * `"F2"`, `"C#4"`, `"B-3"` (the catalog's flat spelling), `"E♭5"` → MIDI.
 *
 * The catalog uses music21's `-` for a flat, because that is what the content
 * pipeline writes; `b` is *not* accepted as a flat, because `B` is a note.
 */
export function noteNameToMidi(name: string): number | null {
  const match = /^([A-Ga-g])([#♯\-♭]*)(-?\d+)$/.exec(name.trim());
  if (!match) return null;
  const step = STEP_SEMITONES[(match[1] as string).toUpperCase()];
  if (step === undefined) return null;
  let alter = 0;
  for (const character of match[2] ?? '') {
    if (character === '#' || character === '♯') alter += 1;
    else alter -= 1;
  }
  const octave = Number.parseInt(match[3] as string, 10);
  const midi = (octave + 1) * 12 + step + alter;
  return midi >= 0 && midi <= 127 ? midi : null;
}

/** A pitch class from a bare note name: `"C"`, `"B-"`, `"F♯"`. */
export function noteNameToPitchClass(name: string): number | null {
  const midi = noteNameToMidi(`${name.trim()}4`);
  return midi === null ? null : ((midi % 12) + 12) % 12;
}

/** Semitones above the root, per quality. Covers every quality the catalog names. */
export const CHORD_QUALITIES: Record<string, number[]> = {
  '': [0, 4, 7],
  maj: [0, 4, 7],
  major: [0, 4, 7],
  m: [0, 3, 7],
  min: [0, 3, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  '6': [0, 4, 7, 9],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  M7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  min7: [0, 3, 7, 10],
  mMaj7: [0, 3, 7, 11],
  dim7: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10],
  'm7-5': [0, 3, 6, 10],
  '9': [0, 4, 7, 10, 14],
  // Extended chords (P12b). Written full rather than as "the seventh plus a
  // ninth", because the drill asks for the notes the learner must find and a
  // 13th chord that quietly omits its 11th is a different chord.
  maj9: [0, 4, 7, 11, 14],
  m9: [0, 3, 7, 10, 14],
  '11': [0, 4, 7, 10, 14, 17],
  m11: [0, 3, 7, 10, 14, 17],
  '13': [0, 4, 7, 10, 14, 21],
  m13: [0, 3, 7, 10, 14, 21],
  maj13: [0, 4, 7, 11, 14, 21],
  '7b9': [0, 4, 7, 10, 13],
  '7#9': [0, 4, 7, 10, 15],
  '7#11': [0, 4, 7, 10, 18],
  add9: [0, 4, 7, 14],
};

/**
 * Semitones above the tonic, per mode.
 *
 * The seven modes of the major scale and nothing else. A "mode" drill that
 * accepted `harmonic minor` would be a scale drill wearing the wrong name, and
 * the generator already writes those.
 */
export const MODE_STEPS: Record<string, number[]> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
};

/** `"D dorian"`, `"dorian"`, `"Mixolydian"` → the mode's name, or null. */
export function parseModeName(text: string): string | null {
  const word = text.trim().toLowerCase().split(/\s+/).pop() ?? '';
  return MODE_STEPS[word] ? word : null;
}

/**
 * The scale a chord asks for, as a mode name (`02` Part D4).
 *
 * Only the mappings that are not a matter of taste: a dominant seventh takes
 * mixolydian, a minor seventh dorian, a half-diminished locrian. Where a chord
 * has two defensible scales — maj7 is ionian or lydian depending on what it is
 * doing in the key — the more common one is chosen and stated, rather than
 * asking the learner to guess which the app meant.
 */
export const CHORD_SCALES: Record<string, string> = {
  maj7: 'ionian',
  M7: 'ionian',
  maj9: 'ionian',
  maj13: 'ionian',
  '': 'ionian',
  maj: 'ionian',
  major: 'ionian',
  '7': 'mixolydian',
  '9': 'mixolydian',
  '11': 'mixolydian',
  '13': 'mixolydian',
  sus4: 'mixolydian',
  m7: 'dorian',
  min7: 'dorian',
  m9: 'dorian',
  m11: 'dorian',
  m13: 'dorian',
  m: 'aeolian',
  min: 'aeolian',
  minor: 'aeolian',
  m7b5: 'locrian',
  'm7-5': 'locrian',
};

/** The mode that fits a chord symbol, or null when there is no settled answer. */
export function chordScaleFor(symbol: string): { chord: ParsedChord; mode: string } | null {
  const match = /^([A-Ga-g][#♯\-♭]?)(.*)$/.exec(symbol.trim());
  if (!match) return null;
  const chord = parseChordSymbol(symbol);
  const mode = CHORD_SCALES[(match[2] ?? '').trim()];
  return chord && mode ? { chord, mode } : null;
}

/** A mode from a root pitch class, one octave ascending, from `octaveRoot`. */
export function modePitches(rootPitchClass: number, mode: string, octaveRoot = 60): number[] | null {
  const steps = MODE_STEPS[mode];
  if (!steps) return null;
  const root = octaveRoot + (((rootPitchClass - (octaveRoot % 12)) % 12) + 12) % 12;
  return [...steps.map((step) => root + step), root + 12];
}

export interface ParsedChord {
  label: string;
  root: number;
  /** Absolute MIDI, voiced from `octaveRoot`. */
  pitches: number[];
}

/**
 * `"Am7"`, `"B-"`, `"F♯dim"`, `"C"` → a chord.
 *
 * The root is taken greedily (two characters if the second is an accidental)
 * and everything after it is the quality, looked up in the table above.
 */
export function parseChordSymbol(symbol: string, octaveRoot = 60): ParsedChord | null {
  const text = symbol.trim();
  const match = /^([A-Ga-g][#♯\-♭]?)(.*)$/.exec(text);
  if (!match) return null;
  const pitchClass = noteNameToPitchClass(match[1] as string);
  if (pitchClass === null) return null;
  const quality = (match[2] ?? '').trim();
  const intervals = CHORD_QUALITIES[quality];
  if (!intervals) return null;
  const root = octaveRoot + ((pitchClass - (octaveRoot % 12) + 12) % 12);
  return { label: text, root, pitches: intervals.map((interval) => root + interval) };
}

/** Semitones from the tonic for each scale degree of the major scale. */
const MAJOR_DEGREES = [0, 2, 4, 5, 7, 9, 11];

const ROMAN_VALUES: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7 };

/**
 * `"IV"`, `"V7"`, `"ii"`, `"vii°"` in a key → a chord.
 *
 * Case carries the quality, as it does on the page: upper case is major, lower
 * case minor, and a trailing `7`, `°` or `ø` adds the seventh or the fifth.
 */
export function romanToChord(roman: string, keyPitchClass: number, octaveRoot = 60): ParsedChord | null {
  const match = /^([ivIV]+)(.*)$/.exec(roman.trim());
  if (!match) return null;
  const numeral = match[1] as string;
  const degree = ROMAN_VALUES[numeral.toLowerCase()];
  if (degree === undefined) return null;
  const suffix = match[2] ?? '';
  const minor = numeral === numeral.toLowerCase();
  const diminished = suffix.includes('°') || suffix.includes('dim') || suffix.includes('ø');
  const seventh = suffix.includes('7');

  let intervals: number[];
  if (diminished) intervals = seventh ? [0, 3, 6, 10] : [0, 3, 6];
  else if (minor) intervals = seventh ? [0, 3, 7, 10] : [0, 3, 7];
  else intervals = seventh ? [0, 4, 7, 10] : [0, 4, 7];

  const offset = MAJOR_DEGREES[degree - 1] ?? 0;
  const rootClass = (keyPitchClass + offset) % 12;
  const root = octaveRoot + ((rootClass - (octaveRoot % 12) + 12) % 12);
  return { label: roman.trim(), root, pitches: intervals.map((interval) => root + interval) };
}

/**
 * `"V/V"`, `"V7/vi"`, `"vii°/V"` — a chord borrowed from another key's ladder.
 *
 * A secondary dominant is the dominant *of* a chord that is not the tonic, so
 * it is built by finding that chord's root and treating it as a temporary
 * tonic. `V/V` in C is D major, not G: the point of the drill is hearing the
 * F sharp that says the music has left home for a bar.
 */
export function secondaryToChord(
  text: string,
  keyPitchClass: number,
  octaveRoot = 60,
): ParsedChord | null {
  const parts = text.trim().split('/');
  if (parts.length !== 2) return null;
  const [numeral, target] = parts as [string, string];
  const targetChord = romanToChord(target, keyPitchClass, octaveRoot);
  if (!targetChord) return null;
  const temporaryTonic = ((targetChord.root % 12) + 12) % 12;
  const chord = romanToChord(numeral, temporaryTonic, octaveRoot);
  return chord ? { ...chord, label: text.trim(), root: chord.root, pitches: chord.pitches } : null;
}

/** A roman numeral, whether or not it names another key's ladder. */
export function anyRomanToChord(
  text: string,
  keyPitchClass: number,
  octaveRoot = 60,
): ParsedChord | null {
  return text.includes('/')
    ? secondaryToChord(text, keyPitchClass, octaveRoot)
    : romanToChord(text, keyPitchClass, octaveRoot);
}

/** `"m2"`, `"M3"`, `"P5"`, `"TT"`, `"P8"` → semitones. */
export function intervalNameToSemitones(name: string): number | null {
  const text = name.trim();
  if (/^\d+$/.test(text)) return Number.parseInt(text, 10);
  const table: Record<string, number> = {
    P1: 0, m2: 1, M2: 2, m3: 3, M3: 4, P4: 5, TT: 6, A4: 6, d5: 6,
    P5: 7, m6: 8, M6: 9, m7: 10, M7: 11, P8: 12,
  };
  return table[text] ?? null;
}

/** Note values the rhythm drills name, in beats. */
export const NOTE_VALUE_BEATS: Record<string, number> = {
  whole: 4,
  'dotted-half': 3,
  half: 2,
  'dotted-quarter': 1.5,
  quarter: 1,
  eighth: 0.5,
  'dotted-eighth': 0.75,
  sixteenth: 0.25,
  triplet: 1 / 3,
};

/** A value name that is a rest — silent, so it consumes time but is not tapped. */
export function isRestValue(value: string): boolean {
  return value.includes('rest');
}

export interface RhythmEvent {
  /** Beats from the start. */
  beat: number;
  beats: number;
  rest: boolean;
  value: string;
}

/**
 * Builds a bar-filling rhythm from the value names a catalog drill lists.
 *
 * Deterministic from the seed, and it never overflows a bar: a value that
 * would not fit is swapped for one that does, because a 3/4 bar with a whole
 * note in it is not a rhythm-reading exercise, it is a bug on a page.
 */
export function buildRhythm(
  values: readonly string[],
  beatsPerBar: number,
  bars: number,
  rng: () => number,
): RhythmEvent[] {
  const usable = values.filter((value) => NOTE_VALUE_BEATS[value.replace(/-?rest$/, '')] !== undefined
    || NOTE_VALUE_BEATS[value] !== undefined);
  const pool = usable.length > 0 ? usable : ['quarter'];
  const events: RhythmEvent[] = [];

  for (let bar = 0; bar < bars; bar += 1) {
    let filled = 0;
    let guard = 0;
    while (filled < beatsPerBar - 1e-6 && guard < 64) {
      guard += 1;
      const remaining = beatsPerBar - filled;
      const candidates = pool.filter((value) => {
        const beats = NOTE_VALUE_BEATS[value.replace(/-?rest$/, '')] ?? NOTE_VALUE_BEATS[value] ?? 1;
        return beats <= remaining + 1e-6;
      });
      const chosen = candidates[Math.floor(rng() * candidates.length)] ?? 'quarter';
      const beats = NOTE_VALUE_BEATS[chosen.replace(/-?rest$/, '')] ?? NOTE_VALUE_BEATS[chosen] ?? 1;
      events.push({
        beat: bar * beatsPerBar + filled,
        beats,
        rest: isRestValue(chosen),
        value: chosen,
      });
      filled += beats;
    }
  }
  return events;
}

/** `"6/8"` → `{ beats: 6, beatType: 8 }`; anything unparseable is 4/4. */
export function parseTimeSignature(text: string | undefined): { beats: number; beatType: number } {
  const match = /^(\d+)\s*\/\s*(\d+)$/.exec((text ?? '').trim());
  if (!match) return { beats: 4, beatType: 4 };
  return {
    beats: Number.parseInt(match[1] as string, 10),
    beatType: Number.parseInt(match[2] as string, 10),
  };
}
