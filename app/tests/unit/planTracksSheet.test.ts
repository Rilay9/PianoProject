// @vitest-environment jsdom
/**
 * Plan's "Tracks" sheet (`docs/handoff-2026-09-09.md` §5j, `PlanScreen.ts`).
 *
 * Two faults, same sheet:
 *
 *  - `core`'s chip refuses a tap and used to say why on the screen's own
 *    status line (`:325`-ish) — which `openSheet`'s `isolate()` had just made
 *    `inert` and covered with the sheet itself, so the message was both
 *    unreachable to a screen reader and invisible. It now writes into a
 *    status line that lives inside the sheet.
 *  - A drag set `suppressClickFor` and only the dragged chip's own click
 *    handler cleared it (`:222`, `:319`), but a touch that has moved does not
 *    get a synthetic click at all — so the flag stuck, and the very next
 *    genuine tap on that chip was silently swallowed. It now self-heals.
 *  - The `move` handler only redrew the header (`:206`), which is inert and
 *    hidden behind this sheet while it is open — the sheet's own rows, which
 *    is what a drag is actually happening within and what the next `move`
 *    event measures via `getBoundingClientRect`, never moved. It now does.
 *
 * jsdom does not implement `setPointerCapture`/`releasePointerCapture` at
 * all (it throws), so this stubs both as no-ops the way any test driving
 * pointer-capture-based drag code under jsdom has to. It also stubs
 * `getBoundingClientRect` to report each chip's real, current row position —
 * jsdom has no layout engine, so without this every rect is `0,0,0,0` and
 * the drag math being tested has nothing to bite on.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';
import type { Curriculum } from '../../src/curriculum/types';

// jsdom implements neither at all (both throw "is not a function"); the
// DOM typings declare them regardless, so these are plain overrides rather
// than a feature check.
Element.prototype.setPointerCapture = (): void => undefined;
Element.prototype.releasePointerCapture = (): void => undefined;

const ROW_HEIGHT = 40;

// A synthetic layout: every chip's box is derived, live, from its own row's
// *current* position among its siblings — so a test can tell whether a row
// actually moved in the DOM, not just whether an array changed.
Element.prototype.getBoundingClientRect = function (this: Element): DOMRect {
  const row = this.closest('.track-row');
  const parent = row?.parentElement;
  const index = parent ? Array.from(parent.children).indexOf(row) : 0;
  const top = index * ROW_HEIGHT;
  return {
    top,
    bottom: top + ROW_HEIGHT - 4,
    left: 0,
    right: 200,
    width: 200,
    height: ROW_HEIGHT - 4,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
};

const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [
    { id: 'core', title: 'Core', description: '', startsAtStage: 0 },
    { id: 'jazz', title: 'Jazz', description: '', startsAtStage: 0 },
    { id: 'blues-boogie', title: 'Blues', description: '', startsAtStage: 0 },
    { id: 'classical', title: 'Classical', description: '', startsAtStage: 0 },
  ],
  stages: [],
};

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve(CURRICULUM),
  allItems: () => Promise.resolve([]),
}));

const { PlanScreen } = await import('../../src/ui/screens/PlanScreen');
const { forgetCachedPlan } = await import('../../src/data/planStore');

const router = { navigateLesson: vi.fn(), navigate: vi.fn() } as unknown as Router;

function pointer(type: string, x: number, y: number, pointerId = 1): PointerEvent {
  return new PointerEvent(type, { clientX: x, clientY: y, pointerId, bubbles: true, cancelable: true });
}

async function openSheetOn(): Promise<HTMLElement> {
  const section = PlanScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelector('#plan-tracks-open')).toBeTruthy();
  });
  (section.querySelector('#plan-tracks-open') as HTMLButtonElement).click();
  await vi.waitFor(() => {
    expect(document.getElementById('plan-tracks-sheet')).toBeTruthy();
  });
  return document.getElementById('plan-tracks-sheet') as HTMLElement;
}

describe('the Tracks sheet', () => {
  beforeEach(() => {
    // `planStore` keeps a write-through, module-level cache: a drag in one
    // test commits an order through `updatePlan`, and without resetting this
    // the next test would open the sheet already reordered.
    forgetCachedPlan();
  });
  afterEach(() => {
    document.body.replaceChildren();
    document.getElementById('plan-tracks-sheet')?.remove();
    vi.useRealTimers();
  });

  it('says core cannot be switched off inside the sheet, announced there', async () => {
    await openSheetOn();
    const coreChip = document.getElementById('plan-track-core') as HTMLButtonElement;
    coreChip.click();

    const sheetStatus = document.getElementById('plan-tracks-sheet-status');
    expect(sheetStatus).toBeTruthy();
    // Announced: a screen reader only speaks a live region that is inside
    // the accessibility tree, which `role="status"` plus `aria-live` makes
    // explicit rather than relying on the element merely existing.
    expect(sheetStatus?.getAttribute('role')).toBe('status');
    expect(sheetStatus?.textContent).toMatch(/core path is always on/i);
    // And it must not be inert or hidden behind the sheet: it has to be a
    // descendant of the sheet's own panel, the one part `openSheet`'s
    // `isolate()` leaves reachable.
    const sheetRoot = document.getElementById('plan-tracks-sheet');
    expect(sheetRoot?.contains(sheetStatus)).toBe(true);
    expect(sheetStatus?.closest('[inert]')).toBeNull();

    // The screen's own status line, outside the sheet, must be untouched —
    // that line is exactly what `isolate()` makes unreachable.
    const screenStatus = document.getElementById('plan-status');
    expect(screenStatus?.textContent ?? '').not.toMatch(/core path is always on/i);
  });

  it('does not swallow the next real tap after a drag that a touch never sent a click for', async () => {
    vi.useFakeTimers();
    await openSheetOn();

    const jazzChip = document.getElementById('plan-track-jazz') as HTMLButtonElement;
    expect(jazzChip.getAttribute('aria-pressed')).toBe('true');

    // A drag: press on jazz (row 1, y≈40..76), move past the threshold onto
    // blues-boogie's row (row 2, y≈80..116). Touch does not synthesise a
    // `click` after a `pointermove` — none is dispatched here, on purpose.
    jazzChip.dispatchEvent(pointer('pointerdown', 10, 58));
    jazzChip.dispatchEvent(pointer('pointermove', 10, 100));
    jazzChip.dispatchEvent(pointer('pointerup', 10, 100));

    // Nothing here yet clears the suppression flag by way of a click, since
    // none fired. Let the self-heal run.
    vi.runAllTimers();

    // A later, wholly separate, genuine tap on the same chip. The click
    // handler's own `commitOrder` + `redraw()` rebuild the sheet's rows
    // synchronously, so `jazzChip` itself is about to become a detached,
    // never-updated node — the live answer has to be read back by id.
    jazzChip.click();

    // Jazz was on; a real, unswallowed tap switches it off.
    const jazzChipAfter = document.getElementById('plan-track-jazz');
    expect(jazzChipAfter?.getAttribute('aria-pressed')).toBe('false');
  });

  it('moves the sheet rows during a drag, not just the hidden header, so the next move measures them where they now are', async () => {
    await openSheetOn();

    const jazzChip = document.getElementById('plan-track-jazz') as HTMLButtonElement;
    const jazzRowBefore = jazzChip.closest('.track-row');
    const listEl = document.getElementById('plan-tracks-list') as HTMLElement;
    expect(jazzRowBefore?.parentElement).toBe(listEl);
    expect(Array.from(listEl.children).indexOf(jazzRowBefore as Element)).toBe(1); // core, jazz, blues, classical

    // Drag jazz down past classical's row (index 3, y≈120..156).
    jazzChip.dispatchEvent(pointer('pointerdown', 10, 58));
    jazzChip.dispatchEvent(pointer('pointermove', 10, 138));

    // The chip element itself must not have been recreated — a fresh element
    // would have dropped whatever pointer capture it held mid-gesture.
    expect(document.getElementById('plan-track-jazz')).toBe(jazzChip);

    // It must have physically moved to the back of the active rows, where
    // `activeTracks` now says it belongs.
    const jazzRowAfter = jazzChip.closest('.track-row');
    expect(Array.from(listEl.children).indexOf(jazzRowAfter as Element)).toBe(3);

    // And a second move, without any further reorder, must measure jazz at
    // its *new* position rather than the stale pre-drag one — this is what a
    // caching or a header-only redraw would get wrong.
    expect(jazzChip.getBoundingClientRect().top).toBe(3 * ROW_HEIGHT);

    jazzChip.dispatchEvent(pointer('pointerup', 10, 138));
  });
});
