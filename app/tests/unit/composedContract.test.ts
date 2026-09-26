// @vitest-environment jsdom
/**
 * The curriculum–generator contract over the composed recipes the reader can
 * reach (C4d; backlog S29; the reviewer's C4.5 review: "recipes reachable by
 * legal reader transitions, not the Cartesian product").
 *
 * `generatorContract.test.ts` holds every single move from a rung's base. The
 * live reader accumulates moves: at 3.1 the working recipe held both hands,
 * dotted quarters, ties, a key and an accidental at once, and C4c found some of
 * those phrases without a promised tie, dotted quarter or accidental — silently.
 * This file walks what the reader can actually offer and holds each of it to
 * the same terms.
 *
 * **The walk** (per core rung that offers a reading row, from the row the
 * reader serves there, `readingOffer` with no reads). The transitions are the
 * reader's own, `readingMoves` — the moves `readingOffer` chooses among, gated
 * by C4b's declarations (`UNREALISABLE_AT`, `unrealisable`, `mayWrite`,
 * `brings` taught) — taken in the order the reader takes them:
 *
 * - **Step up**: the first demand, in the curriculum's taught-at order (then
 *   the vocabulary's), whose `on` move exists — as `readingOffer` does. The
 *   reader passes over a demand the reads have already shown or whose skill is
 *   failing elsewhere; that can only happen to a demand the phrases may already
 *   hold (`mayWrite`) or whose coping skill the row declares (`passable`). The
 *   walk takes three kinds of chain from the row: every demand added in order;
 *   every passable one passed over; and each passable one passed over alone.
 *   Representative, not every subset: the reader's order is what makes a
 *   recipe reachable, and the combinations of controls it never composes are
 *   not walked.
 * - **Step down**: any `off` move from a state of the first two chains (a
 *   demand the reads single out, which may be any the phrase holds), then the
 *   reader's step ups until that demand is back — the diaries' ambiguity
 *   variant took the eighths away on day 4 and added both hands on day 6,
 *   because the bass staff is taught before the eighths.
 * - **The easy read**: from a state of the first two chains, the recipe with
 *   one of its moves undone (the reader undoes the newest; every one is
 *   walked), where the generator gives no new reason against it, as
 *   `readingOffer`'s easy read requires.
 *
 * **The terms**, for every recipe reached, over the seeds, through the real
 * generator, OSMD, the extractor and the detectors (C2):
 *
 * - every demand the recipe promises — each control whose `on` patch the
 *   options already contain — is in every phrase it is asked of; every demand
 *   whose `off` patch they contain is in none;
 * - the rung's and the row's promises hold, except a promise about a demand the
 *   recipe itself moved (listed, not failed: an off drops it on purpose);
 * - nothing the learner's rung has not taught appears;
 * - nothing appears that the base never wrote but a promised demand's control
 *   declares it `brings`;
 * - `mayWrite(options) === false` means none of the phrases has it.
 *
 * **Declared to the reader.** Where a move the reader would otherwise take from
 * a reached state is one the generator declares it cannot make there — a new
 * reason from `unrealisable(options)` for the composed options, or a rung in
 * `UNREALISABLE_AT` — `readingMoves` does not offer it, so the reader passes to
 * the next move or says the next step waits, exactly as for a single impossible
 * move. The table lists those that arise only from the composition (the same
 * move from the rung's base is made). `COMPOSED_UNRELIABLE` names the reached
 * recipes the generator still does not honour at every seed: none — a recipe
 * that fails and is not named there fails this file.
 *
 * `C4D_COMPOSED_REPORT=<file>` writes the table as Markdown.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { unrealisable, type SightReadingOptions } from '../../src/engine/sightReading';
import { READING_CONTROLS, UNREALISABLE_AT } from '../../src/engine/readingControls';
import { nextRecommended, readingMoves, readingOffer, readingOptions, taughtAtRung, type ReadingMove } from '../../src/curriculum/session';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { ReadingRecipe } from '../../src/data/db';
import { detectAll } from '../../src/demands/detect';
import type { DemandsFile } from '../../src/demands/vocabulary';
import { CLAIMED_BY_CONCEPT, PROMISED_BY_RUNG, phraseOf, untaughtChecks, type Check, type Phrase } from './helpers/promises';

const CONTENT = join(process.cwd(), 'public', 'content');
const SOURCE = join(process.cwd(), '..', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const { demands } = JSON.parse(readFileSync(join(SOURCE, 'curriculum', 'vocabulary', 'demands.json'), 'utf8')) as DemandsFile;

/** The seeds demonstration 4 of `firstThirtyDays` reads: C4c's broken ones among them. */
const SEEDS = Array.from({ length: 12 }, (_, i) => 101 + i * 7919);
const ALL = SEEDS.length;

