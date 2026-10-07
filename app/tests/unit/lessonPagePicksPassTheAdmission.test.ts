// @vitest-environment jsdom
/**
 * The rung page's automatic picks pass the one teaching-use admission (D3c; the reviewer's
 * required change on D3b, `responses/4478793.md`, and the answers on D3c's brief,
 * `responses/267c4df.md`).
 *
 * Four controls on the lesson page choose an item from the rung's own lists for the learner:
 * *Start* (the first playable exercise, then song), *Climb the ladder* (the first exercise that
 * opens as a score), *Quick check* (the first exercise with a drill or a file), and the duet and
 * blind tools' piece (the rung's named `tool.item`, or its first playable song). Each is an
 * offer, so each takes the next option on the rung's list that passes its own conditions and
 * `admittedForTeaching` — the gate's own reading, exported once from `eligibility.ts` — or is
 * not drawn, or says there is nothing, truthfully. The option rows are the learner's own choice,
 * like the Library: every authored option stays listed and tappable.
 *
 * Which items the admission refuses is the predicate's answer and is never re-derived here. The
 * constructed refused item is a generated item whose family promises music, with the stored
 * teaching-use bit given, and each case first asks the predicate what it says of it; the sweep
 * over the built curriculum asks the predicate of whatever each control resolves to. The real
 * screen, a fake IndexedDB, the real stores.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { admittedForTeaching } from '../../src/curriculum/eligibility';
import type { CatalogItem, Curriculum, Lesson, LessonTool, Provenance } from '../../src/curriculum/types';
import type { Router } from '../../src/router';
import { isPlayable, targetFor } from '../../src/ui/openItem';
import { measuresARun } from '../../src/ui/screens/DrillScreen';

/** What the mocked loader hands the screen: the curriculum and catalogue of the case being mounted. */
const { held } = vi.hoisted(() => {
  const held: { curriculum: unknown; items: unknown[] } = { curriculum: null, items: [] };
  return { held };
});

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve(held.curriculum),
  allItems: () => Promise.resolve(held.items),
  fetchMarkdown: () => Promise.reject(new Error('no lesson text in this fixture')),
}));

const { LessonScreen } = await import('../../src/ui/screens/LessonScreen');

const DOORS = ['navigateScore', 'navigateDrill', 'navigatePdf'] as const;
const METHODS = [...DOORS, 'navigate', 'navigateLesson', 'navigateLab', 'navigatePlay', 'navigateChart', 'navigateImportFor', 'navigatePaper'] as const;
let router: Record<(typeof METHODS)[number], ReturnType<typeof vi.fn>>;

/** Taps a control and returns the item it opened: the first argument of whichever door it went through, or null. */
function tap(node: HTMLElement): string | null {
  for (const spy of Object.values(router)) spy.mockClear();
  node.click();
  const through = DOORS.flatMap((door) => router[door].mock.calls.map((call) => call[0] as string));
  expect(through.length, 'one tap opened more than one item').toBeLessThanOrEqual(1);
  return through[0] ?? null;
}

/** What each automatic control opens on the page as drawn; null where it is not drawn or opens nothing. */
interface Picks {
  start: string | null;
  ladder: string | null;
  check: string | null;
  duet: string | null;
  blind: string | null;
}

function picks(section: HTMLElement): Picks {
  const control = (selector: string): HTMLElement | null => section.querySelector<HTMLElement>(selector);
  const start = control('#lesson-start');
  const startShown = start !== null && control('#lesson-start-block')?.hidden === false;
  const ladder = control('#lesson-tool-ladder');
  const ladderOpened = ladder === null ? null : tap(ladder);
  // The ladder's claim, on the button, is where the tap lands (`ladderTool.test.ts`).
  if (ladder !== null) expect(ladder.dataset.item).toBe(ladderOpened);
  const duet = control('#lesson-tool-duet');
  const blind = control('#lesson-tool-blind');
  const check = control('#lesson-check');
  return {
    start: startShown ? tap(start) : null,
    ladder: ladderOpened,
    check: check === null ? null : tap(check),
    duet: duet === null ? null : tap(duet),
    blind: blind === null ? null : tap(blind),
  };
}

