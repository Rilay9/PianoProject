// Golden-file helpers.
//
// A golden test freezes the *whole* extracted model, not a handful of
// assertions, so any change in OSMD's parsing or in the extractor shows up as
// a reviewable diff rather than as a silent behaviour change months later.
//
// Regenerate after an intentional change:
//   UPDATE_GOLDEN=1 npm run test

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { expect } from 'vitest';
import { GOLDEN_DIR } from './fixtures';

export const UPDATING = process.env.UPDATE_GOLDEN === '1';

export function goldenPath(name: string): string {
  return join(GOLDEN_DIR, `${name}.json`);
}

/**
 * Compares `actual` with the stored golden, or writes it when UPDATE_GOLDEN=1.
 *
 * Fails loudly on a missing golden rather than creating one silently: a test
 * that writes whatever it is given is not a test.
 */
export function expectMatchesGolden(name: string, actual: unknown): void {
  const path = goldenPath(name);
  const serialised = `${JSON.stringify(actual, null, 2)}\n`;
  if (UPDATING) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, serialised, 'utf8');
    return;
  }
  if (!existsSync(path)) {
    throw new Error(
      `Missing golden for "${name}" at ${path}. Run: UPDATE_GOLDEN=1 npm run test`,
    );
  }
  const expected: unknown = JSON.parse(readFileSync(path, 'utf8'));
  expect(actual).toEqual(expected);
}
