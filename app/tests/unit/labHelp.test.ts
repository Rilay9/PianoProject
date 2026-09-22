// @vitest-environment node
/**
 * The lab's own explanations, and the spec section that lists them (`04` §3c).
 *
 * The owner, 2026-09-21: the lab *"doesn't have enough documentation"*. It had
 * none — a grep of `LabScreen.ts` for `help|explain|tip|hint` on that date
 * returned the file comment and nothing else.
 *
 * What makes the fix rot is the ordinary way: a sentence written beside the
 * markup, copied into the spec, and then changed in one of the two places. So
 * the sentences live in `LAB_HELP`, the screen reads them by id, `04` §3c
 * prints the table, and this is the join. It is the same shape as
 * `labPresets.test.ts`, which joins the preset ids to `validate.py` for the
 * same reason: two copies of one fact drift, and a test is what says when.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAB_HELP, labHelp, type LabHelpLine } from '../../src/engine/sightReading';

const SPEC = readFileSync(resolve('..', 'docs', '04-ui-spec.md'), 'utf8');
const SCREEN = readFileSync(join('src', 'ui', 'screens', 'LabScreen.ts'), 'utf8');

/** `04` §3c, from its own heading to the next `###`. */
function sectionThreeC(): string {
  const start = SPEC.indexOf('### 3c. Accompaniment lab');
  expect(start, '`04` has no §3c heading under that name').toBeGreaterThan(-1);
  const end = SPEC.indexOf('\n### ', start + 1);
  return SPEC.slice(start, end === -1 ? undefined : end);
}

describe('every control on the lab says what it does', () => {
  it('gives a line to each of the controls the screen draws', () => {
    // A relationship, not a count: the ids the screen asks for are the ids the
    // table must answer, whichever way either of them grows.
    const asked = [...SCREEN.matchAll(/labHelp\('([a-zA-Z]+)'\)/g)].map((match) => match[1]);
    expect(asked.length, 'the screen asks for no help lines at all').toBeGreaterThan(0);
    const missing = asked.filter((id) => !LAB_HELP.some((line) => line.id === id));
    expect(missing, `the screen asks for lines the table has not: ${missing.join(', ')}`).toEqual(
      [],
    );
    // And the other way: a line nobody draws is documentation of nothing.
    const undrawn = LAB_HELP.filter((line) => !asked.includes(line.id)).map((line) => line.id);
    expect(undrawn, `lines in the table that no control draws: ${undrawn.join(', ')}`).toEqual([]);
  });

  it('writes a sentence rather than a label again', () => {
    for (const line of LAB_HELP) {
      expect(line.help.trim().length, `${line.id} has no line`).toBeGreaterThan(0);
      expect(line.help.trim().endsWith('.'), `${line.id} is not a sentence: ${line.help}`).toBe(
        true,
      );
      expect(
        line.help.toLowerCase().includes(line.label.toLowerCase()) &&
          line.help.trim().length < line.label.length + 4,
        `${line.id} only repeats its own label`,
      ).toBe(false);
    }
  });

  it('says on the screen exactly what `04` §3c says it says', () => {
    const section = sectionThreeC();
    const drifted: string[] = [];
    for (const line of LAB_HELP) {
      if (!section.includes(line.help)) drifted.push(`${line.id}: ${line.help}`);
    }
    expect(
      drifted,
      `lines the screen shows that §3c does not list: ${drifted.join(' | ')}`,
    ).toEqual([]);
  });

  it('answers an id it does not know with nothing rather than throwing', () => {
    // The screen reads the table at build time, so a wrong id is a type error
    // — but the lookup is still a lookup, and a blank line under a control is
    // a better failure inside a render than an exception that takes the screen.
    expect(labHelp('key')).not.toBe('');
    expect(labHelp('nope' as LabHelpLine['id'])).toBe('');
  });
});
