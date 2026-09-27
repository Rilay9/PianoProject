/**
 * The human review record, as the builder's microscope reads and writes it (D2 item 2;
 * R42, G29, Part 15 §18).
 *
 * `content/review/decisions.jsonl` is the record: one event per line, append-only. This
 * module is the screen's half of its contract; `tools/content/review.py` is the build's
 * and the merge's half. The two are held to one set of cases
 * (`tools/content/tests/fixtures/review_cases.json`, read by `reviewRecord.test.ts` and
 * `test_review_record.py`), so the screen and the build resolve the same lines to the
 * same current values.
 *
 * - **One dimension per event**: `usableScore` or `goodTeachingUse`, each with its own
 *   value, reason, category and `basis` (`inspected`, `notation`, `heard` — the last only
 *   for complete playback with both hands sounding at the item's intended tempo).
 * - **Current values per item and per dimension**: a triage line never participates; an
 *   event on a stale identity never participates; among the valid human events for one
 *   item and one dimension the latest (`at`, then the later line) is current. An event on
 *   one dimension never touches the other's value or basis.
 * - **Identity**: a generated item's generator (family, version, seed) and recipe; a
 *   notated item's built file (sha256, E0's cache key); `none` where there is no file.
 *
 * Nothing here touches a learner's store: the screen keeps its own decisions under its own
 * key (`DevMicroscopeScreen.ts`), and this module is pure.
 */
import type { CatalogItem } from '../curriculum/types';

export const DIMENSIONS = ['usableScore', 'goodTeachingUse'] as const;
export type Dimension = (typeof DIMENSIONS)[number];
export const VALUES = ['yes', 'no', 'fix'] as const;
export type ReviewValue = (typeof VALUES)[number];
/** What a judgement rests on, weakest first. */
export const BASES = ['inspected', 'notation', 'heard'] as const;
export type Basis = (typeof BASES)[number];
export const CATEGORIES: Record<Dimension, readonly string[]> = {
  usableScore: ['notation', 'transcription', 'fidelity', 'identity', 'rendering', 'playback', 'other'],
  goodTeachingUse: ['role', 'opportunity', 'demands', 'physical', 'musical-shape', 'style', 'usefulness', 'placement', 'other'],
};
/** The provenance bit each dimension fills (`provenance.review`). */
export const BIT: Record<Dimension, 'score' | 'teaching'> = { usableScore: 'score', goodTeachingUse: 'teaching' };
export const TRIAGE = 'triage';

export type Identity =
  | {
      kind: 'generator';
      family: string;
      version: number;
      seed: number | string | null;
      recipe: Record<string, unknown>;
      tempoBpm: number | null;
    }
  | { kind: 'file'; sha256: string }
  | { kind: 'none'; why?: string };

export interface HumanEvent {
  v: 1;
  event: string;
  item: string;
  identity: Identity;
  dimension: Dimension;
  value: ReviewValue;
  basis: Basis;
  reason: string;
  category: string;
  by: string;
  at: string;
  note?: string;
  supersedes?: string;
}

export interface TriageEvent {
  v: 1;
  event: string;
  item: string;
  identity?: Identity;
  dimension?: Dimension;
  reason: string;
  category?: string;
  by: typeof TRIAGE;
  at: string;
  from?: string;
  note?: string;
}

export type ReviewEvent = HumanEvent | TriageEvent;
export type EventStatus = 'current' | 'superseded' | 'stale' | 'triage' | 'unknown-item';

const EVENT_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{5,79}$/;
const ITEM_ID = /^[A-Za-z][A-Za-z0-9._-]{0,119}$/;
/** Always with milliseconds and `Z`, so the strings sort as the times they name. */
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const SHA256 = /^[0-9a-f]{64}$/;

