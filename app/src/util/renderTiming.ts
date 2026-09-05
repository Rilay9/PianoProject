// Render-timing log.
//
// P2 renders notation with OpenSheetMusicDisplay against a hard budget
// (< 150 ms for a 2-bar window, < 16 ms for a pre-rendered window swap —
// docs/01-architecture.md §6). Those numbers can only be trusted when measured
// on the owner's phone, so the hook exists now: P2 wraps its render calls in
// `measureRender`, and the diagnostics screen already displays and exports
// whatever has been recorded.

import { RingBuffer } from './RingBuffer';
import { summarise, type Stats } from './stats';

export interface RenderTiming {
  label: string;
  ms: number;
  /** `performance.now()` when the measurement finished. */
  atMs: number;
}

const CAPACITY = 200;
const log = new RingBuffer<RenderTiming>(CAPACITY);

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function recordRenderTiming(label: string, ms: number): void {
  log.push({ label, ms, atMs: now() });
}

/** Times `fn`, records the result under `label`, and returns `fn`'s value. */
export function measureRender<T>(label: string, fn: () => T): T {
  const start = now();
  try {
    return fn();
  } finally {
    recordRenderTiming(label, now() - start);
  }
}

export function getRenderTimings(): RenderTiming[] {
  return log.toArray();
}

export function clearRenderTimings(): void {
  log.clear();
}

/** One row per label, for the diagnostics screen and the debug report. */
export function renderTimingSummary(): { label: string; stats: Stats }[] {
  const byLabel = new Map<string, number[]>();
  for (const t of log.toArray()) {
    const bucket = byLabel.get(t.label);
    if (bucket) bucket.push(t.ms);
    else byLabel.set(t.label, [t.ms]);
  }
  return [...byLabel.entries()]
    .map(([label, values]) => ({ label, stats: summarise(values) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
