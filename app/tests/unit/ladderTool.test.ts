// @vitest-environment jsdom
/**
 * The tempo ladder has an address, and a rung can name it (`04` §3d, `05` §6).
 *
 * The ladder was the one practice mode left out of a rung's `tools` union,
 * because a button in that union has to *open* something and the ladder is run
 * state scoped to a loop. Seven rungs — the scales, the arpeggios, Hanon and
 * the octaves — therefore named no mode at all, which is honest and is nobody's
 * preference.
 *
 * The circle only existed for repertoire. On those seven rungs **the whole item
 * is the loop**: a two-bar arpeggio or a Hanon number repeats by nature, so
 * looping one is not a choice about which bars matter. `?ladder=1` sets that
 * loop and turns the ladder on as one action, and both controls then show their
 * state — which is exactly what `05` §6's invariant is protecting. What it
 * forbids is a ladder left on with *nothing on screen having asked*.
 *
 * Three claims are checked here and the fourth — that the Score screen really
 * arrives looping with the toggle on — is in `scoreTourRoute.test.ts`, where the
 * screen's harness already lives, and again in the browser in
 * `score.ladder-route.spec.ts`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { parseHash, routeToHash, type Route, type Router } from '../../src/router';
import { targetFor } from '../../src/ui/openItem';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';

/** The rungs the tool is for, and the whole permitted set (`04` §3d). */
const LADDER_RUNGS = ['4.1', '4.2', '4.3', '4.4', 'technique.4', 'technique.6', 'technique.7'];

const SCALE = 'exercise.scale.c-major.2oct.similar.both.2';
const ARPEGGIO = 'exercise.arpeggio.c-major.2oct.both';
const PROMPT_DRILL = 'drill.chord.inversions';

function exercise(id: string): CatalogItem {
  return {
    id,
    type: 'exercise',
    title: id,
    level: 4.1,
    hands: 'both',
    tracks: ['core'],
    concepts: [],
    file: `scores/generated/${id}.mxl`,
  } as unknown as CatalogItem;
}

/** A prompt loop: no file, so it opens as a drill and not as notation. */
function promptDrill(id: string): CatalogItem {
  return {
    id,
    type: 'drill',
    title: id,
    level: 4.3,
    hands: 'both',
    tracks: ['core'],
    concepts: [],
    file: null,
    drill: { kind: 'inversion', params: {} },
  } as unknown as CatalogItem;
}

const { loadCurriculumSpy, allItemsSpy, fetchMarkdownSpy, lessonRef } = vi.hoisted(() => {
  const lesson = {
    id: '4.1',
    title: 'Scales hands together',
    concepts: [],
    textFile: 'lessons/4.1.md',
    exerciseOptions: [],
    songOptions: [],
    songOptional: true,
    mastery: { minAccuracy: 0.95, minTempoPct: 0.8 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }],
  } as unknown as Lesson;
  const ref = { current: lesson };
  return {
    lessonRef: ref,
    loadCurriculumSpy: vi.fn(() =>
      Promise.resolve({
        version: 1,
        tracks: [],
        stages: [
          { number: 4, title: 'Four', units: [{ id: '4.1', track: 'core', lessons: [ref.current] }] },
        ],
      }),
    ),
    allItemsSpy: vi.fn((): Promise<CatalogItem[]> => Promise.resolve([])),
    fetchMarkdownSpy: vi.fn(
      (): Promise<string> => Promise.reject(new Error('no lesson text in this fixture')),
    ),
  };
});

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: loadCurriculumSpy,
  allItems: allItemsSpy,
  fetchMarkdown: fetchMarkdownSpy,
}));

const { LessonScreen } = await import('../../src/ui/screens/LessonScreen');

let router: { navigate: ReturnType<typeof vi.fn>; navigateScore: ReturnType<typeof vi.fn> };

/** Mounts the lesson page on a rung built from these options and tools. */
async function mount(rung: Partial<Lesson>, items: CatalogItem[]): Promise<void> {
  lessonRef.current = { ...lessonRef.current, ...rung };
  allItemsSpy.mockResolvedValue(items);
  const section = LessonScreen(router as unknown as Router, lessonRef.current.id);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(document.querySelector('#lesson-exercises .list-row')).not.toBeNull();
  });
}

beforeEach(() => {
  useFakeIndexedDb();
  router = { navigate: vi.fn(), navigateScore: vi.fn() };
});

afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

