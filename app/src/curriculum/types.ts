/**
 * The shapes of `catalog.json` and `curriculum.json` as the app reads them.
 *
 * These mirror `content/catalog.schema.json` and `content/curriculum.schema.json`, which
 * are the authority — the schemas validate the build, these types describe what arrives at
 * runtime. Fields the app does not use yet are omitted rather than typed loosely, so a
 * mistake is a compile error and not an `undefined` two screens later.
 */

// The only imports in this file, and they are erased: `import type` compiles to
// nothing, so `curriculum/types` still has no runtime dependency on the engine.
// Declaring the two unions again here was the alternative and it is the
// "one fact, two places" shape this repository keeps paying for. D2's `Identity`
// is reused the same way (D4): one identity type for a review decision, a
// catalogue row's material and a run's.
import type { LabBed, LabLock } from '../engine/sightReading';
import type { Identity } from '../review/record';

/**
 * `excerpt` (E1): a passage of another item, cut by the build into its own file and measured on
 * the cut (`excerptOf` names the parent; `provenance.excerpt` is its identity). It is music from a
 * piece, never an exercise or a drill, and never the piece itself: `curriculum/excerpt.ts` says how
 * each reader of the type treats one.
 */
export type ItemType = 'song' | 'exercise' | 'drill' | 'excerpt';
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
  /**
   * For an excerpt (E1): the catalogue id of the item the passage was cut from. Display and
   * attribution only (the Library names the parent); the excerpt's demands, level and identity
   * are the cut's own, and its `source` is the parent's, whole.
   */
  excerptOf?: string;
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
   * sight-reading rows (C2) and, since D0, on the generated items whose family
   * contract names a judged primary skill. Read only through `skillActivation.ts`:
   * the evidence readers act on the reading rows' alone, and selection acts on a
   * declared skill only where the one gate (`eligibility.ts`, E0) finds its
   * opportunity established in the measured notes.
   */
  targetSkills?: string[];
  /**
   * The demands the build measured on the item's file with the app's own
   * detectors (`demands/detect.ts`), in the vocabulary's order (E0,
   * `build.attach_demands`; the import path for an imported score). Measured,
   * never declared. `'unmeasured'` where a notated item could not be measured,
   * with the reason in `measurement.reason` — never an empty list that reads as
   * "no demands", which is why it is a string the compiler makes every reader
   * handle. Absent on a runtime drill, whose demands belong to each phrase.
   *
   * Read at runtime only through `eligibility.ts`, the one gate (E0).
   */
  demands?: string[] | 'unmeasured';
  /** How the demands are known, with the counts the density judgement reads (E0). */
  measurement?: Measurement;
  /** Where the item came from and how each fact about it is known (E0; R35). */
  provenance?: Provenance;
  /**
   * Relative to the primary target skill (design §7). Written on the generated items
   * from their family contracts since D0. Selection intent, never evidence: since D4 the
   * session's transfer offer reads `transfer` beside `provenance.transferOf`, and a run
   * keeps the role it was played under; the ladder's transfer still reads first contact.
   */
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
    /**
     * The key signatures the file states, in order, as the build measured them (`fifths`: sharps
     * positive, flats negative). Read by the transfer relationship's key dimension (D4).
     */
    keys?: { fifths: number; mode?: string | null }[];
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

/**
 * How an item's demands are known (E0; `catalog.schema.json`'s `measurement`).
 *
 * - `measured`: the detectors ran on the file. `located` counts the places each
 *   demand was found (only those found at least once); `established` is what the
 *   item provides at a useful density (`content/sources/opportunity-density.json`,
 *   or a generated family's own contract density, `contract`) — the opportunities
 *   the gate reads, told apart from incidental presence.
 * - `unmeasured`: a notated item the detectors could not read, and why.
 * - `runtime`: a drill the app makes when it opens; its demands belong to each phrase.
 */
export type Measurement =
  | {
      status: 'measured';
      definitions: number;
      detectors?: string;
      located: Record<string, number>;
      bars: number;
      steps: number;
      notes: number;
      established: string[];
      contract?: string[];
      /** Of an excerpt's `established` (E1), the demands only the window rule (`minInWindow`) establishes. */
      window?: string[];
      /** Readings known to be wrong on this file (the detectors' clef assumption): kept among the ids, never established. */
      misread?: { demands: string[]; why: string };
      /**
       * Each sounding hand's lowest and highest MIDI over the whole piece, grace notes left out (L120b): the
       * build's reading of the bridge's per-bar `hands` (`build.attach_demands`). The coping question reads it
       * to say whether a skip lies inside a taught fixed position (`eligibilityCore.uncoped`). Absent on a row
       * measured before it, on an import, and where no note sounds: then no position copes with anything.
       */
      span?: Partial<Record<'R' | 'L', [number, number]>>;
    }
  | { status: 'unmeasured'; reason: string }
  | { status: 'runtime'; reason: string };

