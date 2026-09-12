/**
 * Past fifty kinds of error, the app went quiet about the fifty-first.
 *
 * The bound is on memory: fifty distinct messages, each with a stack, held on a
 * phone. It was enforced with a bare `return`, which threw the fifty-first away
 * entirely — uncounted in `errorCount()`, absent from the report, and, because
 * the error boundary listens to the announcement rather than to `window`,
 * raising no banner.
 *
 * That is the wrong way round. A session that has already produced fifty kinds
 * of error is precisely the one where a kind that has never been seen before
 * matters most, and it was the one the app stopped mentioning. The count froze
 * at whatever the first fifty had reached, so the banner said "something went
 * wrong 50 times" for the rest of the session however much went wrong after.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  errorCount,
  loggedErrors,
  onErrorLogged,
  recordError,
  resetErrorLogForTest,
} from '../../src/util/errorLog';

/** `MAX_DISTINCT` in the module. */
const BOUND = 50;

function fill(kinds: number): void {
  for (let i = 0; i < kinds; i += 1) recordError(`error number ${String(i)}`, 'error');
}

describe('more kinds of error than the log will hold', () => {
  beforeEach(() => {
    resetErrorLogForTest();
  });

  it('still counts them', () => {
    fill(BOUND);
    expect(errorCount()).toBe(BOUND);
    recordError('a brand new kind', 'error');
    recordError('and another', 'error');
    expect(errorCount(), 'the count froze, so the banner did too').toBe(BOUND + 2);
  });

  it('still announces them, which is what raises the banner', () => {
    fill(BOUND);
    const heard = vi.fn();
    onErrorLogged(heard);
    recordError('a brand new kind', 'error');
    expect(heard, 'a new kind of error told nobody').toHaveBeenCalledTimes(1);
  });

  it('says how many kinds it is standing for, not one stray error', () => {
    fill(BOUND);
    recordError('one new kind', 'error');
    recordError('two new kinds', 'error');
    recordError('three new kinds', 'error');
    // The same kind again is a repeat of a kind already counted, not a new one.
    recordError('three new kinds', 'error');
    const bucket = loggedErrors().find((entry) => entry.message.includes('other kind'));
    expect(bucket, 'nothing in the report stands for what was dropped').toBeDefined();
    expect(bucket?.message).toBe('3 other kinds of error, not kept separately');
    expect(bucket?.count, 'four errors arrived past the bound').toBe(4);
  });

  it('keeps the bound: nothing past it is stored on its own', () => {
    fill(BOUND);
    fill(BOUND * 2);
    // The fifty it kept, plus one bucket for everything else. The point of the
    // bound is that a phone is not asked to hold a stack trace per kind.
    expect(loggedErrors().length).toBe(BOUND + 1);
  });

  it('a repeat of one it already holds is unaffected', () => {
    fill(BOUND);
    recordError('error number 0', 'error');
    const first = loggedErrors().find((entry) => entry.message === 'error number 0');
    expect(first?.count).toBe(2);
    expect(loggedErrors().length).toBe(BOUND);
  });
});