/** A curriculum of the one rung, or the one given. */
async function mount(rung: Lesson, items: CatalogItem[], curriculum?: Curriculum): Promise<HTMLElement> {
  held.curriculum = curriculum ?? {
    version: 1,
    tracks: [],
    stages: [{ number: 1, title: 'One', summary: '', units: [{ id: 'u', title: 'U', track: 'core', lessons: [rung] }] }],
  };
  held.items = items;
  const section = LessonScreen(router as unknown as Router, rung.id);
  document.body.replaceChildren(section);
  // Set on the section just before the first draw, in the same turn (`LessonScreen`'s loader).
  await vi.waitFor(() => {
    expect(section.dataset.lesson).toBe(rung.id);
  });
  return section;
}

function freshRouter(): void {
  router = Object.fromEntries(METHODS.map((name) => [name, vi.fn()])) as typeof router;
}

const MUSIC = (teaching: boolean | null): Provenance => ({
  source: 'generated',
  facts: { promise: { kind: 'authored', via: 'family_contracts.json', value: 'music' } },
  review: { score: null, teaching },
});
const exercise = (id: string, over: Partial<CatalogItem> = {}): CatalogItem => ({
  id,
  type: 'exercise',
  title: `Title of ${id}`,
  level: 2,
  hands: 'both',
  tracks: ['core'],
  concepts: [],
  file: `scores/generated/${id}.mxl`,
  ...over,
});
/** A generated groove as the build writes one: a file, a drill kind, the family's promise `music`, the stored bit. */
const groove = (id: string, teaching: boolean | null): CatalogItem => exercise(id, { drill: { kind: 'clave', params: {} }, provenance: MUSIC(teaching) });
/** A generated drill: a file, and its family promises a drill; no person has decided its teaching use. */
const drill = (id: string): CatalogItem =>
  exercise(id, {
    drill: { kind: 'scale', params: {} },
    provenance: { source: 'generated', facts: { promise: { kind: 'authored', via: 'family_contracts.json', value: 'drill' } }, review: { score: null, teaching: null } },
  });
/** A prompt loop: no file, so it opens as a drill and not as notation. */
const promptDrill = (id: string): CatalogItem =>
  exercise(id, { type: 'drill', file: null, drill: { kind: 'rhythm', params: {} }, provenance: { source: 'runtime', facts: {}, review: { score: null, teaching: null } } });
/** A notated song no person has decided on: its notes are its truth. */
const song = (id: string, over: Partial<CatalogItem> = {}): CatalogItem =>
  exercise(id, { type: 'song', file: `scores/${id}.mxl`, provenance: { source: 'pdmx', facts: {}, review: { score: null, teaching: null } }, ...over });
/**
 * A song the admission refuses. None is built today (every refused item on the built catalogue is an
 * exercise); constructed so the duet's song fallback is covered for whatever the admission refuses.
 */
const refusedSong = (id: string, teaching: boolean | null): CatalogItem => song(id, { provenance: MUSIC(teaching) });
/** The item with no provenance at all: what every pick took before any admission existed. */
const bare = (item: CatalogItem): CatalogItem => {
  const { provenance: _dropped, ...rest } = item;
  return rest;
};

const rung = (over: Partial<Lesson>): Lesson => ({
  id: 'R',
  title: 'The rung',
  concepts: [],
  textFile: 'lessons/R.md',
  exerciseOptions: [],
  songOptions: [],
  mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
  requirements: [{ kind: 'runs', from: 'exercises', count: 1 }],
  ...over,
});

const STATES = [null, false, true] as const;
const REFUSED = [null, false] as const;
const NOTHING_TO_CHECK = 'This lesson has no drill to check against yet.';

