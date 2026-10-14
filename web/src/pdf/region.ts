// Drawing one system of a rendered page, and how tall it comes out on screen.
//
// Ported from the old PDF screen (branch claude/piano-teaching-app-bo19td,
// app/src/ui/screens/PdfScreen.ts: `drawInto` and `screenHeightOf`), which held
// them as closures over its page cache and its stage. The only change: the
// rendered page and the display width are parameters instead of being read
// from the screen's cache and layout.
//
// How a region is rendered: `PdfDocument.renderPage(page, width)` rasterises
// the whole page at the chosen width (the old screen used 1400 px, "enough for
// a phone at 3× DPR"), the canvas goes into a `BoundedPageCache`, and each
// system is copied out of it at the page's pixel size; CSS scales the system's
// canvas to the stage. A system's top and bottom are fractions of the page
// height (systemPlan.ts), so the same cuts serve any render width.
import type { PlannedSystem } from './systemPlan.ts'; // (with .ts: tests/pdf.mjs runs this file in Node)

/**
 * Copies `system` out of its rendered `page` into `canvas`, on white. With no
 * system or no page yet, the canvas is shrunk to 1×1 and hidden.
 */
export function drawSystemInto(
  canvas: HTMLCanvasElement,
  system: PlannedSystem | undefined,
  page: HTMLCanvasElement | undefined,
): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  if (!system || !page) {
    canvas.width = 1;
    canvas.height = 1;
    canvas.hidden = true;
    return;
  }
  const top = Math.round(system.top * page.height);
  const height = Math.max(1, Math.round((system.bottom - system.top) * page.height));
  canvas.width = page.width;
  canvas.height = height;
  canvas.hidden = false;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(page, 0, top, page.width, height, 0, 0, page.width, height);
}

/**
 * How tall a system is on the screen, from its share of the page, when drawn
 * `displayWidth` CSS pixels wide (the old screen passed its stage width less
 * 16 px). 0 when the page is not rendered yet or there is no width.
 */
export function systemScreenHeight(
  system: PlannedSystem | undefined,
  page: { width: number; height: number } | undefined,
  displayWidth: number,
): number {
  if (!system || !page) return 0;
  if (displayWidth <= 0) return 0;
  return ((system.bottom - system.top) * page.height * displayWidth) / page.width;
}
