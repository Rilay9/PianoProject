/**
 * The answer to a drill prompt, as a line of notation.
 *
 * Behind *Show me* on the drill screen (docs/04 §5c): a name, eight lit keys
 * on the strip and eight notes on a staff are the same fact three ways, and
 * the staff is the one that shows the *shape* — the half-steps sit where the
 * accidentals do. Nothing here decides whether to show it; the screen does,
 * and forfeits the prompt's mark when it does.
 *
 * A scale is written as eighths in one bar (quarters over several when it
 * is longer than eight notes); a chord as one whole note. The key signature is chosen to fit the notes: for a mode that is its
 * parent major key, so B♭ aeolian prints five flats and no accidentals, which
 * is the honest picture of why it sounds the way it does. An answer that
 * sits below middle C is written in the bass clef.
 */
import {
  DIVISIONS,
  writeMusicXml,
  type NoteType,
  type WriterMeasure,
  type WriterNote,
} from '../musicXmlWriter';

/** Pitch classes of the major scale whose key signature has `fifths`. */
function majorPitchClasses(fifths: number): Set<number> {
  const tonic = (((fifths * 7) % 12) + 12) % 12;
  return new Set([0, 2, 4, 5, 7, 9, 11].map((step) => (tonic + step) % 12));
}

/**
 * The key signature that leaves the fewest accidentals, nearest to C on a tie.
 *
 * Exported for the test: a seven-note mode always has a signature that fits
 * every note, and a triad has several, of which C is the plainest.
 */
export function fifthsFor(midis: readonly number[]): number {
  const classes = new Set(midis.map((m) => ((m % 12) + 12) % 12));
  let best = 0;
  let bestScore = -1;
  for (const fifths of [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6]) {
    const scale = majorPitchClasses(fifths);
    let inKey = 0;
    for (const pc of classes) if (scale.has(pc)) inKey += 1;
    if (inKey > bestScore) {
      bestScore = inKey;
      best = fifths;
    }
  }
  return best;
}

export interface AnswerSheetOptions {
  title: string;
  /** The notes to draw, in the order they are played when `ordered`. */
  notes: readonly number[];
  /** A scale or arpeggio (one note after another) rather than a chord. */
  ordered: boolean;
  /**
   * The finished run these notes are the beginning of, when the same staff is
   * drawn again and again as the run grows (Simon's play-along staff, `04`
   * §5c-2).
   *
   * Three things are chosen here to fit the notes given — the key signature,
   * the clef and the note value — and all three would otherwise change under
   * the learner part-way through: a chain gains a flat at its fourth note, or
   * dips below middle C at its sixth, and the staff re-engraves itself with
   * everything already on it in a different place. A staff that does that is
   * not one building up left to right, so the three are settled once, from the
   * whole run, and only the notes drawn grow.
   *
   * It also asks for **one bar**, whatever the run reaches: past eight notes a
   * growing run is written in sixteenths rather than spread over bars of
   * quarters, because the host it is drawn into is the width of a phone card
   * and three bars wrap into two systems there — which would make the card
   * taller half way through the run, which is the one thing this staff must
   * never do.
   */
  wholeRun?: readonly number[];
  /**
   * The signature and spelling to write with, instead of choosing them from the
   * notes. A chain seeded from a genre's scale knows its key and how it names
   * each black key, and a guess from six pitch classes knows neither: C blues
   * was guessed as B flat major, whose flats would write its F sharp as G flat.
   */
  spelling?: { fifths: number; blackKeys: Partial<Record<number, 'flat' | 'sharp'>> };
}

