// @vitest-environment jsdom
/**
 * The lab's verdict lines do not outlive the jam they describe (`04` §3c).
 *
 * From the 2026-09-22 review: `stopJam` cleared `passNotes` and hid
 * `tradeLine` — the line saying whose bars these are — and left
 * `bedVerdict.textContent` and `bedBars` standing. `redraw()` stops a running
 * jam whenever a picker moves, so *Time round 3 · 6 of 9 in the blues scale*
 * survived the settings change that invalidated it, over a chart that had
 * just been redrawn from different chords. The trade's own verdict is the
 * same element class one line up and had the same fault; both are cleared
 * here, and the second is why this file says *lines* and names them.
 *
 * The screen is mounted rather than read as text: the verdicts are cleared by
 * `stopJam`, which is what the *Stop* button calls and what `redraw()` calls
 * for a picker. A jam cannot be started in jsdom — it wants an AudioContext,
 * a metronome and a kit — so the button is the door to the same function, and
 * what a running jam would have written is put on the elements first.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LabScreen } from '../../src/ui/screens/LabScreen';
import type { Router } from '../../src/router';

function mount(): HTMLElement {
  const router = {
    route: { tab: 'library', lab: true },
    navigate: vi.fn(),
    navigateScore: vi.fn(),
    navigateLesson: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
  } as unknown as Router;
  const section = LabScreen(router);
  document.body.append(section);
  return section;
}

describe('stopping a jam takes its verdicts with it', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('clears the time-round verdict, which the settings that produced it have moved on from', () => {
    const section = mount();
    const verdict = section.querySelector('#lab-bed-verdict') as HTMLElement;
    verdict.textContent = 'Time round 3 · 6 of 9 in the blues scale';
    (section.querySelector('#lab-jam-stop') as HTMLElement).click();
    expect(verdict.textContent).toBe('');
  });

  it('clears the trade verdict beside it, and its data attribute with it', () => {
    const section = mount();
    const verdict = section.querySelector('#lab-trade-verdict') as HTMLElement;
    verdict.textContent = 'In on your own bars · 5 of 7 in the blues scale';
    verdict.dataset.cameIn = 'true';
    (section.querySelector('#lab-jam-stop') as HTMLElement).click();
    expect(verdict.textContent).toBe('');
    expect(verdict.dataset.cameIn).toBe('');
  });

  it('still hides the trade line, which was already right', () => {
    const section = mount();
    const line = section.querySelector('#lab-trade') as HTMLElement;
    line.hidden = false;
    (section.querySelector('#lab-jam-stop') as HTMLElement).click();
    expect(line.hidden).toBe(true);
  });
});
