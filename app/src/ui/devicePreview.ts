// A miniature of the score screen, in this device's own proportions, either
// way up (docs/04 §7d).
//
// The setup tour's promise is "this is how it will look on your phone", so
// the miniature *is* the score screen at the phone's own size — its short and
// long sides, the header, the stage, the control bar and the keys strip at
// their real heights — laid out at that size and scaled down as one by a
// CSS transform to the width the card can give it. The engraver draws into
// the real-sized stage with the arrangement the real screen would use that
// way up (slots upright, a sliding chunk sideways) and is told the scale, so
// what the person sees is the layout and the size they will get, at the
// fraction of real size the caption says.

import { KeyboardStrip, type KeyView } from './KeyboardStrip';
import { KeyRibbon } from './KeyRibbon';
import { WindowRenderer, type NoteState } from '../score/WindowRenderer';
import type { ScoreModel } from '../score/types';
import { getSettings } from '../data/settingsStore';
import { stripRangeFor } from './stripRange';
import { el } from './widgets';

export type Orientation = 'upright' | 'sideways';

/** The score screen's chrome, in CSS pixels, from `style.css`. */
const HEAD_UPRIGHT_PX = 50;
const HEAD_SIDEWAYS_PX = 0; // the header row goes sideways; Back and the title ride on the bar
const BAR_PX = 60;
const STRIP_UPRIGHT_PX = 72;
const STRIP_SIDEWAYS_PX = 56;
const RIBBON_PX = 32;

/**
 * The phone the miniature stands for, in CSS pixels.
 *
 * On a phone this is the phone, which is the point: the preview shows the
 * owner their own screen. On a laptop the window is not a phone at all, and
 * taking it literally is what made the previews unreadable — a 1512 x 850
 * window is a 850 x 1512 "device" upright, and a card 320 px wide can only
 * draw that at a fifth of size, so every miniature came out tiny while the
 * same card on the phone managed twice that. A tablet did the same thing for
 * the same reason.
 *
 * So the simulated device is clamped to the range of screens this app is for.
 * Inside the range nothing changes. Outside it the miniature stands for a
 * large phone instead of for the window it happens to be running in, which is
 * both legible and a truer picture of what the owner will actually hold.
 *
 * Clamped, not replaced by one fixed size: a 412 px phone and a 342 px phone
 * should still preview differently, because they do differ.
 */
const PHONE_SHORT_PX = { min: 320, max: 430 };
const PHONE_LONG_PX = { min: 640, max: 950 };

function clamp(value: number, range: { min: number; max: number }): number {
  return Math.min(range.max, Math.max(range.min, value));
}

/** The device's sides: the window's own, held to the range of a phone. */
export function deviceSides(): { short: number; long: number } {
  const w = window.innerWidth || 360;
  const h = window.innerHeight || 780;
  const short = clamp(Math.min(w, h), PHONE_SHORT_PX);
  const long = clamp(Math.max(w, h), PHONE_LONG_PX);
  // A phone is taller than it is wide, and a clamp applied to each side on its
  // own could in principle cross them over. The long side wins, because a
  // miniature drawn wider than it is tall would be a picture of a way up the
  // owner did not choose.
  return { short: Math.min(short, long), long: Math.max(short, long) };
}

export interface DevicePreview {
  el: HTMLElement;
  /** How much of real size the miniature is drawn at, 0..1. */
  ratio: number;
  /** Engraves (again) with the settings as they are now. */
  redraw(): Promise<void>;
  dispose(): void;
}

export interface DevicePreviewOptions {
  orientation: Orientation;
  /** The width the card can give the miniature, in CSS pixels. */
  maxWidth: number;
  /** The height it can give it; the width alone bounds it when absent. */
  maxHeight?: number;
  /** The title in the miniature's header. */
  title: string;
  source: () => Promise<{ model: ScoreModel; musicXml: string }>;
}

function stripHeightFor(keys: string, upright: boolean): number {
  if (keys === 'off') return 0;
  if (keys === 'ribbon') return RIBBON_PX;
  return upright ? STRIP_UPRIGHT_PX : STRIP_SIDEWAYS_PX;
}

