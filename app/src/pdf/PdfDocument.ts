/**
 * The PDF.js side of the viewer (docs/04 §5b).
 *
 * Kept to one file with a small surface so the rest of the app never imports
 * `pdfjs-dist` directly — it is the second-largest dependency after OSMD, and
 * the viewer is loaded on demand precisely so that a learner who imports no
 * PDFs never pays for it.
 *
 * PDF.js runs its parser in a worker. Vite is told about it with
 * `new URL(..., import.meta.url)`, which makes the worker a build artefact
 * with a hashed name — that matters because the precache globs pick up
 * `**\/*.js` and the file has to be *in* the build to be cached (docs/00 D20).
 */
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';

let workerConfigured = false;

function configureWorker(): void {
  if (workerConfigured) return;
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  workerConfigured = true;
}

export interface RenderedPage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export class PdfDocument {
  private constructor(private readonly doc: PDFDocumentProxy) {}

  static async open(data: ArrayBuffer): Promise<PdfDocument> {
    configureWorker();
    // PDF.js takes ownership of the buffer it is handed and detaches it, which
    // would empty the copy held in IndexedDB's in-memory cache; a slice keeps
    // the original readable for a second open.
    const doc = await getDocument({ data: data.slice(0) }).promise;
    return new PdfDocument(doc);
  }

  get pageCount(): number {
    return this.doc.numPages;
  }

  /** Renders one page (1-based for PDF.js; 0-based everywhere in this app). */
  async renderPage(pageIndex: number, targetWidth: number): Promise<RenderedPage> {
    const page = await this.doc.getPage(pageIndex + 1);
    const unscaled = page.getViewport({ scale: 1 });
    const scale = targetWidth / unscaled.width;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser would not give the viewer a 2D canvas.');
    // White behind the page: a PDF's own background is transparent, and on a
    // dark theme that renders black notes on a black ground.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    page.cleanup();
    return { canvas, width: canvas.width, height: canvas.height };
  }

  dispose(): void {
    void this.doc.destroy();
  }
}

/**
 * The width a page is rendered at for *detection*.
 *
 * Detection is a projection profile over every pixel, so its cost is the page
 * area; 900 px wide is enough for a staff line to be several pixels of ink and
 * cheap enough to run on all pages of a sonata without blocking the phone.
 */
export const DETECTION_WIDTH = 900;
