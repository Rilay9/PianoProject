/**
 * The shapes of `catalog.json` and `curriculum.json` as the app reads them.
 *
 * These mirror `content/catalog.schema.json` and `content/curriculum.schema.json`, which
 * are the authority — the schemas validate the build, these types describe what arrives at
 * runtime. Fields the app does not use yet are omitted rather than typed loosely, so a
 * mistake is a compile error and not an `undefined` two screens later.
 */

export type ItemType = 'song' | 'exercise' | 'drill';
export type Hands = 'both' | 'right' | 'left';

export interface CatalogItem {
  id: string;
  type: ItemType;
  title: string;
  level: number;
  hands: Hands;
  tracks: string[];
  concepts: string[];
  /** null for an import placeholder and for a drill generated at runtime. */
  file?: string | null;
  importHint?: string | null;
  /** Other items that train the same thing — docs/00 D21, docs/04 §2 "Swap this". */
  alternatives?: string[];
  variantOf?: string | null;
  tags?: string[];
}

export interface Mastery {
  exercisesRequired: number;
  songsRequired: number;
  minAccuracy: number;
  minTempoPct: number;
  custom?: string;
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
  prerequisites?: string[];
  estimatedDays?: number;
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
}

export interface Curriculum {
  version: number;
  tracks: { id: string; title: string; description: string; startsAtStage: number }[];
  stages: Stage[];
}

/** What the learner has passed, keyed by item id. P7 stores this in IndexedDB. */
export interface PassRecord {
  itemId: string;
  passed: boolean;
  mastered?: boolean;
}