const ORDER: string[] = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
const CORE: string[] = curriculum.stages.flatMap((stage) =>
  stage.units.filter((unit) => unit.track === 'core').flatMap((unit) => unit.lessons.map((lesson) => lesson.id)),
);
const taughtIndex = (demand: string): number => {
  const at = demands.find((d) => d.id === demand)?.taughtAt;
  return at ? ORDER.indexOf(at) : Number.POSITIVE_INFINITY;
};
const vocabularyIndex = (demand: string): number => demands.findIndex((d) => d.id === demand);
const byTaughtOrder = (a: string, b: string): number => taughtIndex(a) - taughtIndex(b) || vocabularyIndex(a) - vocabularyIndex(b);
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
/** The reader names and moves "shorter than a quarter" as the eighths (C4c's fold). */
const SAME_NOTES: Readonly<Record<string, string>> = { 'rhythm.shorter-than-quarter': 'rhythm.eighths' };

/**
 * The composed recipes the generator does not honour at every seed, each with
 * the reason the reader is told. None: the redraw budget was the mechanism of
 * the missed promises; a moving left hand now also promises a melody note in
 * every bar (`underTune`); and the hand held in G major's position at levels
 * 2–3, which climbs above the level's range, is declared by `unrealisable`, so
 * the reader never reaches it (`sightReading.ts`). A recipe that fails here and
 * is not named fails the file.
 */
const COMPOSED_UNRELIABLE: readonly { rungs: readonly string[]; moved: Readonly<Record<string, unknown>>; reason: string }[] = [];

// --- the rungs ----------------------------------------------------------------------

interface Group {
  rungs: string[];
  item: CatalogItem;
  /** The rung whose row it is: what the phrase is held to (`offer.lessonId`). */
  hold: string;
  /** The learner's rung for the group's moves (every rung in it teaches the same). */
  rung: string;
  taught: Set<string>;
  promises: Check[];
  untaught: Check[];
}

function groups(): Group[] {
  const out: Group[] = [];
  for (const rung of CORE) {
    const position = nextRecommended(curriculum, { byRung: new Map() }, ['core'], { startAt: rung });
    const offer = readingOffer({ curriculum, items: catalog, position, activeTracks: ['core'], rows: [], today: new Date(2026, 9, 1), purpose: 'daily' });
    if (!offer?.anchored || position?.lesson.id !== rung) continue;
    const hold = offer.lessonId ?? rung;
    const taught = new Set(demands.filter((d) => d.taughtAt !== null && ORDER.indexOf(d.taughtAt) <= ORDER.indexOf(rung)).map((d) => d.id));
    const key = JSON.stringify([offer.item.id, hold, [...taught].sort()]);
    const found = out.find((g) => JSON.stringify([g.item.id, g.hold, [...g.taught].sort()]) === key);
    if (found) {
      found.rungs.push(rung);
      continue;
    }
    out.push({
      rungs: [rung],
      item: offer.item,
      hold,
      rung,
      taught,
      promises: [...offer.item.concepts.flatMap((c) => CLAIMED_BY_CONCEPT[c] ?? []), ...(PROMISED_BY_RUNG[hold] ?? [])],
      untaught: untaughtChecks(rung, ORDER, demands),
    });
  }
  return out;
}

