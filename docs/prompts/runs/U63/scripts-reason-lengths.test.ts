/**
 * U63, Build 1's first half: every sentence the three writers of a session row's reason can produce,
 * composed by the writers themselves over the built curriculum's values and the longest day words, with
 * the longest per claim kind and overall printed. A count of characters is not a width: the browser
 * probe (`scripts-reason-lines.spec.ts`) lays every sentence written here into a real row of Today's card.
 * Throwaway, not for the commit; run from app/build/u63 with its own vitest config.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';
import type { Curriculum, Lesson } from '../../src/curriculum/types';
import type { ReadingWhy, SlotClaim, SessionSlot } from '../../src/curriculum/session';
import { cardLine, DEMAND_WORDS, FAMILY_WORDS, readingReason, slotReason, swapChoiceWords } from '../../src/ui/help';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';

const CONTENT = resolve('public', 'content');
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const OUT = resolve('build', 'u63', 'out');

type Kind = SessionSlot['kind'];
const KINDS: Kind[] = ['technique', 'review', 'new', 'repertoire', 'jam', 'sightreading'];

/** "today" is 2026-09-30, a Wednesday; the days a line can name, the longest spellings among them. */
const TODAY = new Date(2026, 8, 30, 9, 0, 0);
const daysAgo = (n: number): string => new Date(TODAY.getTime() - n * 86_400_000).toISOString();
/** yesterday, a weekday within the week (Thursday, Saturday, Wednesday are the longest), and a date. */
const DAYS = [daysAgo(1), daysAgo(6), daysAgo(4), daysAgo(20), daysAgo(40), daysAgo(80), daysAgo(100)];

const lessons: Lesson[] = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons));
const trackTitles = curriculum.tracks.map((track) => track.title);
const strands: (string | undefined)[] = [undefined, ...trackTitles];
const skills = VOCABULARY_V0.skills.map((skill) => skill.id);
const demands = Object.keys(DEMAND_WORDS);
const measures = [...new Set(lessons.flatMap((lesson) => lesson.requirements ?? []).filter((r) => r.kind === 'measure').map((r) => (r as { measure: string }).measure))];

interface Sentence {
  writer: 'slotReason' | 'readingReason' | 'swapChoiceWords' | 'candidate';
  claim: string;
  slot: string;
  text: string;
}
const found = new Map<string, Sentence>();
function add(writer: Sentence['writer'], claim: string, slot: string, text: string): void {
  const key = `${claim}|${text}`;
  if (!found.has(key)) found.set(key, { writer, claim, slot, text });
}

function slot(kind: Kind, claim: SlotClaim, known = false): void {
  // What the card prints: `cardLine` over the composition's words (the transfer offer's head alone, U71).
  const text = cardLine(slotReason(kind, claim, TODAY, { known }), claim.kind === 'transfer' ? { kind: 'transfer', skill: claim.skill } : { kind: claim.kind });
  add('slotReason', claim.kind + (claim.kind === 'rung' && claim.held ? ':held' : ''), kind, text);
}

