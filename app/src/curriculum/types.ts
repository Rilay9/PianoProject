/**
 * The shapes of `catalog.json` and `curriculum.json` as the app reads them.
 *
 * These mirror `content/catalog.schema.json` and `content/curriculum.schema.json`, which
 * are the authority — the schemas validate the build, these types describe what arrives at
 * runtime. Fields the app does not use yet are omitted rather than typed loosely, so a
 * mistake is a compile error and not an `undefined` two screens later.
 */

// The only import in this file, and it is erased: `import type` compiles to
// nothing, so `curriculum/types` still has no runtime dependency on the engine.
// Declaring the two unions again here was the alternative and it is the
// "one fact, two places" shape this repository keeps paying for.
import type { LabBed, LabLock } from '../engine/sightReading';

export type ItemType = 'song' | 'exercise' | 'drill';
export type Hands = 'both' | 'right' | 'left';
/** Where an item's `level` came from — replan §1.4. */
export type LevelSource = 'judged' | 'estimated';

export interface ItemSource {
  name: string;
  url?: string | null;
  license: string;
  pd_region?: string | null;
  editionNotes?: string | null;
}

export interface ItemMedia {
  kind: string;
  label: string;
  url: string;
}

export interface CatalogItem {
  id: string;
  type: ItemType;
  title: string;
  level: number;
  /**
   * Whether `level` was judged for this piece or estimated (replan §1.4).
   *
   * `estimated` means an opus was banded to one number on import, or a model
   * computed it from the score's features. The app prints those as `≈ 7.1`
   * and offers "Re-level" so the owner can replace the guess; doing so makes
   * the item `judged`. Optional in the type, required in the schema: an older
   * catalog in a browser cache must not crash the app.
   */
  levelSource?: LevelSource;
  /**
   * Whether the *composition* is public domain (`00` D23).
   *
   * Not the same question as `source.license`, which is about the edition: a
   * transcription can be CC0 while the song it transcribes is not. `unknown`
   * is the honest answer for most of the quarried library — the dataset says
   * the upload is public domain and says nothing about the work — and the
   * Library sheet says so rather than implying either answer.
   */
  compositionStatus?: 'pd' | 'unknown' | 'in-copyright';
  hands: Hands;
  tracks: string[];
  concepts: string[];
  /**
   * What the item is chosen to train: skill ids from vocabulary v0
   * (`content/curriculum/vocabulary/skills.json`), the primary first (C2).
   *
   * Declared, never evidence: a run is evidence of a skill only through a
   * measurement its definition names (design 2026-09-26 §4). Filled on the nine
   * sight-reading rows only; D writes it per generator family. Nothing in the
   * app reads it yet — C3's evidence function will.
   */
  targetSkills?: string[];
  /**
   * The demands the build measured on the item's file with the app's own
   * detectors (`demands/detect.ts`). Measured, never declared; absent on a
   * runtime drill, whose demands belong to each phrase. Nothing writes it yet (E).
   */
  demands?: string[];
  /** Relative to the primary target skill (design §7). Nothing writes it yet (D). */
  role?: 'canonical' | 'variable' | 'transfer';
  /** null for an import placeholder and for a drill generated at runtime. */
  file?: string | null;
  importHint?: string | null;
  /** Other items that train the same thing — docs/00 D21, docs/04 §2 "Swap this". */
  alternatives?: string[];
  variantOf?: string | null;
  tags?: string[];
  composer?: string | null;
  arranger?: string | null;
  genre?: string[];
  durationSec?: number | null;
  tempoBpm?: number | null;
  keySig?: string | null;
  timeSig?: string | null;
  abrsmGradeApprox?: number | null;
  source?: ItemSource | null;
  media?: ItemMedia[];
  teaching?: {
    lessonIds?: string[];
    notes?: string | null;
    /**
     * Named practice sections for the loop (docs/04 §5, P18).
     *
     * Bars are 1-based positions in the *printed* score, which is what a
     * player counts — not the model's unrolled index, where a piece with a
     * repeat has twice as many.
     */
    sections?: { label: string; fromMeasure: number; toMeasure: number }[];
  } | null;
  drill?: { kind: string; params?: Record<string, unknown> } | null;
  /**
   * What the score file actually says, measured from the MusicXML at build
   * time (`build.py`'s `attach_notation`) rather than asserted anywhere.
   *
   * Only the parts the app reads are typed, per this file's own rule. Until
   * 2026-09-21 that was none of it: `grep -rn "notation" app/src` returned
   * nothing, so the one measured description of every piece was written by
   * the build, used by four Python tools (`validate.py`'s
   * `notation_requirements`, `rung_audit.py`, `candidates.py`,
   * `archive_notation.py`) and read by no screen.
   *
   * `chordCount` is what opens the chord-chart door: a chart of a piece with
   * no chord symbols in it is four empty bars, which is the dead control
   * `00` §1 forbids — the chart screen already refuses that case, and the
   * door should not have offered it.
   */
  notation?: {
    /** How many chord symbols are printed. Zero means there is no chart. */
    chordCount?: number;
    /** The distinct symbols, capped at 24 by the build. */
    chords?: string[];
    /** True when the score carries a `swing` or `shuffle` direction. */
    swungMark?: boolean;
  } | null;
  /**
   * Set on the items synthesised from the `imports` store (docs/04 §4). The
   * Library and the Score screen both need to know that this one's bytes come
   * from IndexedDB rather than from a URL under `content/`.
   */
  imported?: boolean;
  /** `pdf` items open in the PDF viewer (docs/04 §5b), never the Score screen. */
  kind?: 'musicxml' | 'pdf';
  /**
   * Rungs an *imported* item was assigned to (replan §4.3).
   *
   * Distinct from `teaching.lessonIds`, which is what a bundled item's author
   * said it teaches. This one is what the owner said when he saved it, and it
   * is why `curriculum/load.ts` can append the piece to those rungs' song
   * options at runtime.
   */
  lessonIds?: string[];
}