// --- the walk -------------------------------------------------------------------------

type Via = 'base' | 'up' | 'down' | 'easy';

interface Reached {
  group: Group;
  recipe: ReadingRecipe;
  /** How the walk first reached it: the moves, in order (`+demand`, `-demand`, `~key` undone). */
  path: string[];
  via: Via;
}

/** A move the reader would otherwise take from a reached recipe, and the generator declares it cannot make there. */
interface Declared {
  group: Group;
  from: ReadingRecipe;
  demand: string;
  direction: 'on' | 'off';
  reason: string;
  /** The same move from the rung's base is made: the unavailability is the composition's. */
  composed: boolean;
}

const recipeKey = (recipe: ReadingRecipe): string => JSON.stringify(recipe.moved ?? {});

function optionsOf(group: Group, recipe: ReadingRecipe, seed?: number): SightReadingOptions {
  return readingOptions(group.item, recipe, seed, taughtAtRung(curriculum, group.hold));
}

function movesOf(group: Group, recipe: ReadingRecipe): ReadingMove[] {
  return readingMoves({ curriculum, item: group.item, recipe: { row: recipe.row, ...(recipe.moved ? { moved: recipe.moved } : {}) }, rung: group.rung, hold: group.hold });
}

/** The reader may pass over this step up: the phrases can already show the demand, or its skill (declared by the row) can be failing elsewhere. */
function passable(group: Group, recipe: ReadingRecipe, demand: string): boolean {
  if (READING_CONTROLS[demand]?.mayWrite(optionsOf(group, recipe)) === true) return true;
  const skill = demands.find((d) => d.id === demand)?.copedWithBy;
  return skill !== undefined && (group.item.targetSkills ?? []).includes(skill);
}

interface Step {
  recipe: ReadingRecipe;
  path: string[];
}

/**
 * The reader's step ups from a recipe, one after another: the first demand in
 * the taught-at order with an `on` move, unless `omit` passes over it — which
 * it may only where the reader can (`passable`). Stops where no step up is
 * left, or after the move `last` accepts.
 */
function chain(group: Group, from: Step, omit: (demand: string) => boolean, last?: (move: ReadingMove) => boolean): Step[] {
  const out: Step[] = [];
  let here = from;
  for (let guard = 0; guard < demands.length * 2; guard += 1) {
    const ups = movesOf(group, here.recipe)
      .filter((m) => m.direction === 'on')
      .sort((a, b) => byTaughtOrder(a.demand, b.demand));
    const up = ups.find((m) => !(omit(m.demand) && passable(group, here.recipe, m.demand)));
    if (!up) break;
    here = { recipe: up.recipe, path: [...here.path, `+${up.demand}`] };
    out.push(here);
    if (last?.(up)) break;
  }
  return out;
}