it('composes every reason a session row can print, over the built curriculum', () => {
  const requirements = [
    { kind: 'runs', from: 'songs', count: 1 },
    { kind: 'runs', from: 'songs', count: 1, performance: true },
    { kind: 'done' },
    ...measures.map((measure) => ({ kind: 'measure', measure })),
  ];
  for (const kind of KINDS) {
    for (const strand of strands) {
      for (const next of [false, true]) {
        for (const requirement of requirements) {
          for (const [have, need] of [[0, 1], [11, 12]] as const) {
            const base = { kind: 'asked', rung: lessons[0], next, requirement, have, need, ...(strand === undefined ? {} : { strand }) } as unknown as SlotClaim;
            slot(kind, base);
            slot(kind, { ...base, waitsForReads: true } as SlotClaim);
          }
        }
        slot(kind, { kind: 'asked', rung: lessons[0], next, requirement: requirements[0], have: 0, need: 1, project: true, ...(strand === undefined ? {} : { strand }) } as unknown as SlotClaim);
        for (const skill of skills) slot(kind, { kind: 'asked', rung: lessons[0], next, requirement: requirements[0], have: 0, need: 1, skill, ...(strand === undefined ? {} : { strand }) } as unknown as SlotClaim);
      }
      for (const held of [false, true]) {
        slot(kind, { kind: 'rung', rung: lessons[0], ...(strand === undefined ? {} : { strand }), ...(held ? { held: true } : {}) } as unknown as SlotClaim);
        if (kind === 'repertoire') slot(kind, { kind: 'rung', rung: lessons[0], ...(strand === undefined ? {} : { strand }), ...(held ? { held: true } : {}) } as unknown as SlotClaim, true);
      }
    }
    for (const skill of skills) {
      for (const day of DAYS) slot(kind, { kind: 'skill-retention', skill, lastShown: day });
      slot(kind, { kind: 'skill', skill, rung: lessons[0] } as unknown as SlotClaim);
      slot(kind, { kind: 'transfer', skill } as unknown as SlotClaim);
    }
    for (const day of DAYS) {
      slot(kind, { kind: 'piece-retention', lastPlayed: day });
      if (kind === 'repertoire') slot(kind, { kind: 'piece-retention', lastPlayed: day }, true);
    }
    for (const demand of demands) {
      slot(kind, { kind: 'ready', demand });
      slot(kind, { kind: 'demand', demand, rung: lessons[0] } as unknown as SlotClaim);
    }
    for (const rung of lessons) {
      slot(kind, { kind: 'prerequisite', rung, of: lessons[0] } as unknown as SlotClaim);
      slot(kind, { kind: 'jam', rung } as unknown as SlotClaim);
      slot(kind, { kind: 'jam', rung, plain: true } as unknown as SlotClaim);
    }
    const families = [
      ...Object.keys(FAMILY_WORDS).map((id) => ({ by: 'kind' as const, id })),
      ...curriculum.tracks.map((track) => ({ by: 'track' as const, id: track.id, title: track.title })),
      { by: 'earlier' as const, id: 'earlier' },
    ];
    for (const family of families) {
      slot(kind, { kind: 'exposure', family } as unknown as SlotClaim);
      for (const day of DAYS) slot(kind, { kind: 'exposure', family, lastPlayed: day } as unknown as SlotClaim);
    }
  }

  // The reader's lines for the session's reading slot (`readingReason(…, 'slot', …)`).
  const last = (day: string) => ({ at: day, right: 64, n: 64 });
  const wrong = (demand: string) => ({ demand, selectivity: 'pattern', phrases: 12, phrasesBelow: 12, n: 64, right: 10 });
  const moves: unknown[] = [];
  for (const demand of demands) for (const direction of ['on', 'off']) moves.push({ demand, direction, recipe: {}, patch: {}, brings: [] });
  for (const hands of ['both', 'left', 'right']) moves.push({ demand: 'texture.hands-together', direction: 'on', recipe: {}, patch: { hands }, brings: [] });
  for (const key of [-4, -3, -2, -1, 1, 2, 3, 4]) moves.push({ demand: 'key.signature', direction: 'on', recipe: {}, patch: {}, brings: [], key });
  for (const fifths of [0, 2]) for (const direction of ['on', 'off']) moves.push({ demand: 'range.beyond-position', direction, recipe: { moved: { fifths } }, patch: {}, brings: [] });
  const whys: unknown[] = [{ kind: 'rung' }, { kind: 'met', read: true }, { kind: 'met', read: false }];
  for (const day of DAYS) {
    whys.push({ kind: 'hold', last: last(day) });
    for (const key of [-4, -3, 1, 2, 3, 4]) whys.push({ kind: 'hold', last: last(day), key });
    whys.push({ kind: 'stay', last: last(day) });
    for (const move of moves) whys.push({ kind: 'forward', last: last(day), move });
    whys.push({ kind: 'unsure', last: last(day) });
  }
  for (const demand of demands) {
    whys.push({ kind: 'hold', last: last(DAYS[0] as string), wrong: wrong(demand) });
    whys.push({ kind: 'kept', last: last(DAYS[0] as string), because: wrong(demand) });
    whys.push({ kind: 'lesson', last: last(DAYS[0] as string), demands: [demand] });
    for (const move of moves) whys.push({ kind: 'back', last: last(DAYS[0] as string), move, because: wrong(demand) });
  }
  for (const move of moves) {
    whys.push({ kind: 'easy', move });
    whys.push({ kind: 'unsure', last: last(DAYS[0] as string), easy: move });
  }
  for (const why of whys) add('readingReason', `reader:${(why as { kind: string }).kind}`, 'sightreading', readingReason(why as ReadingWhy, 'slot', TODAY));

  for (const tier of ['lesson', 'alternative', 'skill', 'demand', 'kind'] as const) add('swapChoiceWords', `swap:${tier}`, 'any', swapChoiceWords(tier));
  // Not the app's words: the reviewer's short form for the held line (`responses/9fce3792.md`:25), measured for
  // the copy owner beside the sentence it would replace. Nothing in the app prints these.
  add('candidate', 'candidate:held', 'new', 'This lesson is waiting on a paused piece');
  add('candidate', 'candidate:held', 'new', 'This lesson is waiting on a paused piece — more from this lesson');

  const all = [...found.values()];
  const byClaim = new Map<string, Sentence>();
  for (const one of all) {
    const best = byClaim.get(one.claim);
    if (!best || one.text.length > best.text.length) byClaim.set(one.claim, one);
  }
  const longest = all.reduce((a, b) => (b.text.length > a.text.length ? b : a));
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'sentences.json'), JSON.stringify(all, null, 1));
  const lines = [
    `distinct sentences: ${String(all.length)} (today = ${TODAY.toDateString()})`,
    `longest overall: ${String(longest.text.length)} chars, ${longest.claim} in ${longest.slot}: ${longest.text}`,
    '',
    'longest per claim kind (characters, a count and not a width):',
    ...[...byClaim.values()].sort((a, b) => b.text.length - a.text.length).map((one) => `${String(one.text.length).padStart(3)}  ${one.claim.padEnd(20)} ${one.text}`),
  ];
  writeFileSync(join(OUT, 'reason-lengths.txt'), `${lines.join('\n')}\n`);
  console.log(lines.join('\n'));
  expect(all.length).toBeGreaterThan(100);
});