const HUMAN_KEYS = new Set(['v', 'event', 'item', 'identity', 'dimension', 'value', 'basis', 'reason', 'category', 'by', 'at', 'note', 'supersedes']);
const HUMAN_REQUIRED = [...HUMAN_KEYS].filter((key) => key !== 'note' && key !== 'supersedes');
const TRIAGE_KEYS = new Set(['v', 'event', 'item', 'identity', 'dimension', 'reason', 'category', 'by', 'at', 'from', 'note']);
const TRIAGE_REQUIRED = ['v', 'event', 'item', 'reason', 'by', 'at'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function identityFault(identity: unknown): string | null {
  if (!isObject(identity)) return 'identity is not an object';
  const keys = Object.keys(identity);
  if (identity.kind === 'generator') {
    const extra = keys.filter((key) => !['kind', 'family', 'version', 'seed', 'recipe', 'tempoBpm'].includes(key));
    if (extra.length > 0) return `identity has unknown fields ${extra.join(', ')}`;
    if (typeof identity.family !== 'string' || identity.family === '') return 'a generator identity names no family';
    if (typeof identity.version !== 'number' || !Number.isInteger(identity.version)) return "a generator identity's version is not an integer";
    if (!('seed' in identity) || !(identity.seed === null || typeof identity.seed === 'number' || typeof identity.seed === 'string')) {
      return "a generator identity's seed is missing or not a number, a string or null";
    }
    if (!isObject(identity.recipe)) return 'a generator identity has no recipe';
    if (!('tempoBpm' in identity) || !(identity.tempoBpm === null || typeof identity.tempoBpm === 'number')) {
      return "a generator identity's tempoBpm is missing or not a number or null";
    }
    return null;
  }
  if (identity.kind === 'file') {
    if (keys.length !== 2 || !keys.includes('sha256')) return 'a file identity carries exactly kind and sha256';
    if (typeof identity.sha256 !== 'string' || !SHA256.test(identity.sha256)) return "a file identity's sha256 is not 64 lowercase hex digits";
    return null;
  }
  if (identity.kind === 'none') {
    if (keys.some((key) => key !== 'kind' && key !== 'why')) return 'a none identity carries only kind and why';
    return null;
  }
  return `identity kind ${JSON.stringify(identity.kind)} is not generator, file or none`;
}

/** Why this value is not a valid record line, or null. The same rules as `review.event_fault`. */
export function eventFault(value: unknown): string | null {
  if (!isObject(value)) return 'not a JSON object';
  if (value.v !== 1) return 'v is not 1';
  const by = value.by;
  if (typeof by !== 'string' || by.trim() === '') return "by (the reviewer's name, or triage) is missing";
  const triage = by === TRIAGE;
  const keys = triage ? TRIAGE_KEYS : HUMAN_KEYS;
  const required = triage ? TRIAGE_REQUIRED : HUMAN_REQUIRED;
  const missing = required.filter((key) => !(key in value)).sort();
  if (missing.length > 0) return `missing ${missing.join(', ')}`;
  const extra = Object.keys(value).filter((key) => !keys.has(key)).sort();
  if (extra.length > 0) {
    if (triage && extra.some((key) => key === 'value' || key === 'basis' || key === 'supersedes')) {
      return `a triage line carries ${extra.join(', ')}: triage flags, it never decides`;
    }
    return `unknown fields ${extra.join(', ')}`;
  }
  if (typeof value.event !== 'string' || !EVENT_ID.test(value.event)) {
    return 'event id is not 6-80 letters, digits, dots, colons, dashes or underscores';
  }
  if (typeof value.item !== 'string' || !ITEM_ID.test(value.item) || value.item.includes('..')) return 'item is not a catalogue id';
  if (typeof value.at !== 'string' || !TIMESTAMP.test(value.at)) {
    return 'at is not an ISO time in UTC with milliseconds (2026-09-27T10:00:00.000Z)';
  }
  if (typeof value.reason !== 'string' || value.reason.trim() === '') return 'reason is empty';
  for (const optional of ['note', 'from'] as const) {
    if (optional in value && typeof value[optional] !== 'string') return `${optional} is not text`;
  }
  if ('dimension' in value && !(DIMENSIONS as readonly unknown[]).includes(value.dimension)) {
    return `dimension ${JSON.stringify(value.dimension)} is not one of ${DIMENSIONS.join(', ')}`;
  }
  if ('identity' in value) {
    const fault = identityFault(value.identity);
    if (fault) return fault;
  }
  if (triage) {
    if ('category' in value && typeof value.category !== 'string') return 'category is not text';
    return null;
  }
  if (by.trim().toLowerCase() === TRIAGE) return "the reviewer's name 'triage' is reserved for triage lines";
  if (!(VALUES as readonly unknown[]).includes(value.value)) return `value ${JSON.stringify(value.value)} is not one of ${VALUES.join(', ')}`;
  if (!(BASES as readonly unknown[]).includes(value.basis)) return `basis ${JSON.stringify(value.basis)} is not one of ${BASES.join(', ')}`;
  const dimension = value.dimension as Dimension;
  if (!CATEGORIES[dimension].includes(value.category as string)) {
    return `category ${JSON.stringify(value.category)} is not one of ${CATEGORIES[dimension].join(', ')} for ${dimension}`;
  }
  if ('supersedes' in value && (typeof value.supersedes !== 'string' || !EVENT_ID.test(value.supersedes))) {
    return 'supersedes is not an event id';
  }
  return null;
}

export function isTriage(event: ReviewEvent): event is TriageEvent {
  return event.by === TRIAGE;
}

export interface ParsedLine {
  line: number;
  text: string;
  event: ReviewEvent;
}

/**
 * The lines of a record or an export: each valid event with its line number, and each
 * refused line with its number and why. Blank lines count and are skipped; a second
 * valid line with an event id already seen is refused.
 */
export function parseRecord(text: string): { events: ParsedLine[]; errors: { line: number; why: string }[] } {
  const events: ParsedLine[] = [];
  const errors: { line: number; why: string }[] = [];
  const seen = new Map<string, number>();
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();
    if (trimmed === '') return;
    let value: unknown;
    try {
      value = JSON.parse(trimmed);
    } catch (cause) {
      errors.push({ line, why: `not JSON (${cause instanceof Error ? cause.message : String(cause)})` });
      return;
    }
    const fault = eventFault(value);
    if (fault) {
      errors.push({ line, why: fault });
      return;
    }
    const event = value as ReviewEvent;
    const earlier = seen.get(event.event);
    if (earlier !== undefined) {
      errors.push({ line, why: `event id ${event.event} is already on line ${String(earlier)}` });
      return;
    }
    seen.set(event.event, line);
    events.push({ line, text: trimmed, event });
  });
  return { events, errors };
}

