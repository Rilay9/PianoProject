// @vitest-environment jsdom
/**
 * The curriculum–generator contract (C4b; the reviewer, Part 8: S25 "as an
 * invariant across the reading curriculum").
 *
 * For every core rung at which the reader offers a reading row (the real
 * `readingOffer`, a learner placed there with no reads), and every demand
 * vocabulary v0 names, the chain in full:
 *
 * taught → selectable → generatable → the detector confirms the requested
 * demand → demands taught later than the rung are absent.
 *
 * - The rung's **base** is its reading row's recipe held to what the rung has
 *   taught (`heldToRung`): on 2.2 the right-hand row inside C position (S16),
 *   everywhere else the row as it stands. The base keeps the rung's promises
 *   and writes nothing the rung has not taught.
 * - **On**: a demand the rung has taught (`taughtAt` at or before it, in the
 *   curriculum's order) that the base does not already write in every phrase
 *   is turned on with its control (`readingControls.ts`). Over the seeds, every
 *   phrase contains it; the rung's and the row's promises hold; nothing a
 *   later rung teaches appears; and nothing appears that the base never wrote
 *   but what the control declares it `brings`.
 * - **Off**: a taught demand the base writes is turned off on the same terms;
 *   a promise about that very demand is dropped on purpose (listed, not failed).
 * - Where a move cannot be made, it is declared: the generator's own reasons
 *   (`unrealisable(options)`), a promise of the rung or the row it would break,
 *   or no control at all — and the set of undoable moves is exactly
 *   `UNREALISABLE_AT`, never silent, never different material passed off as
 *   the thing asked for.
 * - `mayWrite(options, demand) === false` is held to every phrase generated
 *   here: the demand is then in none of them (what `heldToRung` relies on).
 *
 * The phrases go through the real generator, OSMD, the extractor and the
 * demand detectors (C2): the one definition of each fact. Nothing is heard;
 * whether the phrases are musical is not asked here.
 *
 * `C4B_CONTRACT_REPORT=<file>` writes the whole table as Markdown.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { sightReadingOptionsFor, unrealisable, type SightReadingOptions } from '../../src/engine/sightReading';
import { heldToRung, READING_CONTROLS, UNREALISABLE_AT, type Unrealisable } from '../../src/engine/readingControls';
import { nextRecommended, readingOffer } from '../../src/curriculum/session';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import { detectAll } from '../../src/demands/detect';
import type { DemandsFile } from '../../src/demands/vocabulary';
import { CLAIMED_BY_CONCEPT, PROMISED_BY_RUNG, phraseOf, untaughtChecks, type Check, type Phrase } from './helpers/promises';

const CONTENT = join(process.cwd(), 'public', 'content');
const SOURCE = join(process.cwd(), '..', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const { demands } = JSON.parse(readFileSync(join(SOURCE, 'curriculum', 'vocabulary', 'demands.json'), 'utf8')) as DemandsFile;
/** The rows as authored: the build copies them through unchanged (see `sightReadingPromises`). */
const authored = new Map(
  (JSON.parse(readFileSync(join(SOURCE, 'catalog.static.json'), 'utf8')) as CatalogItem[]).map((row) => [row.id, row]),
);

const SEEDS = Array.from({ length: 12 }, (_, i) => 11 + i * 7919);
const ALL = SEEDS.length;

const ORDER: string[] = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
const CORE: string[] = curriculum.stages.flatMap((stage) =>
  stage.units.filter((unit) => unit.track === 'core').flatMap((unit) => unit.lessons.map((lesson) => lesson.id)),
);
const at = (rung: string): number => ORDER.indexOf(rung);

// --- the rungs, as the reader meets them ------------------------------------------

interface Group {
  /** The core rungs sharing one row, one base and one taught set. */
  rungs: string[];
  row: string;
  lessonId: string;
  base: SightReadingOptions;
  taught: Set<string>;
  promises: Check[];
  untaught: Check[];
}

