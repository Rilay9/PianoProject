// @vitest-environment jsdom
/**
 * What a rung with no songs says about itself (`04` §0 R4, `02` Part G).
 *
 * Nineteen of the hundred and nine rungs list no song, and they do not all mean
 * the same thing by it. Until 2026-09-22 they shared two sentences and both
 * were wrong for the rungs that got them:
 *
 *   - sixteen `songOptional` rungs — every theory rung, six improvisation
 *     rungs, `jam.5`, `jam.6` and `technique.8` — printed *"No song tests this
 *     skill — two exercises complete the lesson **(docs/00 D21)**."* That
 *     parenthesis is the repository talking to itself in front of somebody at
 *     a piano. `lessonShape.test.ts` has three separate rules against a
 *     *lesson* doing it (a module slug, a `camelCase` field, a `docs/NN`
 *     citation) and nothing said anything about the screen doing it.
 *   - three `optionsExempt` rungs — `0.1` posture, `0.2` the keyboard's
 *     layout, `0.4` the placement test — printed *"No songs listed for this
 *     lesson **yet**."* There is no song coming. "Yet" reads as a shortfall on
 *     a rung that is complete by design, and `04` §0 R4's whole subject is an
 *     empty block that says the true thing rather than a hopeful one.
 *
 * Two halves, deliberately. `noSongsSentence` is the rule and is tested as a
 * pure function against **the built curriculum** — so a rung that gains or
 * loses `songOptional` is covered without anybody remembering to come back
 * here. The screen is then mounted once for each of the three cases, because
 * a rule nothing calls is the fault this whole file is about.
 *
 * **Nothing here is about music.** Every assertion is a string on a screen.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { CatalogItem, Lesson } from '../../src/curriculum/types';
import type { Router } from '../../src/router';

const built = JSON.parse(readFileSync(resolve('public/content/curriculum.json'), 'utf8')) as {
  stages: { units: { lessons: Lesson[] }[] }[];
};

function everyRung(): Lesson[] {
  return built.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons));
}

const { loadCurriculumSpy, allItemsSpy, fetchMarkdownSpy, rungs } = vi.hoisted(() => {
  /** One rung of each shape, mounted through the real screen. */
  const make = (id: string, extra: Partial<Lesson>): Lesson => ({
    id,
    title: id,
    concepts: [],
    textFile: `lessons/${id}.md`,
    exerciseOptions: [],
    songOptions: [],
    mastery: { minAccuracy: 0.9, minTempoPct: 0.8 }, requirements: [{ kind: 'runs', from: 'exercises', count: 2 }],
    ...extra,
  });
  const optional = make('theory.fake', { songOptional: true });
  const exempt = make('0.fake', { optionsExempt: true });
  const unfilled = make('quarry.fake', {});
  const curriculum = {
    version: 1,
    tracks: [],
    stages: [
      {
        number: 3,
        title: 'Three',
        units: [
          { id: 'u1', track: 'theory-ear', lessons: [optional] },
          { id: 'u2', track: 'core', lessons: [exempt] },
          { id: 'u3', track: 'core', lessons: [unfilled] },
        ],
      },
    ],
  };
  return {
    rungs: { optional, exempt, unfilled },
    loadCurriculumSpy: vi.fn(() => Promise.resolve(curriculum)),
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

const { LessonScreen, noSongsSentence } = await import('../../src/ui/screens/LessonScreen');

let router: { navigate: ReturnType<typeof vi.fn> };

/** The sentence the *Song options* block prints, with the screen really mounted. */
async function sentenceOnScreen(lessonId: string): Promise<string> {
  const section = LessonScreen(router as unknown as Router, lessonId);
  document.body.replaceChildren(section);
  const block = () => document.querySelector('#lesson-songs .muted');
  await vi.waitFor(() => {
    expect(block()).not.toBeNull();
  });
  return block()?.textContent ?? '';
}

beforeEach(() => {
  useFakeIndexedDb();
  router = { navigate: vi.fn() };
});

afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

describe('the rule', () => {
  it('tells a rung that is finished on its exercises apart from one still waiting for a song', () => {
    expect(noSongsSentence({ songOptional: true })).not.toEqual(noSongsSentence({}));
    expect(noSongsSentence({ optionsExempt: true })).not.toEqual(noSongsSentence({}));
  });

  it('never cites this repository at a learner, on any rung of the built curriculum', () => {
    // The same three shapes `lessonShape.test.ts` refuses in a lesson: a
    // `docs/NN` citation, a decision id, a `camelCase` field name.
    const cited: string[] = [];
    for (const rung of everyRung()) {
      const said = noSongsSentence(rung);
      for (const m of said.matchAll(/docs?\/\d+|\bD\d\d?\b|\b[a-z]+[A-Z][A-Za-z]{2,}\b/g)) {
        cited.push(`${rung.id}: ${m[0]}`);
      }
    }
    expect(cited, `the song block citing the repository: ${cited.join('; ')}`).toEqual([]);
  });

  it('does not promise a song to a rung that will never have one', () => {
    const promised = everyRung()
      .filter((rung) => rung.songOptions.length === 0 && rung.optionsExempt === true)
      .filter((rung) => noSongsSentence(rung).includes('yet'))
      .map((rung) => rung.id);
    expect(promised, `rungs exempt from options and still told a song is coming: ${promised.join(', ')}`).toEqual(
      [],
    );
  });

  it('keeps "yet" for the case it is true of — a rung the quarry has not filled', () => {
    expect(noSongsSentence({})).toContain('yet');
  });

  it('covers every song-less rung in the built curriculum, so none falls through to the wrong one', () => {
    const songless = everyRung().filter((rung) => rung.songOptions.length === 0);
    expect(songless.length, 'no song-less rung in the built curriculum to check').toBeGreaterThan(0);
    for (const rung of songless) {
      const said = noSongsSentence(rung);
      expect(said.endsWith('.'), `${rung.id}: ${said}`).toBe(true);
      // A rung that is complete without a song must not read as short of one.
      if (rung.songOptional === true || rung.optionsExempt === true) {
        expect(said, rung.id).not.toContain('yet');
      }
    }
  });
});

describe('the screen', () => {
  it('says the rung is finished on its exercises where no song tests the skill', async () => {
    const said = await sentenceOnScreen(rungs.optional.id);
    expect(said).toBe(noSongsSentence(rungs.optional));
    expect(said).not.toContain('docs/');
  });

  it('says the exercises are the whole of a rung that is exempt, rather than "yet"', async () => {
    const said = await sentenceOnScreen(rungs.exempt.id);
    expect(said).toBe(noSongsSentence(rungs.exempt));
    expect(said).not.toContain('yet');
  });

  it('still says "yet" on a rung that is simply short of songs', async () => {
    const said = await sentenceOnScreen(rungs.unfilled.id);
    expect(said).toContain('yet');
  });
});
