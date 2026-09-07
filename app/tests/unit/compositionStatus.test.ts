/**
 * What the Library sheet says about a song's copyright (P19 A6, review C9).
 *
 * `00` D23 lets the owner's own build carry a transcription of a song that is
 * still in copyright, on the grounds that nothing is distributed. The row has
 * to say so — and say the right thing, which is *not* what the licence line
 * above it says: the licence describes the edition, and a CC0 transcription of
 * a song from 2019 is a CC0 transcription of a song from 2019.
 */
import { describe, expect, it } from 'vitest';
import { compositionStatusLine } from '../../src/ui/screens/LibraryScreen';

describe('compositionStatusLine', () => {
  it('says nothing for a public-domain composition', () => {
    // Most of the catalog. A line on every row trains the eye to skip it.
    expect(compositionStatusLine({ compositionStatus: 'pd' })).toBe('');
  });

  it('says nothing when the field is absent', () => {
    // Authored and generated items never carry it.
    expect(compositionStatusLine({})).toBe('');
  });

  it('is plain about a song still in copyright', () => {
    const line = compositionStatusLine({ compositionStatus: 'in-copyright' });
    expect(line).toContain('still in copyright');
    expect(line).toContain('transcription');
  });

  it('does not turn "unknown" into either answer', () => {
    const line = compositionStatusLine({ compositionStatus: 'unknown' });
    expect(line).toContain('unknown');
    // The distinction the whole field exists for.
    expect(line).toContain('not the same claim');
  });

  it('adds that it is in his build only when the item is tagged for it', () => {
    const tagged = compositionStatusLine({
      compositionStatus: 'in-copyright',
      tags: ['pdmx', 'personal-build'],
    });
    expect(tagged).toContain('your own build only');
    expect(compositionStatusLine({ compositionStatus: 'in-copyright', tags: ['pdmx'] })).not.toContain(
      'your own build only',
    );
  });
});