/** How one fact about an item is known (E0): never flattened into one field. */
export type FactKind = 'measured' | 'inferred' | 'authored' | 'reviewed' | 'unmeasured' | 'runtime';

/**
 * Where an item came from and how each fact about it is known (E0; R35, R15, R11,
 * Part 21 §B). Written by `build.attach_provenance` for a bundled item and by the
 * import path for an imported score. Only the parts the app reads are typed.
 */
export interface Provenance {
  source:
    | 'authored'
    | 'pdmx'
    | 'kern'
    | 'musetrainer'
    | 'mutopia'
    | 'generated'
    | 'runtime'
    | 'placeholder'
    | 'imported-midi'
    | 'imported-musicxml'
    | 'imported-pdf'
    | 'excerpt';
  edition?: string | null;
  composition?: string;
  arrangement?: string;
  converter?: { name: string; version?: string | number };
  /**
   * `value` is what an authored or reviewed fact states: a reviewed decision's `yes`, `no` or `fix`
   * (D2), and a generated item's `promise` — `music` or `drill`, its family contract's rule for its
   * recipe (D3a), which the one gate reads with `review.teaching`.
   */
  facts: Record<string, { kind: FactKind; via?: string; why?: string; untrusted?: string[]; value?: string }>;
  /** R42's two decisions, apart: a usable, faithful score; a good teaching use. `null`: no person has decided. */
  review: { score: boolean | null; teaching: boolean | null };
  /** A declared large-hand voicing, with what a smaller hand does instead (D0 finding 5). */
  physical?: { largeHandSpan?: number; prerequisite: string; alternative: string };
  /**
   * An excerpt's identity (E1 item 4): the definition it was cut from, the cut version, the
   * parent's built bytes at cut time and its edition, and `key`, sha256 over them. The cut file's
   * own sha256 is the identity the review record and a run's `material` carry.
   */
  excerpt?: ExcerptProvenance;
  /**
   * The material identity (D4 item 1): D2's `Identity` as the build computes it
   * (`review.current_identity`) — a generated item's generator family, version and seed with its
   * recipe and tempo; a notated item's built file by its sha256, an excerpt's cut included; `none`
   * for a drill made when it opens or a placeholder. Written on every bundled row; what a run of the
   * row stores as its `material`, so the app never recomputes it. Absent on an import and on a
   * catalogue from before D4.
   */
  identity?: Identity;
  /**
   * The file identities this row's music had while the converter wrote music21's `<encoding-date>`
   * (E50a): the recorded historical dated files (`tools/content/former_identities.json`, from the
   * catalogues able to store a learner's material) whose undated form is this row's file, each re-proved
   * by the build (`convert.former_identities`: the date put back gives its bytes). Only on a row whose
   * file the converter wrote without a date; never the row's own identity. A stored learner row that
   * names one names this row's material (`material.learnerMaterial`); D2's record never reads it.
   * Since E50, also a reviewed repair's old file (`tools/content/repaired_identities.json`), and since
   * E50b the Wabash cut's old cut (the one derived repair the build produced).
   */
  formerIdentities?: Extract<Identity, { kind: 'file' }>[];
  /**
   * E50b: the former identities whose file a reviewed repair changed the tempo of (a relation marked
   * `tempoChanged`): a run stored against one measured its percentage of the old tempo, and a run of
   * this row's id that stored no material or no written base tempo does not show what its percentage
   * is of (never guessed), so no tempo-dependent standard reads either's tempo against
   * this row's (`material.tempoNotComparable`, `rungState.meetsStandard`). Contact, familiarity and
   * projects read the run as before; the run is never rewritten.
   */
  tempoRepairedFrom?: Extract<Identity, { kind: 'file' }>[];
  /**
   * A transfer role's relationship as its family contract declares it for the recipe (D4 item 4):
   * the skill it is transfer material for, the families it was written against, the surface
   * dimensions declared to differ, and what stays unmeasured. Intent and relationship, never
   * evidence; absent on every item whose role is not `transfer`.
   */
  transferOf?: TransferOf;
}

/** `provenance.transferOf` (D4; `catalog.schema.json`): a family contract's declaration for one recipe. */
export interface TransferOf {
  skill: string;
  /** The generator families the declaration was written against. */
  from: string[];
  /** The surface dimensions declared to differ from those families. */
  differs: string[];
  /** What the difference involves that nothing measures. */
  notMeasured: string[];
}