function walk(group: Group): Reached[] {
  const reached = new Map<string, Reached>();
  const add = (step: Step, via: Via): void => {
    const key = recipeKey(step.recipe);
    if (!reached.has(key)) reached.set(key, { group, recipe: step.recipe, path: step.path, via });
  };
  const start: Step = { recipe: { row: group.item.id }, path: [] };
  add(start, 'base');
  // Step up: every demand added in the reader's order; every passable one passed over; each passable one passed over alone.
  const canonical = [start, ...chain(group, start, () => false)];
  const omitAll = [start, ...chain(group, start, () => true)];
  const passedSomewhere = new Set<string>();
  for (const step of canonical) {
    for (const m of movesOf(group, step.recipe)) if (m.direction === 'on' && passable(group, step.recipe, m.demand)) passedSomewhere.add(m.demand);
  }
  const omitOne = [...passedSomewhere].flatMap((demand) => chain(group, start, (d) => d === demand));
  for (const step of [...canonical, ...omitAll, ...omitOne]) add(step, step === start ? 'base' : 'up');
  // One step down from a state on the two outer chains, then the reader's step ups until the demand taken out is back.
  for (const step of [...canonical, ...omitAll]) {
    // Only a demand the phrase may hold: the reader steps down on a demand the reads single out, which it
    // finds only in phrases that had it (`singledOut`); `readingMoves` also lists an off for a demand no phrase
    // of the recipe can hold, which the reader never takes (reported: the walking bass off at 3.4).
    const current = optionsOf(group, step.recipe);
    const downs = movesOf(group, step.recipe).filter((m) => m.direction === 'off' && READING_CONTROLS[SAME_NOTES[m.demand] ?? m.demand]?.mayWrite(current) === true);
    for (const down of downs) {
      const after: Step = { recipe: down.recipe, path: [...step.path, `-${down.demand}`] };
      add(after, 'down');
      for (const next of chain(group, after, () => false, (m) => m.demand === down.demand)) add(next, 'down');
    }
    // The easy read: one move undone, where the generator gives no new reason against it.
    const moved = (step.recipe.moved ?? {}) as Record<string, unknown>;
    const now = new Set(unrealisable(optionsOf(group, step.recipe)));
    for (const k of Object.keys(moved)) {
      const without = { ...moved };
      delete without[k];
      const easy: ReadingRecipe = { row: group.item.id, ...(Object.keys(without).length > 0 ? { moved: without } : {}) };
      if (unrealisable(optionsOf(group, easy)).some((reason) => !now.has(reason))) continue;
      add({ recipe: easy, path: [...step.path, `~${k}`] }, 'easy');
    }
  }
  return [...reached.values()];
}

/**
 * Every move the reader would otherwise consider from a reached recipe that the
 * generator declares it cannot make: the control's patch gives a new reason
 * from `unrealisable`, or `UNREALISABLE_AT` names the move at the rung.
 */
function declaredFrom(group: Group, recipe: ReadingRecipe): Declared[] {
  const out: Declared[] = [];
  const current = optionsOf(group, recipe);
  const now = new Set(unrealisable(current));
  const base = optionsOf(group, { row: group.item.id });
  const atBase = new Set(unrealisable(base));
  for (const d of demands) {
    const control = READING_CONTROLS[d.id];
    if (!control) continue;
    for (const direction of ['on', 'off'] as const) {
      if (direction === 'on' && !group.taught.has(d.id)) continue;
      if (direction === 'off' && control.mayWrite(current) !== true) continue;
      const patch = direction === 'on' ? control.on(current) : control.off(current);
      if (!patch) continue;
      const after: SightReadingOptions = { ...current, ...patch };
      if (same(after, current)) continue;
      const atRung = UNREALISABLE_AT.find((u) => u.demand === d.id && u.direction === direction && u.rungs.includes(group.rung));
      const fresh = unrealisable(after).filter((reason) => !now.has(reason));
      const reason = atRung?.reason ?? fresh[0];
      if (reason === undefined) continue;
      const basePatch = direction === 'on' ? control.on(base) : control.off(base);
      const fromBase = basePatch ? unrealisable({ ...base, ...basePatch }).filter((r) => !atBase.has(r)) : [];
      out.push({ group, from: recipe, demand: d.id, direction, reason, composed: atRung === undefined && fromBase.length === 0 });
    }
  }
  return out;
}

// --- the phrases, once per option set ---------------------------------------------------

interface Read {
  phrases: Phrase[];
  sets: Set<string>[];
}

const reads = new Map<string, Promise<Read>>();

