import { describe, expect, it } from 'vitest';
import { nounFor, plural } from '../../src/util/plural';

describe('plural', () => {
  it('says one of a thing without an s', () => {
    expect(plural(1, 'score')).toBe('1 score');
    expect(plural(1, 'option')).toBe('1 option');
  });

  it('says more than one with an s', () => {
    expect(plural(2, 'score')).toBe('2 scores');
    expect(plural(9, 'option')).toBe('9 options');
  });

  it('says none with an s, which is what English does', () => {
    expect(plural(0, 'score')).toBe('0 scores');
  });

  it('groups the digits, because 37261 is not a number anybody reads', () => {
    expect(plural(37_261, 'score')).toBe('37,261 scores');
  });

  it('takes an irregular plural when the s would be wrong', () => {
    expect(plural(2, 'entry', 'entries')).toBe('2 entries');
    expect(plural(1, 'entry', 'entries')).toBe('1 entry');
  });

  it('hands back the noun alone when the number is already on the page', () => {
    expect(nounFor(1, 'minute')).toBe('minute');
    expect(nounFor(4, 'minute')).toBe('minutes');
  });
});
