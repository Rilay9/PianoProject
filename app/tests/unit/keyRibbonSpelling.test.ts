// @vitest-environment jsdom
/**
 * The key ribbon names a black key as the score writes it (C1 item 8; backlog
 * U44, P0, never teach wrong; T41's follow-up).
 *
 * With *Keys under the score: ribbon*, the wanted key's cell carries its name
 * over it, and that name came from `midiToNoteName`'s table of sharps — so the
 * Minuet in F, which prints E♭5, lit its cell as *D♯5*. T41 put the written
 * spelling on `ScoreNote.accidental` and the status line reads it; the ribbon
 * is the other place a learner reads a note's name. Driven here through the
 * real `ScoreSession` and the real `KeyRibbon`, and read off the cell's
 * `data-note`, which is what the CSS prints over it.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ScoreSession } from '../../src/score/ScoreSession';
import { KeyRibbon } from '../../src/ui/KeyRibbon';
import type { WindowRenderer } from '../../src/score/WindowRenderer';
import { makeModel, note } from './helpers/engineHarness';

/**
 * Bar 3 of Anh. 113 in miniature: B♭3 under D5, then E♭5, then the same key
 * written D♯5 (a chromatic neighbour, as a piece can write it a bar later).
 */
const minuet = makeModel([
  { onset: 0, notes: [note({ midi: 74 }), { ...note({ midi: 58, hand: 'L' }), accidental: 'flat' as const }] },
  { onset: 1, notes: [{ ...note({ midi: 75 }), accidental: 'flat' as const }] },
  { onset: 2, notes: [{ ...note({ midi: 75 }), accidental: 'sharp' as const }] },
  { onset: 3, notes: [note({ midi: 74 })] },
]);

function fakeRenderer(): WindowRenderer {
  return {
    stepIndex: 0,
    showStep: () => undefined,
    showNextStep: () => undefined,
    setCursorVisible: () => undefined,
    setLoopRange: () => undefined,
    visibleNoteElements: () => new Map(),
    noteElements: () => new Map(),
    setNoteStates: () => undefined,
    setBarsPerWindow: () => undefined,
    setLayout: () => undefined,
    setZoom: () => undefined,
    setHandsFocus: () => undefined,
  } as unknown as WindowRenderer;
}

const frames: FrameRequestCallback[] = [];
function flushFrame(): void {
  for (const cb of frames.splice(0)) cb(performance.now());
}

let t = 0;
function press(session: ScoreSession, midi: number): void {
  t += 100;
  session.feed(midi, 80, t);
  t += 50;
  session.feedOff(midi, t);
  flushFrame();
}

/** What the ribbon prints over a cell, where the cell is lit. */
function label(ribbon: KeyRibbon, midi: number): string | undefined {
  return ribbon.el.querySelector<HTMLElement>(`.rib[data-midi="${String(midi)}"]`)?.dataset.note;
}

function lit(ribbon: KeyRibbon, state: 'is-expected' | 'is-next'): number[] {
  return [...ribbon.el.querySelectorAll<HTMLElement>(`.rib.${state}`)].map((cell) => Number(cell.dataset.midi));
}

beforeEach(() => {
  window.requestAnimationFrame = (cb) => {
    frames.push(cb);
    return frames.length;
  };
  window.cancelAnimationFrame = () => undefined;
  frames.length = 0;
  t = 0;
});
afterEach(() => {
  document.body.replaceChildren();
});

describe('the ribbon spells from the score', () => {
  it('in a flat key, the wanted keys are named as the page writes them', () => {
    const ribbon = new KeyRibbon({ from: 55, to: 79 });
    const session = new ScoreSession({
      model: minuet,
      renderer: fakeRenderer(),
      strip: ribbon,
      stripOptions: { guide: 'next', fingers: false, flash: false },
    });
    session.start({ mode: 'wait' });
    flushFrame();
    expect(lit(ribbon, 'is-expected').sort()).toEqual([58, 74]);
    expect(label(ribbon, 58), 'the ribbon named B♭3 from a table of sharps').toBe('B♭3');
    expect(label(ribbon, 74)).toBe('D5');

    press(session, 74);
    press(session, 58);
    expect(lit(ribbon, 'is-expected')).toEqual([75]);
    expect(label(ribbon, 75), 'the ribbon named E♭5 from a table of sharps').toBe('E♭5');

    // The same key, written the other way in the next step, is named that way.
    press(session, 75);
    expect(lit(ribbon, 'is-expected')).toEqual([75]);
    expect(label(ribbon, 75)).toBe('D♯5');
    session.dispose();
  });

  it('the paler next key is spelled from its own step', () => {
    const ribbon = new KeyRibbon({ from: 55, to: 79 });
    const session = new ScoreSession({
      model: minuet,
      renderer: fakeRenderer(),
      strip: ribbon,
      stripOptions: { guide: 'next-two', fingers: false, flash: false },
    });
    session.start({ mode: 'wait' });
    flushFrame();
    expect(lit(ribbon, 'is-next')).toEqual([75]);
    expect(label(ribbon, 75)).toBe('E♭5');
    session.dispose();
  });

  it('before the run starts, the first wanted key is spelled too', () => {
    const ribbon = new KeyRibbon({ from: 55, to: 79 });
    const session = new ScoreSession({
      model: minuet,
      renderer: fakeRenderer(),
      strip: ribbon,
      stripOptions: { guide: 'next', fingers: false, flash: false },
    });
    session.previewFirst({ mode: 'wait', hands: 'L' });
    expect(lit(ribbon, 'is-expected')).toEqual([58]);
    expect(label(ribbon, 58)).toBe('B♭3');
    session.dispose();
  });
});