/** `provenance.excerpt` (E1; `catalog.schema.json`). */
export interface ExcerptProvenance {
  of: string;
  /** Printed bars, 1-based, the pickup counted as bar 1. */
  fromBar: number;
  toBar: number;
  selection: Hands;
  cutVersion: number;
  parentSha256: string;
  parentEdition?: string | null;
  key: string;
  targets?: string[];
  event?: string | null;
  /** An approval made on parent bytes the parent no longer has. */
  stale?: { approvedParentSha256: string; why: string };
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

/**
 * The rung's standard for judging **one run** (`02` Part G): the share of the
 * notes and the share of the written tempo a run has to reach, where the rung
 * states them (`selectors.masteryCriteriaFor`; 0 is "no number of its own").
 * What completes the rung is not here: it is `Lesson.requirements` (C5).
 */
export interface Mastery {
  minAccuracy: number;
  minTempoPct: number;
}

/**
 * What a rung asks of the learner's evidence (C5): one predicate each, every
 * one the app can judge must hold for the rung to be met (`evidence/rungState`).
 *
 * Two scopes, and they are the point (the reviewer's clarification of
 * 2026-09-27). **Skill evidence is the learner's everywhere**: a `skill`
 * requirement reads the ladder over every evidence record, whichever rung the
 * run was judged by. **The decision that this rung's requirement is met by a
 * run is this rung's**: `runs`, `reads` and `measure` count only runs whose
 * record names this rung as the one that judged them (`SessionRow.lessonId`),
 * re-judged under this rung's standard. No item carries credit: an item listed
 * by three rungs completes none of them by being listed.
 */
export type Requirement =
  | RunsRequirement
  | ReadsRequirement
  | SkillRequirement
  | DoneRequirement
  | MeasureRequirement
  | UnjudgedRequirement;

/**
 * Runs of this rung's own material, judged by this rung, each at its standard
 * (Keep tempo at `minTempoPct` or faster where it states a tempo, `minAccuracy`
 * of the notes), counted as distinct items. What the old counts of required
 * exercises and songs counted as passed flags, restated over what the runs
 * measured.
 */
export interface RunsRequirement {
  kind: 'runs';
  /** The rung's exercises, its songs (paper pieces included), or either. */
  from: 'exercises' | 'songs' | 'any';
  /** Only these of the rung's own options (the ear drill a theory rung names). */
  items?: string[];
  /** Distinct items with a qualifying run. */
  count: number;
  /** Played as a performance: started once, no restart, no loop, nothing played to the learner inside it. */
  performance?: boolean;
  /** The share of the notes, where this requirement asks more than the rung's `minAccuracy`. */
  accuracy?: number;
}

/**
 * Phrases read at sight from this rung's reading row, judged by this rung,
 * whose stored evidence for `skill` is at `standard` (the full standard
 * satisfies the practice one) with `share` of its opportunities right.
 */
export interface ReadsRequirement {
  kind: 'reads';
  skill: string;
  standard: 'practice' | 'full';
  share: number;
  count: number;
}

/** A skill's ladder state over all the learner's evidence, at `state` or above (`evidence/ladder`). */
export interface SkillRequirement {
  kind: 'skill';
  skill: string;
  state: 'familiar' | 'proficient';
}

/**
 * An item of this rung's alone, recorded finished with nothing left undone:
 * the tour walked to its end, the placement test answered, every box of the
 * checklist ticked. An event the app observes, not a measurement of a skill.
 */
export interface DoneRequirement {
  kind: 'done';
  item: string;
}

/** A run judged by this rung whose technique measure (`RunMeasures.technique`) of this kind was met. */
export interface MeasureRequirement {
  kind: 'measure';
  measure: string;
}

/**
 * The lesson's rule where no run the app records can show it (loudness
 * contrast, clean pedalling, a time limit, a recording): printed on the page
 * as the lesson's, never counted, never passed in silence. A rung whose every
 * requirement is this kind is not judged by the app at all.
 */
export interface UnjudgedRequirement {
  kind: 'unjudged';
  /** The rule as the curriculum wrote it (the old `mastery.custom` term). */
  rule: string;
  /** The rule in the learner's words, for the lesson page. */
  says: string;
  /** Why no run can show it, for the record and the build's report. */
  why: string;
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
  /**
   * Measurable concepts the lesson introduces while no piece on the rung
   * practises them yet (`docs/02`, F2): the build's field, beside `concepts`.
   * No teaching claim, requirement or evidence reads it. A rung carried over
   * from before C5 makes each an exposure, as it does each of its concepts
   * (`carriedExposures`; CL04, G70). Absent on most rungs.
   */
  introduces?: string[];
  textFile: string;
  exerciseOptions: string[];
  songOptions: string[];
  mastery: Mastery;
  /** What completes the rung, as predicates over the learner's evidence (C5). */
  requirements: Requirement[];
  /**
   * True when no song tests this unit's skill — reading by interval, the first scale,
   * accompaniment patterns, the theory and improvisation tracks (docs/02 Part G). Its
   * requirements then ask for exercises and no song.
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
  /**
   * Each listed book piece's twin (`BookPiece.itemId`, a catalog id), by the
   * piece's `book.<book>/<piece>` id: written by the shelf overlay beside
   * `paperOptions` and, like them, never in the built curriculum. A measured
   * run of the twin judged by this rung counts toward the rung's `runs`
   * requirements as the book piece (`rungState`; CL04, L79).
   */
  paperTwins?: Record<string, string>;
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

