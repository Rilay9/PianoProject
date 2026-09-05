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

/** Navigates to wherever the item belongs. Returns false when nothing opened. */
export function openItem(router: Router, item: CatalogItem): boolean {
  switch (targetFor(item)) {
    case 'pdf':
      router.navigatePdf(item.id);
      return true;
    case 'drill':
      router.navigateDrill(item.id);
      return true;
    case 'score':
      router.navigateScore(item.id);
      return true;
    default:
      return false;
  }
}

/** True when the item can be opened at all — the ▶ button's condition. */
export function isPlayable(item: CatalogItem): boolean {
  return targetFor(item) !== 'none';
}
