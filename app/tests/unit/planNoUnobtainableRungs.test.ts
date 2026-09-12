// @vitest-environment node
/**
 * No rung in the plan is built around music the owner can never get.
 *
 * The rock module used to be eight rungs: an overview and seven *technique
 * briefs*, one per named song — "Seize the Day", "Dear God", "Final
 * Masquerade", "Shadow of the Day", "So Far Away", "Fiction", "Waiting for the
 * End". Each brief's first song option was a catalog placeholder with no file
 * and the licence `copyright, not redistributable`, and its lesson text opened
 * with "**Not bundled.** In copyright; import your own MusicXML." The rung
 * could therefore never be started from inside the app: you had to buy a
 * MusicXML export or transcribe the song yourself first. The owner's word for
 * them was that they "had modules built for them but I'll have to add in which
 * makes it not really fit", and they are gone (2026-09-12).
 *
 * The distinction this holds is between *can never be shipped* and *is not
 * shipped by this build*. The Joplin rags on the ragtime rungs are placeholders
 * too, but they are CC BY-NC-SA editions that are already in the repository and
 * that `build.py --personal` bundles (`00` D10a, D23) — a build flag away, not a
 * shop away. So the rule is about the licence and not about the missing file:
 * a rung may offer something this build left out, and may not offer something
 * no build could ever include.
 *
 * A `node` environment and the built content, not a fixture: the fault was in
 * `content/curriculum/stage-4.json` and `stage-5.json`, and a fixture would
 * have agreed with whatever the test author believed was there.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CatalogItem } from '../../src/curriculum/types';

const CONTENT = resolve('public/content');

interface Lesson {
  id?: string;
  title?: string;
  exerciseOptions?: string[];
  songOptions?: string[];
}
interface Unit {
  id?: string;
  track?: string;
  lessons?: Lesson[];
}
interface Stage {
  number?: number;
  units?: Unit[];
}

const catalog = JSON.parse(readFileSync(resolve(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(resolve(CONTENT, 'curriculum.json'), 'utf8')) as {
  stages: Stage[];
};
const byId = new Map(catalog.map((item) => [item.id, item]));

/** An edition no build of this app may ever carry (`00` D23). */
function neverShippable(item: CatalogItem | undefined): boolean {
  const licence = item?.source?.license ?? '';
  return licence.toLowerCase().startsWith('copyright');
}

function* everyRung(): Generator<{ stage: number; unit: string; lesson: Lesson }> {
  for (const stage of curriculum.stages) {
    for (const unit of stage.units ?? []) {
      for (const lesson of unit.lessons ?? []) {
        yield { stage: stage.number ?? -1, unit: unit.id ?? '?', lesson };
      }
    }
  }
}

describe('the plan', () => {
  it('has enough rungs for a green run to mean something', () => {
    expect([...everyRung()].length).toBeGreaterThan(50);
  });

  it('names at least one edition that can never be shipped, so the rule below has teeth', () => {
    // If the catalog ever stops carrying such an item the rule above becomes
    // vacuously true and would go on passing while saying nothing.
    expect(catalog.filter((item) => neverShippable(item)).length).toBeGreaterThan(0);
  });

  it('offers no rung an option the app may never ship', () => {
    const dead: string[] = [];
    for (const { stage, unit, lesson } of everyRung()) {
      for (const id of [...(lesson.exerciseOptions ?? []), ...(lesson.songOptions ?? [])]) {
        if (neverShippable(byId.get(id))) {
          dead.push(`stage ${String(stage)} · ${unit} · ${lesson.id ?? '?'} offers ${id}`);
        }
      }
    }
    expect(dead, dead.join('\n')).toEqual([]);
  });

  it('keeps the rock module, as the one rung that teaches on music you have', () => {
    // The deletion was of the seven song-specific briefs, not of the track:
    // the overview teaches five textures on Bach, Chopin, Satie, Beethoven and
    // Grieg, every one of them bundled.
    const rock = [...everyRung()].filter(({ lesson }) => lesson.id?.startsWith('rock.'));
    expect(rock.map(({ lesson }) => lesson.id)).toEqual(['rock.overview']);
    const options = rock[0]?.lesson.songOptions ?? [];
    expect(options.length).toBeGreaterThan(0);
    for (const id of options) expect(byId.get(id)?.file ?? null).not.toBeNull();
  });
});
