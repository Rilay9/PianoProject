// The U110b probes' shared reader: every drawn row's slot box and ink extent on the glass (every
// painted SVG element's box, chord symbols and fingering included), the stage's box, the worst
// overlap between consecutive rows, how far the last row's ink ends past the stage, and the
// renderer's debug read-out.
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

export interface GlassRead {
  stageTop: number;
  stageHeight: number;
  stageWidth: number;
  rows: RowRead[];
  /** Largest (upper row's ink bottom - lower row's ink top); positive = ink runs into the next row. */
  overlapPx: number;
  /** Last row's ink bottom - stage height; positive = ink leaves the stage. */
  pastStagePx: number;
  /** Row slot-box packing: the gap between a row's box bottom and the next's top (24 = packed from the top, 0 = even shares). */
  gaps: number[];
  fit: Record<string, unknown>;
}

export async function readGlass(page: Page): Promise<GlassRead> {
  return page.evaluate(() => {
    const stage = document.getElementById('score-stage')!;
    const s = stage.getBoundingClientRect();
    const rows = [...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front')]
      .filter((w) => !w.hidden && w.querySelector('svg') && !w.classList.contains('score-probe'))
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
          inkTop: Math.round((top - s.top) * 10) / 10,
          inkBottom: Math.round((bottom - s.top) * 10) / 10,
        };
      })
      .sort((a, b) => a.top - b.top);
    let overlapPx = -Infinity;
    const gaps: number[] = [];
    for (let k = 0; k + 1 < rows.length; k += 1) {
      overlapPx = Math.max(overlapPx, rows[k]!.inkBottom - rows[k + 1]!.inkTop);
      gaps.push(rows[k + 1]!.top - (rows[k]!.top + rows[k]!.height));
    }
    const last = rows[rows.length - 1];
    const fit = ((window as unknown as { __pianopath?: { scoreFit?: () => unknown } }).__pianopath?.scoreFit?.() ?? {}) as Record<string, unknown>;
    return {
      stageTop: Math.round(s.top * 10) / 10,
      stageHeight: Math.round(s.height * 10) / 10,
      stageWidth: Math.round(s.width * 10) / 10,
      rows,
      overlapPx: Number.isFinite(overlapPx) ? overlapPx : 0,
      pastStagePx: last ? Math.round((last.inkBottom - s.height) * 10) / 10 : 0,
      gaps,
      fit,
    };
  });
}

/** One line: stage height, slots/systems/shown, zoom, ladder, rows as bars[top+height ink a..b], overlap, past stage. */
export function line(g: GlassRead): string {
  const f = g.fit as { slotCount?: number; systemsPerWindow?: number; barsShown?: number; zoom?: number; shapeChanges?: { n?: number; zoom?: number; width?: number } | null };
  const rows = g.rows.map((r) => `${r.bars ?? '?'}${r.ahead ? 'G' : ''}[${String(r.top)}+${String(r.height)} ink ${String(r.inkTop)}..${String(r.inkBottom)}]`).join(' ');
  return `stage ${String(g.stageHeight)} slots ${String(f.slotCount)}/${String(f.systemsPerWindow)}/${String(f.barsShown)} zoom ${String(f.zoom)} ladder ${String(f.shapeChanges?.n ?? '-')}@${String(f.shapeChanges?.zoom ?? '-')} | ${rows} | overlap ${String(g.overlapPx)} past ${String(g.pastStagePx)} gaps ${JSON.stringify(g.gaps)}`;
}