export function createDevicePreview(options: DevicePreviewOptions): DevicePreview {
  const { short, long } = deviceSides();
  const upright = options.orientation === 'upright';
  const deviceW = upright ? short : long;
  const deviceH = upright ? long : short;
  const byHeight = options.maxHeight !== undefined && options.maxHeight > 0 ? options.maxHeight / deviceH : 1;
  // No floor here. A miniature forced up to a legible size overflowed its
  // step — 252 px of preview in a 209 px step sideways — and a preview taller
  // than the step it is in is the fault that put the tour's footer below the
  // fold. Legibility is bought by clamping what the miniature *stands for*,
  // above, which costs the layout nothing.
  const ratio = Math.min(1, options.maxWidth / deviceW, byHeight);
  const headReal = upright ? HEAD_UPRIGHT_PX : HEAD_SIDEWAYS_PX;

  const head = el(
    'div.setup-device__head',
    {},
    el('span', { text: '← Back' }),
    el('strong', { text: options.title }),
    el('span.muted', { text: 'bar 1 / 4' }),
  );
  head.style.height = `${String(headReal)}px`;
  head.hidden = headReal === 0;
  const stage = el('div.score-view.setup-device__stage');
  const strip = el('div.score-strip.setup-device__strip');
  const bar = el(
    'div.setup-device__bar',
    {},
    ...(upright ? [] : [el('span', { text: '← Back' }), el('strong', { text: options.title })]),
    el('span.setup-device__button', { text: '▶' }),
    el('span.setup-device__button', { text: 'Hear it' }),
    el('span.setup-device__button', { text: 'Wait for me' }),
    el('span.setup-device__button', { text: 'R' }),
    el('span.setup-device__button', { text: 'L' }),
    el('span.setup-device__button.is-selected', { text: 'Both' }),
    el('span.muted', { text: '70 bpm' }),
  );
  bar.style.height = `${String(BAR_PX)}px`;

  // The screen at its real size, scaled as one into the outer box.
  const screen = el('div.setup-device__screen', {}, head, stage, bar, strip);
  screen.style.width = `${String(deviceW)}px`;
  screen.style.height = `${String(deviceH)}px`;
  screen.style.transform = `scale(${String(ratio)})`;
  const frame = el('div.setup-device', { 'data-orientation': options.orientation }, screen);
  frame.style.width = `${String(Math.round(deviceW * ratio))}px`;
  frame.style.height = `${String(Math.round(deviceH * ratio))}px`;

  const sizeStrip = (keys: string): number => {
    const real = stripHeightFor(keys, upright);
    strip.hidden = real === 0;
    strip.dataset.keys = keys;
    strip.style.height = `${String(real)}px`;
    // The stage takes what the strip gives back, as it does on the screen.
    stage.style.height = `${String(Math.max(80, deviceH - headReal - BAR_PX - real))}px`;
    return real;
  };
  sizeStrip(getSettings().keys);

  let renderer: WindowRenderer | null = null;
  let keys: KeyView | null = null;
  let building = 0;
  let disposed = false;

  async function redraw(): Promise<void> {
    const token = (building += 1);
    const source = await options.source();
    if (disposed || token !== building) return;
    const now = getSettings();
    renderer?.dispose();
    renderer = null;
    stage.replaceChildren();
    sizeStrip(now.keys);
    const next = await WindowRenderer.create({
      container: stage,
      model: source.model,
      musicXml: source.musicXml,
      barsPerWindow: now.barsPerWindow,
      zoom: now.zoom,
      layout: now.layout,
      handsFocus: 'both',
      drawFingerings: now.showFingering,
      drawChordSymbols: now.showChordSymbols,
      drawMetronomeMarks: false,
      drawLyrics: false,
      orientation: options.orientation,
      miniature: ratio,
    });
    if (disposed || token !== building) {
      next.dispose();
      return;
    }
    renderer = next;
    renderer.showStep(0);
    const states = new Map<string, NoteState>();
    for (const id of renderer.noteElements(0).keys()) states.set(id, 'current');
    renderer.setNoteStates(states);
    mountKeys(source.model);
  }

  function mountKeys(model: ScoreModel): void {
    keys?.destroy();
    keys = null;
    strip.replaceChildren();
    const now = getSettings();
    if (sizeStrip(now.keys) === 0) return;
    const midis = model.steps.flatMap((step) => step.notes.map((note) => note.midi));
    const range = stripRangeFor(midis);
    keys = now.keys === 'ribbon' ? new KeyRibbon(range) : new KeyboardStrip({ ...range, interactive: false });
    strip.append(keys.el);
    // The guide as the settings have it: the first step's keys, the second's
    // paler when two notes ahead is on, the finger numbers on the marked keys.
    const first = now.keysGuide === 'off' ? [] : (model.steps[0]?.notes.map((note) => note.midi) ?? []);
    const second = now.keysGuide === 'next-two' ? (model.steps[1]?.notes.map((note) => note.midi) ?? []) : [];
    const fingers = new Map<number, string>();
    if (now.keysFingerNumbers && now.keysGuide !== 'off') {
      for (const step of [model.steps[0], now.keysGuide === 'next-two' ? model.steps[1] : undefined]) {
        for (const note of step?.notes ?? []) {
          if (note.fingering !== undefined && !fingers.has(note.midi)) fingers.set(note.midi, String(note.fingering));
        }
      }
    }
    keys.setState({ expected: first, next: second, fingers });
    keys.fitKeysToWidth();
  }

  return {
    el: frame,
    ratio,
    redraw,
    dispose() {
      disposed = true;
      renderer?.dispose();
      keys?.destroy();
    },
  };
}

/** "at full size", or "at 41 % of real size". */
export function describeRatio(ratio: number): string {
  return ratio >= 0.95 ? 'at full size' : `at ${String(Math.round(ratio * 100))} % of real size`;
}
