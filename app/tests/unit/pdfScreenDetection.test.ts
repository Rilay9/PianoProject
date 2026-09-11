// @vitest-environment jsdom
/**
 * Opening a long PDF used to detect every page's systems — a rendered page
 * plus a pixel-by-pixel projection profile each — before the first one was
 * ever drawn, and then threw the result away: nothing but the "Adjust cuts"
 * sheet's own Save button ever wrote an auto-detected cut back to the row,
 * so a book the reader never corrected paid that cost again on every single
 * open (handoff-2026-09-09 §5). `tests/e2e/pdf.spec.ts`'s own fixture is one
 * page, which is exactly the shape that hid this: the eager loop and the
 * lazy one behave identically when there is only one page to detect.
 *
 * This drives the real screen with a fake, gateable `PdfDocument` so the
 * many-page case can be observed mid-flight rather than inferred.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';
import { PdfScreen } from '../../src/ui/screens/PdfScreen';

const {
  PAGE_COUNT,
  DETECTION_WIDTH,
  renderCalls,
  backgroundGate,
  releaseBackground,
  detectionState,
  getImportSpy,
  updateImportSpy,
  importRow,
} = vi.hoisted(() => {
  const pageCount = 12;
  const detectionWidth = 900;
  const calls: { page: number; width: number }[] = [];
  let resolveGate: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    resolveGate = resolve;
  });
  const row = {
    id: 'import.book',
    kind: 'pdf' as const,
    title: 'A Long Method Book',
    data: new ArrayBuffer(8),
    cuts: undefined as Record<number, number[]> | undefined,
  };
  return {
    PAGE_COUNT: pageCount,
    DETECTION_WIDTH: detectionWidth,
    renderCalls: calls,
    backgroundGate: gate,
    releaseBackground: resolveGate,
    detectionState: { calls: 0 },
    getImportSpy: vi.fn(() => Promise.resolve(row)),
    updateImportSpy: vi.fn((_id: string, patch: { cuts?: Record<number, number[]> }) => {
      row.cuts = patch.cuts;
      return Promise.resolve(row);
    }),
    importRow: row,
  };
});

vi.mock('../../src/pdf/PdfDocument', () => {
  class FakePdfDocument {
    static open(): Promise<FakePdfDocument> {
      return Promise.resolve(new FakePdfDocument());
    }
    get pageCount(): number {
      return PAGE_COUNT;
    }
    async renderPage(pageIndex: number, width: number): Promise<{ canvas: unknown; width: number; height: number }> {
      if (width === DETECTION_WIDTH) {
        detectionState.calls += 1;
        // The very first detection call is the page being opened, which the
        // screen has to show before anything else — that one must not wait.
        // Every later detection call is the background pass. Recorded only
        // once past the gate, so `renderCalls` counts finished work rather
        // than work merely started.
        if (detectionState.calls > 1) await backgroundGate;
      }
      renderCalls.push({ page: pageIndex, width });
      const fakeContext = {
        getImageData: (_x: number, _y: number, w: number, h: number) => ({
          data: new Uint8ClampedArray(w * h * 4).fill(255), // blank page: no systems detected
        }),
        fillRect: () => undefined,
        drawImage: () => undefined,
        fillStyle: '',
      };
      const fakeCanvas = {
        getContext: () => fakeContext,
        toDataURL: () => 'data:image/png;base64,',
        width: 100,
        height: 140,
      };
      return { canvas: fakeCanvas, width: 100, height: 140 };
    }
    dispose(): void {
      // Nothing real to release.
    }
  }
  return { DETECTION_WIDTH, PdfDocument: FakePdfDocument };
});

vi.mock('../../src/data/importStore', () => ({
  getImport: getImportSpy,
  updateImport: updateImportSpy,
}));

vi.mock('../../src/app/services', () => ({
  audioEngine: { ensureStarted: () => Promise.resolve({}), masterGain: null },
}));

const router = { navigate: vi.fn() } as unknown as Router;

function mount(openAtPage?: number): HTMLElement {
  const section = PdfScreen(router, 'import.book', openAtPage);
  document.body.replaceChildren(section);
  return section;
}

beforeEach(() => {
  renderCalls.length = 0;
  detectionState.calls = 0;
  importRow.cuts = undefined;
  getImportSpy.mockClear();
  updateImportSpy.mockClear();
  // The screen's own on-screen canvases (not the fake pages above) call
  // this too, and jsdom logs a warning every time since it has no `2d`
  // context without the optional `canvas` package. The screen already
  // handles a null context (`drawInto` no-ops), so this only quiets a log
  // this test has no interest in.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('PdfScreen: detecting a long book', () => {
  it('draws the opening page before the rest of the book is detected, then persists once it is', async () => {
    const section = mount();

    // The opening page is shown without waiting on the other 11 — this is
    // the fix: before it, the loop detected every page first and the label
    // never appeared until all of them had run.
    await vi.waitFor(() => {
      expect(section.querySelector('#pdf-label')?.textContent).toContain('1/12');
    });
    // Only the first page has been through detection width so far; the rest
    // are gated in the background.
    expect(renderCalls.filter((c) => c.width === DETECTION_WIDTH)).toHaveLength(1);
    expect(updateImportSpy).not.toHaveBeenCalled();
    // The status line has already moved on from "Finding the systems…" —
    // the reader is not made to wait through all 12 pages before the screen
    // is theirs. `wholePageCuts()`'s one-system-per-undetected-page
    // fallback makes the *count* in the label reach 1/12 either way, which
    // is why this checks the status line rather than the label alone.
    expect(section.querySelector('#pdf-status')?.textContent).not.toContain('Finding the systems');

    // Let the background pass run to completion.
    releaseBackground();
    await vi.waitFor(() => {
      expect(updateImportSpy).toHaveBeenCalled();
    });

    // Every page was detected, and the result was written back once —
    // before this fix nothing but a manual "Save cuts" ever did.
    expect(renderCalls.filter((c) => c.width === DETECTION_WIDTH)).toHaveLength(PAGE_COUNT);
    const [, patch] = updateImportSpy.mock.calls.at(-1) as [string, { cuts: Record<number, number[]> }];
    expect(Object.keys(patch.cuts)).toHaveLength(PAGE_COUNT);
  });

  it('does not re-detect a page whose cuts are already stored', async () => {
    // Simulate the book from the test above having already been opened once:
    // every page's cuts are on the row already.
    importRow.cuts = Object.fromEntries(Array.from({ length: PAGE_COUNT }, (_, i) => [i, [0, 1]]));

    mount();
    await vi.waitFor(() => {
      expect(document.querySelector('#pdf-label')?.textContent).toContain('/12');
    });
    // Give any (wrongly re-triggered) background detection a chance to run.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(renderCalls.filter((c) => c.width === DETECTION_WIDTH)).toHaveLength(0);
    expect(updateImportSpy).not.toHaveBeenCalled();
  });

  it('says so, and opens at the start, when a typed page number is past the end of the file', async () => {
    const section = mount(500);
    await vi.waitFor(() => {
      expect(section.querySelector('#pdf-status')?.textContent).toContain("isn’t in this file");
    });
    expect(section.querySelector('#pdf-status')?.textContent).toContain('12 pages');
    expect(section.querySelector('#pdf-label')?.textContent).toContain('Page 1');
  });
});