/** Structural equality, keys in any order; numbers by value. */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  }
  if (isObject(a) && isObject(b)) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every((key) => key in b && deepEqual(a[key], b[key]));
  }
  return false;
}

/** A `none` identity matches any `none`; a file by its hash; a generator by triple, recipe and tempo. */
export function sameIdentity(a: Identity | undefined, b: Identity | undefined): boolean {
  if (!a || !b || a.kind !== b.kind) return false;
  if (a.kind === 'none') return true;
  if (a.kind === 'file' && b.kind === 'file') return a.sha256 === b.sha256;
  if (a.kind === 'generator' && b.kind === 'generator') {
    return a.family === b.family && a.version === b.version && a.seed === b.seed && deepEqual(a.recipe, b.recipe) && a.tempoBpm === b.tempoBpm;
  }
  return false;
}

interface GeneratorFields {
  family?: string;
  version?: number;
  seed?: number | string | null;
}

/**
 * G21's identity of a generated item, from its catalogue row: `review.generator_identity`.
 * `drill.generator` is not in the app's type (nothing at runtime reads it), so it is read
 * structurally here.
 */
export function generatorIdentity(item: CatalogItem): Identity | null {
  const drill = item.drill as ({ params?: Record<string, unknown>; generator?: GeneratorFields } | null | undefined);
  const generator = drill?.generator;
  if (!generator || typeof generator.family !== 'string' || typeof generator.version !== 'number') return null;
  const recipe: Record<string, unknown> = { ...(drill.params ?? {}) };
  if (!('hands' in recipe)) recipe.hands = item.hands;
  return {
    kind: 'generator',
    family: generator.family,
    version: generator.version,
    seed: generator.seed ?? null,
    recipe,
    tempoBpm: item.tempoBpm ?? null,
  };
}

/**
 * The identity a decision on this item binds to, given the sha256 of the file the screen
 * rendered (for a notated item). A generated item is identified by its generator whatever
 * its file's bytes.
 */
export function identityOf(item: CatalogItem, fileSha256: string | null): Identity {
  const file = item.file ?? '';
  const generated = generatorIdentity(item);
  if (generated && file.startsWith('scores/generated/')) return generated;
  if (file && fileSha256) return { kind: 'file', sha256: fileSha256 };
  if (file) return { kind: 'none', why: 'the score file was not built' };
  if (item.drill) return { kind: 'none', why: 'made when it opens: no file the build keys' };
  return { kind: 'none', why: 'no notation is bundled' };
}

