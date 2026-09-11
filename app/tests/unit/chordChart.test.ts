// @vitest-environment jsdom
/**
 * The chord chart's beat handler (`docs/handoff-2026-09-09.md`, this round).
 *
 * `onBeat` decided "a new bar started" by comparing the bar index it derived
 * from `beat.bar` against the one already drawn. That comparison is false on
 * the very first beat of *every* run — bar 1 beat 1 derives to index 0, which
 * is what `bar` is initialised to — so the first bar of every chord-chart
 * performance played with no comp, no fresh match and no backing loop; only
 * bar 2 onwards ever comped. A one-bar chart (a vamp, a single held chord)
 * never recovers from that at all: the derived index is 0 on *every* beat, so
 * nothing after the initial draw ever ran again and the chorus counter never
 * moved no matter how many times the loop went round.
 *
 * `barAt` now derives the chorus from `beat.bar` directly instead of
 * incrementing on a "wrapped to 0" guess, and a `barStarted` flag makes sure
 * the very first beat is never mistaken for "nothing changed".
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';

const { playChordSpy, metronomeState } = vi.hoisted(() => ({
  playChordSpy: vi.fn(),
  metronomeState: { listeners: [] as ((beat: unknown) => void)[] },
}));

vi.mock('../../src/app/services', () => ({
  audioEngine: {
    ensureStarted: () => Promise.resolve({ currentTime: 0 }),
    masterGain: null,
    contextOrNull: null,
  },
  getPiano: () => Promise.resolve({ playChord: playChordSpy }),
  screenKeyboardSource: { onNote: () => () => undefined },
  webMidiSource: { onNote: () => () => undefined },
}));

vi.mock('../../src/audio/Metronome', () => ({
  Metronome: class {
    onTick(cb: (beat: unknown) => void): () => void {
      metronomeState.listeners.push(cb);
      return () => {
        metronomeState.listeners = metronomeState.listeners.filter((l) => l !== cb);
      };
    }
    setBpm(): void {}
    setBeatsPerBar(): void {}
    setCountInBars(): void {}
    setVolume(): void {}
    setSound(): void {}
    start(): void {}
    stop(): void {}
    dispose(): void {}
  },
}));

vi.mock('../../src/audio/backingLoop', () => ({
  DrumKit: class {
    setVolume(): void {}
    play(): void {}
    dispose(): void {}
  },
  barSchedule: () => [],
}));

vi.mock('../../src/data/midiSettings', () => ({
  getMidiSettings: () => ({ metronomeVolume: 0.5, pianoVolume: 0.8, pinnedInputId: null }),
}));

vi.mock('../../src/data/settingsStore', () => ({
  getSettings: () => ({ countInBars: 0, metronomeSound: 'wood', requireTwoSongs: false }),
}));

let currentXml = '';
vi.mock('../../src/data/importStore', () => ({
  getImport: () => Promise.resolve({ data: currentXml }),
}));

let currentTempoBpm: number | undefined;
vi.mock('../../src/curriculum/load', () => ({
  contentUrl: (path: string) => path,
  findItem: () =>
    Promise.resolve({
      id: 'demo',
      title: 'Demo chart',
      imported: true,
      file: null,
      concepts: [],
      tempoBpm: currentTempoBpm,
    }),
}));

const { ChordChartScreen } = await import('../../src/ui/screens/ChordChartScreen');

const router = { navigate: vi.fn(), navigateScore: vi.fn() } as unknown as Router;

function measure(number: number, root: string): string {
  return `<measure number="${String(number)}"><harmony><root><root-step>${root}</root-step></root><kind>major</kind></harmony></measure>`;
}

async function mountAndStart(xml: string): Promise<HTMLElement> {
  currentXml = xml;
  const section = ChordChartScreen(router, 'demo');
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelector<HTMLButtonElement>('#chart-start')).toBeTruthy();
  });
  section.querySelector<HTMLButtonElement>('#chart-comp')?.click();
  section.querySelector<HTMLButtonElement>('#chart-start')?.click();
  await vi.waitFor(() => {
    expect(metronomeState.listeners.length).toBeGreaterThan(0);
  });
  return section;
}

function fireBeat(bar: number): void {
  const beat = { bar, beatInBar: 1, isCountIn: false, isAccent: true, index: 0, timeSec: 0 };
  for (const listener of [...metronomeState.listeners]) listener(beat);
}

describe('the chord chart comps and advances on the very first bar', () => {
  beforeEach(() => {
    metronomeState.listeners = [];
    playChordSpy.mockClear();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('comps bar 1 as soon as it starts, not only from bar 2 onward', async () => {
    const xml = `<score-partwise><part id="P1">${measure(1, 'C')}${measure(2, 'G')}</part></score-partwise>`;
    await mountAndStart(xml);

    fireBeat(1);
    await vi.waitFor(() => {
      expect(playChordSpy, 'the first bar of every performance must comp, not stay silent').toHaveBeenCalledTimes(
        1,
      );
    });
    // C major, root pitch class 0, in the comp octave: 48, 52, 55.
    expect(playChordSpy.mock.calls[0]?.[0]).toEqual([48, 52, 55]);

    fireBeat(2);
    await vi.waitFor(() => {
      expect(playChordSpy).toHaveBeenCalledTimes(2);
    });
    // G major, root pitch class 7: 55, 59, 50 (mod-12 wrapped into the octave).
    expect(playChordSpy.mock.calls[1]?.[0]).toEqual([55, 59, 50]);
  });

  it('a one-bar chart still advances the chorus and comps every time round', async () => {
    const xml = `<score-partwise><part id="P1">${measure(1, 'C')}</part></score-partwise>`;
    const section = await mountAndStart(xml);

    fireBeat(1);
    await vi.waitFor(() => expect(playChordSpy).toHaveBeenCalledTimes(1));
    expect(section.querySelector('#chart-form')?.textContent).toContain('chorus 1');

    // Bar 2 of a one-bar chart is chorus 2, bar index 0 again — the exact
    // case that never re-fired before, because the derived bar index (0)
    // never differed from the one already drawn.
    fireBeat(2);
    await vi.waitFor(() => {
      expect(playChordSpy, 'a one-bar loop never comped again after the first bar').toHaveBeenCalledTimes(2);
    });
    expect(section.querySelector('#chart-form')?.textContent).toContain('chorus 2');

    fireBeat(3);
    await vi.waitFor(() => expect(playChordSpy).toHaveBeenCalledTimes(3));
    expect(section.querySelector('#chart-form')?.textContent).toContain('chorus 3');
  });
});

describe("a catalog tempo outside the bpm field's own 40-240 range", () => {
  afterEach(() => {
    document.body.replaceChildren();
    currentTempoBpm = undefined;
  });

  /**
   * The catalog holds real pieces from 31 bpm up to 264 — both outside the
   * `#chart-bpm` field's declared `min="40" max="240"`, the same bounds a
   * manual edit is clamped to. Loading a chart used to set the field straight
   * from `item.tempoBpm` with no clamp at all, so the field disagreed with its
   * own `min`/`max` before anyone had touched it.
   */
  it.each([
    [264, '240'],
    [31, '40'],
  ])('clamps a catalog tempo of %d to %s, same as a manual edit would be', async (tempoBpm, expected) => {
    currentTempoBpm = tempoBpm;
    const xml = `<score-partwise><part id="P1">${measure(1, 'C')}</part></score-partwise>`;
    currentXml = xml;
    const section = ChordChartScreen(router, 'demo');
    document.body.replaceChildren(section);
    await vi.waitFor(() => {
      expect(section.querySelector<HTMLInputElement>('#chart-bpm')?.value).toBe(expected);
    });
  });
});
