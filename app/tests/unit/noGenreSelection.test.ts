// @vitest-environment node
/**
 * No tool selects music by `genres` or `tags`.
 *
 * Those two fields come from whoever uploaded the score. A tango is filed under
 * `classical`; the Library's own Latin and Rock & metal filters held **no songs
 * at all** until 2026-09-18 because a song's track came from its import bucket.
 * `import_pdmx.py` says it outright: *"guessing tracks from a title is how the
 * library fills with mislabelled rows."*
 *
 * And the rule is easy to break while believing you are following it. On the
 * same day this was measured, a search tool was written whose first version
 * filtered on exactly these fields — and the owner caught it, not a test.
 *
 * **What is allowed.** Reading `genres` to *display* it, or to carry it through
 * a pipeline, is fine; this looks for it being used to *choose*. The test is
 * deliberately blunt — a `genre` or `tag` argument on a selection tool — because
 * a subtle version would be argued around.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const TOOLS = resolve('..', 'tools', 'content');

/** Tools whose job is to choose music. */
const SELECTORS = ['candidates.py', 'archive_search.py', 'archive_notation.py', 'rung_audit.py'];

describe('music is never chosen by a field an uploader wrote', () => {
  it('gives no selection tool a genre or tag filter', () => {
    const offenders: string[] = [];
    for (const name of SELECTORS) {
      let source: string;
      try {
        source = readFileSync(join(TOOLS, name), 'utf8');
      } catch {
        continue; // a tool that does not exist yet cannot break the rule
      }
      // An argparse option named --genre/--tag, or a filter reading the field.
      for (const pattern of [/add_argument\(\s*["']--genres?["']/, /add_argument\(\s*["']--tags?["']/]) {
        if (pattern.test(source)) {
          offenders.push(`${name} takes a genre or tag filter`);
        }
      }
    }
    expect(
      offenders,
      `a selection tool filters on a field an uploader wrote:\n${offenders.join('\n')}\n` +
        'Select on notation — key, metre, staves, chord symbols — or on a title, ' +
        'which is the work\'s own name. See tools/content/archive_search.py for why.',
    ).toEqual([]);
  });

  it('still has the tools it is guarding', () => {
    // If every selector were renamed the test above would pass while checking
    // nothing, which is how a guard quietly stops guarding.
    const present = readdirSync(TOOLS);
    const found = SELECTORS.filter((name) => present.includes(name));
    expect(found.length, `none of the selection tools are where this expects them`).toBeGreaterThan(
      2,
    );
  });
});