describe('each automatic pick on the rung page takes the next admitted option, or is gone truthfully (D3c)', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    freshRouter();
  });
  afterEach(() => {
    document.body.replaceChildren();
    clearFakeIndexedDb();
  });

  it.each(STATES)('Start, teaching %s: the rung’s groove is passed over for the next playable option until approved', async (teaching) => {
    const first = groove('ex.groove', teaching);
    expect(admittedForTeaching(first)).toBe(teaching === true);
    const section = await mount(rung({ exerciseOptions: ['ex.groove', 'ex.next'], songOptions: ['song.a'] }), [first, exercise('ex.next'), song('song.a')]);
    expect(picks(section).start).toBe(teaching === true ? 'ex.groove' : 'ex.next');
    // The line names what Start opens, and calls it the first thing on the rung only when it is.
    const said = section.querySelector('#lesson-start-what')?.textContent;
    expect(said).toBe(teaching === true ? 'Opens “Title of ex.groove”, the first thing on this rung.' : 'Opens “Title of ex.next”.');
  });

  it.each(REFUSED)('Start, teaching %s: past every exercise to the first playable song; with nothing admitted, no Start at all', async (teaching) => {
    const listed = rung({ exerciseOptions: ['ex.groove'], songOptions: ['song.a'] });
    expect(picks(await mount(listed, [groove('ex.groove', teaching), song('song.a')])).start).toBe('song.a');
    const alone = await mount(rung({ exerciseOptions: ['ex.groove'] }), [groove('ex.groove', teaching)]);
    expect(alone.querySelector('#lesson-start')).toBeNull();
    expect(alone.querySelector<HTMLElement>('#lesson-start-block')?.hidden).toBe(true);
  });

  it.each(STATES)('Climb the ladder, teaching %s: the groove is passed over for the next exercise that opens as a score until approved', async (teaching) => {
    const first = groove('ex.groove', teaching);
    expect(admittedForTeaching(first)).toBe(teaching === true);
    const section = await mount(rung({ exerciseOptions: ['ex.groove', 'drill.prompt', 'ex.scale'], tools: [{ kind: 'ladder' }] }), [first, promptDrill('drill.prompt'), drill('ex.scale')]);
    expect(picks(section).ladder).toBe(teaching === true ? 'ex.groove' : 'ex.scale');
  });

  it.each(REFUSED)('Climb the ladder, teaching %s: not drawn where nothing admitted opens as a score, and the block goes with it', async (teaching) => {
    const section = await mount(rung({ exerciseOptions: ['ex.groove', 'drill.prompt'], tools: [{ kind: 'ladder' }] }), [groove('ex.groove', teaching), promptDrill('drill.prompt')]);
    expect(section.querySelector('#lesson-tool-ladder')).toBeNull();
    expect(section.querySelector<HTMLElement>('#lesson-tools-block')?.hidden).toBe(true);
  });

  it.each(STATES)('Quick check, teaching %s: the groove is passed over for the next drill until approved', async (teaching) => {
    const first = groove('ex.groove', teaching);
    expect(admittedForTeaching(first)).toBe(teaching === true);
    const section = await mount(rung({ exerciseOptions: ['ex.groove', 'drill.prompt'] }), [first, promptDrill('drill.prompt')]);
    expect(picks(section).check).toBe(teaching === true ? 'ex.groove' : 'drill.prompt');
  });

  it.each(REFUSED)('Quick check, teaching %s: with nothing admitted it opens nothing and says there is no drill', async (teaching) => {
    const section = await mount(rung({ exerciseOptions: ['ex.groove'] }), [groove('ex.groove', teaching)]);
    expect(picks(section).check).toBeNull();
    expect(section.querySelector('#lesson-status')?.textContent).toBe(NOTHING_TO_CHECK);
  });

  it.each(STATES)('the duet’s named item, teaching %s: an unadmitted named item draws no button, as a name that is not the rung’s own does; approved, it opens', async (teaching) => {
    const named = groove('ex.groove', teaching);
    expect(admittedForTeaching(named)).toBe(teaching === true);
    const section = await mount(rung({ exerciseOptions: ['ex.groove'], songOptions: ['song.a'], tools: [{ kind: 'duet', item: 'ex.groove' }] }), [named, song('song.a')]);
    // Not the song instead: the rung named what it meant, and that is not on offer.
    expect(picks(section).duet).toBe(teaching === true ? 'ex.groove' : null);
  });

  it.each(STATES)('the duet’s and blind’s first playable song, teaching %s: a refused song is passed over for the next until approved', async (teaching) => {
    const first = refusedSong('song.refused', teaching);
    expect(admittedForTeaching(first)).toBe(teaching === true);
    const tools: LessonTool[] = [{ kind: 'duet' }, { kind: 'blind' }];
    const section = await mount(rung({ songOptions: ['song.refused', 'song.b'], tools }), [first, song('song.b')]);
    const now = picks(section);
    expect([now.duet, now.blind]).toEqual(teaching === true ? ['song.refused', 'song.refused'] : ['song.b', 'song.b']);
  });

  it.each(REFUSED)('the duet’s and blind’s first playable song, teaching %s: with no admitted song neither button is drawn', async (teaching) => {
    const section = await mount(rung({ songOptions: ['song.refused'], tools: [{ kind: 'duet' }, { kind: 'blind' }] }), [refusedSong('song.refused', teaching)]);
    expect(section.querySelector('#lesson-tool-duet')).toBeNull();
    expect(section.querySelector('#lesson-tool-blind')).toBeNull();
    expect(section.querySelector<HTMLElement>('#lesson-tools-block')?.hidden).toBe(true);
  });

  it('a generated drill and a notated song on the same list are picked exactly as before', async () => {
    const tools: LessonTool[] = [{ kind: 'ladder' }, { kind: 'duet', item: 'ex.drill' }, { kind: 'blind' }];
    const listed = rung({ exerciseOptions: ['ex.drill'], songOptions: ['song.n'], tools });
    const items = [drill('ex.drill'), song('song.n')];
    expect(items.map(admittedForTeaching)).toEqual([true, true]);
    const now = picks(await mount(listed, items));
    expect(now).toEqual({ start: 'ex.drill', ladder: 'ex.drill', check: 'ex.drill', duet: 'ex.drill', blind: 'song.n' });
    // Measured the same way with the provenance taken off: the page before any admission existed.
    expect(picks(await mount(listed, items.map(bare)))).toEqual(now);
  });

  it('the option rows are the learner’s own choice: every authored option stays listed and tappable, the refused groove among them', async () => {
    const tools: LessonTool[] = [{ kind: 'ladder' }, { kind: 'duet', item: 'ex.groove' }];
    const section = await mount(rung({ exerciseOptions: ['ex.groove', 'ex.next'], songOptions: ['song.a'], tools }), [groove('ex.groove', null), exercise('ex.next'), song('song.a')]);
    const listed = (selector: string) => [...section.querySelectorAll<HTMLElement>(`${selector} .list-row[data-item]`)].map((row) => row.dataset.item);
    expect(listed('#lesson-exercises')).toEqual(['ex.groove', 'ex.next']);
    expect(listed('#lesson-songs')).toEqual(['song.a']);
    const play = section.querySelector<HTMLElement>('#lesson-exercises .list-row[data-item="ex.groove"] button[aria-label="Open Title of ex.groove"]');
    expect(play, 'the refused groove lost its ▶').not.toBeNull();
    expect(tap(play as HTMLElement)).toBe('ex.groove');
    // …while no automatic control resolves to it.
    expect(Object.values(picks(section))).not.toContain('ex.groove');
  });

  it('LessonScreen.ts reads neither the promise fact nor the teaching bit: it asks the admission; openItem.ts holds no offer policy', () => {
    const screen = readFileSync(join(process.cwd(), 'src', 'ui', 'screens', 'LessonScreen.ts'), 'utf8');
    expect(screen).not.toMatch(/facts\??\.promise|review\??\.teaching/);
    expect(screen).toMatch(/admittedForTeaching\(/);
    const doors = readFileSync(join(process.cwd(), 'src', 'ui', 'openItem.ts'), 'utf8');
    expect(doors).not.toMatch(/admittedForTeaching|eligib|facts\??\.promise|review\??\.teaching/);
  });
});

