import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { drillFromCatalog } from '../../src/engine/drills/fromCatalog';
import type { CatalogItem } from '../../src/curriculum/types';

/**
 * Every drill in the catalogue says what to do, in words that are not its own
 * name.
 *
 * The five-finger and accompaniment patterns are built as `call-response`
 * drills, whose sentence is "Play it back" — true of a phrase and useless for a
 * hand position. Worse, their card showed the *item's title* at forty pixels a
 * letter: "Left-hand accompaniment patterns — 1", which is what he had just
 * tapped and says nothing about what to play.
 */
const catalog = JSON.parse(
  readFileSync(new URL('../../public/content/catalog.json', import.meta.url), 'utf8'),
) as CatalogItem[];

describe('every drill in the catalogue', () => {
  // Whatever the catalogue can actually build a prompt loop from.
  const drillable = catalog.filter((item) => drillFromCatalog(item, { seed: 1 }) !== null);

  it('has some to test', () => {
    expect(drillable.length).toBeGreaterThan(20);
  });

  it('never uses the item title as the prompt label', () => {
    const offenders: string[] = [];
    for (const item of drillable) {
      const drill = drillFromCatalog(item, { seed: 1 });
      const prompt = drill?.next();
      if (!prompt) continue;
      if (prompt.label.trim() === item.title.trim()) offenders.push(item.id);
      // The pattern builders used `${title} — 1`, which is the same fault with
      // a number after it.
      if (prompt.label.includes(item.title)) offenders.push(`${item.id} (contains title)`);
    }
    expect(offenders).toEqual([]);
  });

  it('gives a kind that cannot speak for itself its own sentence', () => {
    const patterns = drillable.filter((item) =>
      ['five-finger', 'accompaniment', 'arpeggio'].includes(String(item.drill?.kind ?? '')),
    );
    expect(patterns.length).toBeGreaterThan(0);
    for (const item of patterns) {
      const drill = drillFromCatalog(item, { seed: 1 });
      if (!drill) continue;
      // Either the kind says it, or the drill does; what must not happen is
      // falling through to the item's own name.
      expect(drill.promptText ?? '').not.toBe('');
      expect(drill.promptText ?? '').not.toContain(item.title);
    }
  });
});
