// @vitest-environment node
/**
 * The one way the hoisted-Sets cache in `selectors.ts` can go wrong.
 *
 * `recordSets` caches by the `records` array's own identity, which is sound
 * only while nobody mutates such an array in place. Every caller builds a fresh
 * one with `.map()` — but a future caller that appended to an existing array
 * would get a stale answer, and the symptom would be a rung that stayed
 * incomplete after it was passed: silent, and nowhere near the file that caused
 * it.
 *
 * So this pins the invariant rather than the implementation: no source file may
 * mutate a `records` array in place. It is a cheap guard on a fault that would
 * otherwise be very expensive to find.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
    else if (name.endsWith('.ts')) out.push(path);
  }
  return out;
}

describe('the records array is never mutated in place', () => {
  it('no source file pushes, splices, sorts or assigns into one', () => {
    const mutators = /\brecords\s*(?:\.(?:push|splice|sort|reverse|unshift|pop|shift|fill|copyWithin)\s*\(|\[[^\]]*\]\s*=[^=])/;
    const offenders: string[] = [];
    for (const path of sourceFiles(join(process.cwd(), 'src'))) {
      const text = readFileSync(path, 'utf8');
      text.split('\n').forEach((line, i) => {
        // Comments describing the rule are not breaking it.
        const code = line.replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '');
        if (mutators.test(code)) offenders.push(`${path}:${String(i + 1)}: ${line.trim()}`);
      });
    }
    expect(
      offenders,
      `these mutate a records array in place, which makes selectors.ts's cache serve stale answers:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