describe('every rung of the built curriculum, on the built catalogue: no automatic control on the rung page resolves to an item the admission refuses (D3c)', () => {
  const CONTENT = join(process.cwd(), 'public', 'content');
  const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
  const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const rungs = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons));
  const CONTROLS = ['start', 'ladder', 'check', 'duet', 'blind'] as const;

  /** The first of `ids` passing `valid` and, where `admit`, the admission: the next option, read from the rung's list. */
  const nextOf = (ids: readonly string[], valid: (item: CatalogItem) => boolean, admit: boolean): string | null =>
    ids.map((id) => byId.get(id)).find((item) => item !== undefined && valid(item) && (!admit || admittedForTeaching(item)))?.id ?? null;
  /**
   * What each control's own conditions choose from the rung's lists, with the admission (`admit`) or
   * without it (what the page drew before D3c). The conditions are the page's, asked of `openItem`'s
   * helpers; the admission is the predicate's.
   */
  function chosen(lesson: Lesson, admit: boolean, check: (item: CatalogItem) => boolean = measuresARun): Picks {
    const tool = (kind: LessonTool['kind']) => (lesson.tools ?? []).find((one) => one.kind === kind);
    const piece = (named: LessonTool | undefined): string | null => {
      if (named === undefined) return null;
      if (named.item === undefined) return nextOf(lesson.songOptions, (item) => isPlayable(item) && item.type === 'song', admit);
      const offered = lesson.songOptions.includes(named.item) || lesson.exerciseOptions.includes(named.item);
      return offered ? nextOf([named.item], (item) => targetFor(item) === 'score', admit) : null;
    };
    return {
      start: nextOf([...lesson.exerciseOptions, ...lesson.songOptions], isPlayable, admit),
      ladder: tool('ladder') === undefined ? null : nextOf(lesson.exerciseOptions, (item) => targetFor(item) === 'score', admit),
      // Revised (X1, G62): *Quick check* takes the first option whose run is measured (`measuresARun`), never a
      // drill that judges nothing. Old assumption: any drill or file.
      check: nextOf(lesson.exerciseOptions, check, admit),
      duet: piece(tool('duet')),
      blind: piece(tool('blind')),
    };
  }

  const drawn = new Map<string, Picks>();
  beforeAll(async () => {
    useFakeIndexedDb();
    freshRouter();
    for (const lesson of rungs) drawn.set(lesson.id, picks(await mount(lesson, catalog, curriculum)));
  }, 600_000);
  afterAll(() => {
    document.body.replaceChildren();
    clearFakeIndexedDb();
  });

  it('the built catalogue has items the admission refuses on the rungs’ lists, so the sweep has something to find', () => {
    const listedRefused = rungs.flatMap((lesson) => [...lesson.exerciseOptions, ...lesson.songOptions].filter((id) => byId.has(id) && !admittedForTeaching(byId.get(id) as CatalogItem)));
    expect(listedRefused.length).toBeGreaterThan(0);
    expect(drawn.size).toBe(rungs.length);
  });

  it('every rung: no control resolves to an item the admission refuses', () => {
    const offered: string[] = [];
    for (const [id, now] of drawn) {
      for (const control of CONTROLS) {
        const item = now[control];
        if (item !== null && !admittedForTeaching(byId.get(item) as CatalogItem)) offered.push(`${id} ${control}: ${item}`);
      }
    }
    expect(offered, `${String(offered.length)} controls`).toEqual([]);
  });

  it('every rung: each control opens the rung’s next admitted option for it, and is gone only where the rung has none', () => {
    const differ: string[] = [];
    for (const lesson of rungs) {
      const now = drawn.get(lesson.id) as Picks;
      const want = chosen(lesson, true);
      for (const control of CONTROLS) if (now[control] !== want[control]) differ.push(`${lesson.id} ${control}: drew ${String(now[control])}, next admitted ${String(want[control])}`);
    }
    expect(differ, `${String(differ.length)} controls`).toEqual([]);
  });

  it('the controls that change are those whose first choice the admission refuses; the ones gone are named', () => {
    const unexplained: string[] = [];
    const gone: string[] = [];
    for (const lesson of rungs) {
      const now = drawn.get(lesson.id) as Picks;
      const before = chosen(lesson, false);
      for (const control of CONTROLS) {
        const was = before[control];
        if (was === now[control]) continue;
        if (was === null || admittedForTeaching(byId.get(was) as CatalogItem)) unexplained.push(`${lesson.id} ${control}: ${String(was)} → ${String(now[control])}`);
        if (now[control] === null) gone.push(`${lesson.id} ${control}`);
      }
    }
    expect(unexplained).toEqual([]);
    // Quick check's button stays and says there is no drill; the duet is gone where its named item is refused.
    expect(gone.sort()).toEqual(GONE);
  });

  it('Quick check takes a drill that measures a run (G62, X1): the rungs whose check moved, and where to', () => {
    const moved: string[] = [];
    for (const lesson of rungs) {
      const was = chosen(lesson, true, (item) => Boolean(item.drill || item.file)).check;
      const now = (drawn.get(lesson.id) as Picks).check;
      if (was !== now) moved.push(`${lesson.id} check: ${String(was)} → ${String(now)}`);
      if (now !== null) expect(measuresARun(byId.get(now) as CatalogItem), `${lesson.id} check opens ${now}`).toBe(true);
    }
    expect(moved.sort()).toEqual([...G62_MOVES].sort());
  });
});

