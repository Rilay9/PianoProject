// @vitest-environment node
/**
 * A lesson may not promise music its rung does not offer.
 *
 * This is the `blues.3` fault, made mechanical. That lesson said "one of these
 * is in the minor, and it is the one to start with" and none of its three songs
 * was: the prose was written for a rung the quarry had not filled yet, both
 * files were valid on their own, and nothing joined them. A learner reads the
 * sentence, looks at three options, and concludes they cannot tell a minor key
 * when they see one.
 *
 * Two joins are checked here, and neither is a matter of taste:
 *
 * 1. **A piece named in the prose is on the rung** — unless the sentence says
 *    it is in the Library, which is the documented way a rung points past
 *    itself (`02` Part A item 5: "more at this level under X in the Library").
 * 2. **A song on a genre rung carries that genre's track**, which is what the
 *    Library filters by. `build.py`'s `attach_rung_tracks` derives this, so the
 *    test guards the derivation rather than the data: before it existed the
 *    Latin and Rock & metal filters held no songs at all while their own
 *    lessons pointed learners at them.
 *
 * Read against the *built* content for the reason `curriculumIntegrity` gives.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CONTENT = join(process.cwd(), 'public', 'content');
const LESSONS = join(CONTENT, 'lessons');

interface Lesson {
  id: string;
  songOptions?: string[];
  exerciseOptions?: string[];
}
interface Unit {
  id: string;
  track?: string;
  lessons?: Lesson[];
}
interface CatalogRow {
  id: string;
  type?: string;
  title?: string;
  tracks?: string[];
}

function built(): { units: Unit[]; rows: CatalogRow[] } {
  const stages = (
    JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as {
      stages: { units: Unit[] }[];
    }
  ).stages;
  return {
    units: stages.flatMap((stage) => stage.units),
    rows: JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogRow[],
  };
}

/** Lowercased, punctuation and bracketed qualifiers dropped. */
function norm(text: string): string {
  return text
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * The italicised spans in a lesson that are plausibly piece names.
 *
 * Lessons italicise for emphasis as well as for titles — *left*, *after*,
 * *before* — and a single common word substring-matches a dozen catalog titles.
 * Requiring two words and eight characters keeps the emphasis out without a
 * word list to maintain; a one-word title like *Insensatez* is then missed,
 * which is the safe direction for a test that fails a build.
 */
function namedPieces(body: string): string[] {
  const spans = [...body.matchAll(/(?<!\*)\*([^*\n]{2,60})\*(?!\*)/g)].map((m) =>
    (m[1] ?? '').trim(),
  );
  return [
    ...new Set(
      spans.filter((span) => {
        const n = norm(span);
        return n.length >= 8 && n.split(' ').length >= 2 && n.split(' ').length <= 8;
      }),
    ),
  ];
}

/** A sentence that hands the reader to the Library is allowed to name anything. */
function pointsAtTheLibrary(body: string, phrase: string): boolean {
  const at = body.indexOf(phrase);
  if (at < 0) return false;
  const from = body.lastIndexOf('.', at) + 1;
  const to = body.indexOf('.', at + phrase.length);
  const sentence = body.slice(from, to === -1 ? body.length : to + 1).toLowerCase();
  return /librar|import|find more|not in the library|shelf/.test(sentence);
}

/**
 * The paragraph where a lesson promises its own repertoire, and only that.
 *
 * Scoping this to the whole lesson was the first attempt and it was wrong — not
 * because the lessons were, but because naming a piece is not the same act as
 * offering one. `theory.3` teaches intervals by the tunes that start with them
 * ("major 2nd is the start of *Happy Birthday*"); `rock.overview` says "See it
 * in: Satie *Gnossienne no. 1*", a piece to listen to now and play in a year;
 * `ragtime.8` names *The Entertainer* inside a **Common mistake**. All three are
 * good writing and none is a promise. Widening the exemptions to let them
 * through would have meant a list of phrasings growing forever and a test that
 * quietly stopped catching anything.
 *
 * The **Repertoire** paragraph is where the promise actually lives, it is where
 * the `blues.3` fault was, and it is where the latin lesson called two tangos
 * bossas. A lesson without one is not checked, which is correct: it has not
 * promised anything.
 */
function repertoireParagraph(body: string): string | null {
  const start = /\*\*Repertoire[^*]*\.?\*\*/.exec(body);
  if (!start) return null;
  const from = start.index;
  // To the next bold lead-in, which is how every lesson starts its next point.
  const rest = body.slice(from + start[0].length);
  const next = /\*\*[A-Z]/.exec(rest);
  return rest.slice(0, next ? next.index : rest.length);
}

describe('a lesson promises only what its rung has', () => {
  it('names no piece the rung does not offer, unless it says where else to look', () => {
    const { units, rows } = built();
    const byId = new Map(rows.map((row) => [row.id, row]));
    const titles = rows.map((row) => norm(row.title ?? '')).filter(Boolean);
    const wrong: string[] = [];
    let checked = 0;

    for (const unit of units) {
      for (const lesson of unit.lessons ?? []) {
        let body: string;
        try {
          body = readFileSync(join(LESSONS, `${lesson.id}.md`), 'utf8');
        } catch {
          continue;
        }
        body = body.replace(/^---[\s\S]*?\n---\n/, '').replace(/\s+/g, ' ');
        const promised = repertoireParagraph(body);
        if (promised === null) continue;
        const onRung = [...(lesson.songOptions ?? []), ...(lesson.exerciseOptions ?? [])]
          .map((id) => norm(byId.get(id)?.title ?? ''))
          .filter(Boolean);

        for (const phrase of namedPieces(promised)) {
          const n = norm(phrase);
          // Only a phrase the catalog actually knows is a claim about music;
          // anything else is prose this test has no opinion about.
          if (!titles.some((t) => t.includes(n) || n.includes(t))) continue;
          checked += 1;
          if (onRung.some((t) => t.includes(n) || n.includes(t))) continue;
          if (pointsAtTheLibrary(promised, phrase)) continue;
          wrong.push(`${lesson.id} names "${phrase}", which its rung does not offer`);
        }
      }
    }

    expect(checked, 'no lesson named a piece — has the italic convention changed?').toBeGreaterThan(
      10,
    );
    expect(wrong, `a lesson promising music its rung has not got:\n${wrong.join('\n')}`).toEqual([]);
  });

  it('gives every song on a genre rung the track the Library filters it by', () => {
    const { units, rows } = built();
    const byId = new Map(rows.map((row) => [row.id, row]));
    // Not genres: every core-path item would collect `core`, which filters
    // nothing, and the three skill tracks are not what a learner browses by.
    const notGenres = new Set(['core', 'practice', 'technique', 'theory-ear']);
    const wrong: string[] = [];
    let checked = 0;

    for (const unit of units) {
      const track = unit.track;
      if (!track || notGenres.has(track)) continue;
      for (const lesson of unit.lessons ?? []) {
        for (const id of lesson.songOptions ?? []) {
          const row = byId.get(id);
          if (!row) continue;
          checked += 1;
          if (!(row.tracks ?? []).includes(track)) {
            wrong.push(`${lesson.id}: ${id} is on a ${track} rung and is not tagged ${track}`);
          }
        }
      }
    }

    expect(checked, 'no genre rung had songs — has the curriculum moved?').toBeGreaterThan(20);
    expect(
      wrong,
      `songs the Library's genre filter cannot see:\n${wrong.slice(0, 20).join('\n')}`,
    ).toEqual([]);
  });
});
