/**
 * G1e ruling probe (temporary; its source is kept under docs/prompts/runs/G1e/ruling/ and it is removed from the
 * tests): on the shipped content, the reviewer's rung case. For every rung listing a song, a learner placed on
 * it (its track switched on beside the core), every song option of the rung paused (id rows, as the sheet keeps
 * an id's row), the 30-minute card at Shuffle seeds 0 and 1: is a paused song on any row, does the card say the
 * rung waits (a `rung` claim with `held`), and is anything of the next lesson offered. And the counts the entry
 * asks for. Writes build/g1e-ruling-probe.json and prints a summary.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { buildSession, playable, type SessionSlot } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { ProjectRow } from '../../src/data/projectStore';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const index = indexCatalog(catalog);
const TODAY = new Date(2026, 9, 20, 9);
const at = new Date(2026, 9, 17, 12).toISOString();
const paused = (itemId: string): ProjectRow => ({ id: `id:${itemId}`, material: { kind: 'id', itemId }, itemId, state: 'paused', since: at, history: [{ state: 'paused', at, why: 'pause' }] });

const lessons: { lesson: Lesson; stage: number; track: string }[] = curriculum.stages.flatMap((stage) =>
  stage.units.flatMap((unit) => unit.lessons.map((lesson) => ({ lesson, stage: stage.number, track: unit.track }))),
);
const isSong = (id: string): boolean => index.byId.get(id)?.type === 'song';

it('ruling probe', () => {
  const withSongs = lessons.filter(({ lesson }) => lesson.songOptions.some(isSong));
  /** An ask only songs can meet: runs from songs, runs naming songs alone, done of a song. */
  const songOnlyAsk = (lesson: Lesson): boolean =>
    (lesson.requirements ?? []).some(
      (r) =>
        (r.kind === 'runs' && r.from === 'songs') ||
        (r.kind === 'runs' && r.items !== undefined && r.items.length > 0 && r.items.every(isSong)) ||
        (r.kind === 'done' && isSong(r.item)),
    );
  const asking = withSongs.filter(({ lesson }) => songOnlyAsk(lesson));
  const results: { rung: string; track: string; seed: number; placed: boolean; revived: string[]; held: string[]; next: string[]; rows: string[] }[] = [];
  for (const { lesson, track } of withSongs) {
    const songs = lesson.songOptions.filter(isSong);
    for (const seed of [0, 1]) {
      const input = {
        curriculum,
        catalog: index,
        items: catalog,
        states: rungState([], curriculum, VOCABULARY_V0, TODAY),
        rows: [],
        learned: [],
        lastPlayed: new Map<string, string>(),
        activeTracks: track === 'core' ? ['core'] : ['core', track],
        minutes: 30,
        seed,
        startAt: lesson.id,
        today: TODAY,
      };
      const before: SessionSlot[] = buildSession(input).slots;
      const placed = before.some((slot) => slot.lessonId === lesson.id);
      const card: SessionSlot[] = buildSession({ ...input, projects: songs.map(paused) }).slots;
      results.push({
        rung: lesson.id,
        track,
        seed,
        placed,
        revived: card.filter((slot) => slot.item !== undefined && songs.includes(slot.item.id)).map((slot) => `${slot.kind} ${slot.item?.id ?? ''} ${slot.claim?.kind ?? ''}`),
        held: card.filter((slot) => slot.claim?.kind === 'rung' && slot.claim.held === true).map((slot) => `${slot.kind} ${slot.item?.id ?? ''}: ${slot.reason}`),
        next: card.filter((slot) => slot.claim?.kind === 'asked' && slot.claim.next).map((slot) => `${slot.kind} ${slot.item?.id ?? ''}: ${slot.reason}`),
        rows: card.map((slot) => `${slot.kind} | ${slot.item?.id ?? '-'} | ${slot.claim?.kind ?? '-'} | ${slot.reason}`),
      });
    }
  }
  const askingIds = new Set(asking.map(({ lesson }) => lesson.id));
  const seed0 = results.filter((one) => one.seed === 0);
  const out = {
    counts: {
      rungs: lessons.length,
      rungsListingASongOption: withSongs.length,
      songOptionsListed: withSongs.reduce((n, { lesson }) => n + lesson.songOptions.filter(isSong).length, 0),
      rungsWithAnAskOnlySongsMeet: asking.length,
      rungsWithAnAskOnlySongsMeetWhoseOtherMaterialIsNone: asking.filter(({ lesson }) => lesson.exerciseOptions.filter((id) => playable(index.byId.get(id))).length === 0).map(({ lesson }) => lesson.id),
    },
    cards: {
      built: results.length,
      withARevivedSong: results.filter((one) => one.revived.length > 0).length,
      withANextLessonRow: results.filter((one) => one.next.length > 0).map((one) => `${one.rung} s${String(one.seed)}: ${one.next.join(' / ')}`),
      seed0: {
        songAskRungs: seed0.filter((one) => askingIds.has(one.rung)).length,
        songAskRungsSayingItWaits: seed0.filter((one) => askingIds.has(one.rung) && one.held.length > 0).length,
        songAskRungsNotSayingIt: seed0.filter((one) => askingIds.has(one.rung) && one.held.length === 0).map((one) => `${one.rung} (${one.track}; placed ${String(one.placed)}): ${one.rows.join(' ;; ')}`),
        otherRungsSayingItWaits: seed0.filter((one) => !askingIds.has(one.rung) && one.held.length > 0).map((one) => `${one.rung}: ${one.held.join(' / ')}`),
        heldWords: [...new Set(seed0.flatMap((one) => one.held.map((line) => line.replace(/^[a-z]+ [^:]+: /, ''))))],
        heldSlotKinds: [...new Set(seed0.flatMap((one) => one.held.map((line) => line.split(' ')[0])))],
      },
    },
    sample: results.filter((one) => ['1.1', '2.2', '0.3'].includes(one.rung) && one.seed === 0),
  };
  mkdirSync(join(process.cwd(), '..', 'build'), { recursive: true });
  writeFileSync(join(process.cwd(), '..', 'build', 'g1e-ruling-probe.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out.counts, null, 2));
  expect(results.length).toBeGreaterThan(0);
}, 600_000);