/** Generated by tools/content/finder.py into the built curriculum (replan §4.1). */
export interface Finder {
  skill: string;
  levelWords: string;
  constraints: string[];
  avoid: string[];
  examples?: { title: string; composer?: string; note: 'bundled' | 'wanted' }[];
  formats: string;
  searchQuery: string;
  chatPrompt: string;
}

/**
 * What a rung is still short of (replan §4.2), written by validate.py.
 *
 * The app reads it rather than recounting: the counting rules — the floor, the
 * song-optional rung that counts both lists together — live in the validator,
 * and having them in two places is how the two would come to disagree.
 */
export interface Needs {
  songs: number;
  exercises: number;
  /** Always 0 until the shelf of paper books exists (replan §5). */
  paper: number;
  /** How many of this rung's options have a level inside its band. */
  inBand: number;
  floor: number;
}

/** A concept id, its display name, and how to find music that trains it. */
export interface ConceptEntry {
  id: string;
  display: string;
  /** True for a feature of this app rather than a musical skill: no finder. */
  appFeature?: boolean;
  finder?: Finder;
}

export interface Mastery {
  exercisesRequired: number;
  songsRequired: number;
  minAccuracy: number;
  minTempoPct: number;
  custom?: string;
}

/**
 * One mode a rung recommends, and what to open it on.
 *
 * `item` is optional and names a catalog row the mode should open — a rung says
 * "play *this* one as a duet" or leaves the choice open and the button offers
 * the mode on the rung's first playable option. A tool naming an item the rung
 * does not offer is a lesson pointing somewhere its own options do not go, so
 * `validate.py` refuses it.
 */
export interface LessonTool {
  /**
   * Only the modes that have an address.
   *
   * `rhythm` is deliberately absent: rhythm-only is a remembered setting the
   * Library writes before navigating, so it cannot be reached by a route and a
   * button for it would be a control that looks pressable and opens the wrong
   * thing. `00-invariants` §1 calls that a bug rather than a cosmetic. It stays
   * in the prose, which is where it can be explained.
   *
   * `ladder` was absent for the same reason until 2026-09-22 and is not any
   * more: the tempo ladder is run state scoped to a loop (`05` §6), and on a
   * scale, an arpeggio, a Hanon number or an octave study the whole item *is*
   * the loop, so `?ladder=1` can set both as one action. It is permitted on
   * those rungs only — `04` §3d has the list and the reason a whole-piece loop
   * is absurd on repertoire.
   */
  kind: 'lab' | 'duet' | 'blind' | 'simon' | 'play' | 'ladder';
  /** For `kind: 'lab'` — which preset (`engine/sightReading.ts`'s `LAB_PRESETS`). */
  preset?: string;
  /**
   * For the Score-screen modes — which of this rung's options to open.
   *
   * One of the rung's **own** options, song or exercise, which is what
   * `validate.py`'s `tool_errors` checks it against — a `simon` opens a drill
   * and so takes an exercise, and since 2026-09-22 a `duet` or a `blind` may
   * take one too (`04` §3d: `technique.7`'s sentence is about its exercise).
   * A `ladder` takes no `item` at all: it uses the rung's first exercise that
   * opens as notation, and one written on a `ladder` is refused by name —
   * `tool_errors` says so in its own branch rather than leaving it to the
   * song-option rule, which is what made this sentence false for a day.
   */
  item?: string;
  /** Overrides the default label where the rung wants to say something shorter. */
  label?: string;
  /**
   * For `kind: 'lab'` with a preset - which of that preset's locked pickers
   * this rung hands back.
   *
   * Added 2026-09-22 in place of the shape Entry 24 item 5 gave six rungs: a
   * *second* `lab` entry with no preset, so the page drew two buttons onto one
   * screen and each of the six lessons had to name both. `validate.py` refuses
   * a name the rung's own preset does not lock.
   */
  unlock?: readonly LabLock[];
  /**
   * For `kind: 'lab'` - which of the three ways round the lab opens on
   * (`04` 3c).
   *
   * A preset carries a default and a preset is shared, so the three rungs
   * Entry 30 named - `jam.5`, `3.2` and `chords-pop.9` - had no way to ask for
   * the other one.
   */
  mode?: LabBed;
}