/** MusicXML for the answer, or null when there is nothing to draw. */
export function answerSheet(options: AnswerSheetOptions): string | null {
  const notes = options.notes.filter((m) => Number.isFinite(m));
  if (notes.length === 0) return null;
  // What the page is *shaped* for, which is the whole run when there is one
  // and otherwise exactly the notes on it.
  const whole = (options.wholeRun ?? notes).filter((m) => Number.isFinite(m));
  const shape = whole.length > 0 ? whole : notes;
  const fifths = options.spelling?.fifths ?? fifthsFor(shape);
  const clef: 'G' | 'F' = Math.min(...shape) < 60 ? 'F' : 'G';
  const beatsPerBar = 4;
  const barLength = DIVISIONS * beatsPerBar;

  const measures: WriterMeasure[] = [];
  if (options.ordered) {
    // Up to eight notes fit one bar as eighths, which keeps a scale on one
    // line of a phone; a longer run (two octaves) takes quarters over bars.
    let step = DIVISIONS / 2;
    let type: NoteType = 'eighth';
    if (shape.length > 8) {
      // A run drawn *as it grows* stays on one bar however long it gets:
      // sixteen sixteenths are one bar, and Simon's chain caps at twelve. The
      // alternative — quarters over three bars, which is right for a
      // two-octave scale drawn once — is three bars OSMD wraps into two or
      // three systems in a card-width host, and the card would then grow
      // taller half way through a chain and push the buttons off the screen.
      step = options.wholeRun === undefined ? DIVISIONS : DIVISIONS / 4;
      type = options.wholeRun === undefined ? 'quarter' : '16th';
    }
    const perBar = barLength / step;
    for (let at = 0; at < notes.length; at += perBar) {
      const played: WriterNote[] = notes
        .slice(at, at + perBar)
        .map((midi) => ({ midi, duration: step, type, voice: 1 }));
      const short = barLength - played.length * step;
      if (short > 0) played.push(...rests(short));
      measures.push({ notes: played });
    }
  } else {
    const sorted = [...new Set(notes)].sort((a, b) => a - b);
    measures.push({
      notes: sorted.map((midi, index) => ({
        midi,
        duration: barLength,
        type: 'whole',
        voice: 1,
        ...(index > 0 ? { chord: true } : {}),
      })),
    });
  }
  return writeMusicXml({
    title: options.title,
    fifths,
    beats: beatsPerBar,
    beatType: 4,
    bpm: 80,
    staves: 1,
    clef,
    ...(options.spelling ? { blackKeys: options.spelling.blackKeys } : {}),
    measures,
  });
}

// --- a progression, one chord to the bar ------------------------------------

/** Middle C. The split between the hands, and the clef decision, both. */
const MIDDLE_C = 60;

/** Voice numbers for the two staves, as the sight-reading writer uses them. */
const STAFF_VOICE = { 1: 1, 2: 5 } as const;

export interface ProgressionSheetOptions {
  title: string;
  /** One chord to the bar, in the order they are played. */
  chords: readonly (readonly number[])[];
  /**
   * A word over each bar — `V7/V`, `C:I`, `Am7`.
   *
   * Optional, and used only when there is one for every bar: a progression
   * labelled on three of its four chords would be read as *the fourth chord has
   * no numeral*, which is a different claim from *this drill did not say*.
   */
  labels?: readonly string[];
}

/**
 * A chord progression as notation: one chord a bar, with its numeral above it.
 *
 * The owner's ask, 2026-09-16: *"Any time you're showing note progressions or
 * chord progressions in these drills, it's useful to show it on the staff so I
 * can correlate the notes on the staff with the chord progressions — know what
 * chords look like. It's very hard to read chords."* A row of numerals says
 * which chords; this says what they *are*, in the medium the learner will meet
 * them in, with the two lined up bar by bar so the correlation is the picture
 * rather than something to work out.
 *
 * Two staves when the chords straddle middle C, one when they do not — which
 * is not quite "two staves whenever anything is below middle C". A progression
 * written from the bass up (harmonic dictation builds its chords from C3) is
 * *entirely* below middle C, and a grand staff for it is a treble stave holding
 * four whole rests: the empty half is then the loudest thing on the card. Below
 * middle C throughout is one bass stave, above it throughout is one treble, and
 * a progression that crosses gets both with the split at middle C — where a
 * pianist's hands would put it.
 */
export function progressionSheet(options: ProgressionSheetOptions): string | null {
  const chords = options.chords
    .map((chord) => [...new Set(chord.filter((m) => Number.isFinite(m)))].sort((a, b) => a - b))
    .filter((chord) => chord.length > 0);
  if (chords.length === 0) return null;

  const all = chords.flat();
  const fifths = fifthsFor(all);
  const low = Math.min(...all);
  const high = Math.max(...all);
  const grand = low < MIDDLE_C && high >= MIDDLE_C;
  const barLength = DIVISIONS * 4;
  const labels = options.labels?.length === chords.length ? options.labels : undefined;

  const measures: WriterMeasure[] = chords.map((chord, bar) => {
    const notes: WriterNote[] = [];
    if (grand) {
      for (const staff of [1, 2] as const) {
        const onIt = chord.filter((midi) => (staff === 1 ? midi >= MIDDLE_C : midi < MIDDLE_C));
        if (onIt.length === 0) {
          // A staff with nothing in this bar still has to account for the
          // bar's time, or the `<backup>` that follows lands in the wrong
          // place and the two staves drift apart from bar two onwards.
          notes.push({
            midi: null,
            duration: barLength,
            type: 'whole',
            voice: STAFF_VOICE[staff],
            staff,
          });
          continue;
        }
        onIt.forEach((midi, index) => {
          notes.push({
            midi,
            duration: barLength,
            type: 'whole',
            voice: STAFF_VOICE[staff],
            staff,
            ...(index > 0 ? { chord: true } : {}),
          });
        });
      }
    } else {
      chord.forEach((midi, index) => {
        notes.push({
          midi,
          duration: barLength,
          type: 'whole',
          voice: 1,
          ...(index > 0 ? { chord: true } : {}),
        });
      });
    }
    const label = labels?.[bar];
    return { notes, ...(label !== undefined && label !== '' ? { text: label } : {}) };
  });

  return writeMusicXml({
    title: options.title,
    fifths,
    beats: 4,
    beatType: 4,
    bpm: 80,
    staves: grand ? 2 : 1,
    clef: low < MIDDLE_C ? 'F' : 'G',
    measures,
  });
}

