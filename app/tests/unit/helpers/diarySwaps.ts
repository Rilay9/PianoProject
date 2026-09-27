/**
 * What "Swap this" would offer for each row of a learner's card, as a diary line
 * (E0): the tier each option came from and the option's title, in the sheet's
 * order, with the sheet's heading words — so a reader of the thirty days sees the
 * swap sheets beside the cards, the way the Today screen draws them. Diary output
 * only: nothing here is asserted.
 */
import { swapOptions, type SessionSlot } from '../../../src/curriculum/session';
import type { CatalogIndex } from '../../../src/curriculum/selectors';
import type { CatalogItem, Curriculum } from '../../../src/curriculum/types';
import type { SessionRow } from '../../../src/data/db';
import { swapTierWords } from '../../../src/ui/help';

/**
 * One line per row with an item: its swap sheet's first `limit` options, each after its
 * tier's words — with the learner's rung, stored runs and reached rungs, as the Today screen
 * hands them (E0a: the rungs the session says they have reached).
 */
export function swapLines(
  card: readonly SessionSlot[],
  curriculum: Curriculum,
  catalog: CatalogIndex,
  items: CatalogItem[],
  rung: string | undefined,
  rows: readonly SessionRow[] = [],
  today: Date = new Date(),
  reached: readonly string[] = [],
  limit = 6,
): string[] {
  const out: string[] = [];
  for (const slot of card) {
    if (!slot.item || slot.kind === 'free') continue;
    const options = swapOptions(slot, [...card], curriculum, catalog, { items, ...(rung === undefined ? {} : { rung }), rows, today, reached });
    const shown = options.slice(0, limit).map((option) => `[${swapTierWords(option.tier, option.shared)}] ${option.item.title}`);
    const more = options.length > limit ? ` (+${String(options.length - limit)} more)` : '';
    out.push(`            swap ${slot.kind.padEnd(12)} ${shown.length === 0 ? '(nothing)' : shown.join('; ')}${more}`);
  }
  return out;
}
