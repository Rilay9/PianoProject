// The U110 probes' shared reader (not committed): every drawn row's slot box and ink extent on the
// glass (every painted SVG element's box, chord symbols and fingering included), the worst overlap
// between consecutive rows, the renderer's debug read-out and the pricing log.
import type { Page } from '@playwright/test';

export interface RowRead {
  slot: number;
  bars: string | null;
  ahead: boolean;
  top: number;
  height: number;
  inkTop: number;
  inkBottom: number;
}

export async function readRows(page: Page): Promise<{ rows: RowRead[]; overlapPx: number; intoNextSlotPx: number; fit: Record<string, unknown>; log: unknown[] }> {
  return page.evaluate(() => {
    const stage = document.getElementById('score-stage')!;
    const s = stage.getBoundingClientRect();
    const rows = [...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front')]
      .filter((w) => !w.hidden && w.querySelector('svg'))
      .map((w) => {
        let top = Infinity;
        let bottom = -Infinity;
        for (const el of w.querySelectorAll<SVGGraphicsElement>('svg path, svg text, svg rect, svg line, svg polygon, svg polyline, svg ellipse, svg circle')) {
          const r = el.getBoundingClientRect();
          if (!(r.width > 0 || r.height > 0)) continue;
          if (r.width > s.width * 3 || r.height > s.height * 2) continue;
          top = Math.min(top, r.top);
          bottom = Math.max(bottom, r.bottom);
        }
        return {
          slot: Number(w.dataset.slot),
          bars: w.dataset.bars ?? null,
          ahead: w.classList.contains('is-ahead'),
          top: Math.round(Number.parseFloat(w.style.top) || 0),
          height: Math.round(Number.parseFloat(w.style.height) || 0),
          inkTop: Math.round(top - s.top),
          inkBottom: Math.round(bottom - s.top),
        };
      })
      .sort((a, b) => a.top - b.top);
    let overlapPx = -Infinity;
    let intoNextSlotPx = -Infinity;
    for (let k = 0; k + 1 < rows.length; k += 1) {
      overlapPx = Math.max(overlapPx, rows[k]!.inkBottom - rows[k + 1]!.inkTop);
      intoNextSlotPx = Math.max(intoNextSlotPx, rows[k]!.inkBottom - rows[k + 1]!.top);
    }
    const fit = ((window as unknown as { __pianopath?: { scoreFit?: () => unknown } }).__pianopath?.scoreFit?.() ?? {}) as Record<string, unknown>;
    const log = ((window as unknown as { __u110log?: unknown[] }).__u110log ?? []).slice();
    return { rows, overlapPx: Number.isFinite(overlapPx) ? overlapPx : 0, intoNextSlotPx: Number.isFinite(intoNextSlotPx) ? intoNextSlotPx : 0, fit, log };
  });
}