function groups(): Group[] {
  const out: Group[] = [];
  for (const rung of CORE) {
    const position = nextRecommended(curriculum, [], ['core'], { startAt: rung });
    const offer = readingOffer({
      curriculum,
      items: catalog,
      position,
      activeTracks: ['core'],
      rows: [],
      today: new Date(2026, 9, 1),
      purpose: 'daily',
    });
    if (!offer?.anchored || position?.lesson.id !== rung) continue;
    const row = authored.get(offer.item.id) ?? offer.item;
    const taught = new Set(demands.filter((d) => d.taughtAt !== null && at(d.taughtAt) <= at(rung)).map((d) => d.id));
    const base = heldToRung(sightReadingOptionsFor(row.drill?.params ?? {}), (d) => taught.has(d));
    const lessonId = offer.lessonId ?? rung;
    const key = JSON.stringify([row.id, lessonId, base, [...taught].sort()]);
    const same = out.find((g) => JSON.stringify([g.row, g.lessonId, g.base, [...g.taught].sort()]) === key);
    if (same) {
      same.rungs.push(rung);
      continue;
    }
    out.push({
      rungs: [rung],
      row: row.id,
      lessonId,
      base,
      taught,
      promises: [...row.concepts.flatMap((c) => CLAIMED_BY_CONCEPT[c] ?? []), ...(PROMISED_BY_RUNG[lessonId] ?? [])],
      untaught: untaughtChecks(rung, ORDER, demands),
    });
  }
  return out;
}

// --- the phrases, once per option set --------------------------------------------

interface Read {
  phrases: Phrase[];
  /** The demand ids each phrase contains. */
  sets: Set<string>[];
}

const reads = new Map<string, Promise<Read>>();

function read(options: SightReadingOptions): Promise<Read> {
  const key = JSON.stringify(options);
  let pending = reads.get(key);
  if (!pending) {
    pending = (async () => {
      const phrases: Phrase[] = [];
      for (const seed of SEEDS) phrases.push(await phraseOf({ ...options, seed }, `contract.${String(seed)}`));
      const sets = phrases.map((p) => {
        const found = detectAll(p.model);
        return new Set(demands.filter((d) => found[d.detector].present).map((d) => d.id));
      });
      return { phrases, sets };
    })();
    reads.set(key, pending);
  }
  return pending;
}

// --- one move, judged ----------------------------------------------------------------

type Direction = 'on' | 'off';

interface Outcome {
  group: Group;
  demand: string;
  direction: Direction;
  /** `always`: the base already writes it in every phrase (on only). */
  kind: 'ok' | 'always' | 'generator' | 'promise' | 'none' | 'fails';
  options?: SightReadingOptions;
  reasons: string[];
  /** Promises about the demand itself that an "off" drops on purpose. */
  dropped: string[];
  /** Promises the move breaks that are not about the demand. */
  broken: string[];
  problems: string[];
  /** Demands the move brought that the base never wrote, declared by the control. */
  brought: string[];
}

/**
 * The phrases a demand is asked of: syncopation, triplets and the dotted
 * quarter are asked only of phrases in simple time (T37; in compound time the
 * dotted quarter is the beat), so a row whose metre is a list is judged on
 * those over its simple-time phrases, of which there must be one.
 */
const SIMPLE_ONLY = new Set(['rhythm.syncopation', 'rhythm.triplets', 'rhythm.dotted-quarter']);
function askedOf(demand: string, r: Read): Set<string>[] {
  return SIMPLE_ONLY.has(demand) ? r.sets.filter((s) => !s.has('metre.compound')) : r.sets;
}

function holding(check: Check, r: Read): boolean {
  const n = r.phrases.filter((p) => check.holds(p)).length;
  return check.scope === 'every' ? n === ALL : n > 0;
}

