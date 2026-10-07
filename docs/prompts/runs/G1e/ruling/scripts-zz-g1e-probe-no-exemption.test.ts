/**
 * G1e probe (temporary; its source is kept under docs/prompts/runs/G1e/ and it is removed from the tests):
 * on the shipped content, which real states offer a learned, paused song through a chooser that is not a
 * rung's own ask, on the code as it is; and item 3's count — the songs the shipped curriculum's rungs list
 * as their own (a rung's ask or its fallback rung step can offer them) that a learner could pause.
 * Writes its findings to build/g1e-probe-ruling.json (the worktree's gitignored build/) and prints a summary.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { buildSession, playable, type SessionSlot } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import { admittedForTeaching } from '../../src/curriculum/eligibility';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { ProjectRow } from '../../src/data/projectStore';
import { isProjectable } from '../../src/data/projectStore';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { SessionRow } from '../../src/data/db';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const index = indexCatalog(catalog);
const TODAY = new Date(2026, 9, 20, 9);
const daysAgo = (n: number): string => new Date(2026, 9, 20 - n, 12).toISOString();
const RUNG_OWN = new Set<string>(); // the ruling: no claim is exempt

function paused(itemId: string): ProjectRow {
  return { id: `id:${itemId}`, material: { kind: 'id', itemId }, itemId, state: 'paused', since: daysAgo(3), history: [{ state: 'paused', at: daysAgo(3), why: 'pause' }] };
}

const lessons: { lesson: Lesson; stage: number; track: string }[] = curriculum.stages.flatMap((stage) =>
  stage.units.flatMap((unit) => unit.lessons.map((lesson) => ({ lesson, stage: stage.number, track: unit.track }))),
);

it('probe', () => {
  const out: Record<string, unknown> = {};

  // Item 3's count: the songs a rung lists as its own — its song and exercise options, and a `done` ask's
  // item — that are songs (the sheet makes projects of songs only, `isProjectable`), in the catalogue.
  const listings: { rung: string; stage: number; track: string; item: string; playable: boolean; admitted: boolean }[] = [];
  for (const { lesson, stage, track } of lessons) {
    const ids = new Set([...lesson.exerciseOptions, ...lesson.songOptions, ...(lesson.requirements ?? []).flatMap((r) => (r.kind === 'done' ? [r.item] : []))]);
    for (const id of ids) {
      const item = index.byId.get(id);
      if (!item || !isProjectable(item)) continue;
      listings.push({ rung: lesson.id, stage, track, item: id, playable: playable(item), admitted: admittedForTeaching(item) });
    }
  }
  const songs = new Set(listings.map((one) => one.item));
  const playableSongs = new Set(listings.filter((one) => one.playable && one.admitted).map((one) => one.item));
  const byStage = new Map<number, Set<string>>();
  for (const one of listings) if (one.playable && one.admitted) (byStage.get(one.stage) ?? byStage.set(one.stage, new Set()).get(one.stage))?.add(one.item);
  const rungsWithSongs = new Set(listings.map((one) => one.rung));
  out.count = {
    rungs: lessons.length,
    rungsListingASong: rungsWithSongs.size,
    listings: listings.length,
    distinctSongs: songs.size,
    distinctPlayableAdmitted: playableSongs.size,
    listingsPlayableAdmitted: listings.filter((one) => one.playable && one.admitted).length,
    byStage: Object.fromEntries([...byStage.entries()].sort((a, b) => a[0] - b[0]).map(([stage, set]) => [stage, set.size])),
    catalogueSongs: catalog.filter((item) => item.type === 'song').length,
    catalogueSongsPlayable: catalog.filter((item) => item.type === 'song' && playable(item)).length,
    songsWithRoleTransfer: catalog.filter((item) => item.type === 'song' && item.role === 'transfer').map((item) => item.id),
  };

  // The adversary on real states: a learner placed at a core rung, one song of an earlier core rung passed and
  // played twenty days ago, then paused. Where does it land on the card, on the code as it is?
  const core = lessons.filter((one) => one.track === 'core');
  const found: { at: string; song: string; minutes: number; seed: number; slot: string; claim: string; reason: string }[] = [];
  let builds = 0;
  const started = Date.now();
  for (const [position, { lesson: rung }] of core.entries()) {
    if (position === 0 || Date.now() - started > 240_000) continue;
    const earlierSongs = [...new Set(core.slice(0, position).flatMap((one) => one.lesson.songOptions))].filter((id) => {
      const item = index.byId.get(id);
      return item !== undefined && item.type === 'song' && playable(item);
    });
    for (const song of earlierSongs) {
      const listedOn = core.slice(0, position).find((one) => one.lesson.songOptions.includes(song))?.lesson.id;
      const rows: SessionRow[] = [
        { itemId: song, ...(listedOn ? { lessonId: listedOn } : {}), mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 0.95, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: daysAgo(20) },
      ];
      for (const minutes of [30, 120]) {
        for (const seed of [0, 1]) {
          builds += 1;
          const slots: SessionSlot[] = buildSession({
            curriculum,
            catalog: index,
            items: catalog,
            states: rungState(rows, curriculum, VOCABULARY_V0, TODAY),
            rows,
            learned: [{ itemId: song, status: 'passed', lastPlayed: daysAgo(20) }],
            projects: [paused(song)],
            lastPlayed: new Map([[song, daysAgo(20)]]),
            activeTracks: ['core'],
            minutes,
            seed,
            startAt: rung.id,
            today: TODAY,
          }).slots;
          for (const slot of slots) {
            if (slot.item?.id === song && !RUNG_OWN.has(slot.claim?.kind ?? '')) {
              found.push({ at: rung.id, song, minutes, seed, slot: slot.kind, claim: slot.claim?.kind ?? '-', reason: slot.reason });
            }
          }
        }
      }
    }
  }
  out.adversary = { builds, found: found.length, firstFew: found.slice(0, 40) };
  mkdirSync(join(process.cwd(), '..', 'build'), { recursive: true });
  writeFileSync(join(process.cwd(), '..', 'build', 'g1e-probe-ruling.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  expect(builds).toBeGreaterThan(0);
}, 600_000);

it('probe: the browser states — placed at 0.4 and at 1.1, Hot Cross Buns passed on 0.3 twenty days ago', () => {
  const HCB = 'song.folk.hot-cross-buns';
  const rows: SessionRow[] = [
    { itemId: HCB, lessonId: '0.3', mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 0.95, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: daysAgo(20) },
  ];
  const card = (startAt: string, projects: ProjectRow[], minutes = 30) =>
    buildSession({
      curriculum,
      catalog: index,
      items: catalog,
      states: rungState(rows, curriculum, VOCABULARY_V0, TODAY),
      rows,
      learned: [{ itemId: HCB, status: 'passed', lastPlayed: daysAgo(20) }],
      projects,
      lastPlayed: new Map([[HCB, daysAgo(20)]]),
      activeTracks: ['core'],
      minutes,
      startAt,
      today: TODAY,
    }).slots.map((slot) => `${slot.kind} | ${slot.item?.id ?? '-'} | ${slot.claim?.kind ?? '-'} | ${slot.reason}`);
  const out = {
    at04: { none: card('0.4', []), paused: card('0.4', [paused(HCB)]), paused60: card('0.4', [paused(HCB)], 60), paused120: card('0.4', [paused(HCB)], 120) },
    at11: { none: card('1.1', []), paused: card('1.1', [paused(HCB)]) },
  };
  mkdirSync(join(process.cwd(), '..', 'build'), { recursive: true });
  writeFileSync(join(process.cwd(), '..', 'build', 'g1e-probe-browser-states-ruling.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
});
