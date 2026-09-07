import { describe, expect, it } from 'vitest';
import { looksLikeThePageItself } from '../../src/curriculum/load';

/**
 * The drill tips showed `<!doctype html> <html lang="en"> <head>` on screen,
 * as prose, under the heading "Tips".
 *
 * A static host answers a missing path with `index.html` and a **200**, so
 * `response.ok` was true and the app rendered the page's own source as
 * markdown. The check is cheap and the failure was not obvious, which is
 * exactly the combination worth a test.
 */
describe('looksLikeThePageItself', () => {
  it('recognises the app being served in place of a file', () => {
    expect(looksLikeThePageItself('<!doctype html>\n<html lang="en">')).toBe(true);
    expect(looksLikeThePageItself('<!DOCTYPE HTML>')).toBe(true);
    expect(looksLikeThePageItself('  \n  <html lang="en">')).toBe(true);
    expect(looksLikeThePageItself('<html>')).toBe(true);
  });

  it('lets real markdown through', () => {
    expect(looksLikeThePageItself('## What it is for\n\nNaming the distance…')).toBe(false);
    expect(looksLikeThePageItself('---\nvariant: grand\n---\n\n# Tips')).toBe(false);
    expect(looksLikeThePageItself('')).toBe(false);
  });

  it('lets markdown that merely starts with a tag through', () => {
    // A tips file may open with an inline tag; only a whole document is the
    // failure this catches.
    expect(looksLikeThePageItself('<em>listen</em> before you play')).toBe(false);
    expect(looksLikeThePageItself('<htmlish> is not a document')).toBe(false);
  });
});