async function judge(group: Group, demand: string, direction: Direction, baseRead: Read): Promise<Outcome> {
  const control = READING_CONTROLS[demand];
  const outcome: Outcome = { group, demand, direction, kind: 'ok', reasons: [], dropped: [], broken: [], problems: [], brought: [] };
  const patch = direction === 'on' ? control?.on(group.base) : control?.off(group.base);
  if (!patch) {
    outcome.kind = 'none';
    outcome.reasons = [control?.none?.[direction] ?? 'no control'];
    return outcome;
  }
  const options = { ...group.base, ...patch };
  outcome.options = options;
  const reasons = unrealisable(options);
  if (reasons.length > 0) {
    outcome.kind = 'generator';
    outcome.reasons = reasons;
    return outcome;
  }
  const r = await read(options);
  const asked = askedOf(demand, r);
  const present = asked.filter((s) => s.has(demand)).length;
  if (direction === 'on' && (asked.length === 0 || present < asked.length)) {
    outcome.problems.push(`${demand} in ${String(present)} of ${String(asked.length)} phrases it is asked of`);
  }
  if (direction === 'off' && r.sets.some((s) => s.has(demand))) {
    outcome.problems.push(`${demand} still in ${String(r.sets.filter((s) => s.has(demand)).length)} of ${String(ALL)} phrases`);
  }
  for (const check of group.untaught) {
    if (!holding(check, r)) outcome.problems.push(`untaught: ${check.what}`);
  }
  for (const check of group.promises) {
    if (holding(check, r)) continue;
    if (direction === 'off' && check.about?.includes(demand)) outcome.dropped.push(check.what);
    else outcome.broken.push(check.what);
  }
  const ever = new Set(baseRead.sets.flatMap((s) => [...s]));
  const declared = new Set(control?.brings?.(options) ?? []);
  const fresh = [...new Set(r.sets.flatMap((s) => [...s]))].filter((d) => d !== demand && !ever.has(d));
  outcome.brought = fresh.filter((d) => declared.has(d));
  const undeclared = fresh.filter((d) => !declared.has(d));
  if (undeclared.length > 0) outcome.problems.push(`brings ${undeclared.join(', ')}`);
  for (const d of demands) {
    if (READING_CONTROLS[d.id]?.mayWrite(options) === false && r.sets.some((s) => s.has(d.id))) {
      outcome.problems.push(`mayWrite says no ${d.id}, and a phrase has one`);
    }
  }
  outcome.kind = outcome.problems.length > 0 ? 'fails' : outcome.broken.length > 0 ? 'promise' : 'ok';
  return outcome;
}

// --- the run ---------------------------------------------------------------------------

const GROUPS = groups();
const outcomes: Outcome[] = [];
const baseReads = new Map<Group, Read>();

beforeAll(async () => {
  for (const group of GROUPS) {
    const baseRead = await read(group.base);
    baseReads.set(group, baseRead);
    for (const d of demands) {
      const asked = askedOf(d.id, baseRead);
      const everyPhrase = asked.length > 0 && asked.every((s) => s.has(d.id));
      const anyPhrase = baseRead.sets.some((s) => s.has(d.id));
      if (group.taught.has(d.id)) {
        if (everyPhrase) {
          outcomes.push({ group, demand: d.id, direction: 'on', kind: 'always', reasons: [], dropped: [], broken: [], problems: [], brought: [] });
        } else {
          outcomes.push(await judge(group, d.id, 'on', baseRead));
        }
        if (anyPhrase) outcomes.push(await judge(group, d.id, 'off', baseRead));
      }
    }
  }
  const path = process.env.C4B_CONTRACT_REPORT;
  if (path) writeFileSync(path, report(), 'utf8');
}, 900_000);

