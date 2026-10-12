// The strip under the music (owner, 2026-10-11): an on-screen keyboard, the notes' names, both, or nothing.
// - Keyboard: the keys the song uses, rounded out to whole octaves and at least two (as the old app did, so a
//   piece in one octave gets keys a finger can find); keys sounding now lit strongly and the next notes paler,
//   the right hand (top staff) blue and the left hand (bottom staff) green.
// - Note names: one line, the left hand's notes on the left, the right hand's on the right, and between them the
//   chord (owner, 2026-10-11): the file's chord symbol when it has one, otherwise what the sounding notes make.
// Like the old app's strip, the keys are built once per song and only their classes change as the marker moves.

import { Chord, Interval } from 'tonal';
import type { Pitch, StepNotes } from './follow';
import type { Under } from './settings';

const pitchClass = (spelled: string) => spelled.replace(/-?\d+$/, '');
const QUALITY: Record<string, string> = { M: 'major', m: 'minor', P: 'perfect', A: 'augmented', d: 'diminished', AA: 'doubly augmented', dd: 'doubly diminished' };
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;

/**
 * The chord types named (owner, 2026-10-11: familiar ones only; Tonal's rare types have symbols like "F#4" for a
 * chord in fourths, which reads as a note). Tonal's own symbols for them.
 */
const COMMON = new Set(['M', 'm', 'dim', 'aug', '6', 'm6', '7', 'maj7', 'm7', 'm7b5', 'dim7', 'mMaj7', 'sus4', 'sus2',
  '7sus4', 'add9', 'madd9', '9', 'maj9', 'm9', '11', 'm11', '13', 'maj13', 'm13']);

/**
 * What the sounding notes make, using Tonal's chord dictionary: for three or more different notes every familiar
 * chord name that fits (owner: show them all), kept only when the chord's own spelling is the written notes (so
 * C E G is C major, never "Em#5/C", which would need a B#); for two different notes the interval between them,
 * within an octave (owner: C3 to E5 is a major 3rd).
 */
export function chordName(pitches: Pitch[]): string {
  const sorted = [...pitches].sort((a, b) => a.midi - b.midi);
  const classes = [...new Set(sorted.map((p) => pitchClass(p.spelled)))]; // lowest first: the bass
  if (classes.length >= 3) {
    const written = [...classes].sort().join(' ');
    const fits = Chord.detect(classes).filter((name) => {
      const c = Chord.get(name);
      return c.aliases.some((a) => COMMON.has(a)) && [...new Set(c.notes)].sort().join(' ') === written;
    });
    // A major chord reads as its letter (C, Cadd9; not Tonal's CM, CMadd9), as learners see it written.
    return fits.map((name) => name.replace(/^([A-G](?:#|b)*)M(add9|\/|$)/, '$1$2')).join(' / ');
  }
  if (classes.length === 2) {
    const low = sorted[0], high = sorted.find((p) => pitchClass(p.spelled) !== pitchClass(low.spelled))!;
    const i = Interval.get(Interval.distance(low.spelled, high.spelled));
    return i.empty ? '' : `${QUALITY[i.q] ?? i.q} ${ordinal(i.simple)}`;
  }
  return '';
}

const LOWEST = 21; // A0
const HIGHEST = 108; // C8
const MIN_SPAN = 24; // two octaves: enough to see where the hand is
const isBlack = (midi: number) => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
const octaveFloor = (midi: number) => midi - (((midi % 12) + 12) % 12);

/** The range to draw: whole octaves around the song's notes, widened to two octaves, kept on a real piano. */
export function keyRange(midis: number[]): { from: number; to: number } {
  if (!midis.length) return { from: 48, to: 72 };
  let from = octaveFloor(Math.min(...midis));
  let to = octaveFloor(Math.max(...midis)) + 12; // the C above the top note, so it is never the last key
  while (to - from < MIN_SPAN && (from > LOWEST || to < HIGHEST)) {
    if (to < HIGHEST) to += 12;
    if (to - from < MIN_SPAN && from > LOWEST) from -= 12;
  }
  return { from: Math.max(LOWEST, from), to: Math.min(HIGHEST, to) };
}

export class UnderStrip {
  private keys = new Map<number, HTMLDivElement>();
  private lit: HTMLDivElement[] = [];

  constructor(private readonly host: HTMLElement, private readonly keyboard: HTMLElement, private readonly line: HTMLElement) {}

  /** Shows the chosen parts; returns the strip's height so the music can sit above it. */
  setMode(mode: Under): number {
    this.host.hidden = mode === 'nothing';
    this.keyboard.hidden = mode !== 'keyboard' && mode !== 'both';
    this.line.hidden = mode !== 'notes' && mode !== 'both';
    return this.host.hidden ? 0 : this.host.offsetHeight;
  }

  /** Builds the keys for a song. */
  setSong(midis: number[]): void {
    const { from, to } = keyRange(midis);
    this.keys.clear();
    this.lit = [];
    const whites = document.createElement('div');
    whites.className = 'keys';
    let whiteCount = 0;
    for (let m = from; m <= to; m++) if (!isBlack(m)) whiteCount++;
    let w = 0;
    for (let m = from; m <= to; m++) {
      const key = document.createElement('div');
      if (isBlack(m)) {
        key.className = 'key black';
        key.style.left = `calc(${(w / whiteCount) * 100}% - var(--black-w) / 2)`;
      } else {
        key.className = 'key white';
        if (m % 12 === 0) key.textContent = `C${m / 12 - 1}`; // the octave labels a learner counts by
        w++;
      }
      whites.append(key);
      this.keys.set(m, key);
    }
    this.keyboard.replaceChildren(whites);
    // Black keys about 0.6 of a white key wide (the old app's 16 px on 26 px), whatever the range.
    this.keyboard.style.setProperty('--black-w', `${60 / whiteCount}%`);
  }

  /** Shows the keys being pressed on the MIDI keyboard. */
  setPressed(down: Set<number>): void {
    for (const [midi, key] of this.keys) key.classList.toggle('pressed', down.has(midi));
  }

  /** Lights the keys and writes the names for where the marker is. */
  show(notes: StepNotes): void {
    for (const k of this.lit) k.classList.remove('now-r', 'now-l', 'next-r', 'next-l');
    this.lit = [];
    const light = (pitches: Pitch[], cls: string) => {
      for (const p of pitches) {
        const k = this.keys.get(p.midi);
        if (k && !this.lit.includes(k)) { k.classList.add(cls); this.lit.push(k); }
      }
    };
    // Now first: a key both sounding now and coming next shows as now.
    notes.now.forEach((ps, staff) => light(ps, staff === 0 ? 'now-r' : 'now-l'));
    notes.next.forEach((ps, staff) => light(ps, staff === 0 ? 'next-r' : 'next-l'));
    const names = (ps: Pitch[]) => [...ps].sort((a, b) => a.midi - b.midi).map((p) => p.name).join(' ');
    const left = notes.now.slice(1).flat();
    const chord = notes.fileChord || chordName(notes.now.flat());
    this.line.replaceChildren(
      Object.assign(document.createElement('span'), { className: 'left', textContent: names(left) }),
      Object.assign(document.createElement('span'), { className: 'chord', textContent: chord }),
      Object.assign(document.createElement('span'), { className: 'right', textContent: names(notes.now[0] ?? []) }),
    );
  }
}