export interface Lesson {
  id: string;
  title: string;
  concepts: string[];
  textFile: string;
  exerciseOptions: string[];
  songOptions: string[];
  mastery: Mastery;
  /**
   * True when no song tests this unit's skill — reading by interval, the first scale,
   * accompaniment patterns, the theory and improvisation tracks (docs/02 Part G). The
   * lesson then completes on two exercises instead of an exercise and a song.
   */
  songOptional?: boolean;
  /** Orientation lessons that are a single thing by nature: the placement test, the tour. */
  optionsExempt?: boolean;
  /**
   * The modes this rung's material suits, as controls rather than as prose
   * (`04` §3d, added 2026-09-18).
   *
   * Sixty lessons gained a "Tools for this rung" paragraph in `b4fb15b` and a
   * paragraph cannot be tapped. `chords-pop.3` tells the learner to *"Pick D,
   * take I–IV–V–I"* in the accompaniment lab — which is now one preset chip the
   * lesson has no way to open. Duet, rhythm-only, blind, the tempo ladder,
   * Simon and the five lab presets are all built and no lesson links to any of
   * them.
   *
   * Each entry becomes a button that opens the thing, using the route
   * parameters the Score screen and the lab already take. The prose stays: it
   * says *why* the mode suits this rung, which a button cannot.
   */
  tools?: LessonTool[];
  prerequisites?: string[];
  estimatedDays?: number;
  /** How to go and find more for this rung. Absent only on an exempt rung. */
  finder?: Finder;
  /**
   * What to play from a book instead, if he has one (replan §5.2).
   *
   * Prose, not data: "or bars 1-16 of whatever your method book gives for
   * hands together with a held left hand". It is a sentence rather than a
   * search because a method book is not searchable — he is looking at a shelf.
   */
  paperHint?: string;
  /**
   * Registered book pieces assigned to this rung, appended at runtime by the
   * shelf overlay. Never in the built curriculum: the shelf lives on the
   * phone, and nothing about which books he owns belongs in the repository.
   */
  paperOptions?: string[];
  /** What it is short of, written by validate.py. */
  needs?: Needs;
  /** `[min, max]` level across this rung's options (replan §1.7). */
  levelBand?: [number, number];
}

export interface Unit {
  id: string;
  title: string;
  track: string;
  lessons: Lesson[];
}

export interface Stage {
  number: number;
  title: string;
  summary: string;
  units: Unit[];
  approxDuration?: string;
  abrsmGradeApprox?: number | string | null;
}

export interface Track {
  id: string;
  title: string;
  description: string;
  startsAtStage: number;
  /** Switched on for a new learner; the Plan screen's track chips change it. */
  defaultActive?: boolean;
}

export interface Curriculum {
  version: number;
  tracks: Track[];
  stages: Stage[];
  /** Display names and finders for every concept id used anywhere (replan §4.1). */
  concepts?: ConceptEntry[];
}

/** What the learner has passed, keyed by item id. P7 stores this in IndexedDB. */
export interface PassRecord {
  itemId: string;
  passed: boolean;
  mastered?: boolean;
  /**
   * True when the pass is the learner's own word rather than a measurement —
   * "I already know this", or a run against paper the app could not see.
   */
  selfPassed?: boolean;
}