function report(): string {
  const lines: string[] = ['# The curriculum–generator contract, as measured', ''];
  for (const group of GROUPS) {
    lines.push(`## ${group.rungs.join(', ')} — ${group.row} (the reader's row from ${group.lessonId})`, '');
    lines.push('```', JSON.stringify(group.base), '```', '');
    const baseRead = baseReads.get(group);
    lines.push('| demand | taught | in base phrases | on | off |', '|---|---|---|---|---|');
    for (const d of demands) {
      const n = baseRead?.sets.filter((s) => s.has(d.id)).length ?? 0;
      const cell = (direction: Direction): string => {
        const o = outcomes.find((x) => x.group === group && x.demand === d.id && x.direction === direction);
        if (!o) return '—';
        const extra = [
          o.reasons.length ? o.reasons.join(' / ') : '',
          o.dropped.length ? `drops: ${o.dropped.join('; ')}` : '',
          o.broken.length ? `breaks: ${o.broken.join('; ')}` : '',
          o.problems.length ? `PROBLEMS: ${o.problems.join('; ')}` : '',
          o.brought.length ? `brings: ${o.brought.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join(' · ');
        return `${o.kind}${extra ? ` (${extra})` : ''}`;
      };
      lines.push(`| ${d.id} | ${group.taught.has(d.id) ? 'yes' : 'no'} | ${String(n)}/${String(ALL)} | ${cell('on')} | ${cell('off')} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// --- the assertions ----------------------------------------------------------------------

describe('every reading demand has a control entry, and its dimension', () => {
  it('the control map names exactly the vocabulary’s demands', () => {
    expect(Object.keys(READING_CONTROLS).sort()).toEqual(demands.map((d) => d.id).sort());
  });
  it('each entry names the generator option that moves it, or says why none does', () => {
    for (const d of demands) {
      const control = READING_CONTROLS[d.id];
      if (control?.option === null) {
        expect(control.none?.on ?? control.none?.off, d.id).toBeTruthy();
      } else {
        expect(typeof control?.option, d.id).toBe('string');
      }
    }
  });
});

describe('the contract covers the reading curriculum', () => {
  it('every core rung that offers a reading row, and every core rung after it, is in a group', () => {
    const first = CORE.findIndex((rung) => GROUPS.some((g) => g.rungs.includes(rung)));
    expect(first).toBeGreaterThanOrEqual(0);
    const covered = new Set(GROUPS.flatMap((g) => g.rungs));
    const missing = CORE.slice(first).filter((rung) => !covered.has(rung));
    expect(missing, 'core rungs after the first reading row with no reading row the contract saw').toEqual([]);
  });
});

describe('each rung’s base: its row held to what it has taught', () => {
  for (const group of GROUPS) {
    it(`${group.rungs.join(', ')} (${group.row}): keeps its promises and writes nothing the rung has not taught`, () => {
      const r = baseReads.get(group) as Read;
      for (const check of [...group.promises, ...group.untaught]) {
        expect(holding(check, r), `${group.rungs.join(', ')}: ${check.what}`).toBe(true);
      }
      expect(unrealisable(group.base)).toEqual([]);
    });
  }
  it('S16: on 2.2 the right-hand row stays in C position; on 2.5 it is the row as it stands and leaves it', async () => {
    const at22 = GROUPS.find((g) => g.rungs.includes('2.2'));
    const at25 = GROUPS.find((g) => g.rungs.includes('2.5'));
    expect(at22?.row).toBe('drill.reading.sight-reading-2-right');
    expect(at25?.row).toBe('drill.reading.sight-reading-2-right');
    expect(at22?.base.position).toBe(true);
    expect(at25?.base.position).toBeUndefined();
    const inside = await read(at22?.base as SightReadingOptions);
    const beyond = await read(at25?.base as SightReadingOptions);
    expect(inside.sets.filter((s) => s.has('range.beyond-position')).length).toBe(0);
    expect(beyond.sets.filter((s) => s.has('range.beyond-position')).length).toBeGreaterThan(0);
  });
});

describe('every move the curriculum can ask for is made, or declared', () => {
  const key = (rung: string, demand: string, direction: Direction): string => `${rung} ${demand} ${direction}`;

  it('no move silently fails: it keeps its promise, or it is undoable for a declared reason', () => {
    const failing = outcomes.filter((o) => o.kind === 'fails').map((o) => `${o.group.rungs.join(',')} ${o.demand} ${o.direction}: ${o.problems.join('; ')}`);
    expect(failing).toEqual([]);
  });

  it('the moves that cannot be made are exactly UNREALISABLE_AT, with its reasons', () => {
    const measured = new Map<string, Outcome>();
    for (const o of outcomes) {
      if (o.kind === 'generator' || o.kind === 'promise' || o.kind === 'none') {
        for (const rung of o.group.rungs) measured.set(key(rung, o.demand, o.direction), o);
      }
    }
    const declared = new Map<string, Unrealisable>();
    for (const u of UNREALISABLE_AT) for (const rung of u.rungs) declared.set(key(rung, u.demand, u.direction), u);
    expect([...declared.keys()].filter((k) => !measured.has(k)), 'declared, but the move is made (or never asked)').toEqual([]);
    expect([...measured.keys()].filter((k) => !declared.has(k)), 'undoable, and not declared').toEqual([]);
    for (const [k, o] of measured) {
      const u = declared.get(k) as Unrealisable;
      expect(u.kind, k).toBe(o.kind);
      if (o.kind === 'promise') for (const what of o.broken) expect(u.reason, `${k} breaks "${what}"`).toContain(what);
      else expect(o.reasons, k).toContain(u.reason);
    }
  });

  it('S25: from 2.4, and on every rung the 2.5 row serves, ties and dotted quarters are written when asked', () => {
    for (const rung of ['2.4', '2.5', '3.1', '3.2', '3.3']) {
      for (const demand of ['rhythm.ties', 'rhythm.dotted-quarter']) {
        const o = outcomes.find((x) => x.group.rungs.includes(rung) && x.demand === demand && x.direction === 'on');
        expect(o?.kind, `${rung} ${demand}`).toBe('ok');
      }
    }
  });

  it('S22: on 3.4 the row it offers writes a ledger line beyond middle C when asked', () => {
    const o = outcomes.find((x) => x.group.rungs.includes('3.4') && x.demand === 'pitch.ledger' && x.direction === 'on');
    expect(o?.group.row).toBe('drill.reading.sight-reading-2');
    expect(o?.kind).toBe('ok');
  });
});