/**
 * The controls that open nothing on the built catalogue, each because every option it could take is
 * refused: every exercise `latin.3` and `latin.6` list is a clave, a tresillo, a tumbao, a montuno or
 * a Latin groove, so their Quick check says there is no drill. `latin`'s and `latin.3`'s duets were on
 * this list until F2 (Entry 108) took the duet tool off those two rungs, since the lesson named a button
 * the page no longer drew (L111): a control the rung does not carry is not gone, it is absent, and the
 * clave exercise opens from its own row. A teaching-use yes on one of the grooves, or an admitted
 * exercise added to those rungs through its own seam, brings a Quick check back and changes this list.
 */
// Revised (X1, G62): jam.5's Quick check joins them — its one measured option is an unapproved groove, and its
// form tracker, which the check took before, measures nothing.
// Revised (LP1): latin.4 joined them while its three exercises, the tresillo items, carried no teaching-use
// decision, so its Quick check said there was no drill, as latin.3's did (the brief's H6).
// Revised again (Entry 253, 2026-10-06): the outside reviewer decided teaching use YES for the three tresillo
// exercises in their CONTROL role (`responses/lp1-latin4-placement.md` section 1), so latin.3's and latin.4's
// Quick check now resolve to an admitted drill and leave this list.
// G13 (the same day) adds four bass_cell drills to latin.4 whose family promises a drill, admitted by the gate without a
// decision; latin.4's Quick check opens the 2/4 tresillo control. The list is unchanged by that.
const GONE = ['jam.5 check', 'latin.6 check'];