export type Decided = Partial<Record<Dimension, HumanEvent>>;

/**
 * The current event per item and dimension, and each event's status: the same rules as
 * `review.resolve`. `current(item)` is the item's identity now, or undefined for an item
 * the catalogue does not have.
 */
export function resolve(
  events: readonly ReviewEvent[],
  current: (item: string) => Identity | undefined,
): { decided: Map<string, Decided>; status: Map<string, EventStatus> } {
  const status = new Map<string, EventStatus>();
  const candidates = new Map<string, { at: string; order: number; event: HumanEvent }[]>();
  events.forEach((event, order) => {
    if (isTriage(event)) {
      status.set(event.event, 'triage');
      return;
    }
    const identity = current(event.item);
    if (identity === undefined) {
      status.set(event.event, 'unknown-item');
      return;
    }
    if (!sameIdentity(event.identity, identity)) {
      status.set(event.event, 'stale');
      return;
    }
    const key = `${event.item}\u0000${event.dimension}`;
    const list = candidates.get(key) ?? [];
    list.push({ at: event.at, order, event });
    candidates.set(key, list);
  });
  const decided = new Map<string, Decided>();
  for (const list of candidates.values()) {
    list.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.order - b.order));
    for (const row of list.slice(0, -1)) status.set(row.event.event, 'superseded');
    const winner = list[list.length - 1]!.event;
    status.set(winner.event, 'current');
    const entry = decided.get(winner.item) ?? {};
    entry[winner.dimension] = winner;
    decided.set(winner.item, entry);
  }
  return { decided, status };
}

/** Triage lines that still bear on their item: no identity given, or the item's current one. */
export function flagsOf(events: readonly ReviewEvent[], current: (item: string) => Identity | undefined): TriageEvent[] {
  return events.filter((event): event is TriageEvent => {
    if (!isTriage(event)) return false;
    const identity = current(event.item);
    if (identity === undefined) return false;
    return event.identity === undefined || sameIdentity(event.identity, identity);
  });
}

/** `yes` is usable / a good use as it stands; `no` and `fix` are not, as it stands. */
export function bits(decided: Decided | undefined): { score: boolean | null; teaching: boolean | null } {
  return {
    score: decided?.usableScore ? decided.usableScore.value === 'yes' : null,
    teaching: decided?.goodTeachingUse ? decided.goodTeachingUse.value === 'yes' : null,
  };
}

/**
 * What merging `incoming` into `existing` would append, skip and refuse: the same rules as
 * `review.merge_lines`. The screen uses it to show what the record will hold once its
 * decisions are merged, and the rules are the merge's.
 */
export function mergeEvents(
  existing: readonly ReviewEvent[],
  incoming: readonly ReviewEvent[],
  current: (item: string) => Identity | undefined,
): { append: ReviewEvent[]; skipped: string[]; refused: { event: string; why: string }[] } {
  const known = new Map(existing.map((event) => [event.event, event]));
  const append: ReviewEvent[] = [];
  const skipped: string[] = [];
  const refused: { event: string; why: string }[] = [];
  for (const event of incoming) {
    const fault = eventFault(event);
    if (fault) {
      refused.push({ event: event.event, why: fault });
      continue;
    }
    const already = known.get(event.event);
    if (already) {
      if (deepEqual(already, event)) skipped.push(event.event);
      else refused.push({ event: event.event, why: `event id ${event.event} is already in the record with different content` });
      continue;
    }
    const identity = current(event.item);
    if (identity === undefined) {
      refused.push({ event: event.event, why: `${event.item} is not in the built catalogue` });
      continue;
    }
    if (event.identity !== undefined && !sameIdentity(event.identity, identity)) {
      refused.push({ event: event.event, why: `${event.item}: the line names an identity the catalogue does not have` });
      continue;
    }
    known.set(event.event, event);
    append.push(event);
  }
  return { append, skipped, refused };
}

/** One line of the record, keys in the order the README lists them. */
export function serializeEvent(event: ReviewEvent): string {
  const order = ['v', 'event', 'item', 'identity', 'dimension', 'value', 'basis', 'category', 'reason', 'note', 'by', 'from', 'at', 'supersedes'];
  const record = event as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of order) if (key in record && record[key] !== undefined) out[key] = record[key];
  return JSON.stringify(out);
}