// --- what a prompt should draw ----------------------------------------------

/** As much of a `DrillPrompt` as a staff needs; see `sheetForPrompt`. */
export interface SheetPrompt {
  label: string;
  expected: readonly number[];
  ordered?: boolean;
  playback?: { midi: number[]; atMs: number }[];
}

/**
 * The chords a prompt is a progression *of*, or null when it is not one.
 *
 * The prompt does not carry its chords as chords — `expected` is one flat list
 * of pitches, because that is what judging an answer needs — but a prompt whose
 * playback is *several sounds of which at least one is more than one note* is a
 * progression by construction, and that is every kind that has one: harmonic
 * dictation plays its chords one to a step, the ear progressions play theirs,
 * the backing track plays its loop a bar at a time. Two single notes played in
 * turn is an interval and a run of them is a tune; neither is a progression,
 * and both already draw correctly as a run.
 *
 * Deriving it here rather than adding a field to `DrillPrompt` keeps the change
 * inside the staff's own file — see the handoff §5as note, which is also where
 * the case for carrying it properly one day is written down.
 */
export function promptProgression(
  prompt: SheetPrompt,
): { chords: number[][]; labels: string[] } | null {
  const steps = prompt.playback ?? [];
  if (steps.length < 2) return null;
  if (!steps.some((step) => step.midi.length > 1)) return null;
  const chords = steps.map((step) => [...step.midi]);
  return { chords, labels: splitProgressionLabel(prompt.label, chords.length) };
}

/**
 * `"C:I – C:V7/V – G:V – G:I"` and `"I-vi-IV-V"` into one word a bar.
 *
 * The two shapes the two progression kinds write: dictation joins its tokens
 * with an en dash and spaces, a written progression is hyphenated. Anything
 * that does not come apart into exactly one word per chord — a cadence named
 * `authentic`, a label somebody writes with a dash in a chord name — yields no
 * labels at all rather than labels that are off by one, because a numeral over
 * the wrong bar is worse than no numeral.
 */
export function splitProgressionLabel(label: string, chords: number): string[] {
  const parts = label
    .split(/\s+[–—-]\s+|-/)
    .map((part) => part.trim())
    .filter((part) => part !== '');
  return parts.length === chords ? parts : [];
}

/**
 * The sheet for a prompt: its progression if it has one, its answer if not.
 *
 * One entry point, so the screen never has to decide which kind of picture a
 * kind wants — the prompt says, and the policy table (`types.ts`) says only
 * *when*.
 */
export function sheetForPrompt(prompt: SheetPrompt, title = prompt.label): string | null {
  const progression = promptProgression(prompt);
  if (progression) {
    return progressionSheet({
      title,
      chords: progression.chords,
      ...(progression.labels.length > 0 ? { labels: progression.labels } : {}),
    });
  }
  return answerSheet({ title, notes: prompt.expected, ordered: prompt.ordered === true });
}

/** Rests that fill `duration` divisions, largest first. */
function rests(duration: number): WriterNote[] {
  const out: WriterNote[] = [];
  let left = duration;
  for (const [size, type] of [
    [DIVISIONS * 4, 'whole'],
    [DIVISIONS * 2, 'half'],
    [DIVISIONS, 'quarter'],
    [DIVISIONS / 2, 'eighth'],
    // A run of sixteenths does not have to end on a beat — nine of them leave
    // three divisions — so the filler goes down to the value the run is in.
    [DIVISIONS / 4, '16th'],
  ] as const) {
    while (left >= size) {
      out.push({ midi: null, duration: size, type, voice: 1 });
      left -= size;
    }
  }
  return out;
}