describe('the address', () => {
  it('is read off the hash the way blind and performance are', () => {
    expect(parseHash(`#/score/${SCALE}?ladder=1`).ladder).toBe(true);
    expect(parseHash(`#/score/${SCALE}`).ladder).toBeUndefined();
    // Anything but `1` is not a request. A flag that switched on for `0` would
    // turn the ladder on for a hash asking it to be off.
    expect(parseHash(`#/score/${SCALE}?ladder=0`).ladder).toBeUndefined();
  });

  it('survives being written back out, so a navigation keeps it', () => {
    const route: Route = { tab: 'plan', score: SCALE, scoreMode: 'tempo', ladder: true };
    const hash = routeToHash(route);
    expect(hash).toContain('ladder=1');
    expect(parseHash(hash).ladder).toBe(true);
    expect(routeToHash({ tab: 'plan', score: SCALE })).not.toContain('ladder');
  });
});

describe('the button on a rung', () => {
  it('opens one of the rung’s own exercises, in Tempo mode, with the ladder asked for', async () => {
    await mount(
      { exerciseOptions: [SCALE, ARPEGGIO], tools: [{ kind: 'ladder' }] },
      [exercise(SCALE), exercise(ARPEGGIO)],
    );
    const node = document.querySelector<HTMLButtonElement>('#lesson-tool-ladder');
    expect(node, 'no ladder button on a rung that names the tool').not.toBeNull();
    // What it says it will open, on the button itself, so the browser test can
    // compare the claim against where the tap lands rather than against an id
    // copied into a test — the copy that failed the day a rung was repointed.
    expect(node?.dataset.item).toBe(SCALE);
    node?.click();
    // The rung rides along so Back returns to it (`04` §5, T17-2).
    expect(router.navigateScore).toHaveBeenCalledWith(SCALE, {
      mode: 'tempo',
      ladder: true,
      from: '4.1',
    });
  });

  it('skips an option that is a prompt loop rather than notation', async () => {
    // `4.3` offers `drill.chord.inversions` first and it has no file: it opens
    // as a drill, and a ladder over a drill is a button that lands nowhere.
    await mount(
      { exerciseOptions: [PROMPT_DRILL, ARPEGGIO], tools: [{ kind: 'ladder' }] },
      [promptDrill(PROMPT_DRILL), exercise(ARPEGGIO)],
    );
    expect(document.querySelector<HTMLButtonElement>('#lesson-tool-ladder')?.dataset.item).toBe(
      ARPEGGIO,
    );
  });

  it('is not drawn at all where the rung offers no exercise that opens as a score', async () => {
    await mount({ exerciseOptions: [PROMPT_DRILL], tools: [{ kind: 'ladder' }] }, [
      promptDrill(PROMPT_DRILL),
    ]);
    expect(document.querySelector('#lesson-tool-ladder')).toBeNull();
    // …and with nothing else on the rung the whole block goes, rather than
    // standing empty above the options (`04` §0 R4).
    expect(document.querySelector<HTMLElement>('#lesson-tools-block')?.hidden).toBe(true);
  });
});

describe('the rungs that carry it', () => {
  /**
   * Read from the stage files the owner wrote, not from `public/content`: the
   * build copies them and this task did not run it, so reading the build here
   * would make every row below a claim about whether somebody had run
   * `build.py` (`lessonClaimsAboutApp.test.ts` gives the same reason).
   */
  const authored: Curriculum = {
    version: 1,
    tracks: [],
    stages: readdirSync(resolve('..', 'content', 'curriculum'))
      .filter((name) => /^stage-\d+\.json$/.test(name))
      .sort()
      .flatMap(
        (name) =>
          (
            JSON.parse(
              readFileSync(join(resolve('..', 'content', 'curriculum'), name), 'utf8'),
            ) as Curriculum
          ).stages,
      ),
  };
  const catalog = JSON.parse(
    readFileSync(join(process.cwd(), 'public', 'content', 'catalog.json'), 'utf8'),
  ) as CatalogItem[];
  const byId = new Map(catalog.map((row) => [row.id, row]));
  const rungs = new Map<string, Lesson>(
    authored.stages.flatMap((stage) =>
      stage.units.flatMap((unit) => unit.lessons.map((lesson) => [lesson.id, lesson] as const)),
    ),
  );

  it.each(LADDER_RUNGS)('%s names the ladder and has something to climb', (id) => {
    const rung = rungs.get(id);
    expect(rung, `no authored rung ${id}`).toBeDefined();
    expect((rung as Lesson).tools?.some((tool) => tool.kind === 'ladder'), id).toBe(true);
    const climbable = (rung as Lesson).exerciseOptions.filter((option) => {
      const row = byId.get(option);
      return row !== undefined && targetFor(row) === 'score';
    });
    expect(climbable.length, `${id} names the ladder and offers nothing it can open`).toBeGreaterThan(
      0,
    );
  });

  it('is on those rungs and no others, because a whole-piece loop suits an exercise', () => {
    const carrying = [...rungs.values()]
      .filter((rung) => (rung.tools ?? []).some((tool) => tool.kind === 'ladder'))
      .map((rung) => rung.id)
      .sort();
    expect(carrying).toEqual([...LADDER_RUNGS].sort());
  });
});
