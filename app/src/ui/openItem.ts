/**
 * Where an item opens.
 *
 * Four screens can play an item and there are now four places it might go, so
 * the decision lives here once rather than being re-made (and drifting) on
 * Today, Library, the lesson page and Skills review:
 *
 *   - a PDF has pages, not notes → the PDF viewer (docs/04 §5b);
 *   - a drill is a prompt loop, not notation → the drill screen (docs/05 §7);
 *   - a *generated exercise* is notation and has a file, so it is a score even
 *     though its catalog entry also carries a `drill` block naming the
 *     generator that produced it — the file is what decides;
 *   - everything else with notation → the Score screen.
 *
 * An item with none of those is an import placeholder: there is nothing to
 * open, and the caller shows its alternatives instead (docs/04 §2).
 */
import type { Router } from '../router';
import type { CatalogItem } from '../curriculum/types';

export type OpenTarget = 'pdf' | 'drill' | 'score' | 'none';

export function targetFor(item: CatalogItem): OpenTarget {
  if (item.kind === 'pdf') return 'pdf';
  // The file wins over the drill block: `exercise.scale.c-major…` carries
  // `drill: { kind: 'scale' }` to say how it was generated, and it is still a
  // score. Sight-reading is the one drill kind that opens as notation, and it
  // has no file, so it is named rather than inferred.
  if (item.file) return 'score';
  if (item.imported) return 'score';
  if (item.drill) return item.drill.kind === 'sight-reading' ? 'score' : 'drill';
  return 'none';
}

/**
 * Navigates to wherever the item belongs. Returns false when nothing opened.
 *
 * `from` is the rung this was opened from, and it rides into the Score screen
 * so that Back goes back to the rung rather than to the tab (`04` §5). Only
 * the score door carries it: the drill screen and the PDF viewer have their
 * own way out and neither was reported lost.
 */
export function openItem(
  router: Router,
  item: CatalogItem,
  options: { from?: string } = {},
): boolean {
  switch (targetFor(item)) {
    case 'pdf':
      router.navigatePdf(item.id);
      return true;
    case 'drill':
      router.navigateDrill(item.id);
      return true;
    case 'score':
      // The bare call where there is no rung, rather than one with an empty
      // options object: three screens open items through here and their tests
      // read the call, so "nothing was asked for" should look like nothing.
      if (options.from === undefined) router.navigateScore(item.id);
      else router.navigateScore(item.id, { from: options.from });
      return true;
    default:
      return false;
  }
}

/** True when the item can be opened at all — the ▶ button's condition. */
export function isPlayable(item: CatalogItem): boolean {
  return targetFor(item) !== 'none';
}

/**
 * Is there a chord chart in this piece? (`04` §3b, built 2026-09-21.)
 *
 * The chart screen has existed since P18 and **nothing navigated to it**:
 * `#/chart/<itemId>` parsed, `router.navigateChart` compiled, and the only
 * way in was typing the URL. So the fifth screen in the app was reachable by
 * nobody, and two rungs' lessons described it.
 *
 * Measured from the file (`notation.chordCount`), not guessed from the genre
 * or the rung: a chart of a piece with no chord symbols is four empty bars
 * with a count-off over them, and the door that offered it would be the dead
 * control `00` §1 forbids. A row with no `notation` at all — an import, a
 * piece the build could not parse — is not offered one either, because
 * "unknown" is not "yes".
 *
 * `imported` is the one exception and it is deliberate: the chart screen
 * reads the chords out of the imported bytes itself, which the build never
 * saw, so there the door is offered and the screen says if there is nothing
 * behind it.
 */
export function hasChordSymbols(item: CatalogItem): boolean {
  if (targetFor(item) !== 'score') return false;
  if (item.imported === true) return true;
  return (item.notation?.chordCount ?? 0) > 0;
}