/**
 * X1's G62 moves (the reviewer's row, `responses/e85c162.md`: a Quick check selection rule, a drill that
 * measures): each rung whose Quick check took a drill that measures nothing now takes its first measured
 * option, or — on 0.3 (the tour), 0.4 (the placement test) and jam.5 (the form tracker) — says the lesson has
 * no drill that measures a run and opens nothing (in `GONE` above).
 */
const G62_MOVES = [
  '0.1 check: drill.setup.posture-checklist → drill.technique.finger-numbers',
  '0.3 check: drill.tour.app-basics → null',
  '0.4 check: drill.placement.stage-0 → null',
  'blues.4 check: drill.blues.lh-patterns → exercise.rhythm.syncopated.4bar',
  'blues.5 check: drill.improv.blues-backing → exercise.arpeggio7.f-dominant7.2oct.both',
  'improv.3 check: drill.improv.loop-i-iv-v → exercise.cadence.c.root',
  'improv.5 check: drill.improv.blues-backing → drill.improv.call-response',
  'jam check: drill.jam.form-tracker → exercise.rhythm.shuffle-eighths.4bar',
  'jam.5 check: drill.jam.form-tracker → null',
  'jam.7 check: drill.jam.form-tracker → exercise.blues-scale.e-flat.1oct.both',
];
