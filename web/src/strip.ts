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

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Keys played with no score to spell them (Free play): their names and the chord or interval they make, spelled
 * all in sharps or all in flats, whichever names a familiar chord or a plain interval (so B♭ D F is B♭, not a
 * chord on A♯); if both do, the one with fewer sharps and flats.
 */
export function keysChord(midis: number[]): { chord: string; names: string } {
  const keys = [...new Set(midis)].sort((a, b) => a - b);
  const options = [SHARPS, FLATS].map((table) => {
    const pitches: Pitch[] = keys.map((m) => {
      const spelled = `${table[m % 12]}${Math.floor(m / 12) - 1}`;
      return { midi: m, spelled, name: spelled.replace('#', '♯').replace(/^([A-G])b/, '$1♭'), len: 1 };
    });
    const chord = chordName(pitches);
    const odd = !chord || /augmented|diminished/.test(chord); // an interval spelled awkwardly (C to D♯)
    return { chord, names: pitches.map((p) => p.name).join(' '), odd, marks: (pitches.map((p) => p.spelled).join('').match(/[#b]/g) ?? []).length };
  });
  options.sort((a, b) => Number(a.odd) - Number(b.odd) || a.marks - b.marks);
  // A diminished 7th is the same chord in every inversion (its notes a minor 3rd apart all round), so it is named
  // from its bass, as players read it: C D♯ F♯ A is Cdim7, not D♯dim7/C.
  const chord = options[0].chord.replace(/^[A-G][#b]?dim7\/([A-G][#b]?)$/, '$1dim7');
  // Sharps and flats written as ♯ and ♭, like the note names (the chord type's own b, as in m7b5, stays).
  return { chord: chord.replace(/([A-G])#/g, '$1♯').replace(/([A-G])b/g, '$1♭'), names: options[0].names };
}

const LOWEST = 21; // A0
const HIGHEST = 108; // C8
const MIN_SPAN = 24; // two octaves: enough to see where the hand is
const FOLLOW_SPAN = 24; // following the music: two octaves (C to C) shown, keys about 28 px on a phone upright
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
  private song: { from: number; to: number } = { from: 48, to: 72 };
  private window: number | null = null; // following: the lowest key shown; null: the whole range
  private span = FOLLOW_SPAN; // following: how many keys on from the lowest (two octaves, more when the notes wanted now need it)
  private down = new Set<number>();
  private lastNotes: StepNotes | null = null;
  /**
   * Whether the keys follow the music two octaves at a time (owner, 2026-10-13: a phone upright where the keys can
   * be played by touch, so they are wide enough to tap); otherwise the song's whole range.
   */
  narrow: () => boolean = () => false;
  /**
   * The keys an activity chose for this screen (2026-10-16: a lesson step's keys, so fewer, wider keys can be tapped),
   * where the keys play (the score: Wait for me); null: the strip's own keys. The caller gives them already holding
   * every key to be played (the score: the bars and hands of the run), so they never change during a run.
   */
  chosen: () => { lo: number; hi: number } | null = () => null;
  private chosenOn = false; // the keys drawn are the chosen ones
  private wide = false; // chosen keys: the black keys wider, to be tapped (below)
  /** The octave labels (C4, C5) on the white keys; off where no note names are shown ("keys, no music"). */
  names = true;
  /** Every white key's letter on it (C, D, E… with no octave number; owner's lesson 2 spec, 2026-10-18: key names), in
   * place of the octave labels. */
  letters = false;
  /** Finger numbers on the keys (an activity's `fingers`, owner 2026-10-16): the finger for a key, or none. */
  fingers: ((midi: number) => number | undefined) | null = null;
  /** The black keys' groups of two and three outlined, with 2 and 3 above them (Free play, owner 2026-10-16: as the
   * lesson's picture marks them), each group wholly on the keys drawn. */
  groups = false;

  constructor(private readonly host: HTMLElement, private readonly keyboard: HTMLElement, private readonly line: HTMLElement) {}

  /** Shows the chosen parts; returns the strip's height so the music can sit above it. */
  setMode(mode: Under): number {
    this.host.hidden = mode === 'nothing';
    this.keyboard.hidden = mode !== 'keyboard' && mode !== 'both';
    this.line.hidden = mode !== 'notes' && mode !== 'both';
    return this.host.hidden ? 0 : this.host.offsetHeight;
  }

  /** The keys drawn now, lowest and highest. */
  get shown(): { lo: number; hi: number } { return this.window !== null ? { lo: this.window, hi: this.window + this.span } : { lo: this.song.from, hi: this.song.to }; }

  /** Builds the keys for a song (following: the two octaves of its first notes). */
  setSong(midis: number[]): void {
    this.song = keyRange(midis);
    this.window = null;
    this.span = FOLLOW_SPAN;
    this.chosenOn = this.wide = false;
    const c = this.chosen();
    if (c) { this.useChosen(c); return; }
    if (this.narrow() && this.song.to - this.song.from > FOLLOW_SPAN) this.window = this.song.from;
    this.build();
  }

  /** Exactly these keys, lowest to highest (a range an activity chose, already grown to hold its music). */
  showRange(lo: number, hi: number): void {
    this.song = { from: lo, to: hi };
    this.window = null;
    this.span = FOLLOW_SPAN;
    this.chosenOn = false;
    this.wide = true;
    this.build();
  }

  private useChosen(c: { lo: number; hi: number }): void {
    this.window = c.lo;
    this.span = c.hi - c.lo;
    this.chosenOn = this.wide = true;
    this.build();
  }

  /**
   * Following: every note wanted now stays on the keys, and the coming ones too where they fit. The two octaves start
   * on a C when the notes allow, otherwise at the lowest note wanted now (F3 and F5 together fit F3 to F5, which C to
   * C cannot hold: owner, 2026-10-15, F5 was off the keys); only notes wanted now further apart than two octaves widen
   * the keys (narrower, all tappable). The keys move only when what is wanted leaves them.
   */
  follow(now: number[], next: number[] = []): void {
    const c = this.chosen();
    if (c) {
      // Fixed: only drawn again when the range itself changed (other bars, hands or screen), never by the notes.
      if (!this.chosenOn || c.lo !== this.window || c.hi - c.lo !== this.span) { this.useChosen(c); if (this.lastNotes) this.show(this.lastNotes); }
      return;
    }
    if (this.chosenOn) { // (no longer chosen: Wait for me left, say) back to the strip's own keys
      this.chosenOn = this.wide = false;
      this.window = null;
      this.span = FOLLOW_SPAN;
      this.build();
      if (this.lastNotes) this.show(this.lastNotes);
    }
    const narrow = this.narrow() && this.song.to - this.song.from > FOLLOW_SPAN;
    if (!narrow) { if (this.window !== null) { this.window = null; this.span = FOLLOW_SPAN; this.build(); } return; }
    const need = now.length ? now : next;
    if (!need.length) return;
    const all = [...need, ...(now.length ? next : [])];
    let lo = Math.min(...all), hi = Math.max(...all);
    if (hi - lo > FOLLOW_SPAN) { lo = Math.min(...need); hi = Math.max(...need); } // the coming notes don't fit too: what is wanted now
    if (this.window !== null && lo >= this.window && hi <= this.window + this.span) return;
    let span = Math.max(FOLLOW_SPAN, hi - lo);
    let from = octaveFloor(lo);
    if (hi > from + span) from = isBlack(lo) ? lo - 1 : lo;
    if (hi > from + span) span = hi - from;
    if (isBlack(from + span)) span++; // (never a black key at the top edge)
    from = Math.max(this.song.from, Math.min(this.song.to - span, from));
    if (from === this.window && span === this.span) return;
    this.window = from;
    this.span = span;
    this.build();
    if (this.lastNotes) this.show(this.lastNotes);
  }

  private build(): void {
    const from = this.window ?? this.song.from, to = this.window !== null ? this.window + this.span : this.song.to;
    this.keys.clear();
    this.lit = [];
    const whites = document.createElement('div');
    whites.className = 'keys';
    let whiteCount = 0;
    for (let m = from; m <= to; m++) if (!isBlack(m)) whiteCount++;
    let w = 0;
    const at = new Map<number, number>(); // a black key: the white keys before it
    for (let m = from; m <= to; m++) {
      const key = document.createElement('div');
      if (isBlack(m)) {
        key.className = 'key black';
        key.style.left = `calc(${(w / whiteCount) * 100}% - var(--black-w) / 2)`;
        at.set(m, w);
      } else {
        key.className = 'key white';
        if (this.letters) key.append(Object.assign(document.createElement('span'), { className: 'letter', textContent: 'C D EF G A B'[m % 12] }));
        else if (m % 12 === 0 && this.names) key.textContent = `C${m / 12 - 1}`; // the octave labels a learner counts by
        w++;
      }
      const finger = this.fingers?.(m);
      if (finger !== undefined) key.append(Object.assign(document.createElement('span'), { className: 'finger', textContent: String(finger) }));
      key.dataset.midi = String(m);
      whites.append(key);
      this.keys.set(m, key);
    }
    // The groups: C♯ D♯ (two) and F♯ G♯ A♯ (three), each outlined from its first black key to its last.
    if (this.groups) {
      for (let c = from - (((from % 12) + 12) % 12); c <= to; c += 12) {
        for (const [cls, n, ks] of [['two', '2', [1, 3]], ['three', '3', [6, 8, 10]]] as const) {
          const keys = ks.map((k) => c + k);
          if (!keys.every((k) => at.has(k))) continue;
          const a = at.get(keys[0])!, b = at.get(keys[keys.length - 1])!;
          const g = Object.assign(document.createElement('div'), { className: `key-group ${cls}` });
          g.style.left = `calc(${(a / whiteCount) * 100}% - var(--black-w) / 2 - 4px)`;
          g.style.width = `calc(${((b - a) / whiteCount) * 100}% + var(--black-w) + 8px)`;
          g.append(Object.assign(document.createElement('span'), { textContent: n }));
          g.setAttribute('aria-hidden', 'true');
          whites.append(g);
        }
      }
    }
    this.keyboard.replaceChildren(whites);
    // Black keys about 0.6 of a white key wide (the old app's 16 px on 26 px), whatever the range. Chosen keys (a lesson
    // step's, to be tapped: 2026-10-16) make them at least 30 px where the white keys allow, up to 0.85 of a white key:
    // C4–E5 upright on a 360 px phone has white keys about 36 px, whose 0.6 is 21 px; the lesson plan asks for about 30
    // px, and 0.85 still leaves a white key's top showing between two black keys.
    this.keyboard.style.setProperty('--black-w', this.wide ? `max(${60 / whiteCount}%, min(30px, ${85 / whiteCount}%))` : `${60 / whiteCount}%`);
    this.setPressed(this.down);
  }

  /** Marks these keys with a class (exercises: lit, wrong, wanted), clearing it from all others. */
  markKeys(cls: string, midis: number[]): void {
    for (const [midi, key] of this.keys) key.classList.toggle(cls, midis.includes(midi));
  }

  /** Shows the keys being pressed on the MIDI keyboard. */
  setPressed(down: Set<number>): void {
    this.down = new Set(down);
    for (const [midi, key] of this.keys) key.classList.toggle('pressed', down.has(midi));
  }

  /** Lights the keys and writes the names for where the marker is. */
  /** Follows the notes shown last again: the keys became playable (Wait for me chosen) after the music was drawn. */
  refollow(): void {
    if (this.lastNotes) this.follow(this.lastNotes.now.flat().map((p) => p.midi), this.lastNotes.next.flat().map((p) => p.midi));
  }

  show(notes: StepNotes): void {
    this.lastNotes = notes;
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
    // (no note names where an activity hides them until taught: owner, 2026-10-16)
    const names = (ps: Pitch[]) => (this.names ? [...ps].sort((a, b) => a.midi - b.midi).map((p) => p.name).join(' ') : '');
    const left = notes.now.slice(1).flat();
    const chord = this.names ? notes.fileChord || chordName(notes.now.flat()) : '';
    this.line.replaceChildren(
      Object.assign(document.createElement('span'), { className: 'left', textContent: names(left) }),
      Object.assign(document.createElement('span'), { className: 'chord', textContent: chord }),
      Object.assign(document.createElement('span'), { className: 'right', textContent: names(notes.now[0] ?? []) }),
    );
  }
}