function read(options: SightReadingOptions): Promise<Read> {
  const key = JSON.stringify(options);
  let pending = reads.get(key);
  if (!pending) {
    pending = (async () => {
      const phrases: Phrase[] = [];
      for (const seed of SEEDS) phrases.push(await phraseOf({ ...options, seed }, `composed.${String(seed)}`));
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

const SIMPLE_ONLY = new Set(['rhythm.syncopation', 'rhythm.triplets', 'rhythm.dotted-quarter']);
const askedOf = (demand: string, r: Read): Set<string>[] => (SIMPLE_ONLY.has(demand) ? r.sets.filter((s) => !s.has('metre.compound')) : r.sets);

/** The demands the options promise in every phrase (`on` patch contained) and keep out of every one (`off` patch contained). */
function promisedBy(options: SightReadingOptions): { on: string[]; off: string[] } {
  const on: string[] = [];
  const off: string[] = [];
  const holds = (patch: object | null): boolean =>
    patch !== null && Object.keys(patch).length > 0 && Object.entries(patch).every(([k, v]) => same((options as unknown as Record<string, unknown>)[k], v));
  for (const d of demands) {
    const control = READING_CONTROLS[d.id];
    if (!control || control.option === null) continue;
    if (holds(control.on(options))) on.push(d.id);
    else if (holds(control.off(options))) off.push(d.id);
  }
  // The left-hand pattern's `on` names the one pattern the metre suits (the Alberti where a phrase may be in
  // 6/8); any moving pattern the recipe asks for under a melody is the demand, and the generator promises it
  // under a tune in every bar (`underTune`): an Alberti kept after the 6/8 is taken away is still one.
  const moving = options.hands === 'both' && (options.leftHand === 'alberti' || options.leftHand === 'broken' || options.leftHand === 'walking');
  if (moving && !on.includes('texture.left-hand-pattern')) on.push('texture.left-hand-pattern');
  return { on, off: off.filter((d) => !on.includes(d)) };
}

interface Judged {
  reached: Reached;
  options: SightReadingOptions;
  promised: { on: string[]; off: string[] };
  dropped: string[];
  problems: string[];
  brought: string[];
}

async function judge(reached: Reached, baseRead: Read): Promise<Judged> {
  const { group, recipe } = reached;
  const options = optionsOf(group, recipe);
  const promised = promisedBy(options);
  const r = await read(options);
  const problems: string[] = [];
  for (const d of promised.on) {
    const asked = askedOf(d, r);
    const present = asked.filter((s) => s.has(d)).length;
    if (asked.length === 0 || present < asked.length) problems.push(`${d} in ${String(present)} of ${String(asked.length)} phrases it is asked of`);
  }
  for (const d of promised.off) {
    const n = r.sets.filter((s) => s.has(d)).length;
    if (n > 0) problems.push(`${d} kept out, and in ${String(n)} of ${String(ALL)} phrases`);
  }
  for (const check of group.untaught) {
    const n = r.phrases.filter((p) => check.holds(p)).length;
    if (n < ALL) problems.push(`untaught: ${check.what} fails in ${String(ALL - n)} of ${String(ALL)}`);
  }
  const moved = new Set([...Object.keys(recipe.moved ?? {})].flatMap((k) => demands.filter((d) => READING_CONTROLS[d.id]?.option === k).map((d) => d.id)));
  const dropped: string[] = [];
  for (const check of group.promises) {
    const n = r.phrases.filter((p) => check.holds(p)).length;
    if (check.scope === 'every' ? n === ALL : n > 0) continue;
    if (check.about?.some((d) => moved.has(d))) dropped.push(check.what);
    else problems.push(`breaks: ${check.what}`);
  }
  const ever = new Set(baseRead.sets.flatMap((s) => [...s]));
  const declared = new Set(promised.on.flatMap((d) => [...(READING_CONTROLS[d]?.brings?.(options) ?? [])]));
  const fresh = [...new Set(r.sets.flatMap((s) => [...s]))].filter((d) => !ever.has(d) && !promised.on.includes(d));
  const brought = fresh.filter((d) => declared.has(d));
  const undeclared = fresh.filter((d) => !declared.has(d));
  if (undeclared.length > 0) problems.push(`brings ${undeclared.join(', ')}, which no control it promises declares`);
  for (const d of demands) {
    if (READING_CONTROLS[d.id]?.mayWrite(options) === false && r.sets.some((s) => s.has(d.id))) problems.push(`mayWrite says no ${d.id}, and a phrase has one`);
  }
  return { reached, options, promised, dropped, problems, brought };
}

/** Which seeds a failing recipe fails at, for the report. */
async function failingSeeds(judged: Judged): Promise<number[]> {
  const r = await read(judged.options);
  return SEEDS.filter((_, i) => judged.promised.on.some((d) => !(r.sets[i] as Set<string>).has(d) && !(SIMPLE_ONLY.has(d) && r.sets[i]?.has('metre.compound'))));
}

// --- the run ----------------------------------------------------------------------------

const GROUPS = groups();
const judged: Judged[] = [];
const declared: Declared[] = [];

beforeAll(async () => {
  for (const group of GROUPS) {
    const baseRead = await read(optionsOf(group, { row: group.item.id }));
    for (const reached of walk(group)) {
      judged.push(await judge(reached, baseRead));
      if (reached.via !== 'easy') declared.push(...declaredFrom(group, reached.recipe));
    }
  }
  const path = process.env.C4D_COMPOSED_REPORT;
  if (path) writeFileSync(path, await report(), 'utf8');
}, 1_800_000);

async function report(): Promise<string> {
  const lines = ['# The composed-recipe contract, as walked', ''];
  for (const group of GROUPS) {
    const mine = judged.filter((j) => j.reached.group === group);
    lines.push(`## ${group.rungs.join(', ')} — ${group.item.id} held to ${group.hold}: ${String(mine.length)} recipes`, '');
    lines.push('| recipe (moves from the row) | reached by | promised in every phrase | kept out | verdict |', '|---|---|---|---|---|');
    for (const j of mine) {
      const failing = j.problems.length > 0 ? ` at seeds ${(await failingSeeds(j)).join(', ')}` : '';
      const verdict = j.problems.length > 0 ? `FAILS${failing}: ${j.problems.join('; ')}` : `reliable${j.dropped.length ? ` (drops on purpose: ${j.dropped.join('; ')})` : ''}${j.brought.length ? ` (brings, declared: ${j.brought.join(', ')})` : ''}`;
      lines.push(`| \`${recipeKey(j.reached.recipe)}\` | ${j.reached.via}: ${j.reached.path.join(' ') || '—'} | ${j.promised.on.join(', ')} | ${j.promised.off.join(', ')} | ${verdict} |`);
    }
    const composed = declared.filter((d) => d.group === group && d.composed);
    if (composed.length > 0) {
      lines.push('', 'Declared unavailable only in composition (the reader does not offer them):', '');
      const seen = new Set<string>();
      for (const d of composed) {
        const k = `${d.demand} ${d.direction} ${d.reason}`;
        const froms = composed.filter((x) => `${x.demand} ${x.direction} ${x.reason}` === k).map((x) => `\`${recipeKey(x.from)}\``);
        if (seen.has(k)) continue;
        seen.add(k);
        lines.push(`- ${d.demand} ${d.direction} — “${d.reason}” — from ${froms.join(', ')}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

// --- the assertions ---------------------------------------------------------------------------

describe('the walk is the reader’s, and covers what the diaries read', () => {
  it('every core rung from the first reading row is in a group, with the reader’s row', () => {
    const first = CORE.findIndex((rung) => GROUPS.some((g) => g.rungs.includes(rung)));
    expect(first).toBeGreaterThanOrEqual(0);
    const covered = new Set(GROUPS.flatMap((g) => g.rungs));
    expect(CORE.slice(first).filter((rung) => !covered.has(rung))).toEqual([]);
  });

  it('it reaches accumulated recipes at 2.2, 2.5 and 3.1, and 3.1’s working recipes from the thirty-day diary', () => {
    for (const rung of ['2.2', '2.5', '3.1']) {
      const mine = judged.filter((j) => j.reached.group.rungs.includes(rung) && Object.keys(j.reached.recipe.moved ?? {}).length >= 2);
      expect(mine.length, `${rung}: no recipe with two moves or more`).toBeGreaterThan(0);
    }
    const at31 = new Set(judged.filter((j) => j.reached.group.rungs.includes('3.1')).map((j) => recipeKey(j.reached.recipe)));
    for (const moved of [
      { hands: 'both', dottedQuarters: true, ties: true, fifths: [1, -1], accidentals: true },
      { hands: 'both', leaps: true, dottedQuarters: true, ties: true, fifths: [1, -1], accidentals: true },
    ]) {
      const key = [...at31].find((k) => same(Object.entries(JSON.parse(k) as object).sort(), Object.entries(moved).sort()));
      expect(key, `3.1 did not reach ${JSON.stringify(moved)}`).toBeDefined();
    }
  });

  it('it is the reachable set, not every combination: where three controls or more are moved, fewer recipes than the combinations of their values', () => {
    for (const group of GROUPS) {
      const mine = judged.filter((j) => j.reached.group === group);
      const values = new Map<string, Set<string>>();
      for (const j of mine) {
        for (const [k, v] of Object.entries(j.reached.recipe.moved ?? {})) values.set(k, (values.get(k) ?? new Set()).add(JSON.stringify(v)));
      }
      if (values.size < 3) continue;
      const combinations = [...values.values()].reduce((product, seen) => product * (seen.size + 1), 1);
      expect(mine.length, group.rungs.join(', ')).toBeLessThan(combinations);
    }
  });
});

// The two walks below drive the real generator over the reachable set; under CI's
// load one of them passed the default 5 s on this machine and not there (Q37). Their
// budget is the walk's, stated on the test, not the suite's default.
describe('every reachable composed recipe keeps its promises, or is declared to the reader', () => {
  it('no reachable recipe silently fails: every promised demand in every phrase, nothing untaught, nothing undeclared', async () => {
    const failing: string[] = [];
    for (const j of judged) {
      if (j.problems.length === 0) continue;
      const listed = COMPOSED_UNRELIABLE.some((u) => u.rungs.some((r) => j.reached.group.rungs.includes(r)) && same(u.moved, j.reached.recipe.moved ?? {}));
      if (!listed) failing.push(`${j.reached.group.rungs.join(',')} ${recipeKey(j.reached.recipe)} (${j.reached.via}) seeds ${(await failingSeeds(j)).join(',')}: ${j.problems.join('; ')}`);
    }
    expect(failing).toEqual([]);
  }, 180_000);

  it('what COMPOSED_UNRELIABLE names is reached and does fail (never stale)', () => {
    for (const u of COMPOSED_UNRELIABLE) {
      const hit = judged.find((j) => u.rungs.some((r) => j.reached.group.rungs.includes(r)) && same(u.moved, j.reached.recipe.moved ?? {}));
      expect(hit?.problems.length ?? 0, JSON.stringify(u.moved)).toBeGreaterThan(0);
    }
  });

  it('a move the generator declares it cannot make from a reached recipe is never offered by the reader', () => {
    const offered: string[] = [];
    for (const d of declared) {
      const moves = movesOf(d.group, d.from);
      if (moves.some((m) => m.demand === d.demand && m.direction === d.direction)) {
        offered.push(`${d.group.rungs.join(',')} ${recipeKey(d.from)}: ${d.demand} ${d.direction} is offered, though “${d.reason}”`);
      }
    }
    expect(offered).toEqual([]);
  }, 180_000);
});
