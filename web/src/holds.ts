// How long each key sounded (owner, 2026-10-13: rhythm is also holding a note its length). One record for every input:
// the MIDI keyboard's keys and its sustain pedal (main.ts) and the screen's keys (exercise/keys.ts; the score's strip
// goes through main.ts too). A key let go while the pedal is down still sounds until the pedal comes up, or until the
// same key is struck again. Times are performance.now() ms, as KeyEvent.time.
//
// The rule the modes use: a written note is "let go early" when it sounded less than HOLD_SHARE of its written length
// (at the speed played); notes marked staccato (and the like) are meant short and are never asked to be held.

/** The share of a note's written length it must sound for (a little short is normal playing). */
export const HOLD_SHARE = 0.75;
/**
 * A note at a phrase end (followed by a written rest, or ending a slur) is often shortened on purpose: it needs only
 * this share (owner, 2026-10-13). Given to the judges as a shorter length: written × PHRASE_END_SHARE / HOLD_SHARE.
 */
export const PHRASE_END_SHARE = 0.5;
export const phraseEndLength = (writtenMs: number) => (writtenMs * PHRASE_END_SHARE) / HOLD_SHARE;

interface Sounded { midi: number; down: number; up?: number; end?: number }
const KEEP = 4000; // presses remembered (minutes of playing); older ones are dropped

class Holds {
  private log: Sounded[] = [];
  private pedal = false;

  /** A key went down or up. */
  key(midi: number, on: boolean, time: number): void {
    if (on) {
      // The same key struck again ends its earlier sound (held or sustained).
      for (let i = this.log.length - 1; i >= 0 && i >= this.log.length - 64; i--) {
        const s = this.log[i];
        if (s.midi === midi && s.end === undefined) { s.up ??= time; s.end = time; }
      }
      this.log.push({ midi, down: time });
      if (this.log.length > KEEP) this.log.splice(0, this.log.length - KEEP);
      return;
    }
    const s = this.open(midi);
    if (!s) return;
    s.up = time;
    if (!this.pedal) s.end = time;
  }

  /** The sustain pedal went down or up (up: every key already let go stops sounding). */
  sustain(down: boolean, time: number): void {
    this.pedal = down;
    if (down) return;
    for (const s of this.log) if (s.up !== undefined && s.end === undefined) s.end = time;
  }

  /**
   * How long the press of `midi` at `at` sounded, in ms. Still sounding, or unknown (no such press recorded):
   * Infinity, so nothing is marked on a guess (a mode judges a note once its time to be held is past).
   */
  heldFor(midi: number, at: number): number {
    let best: Sounded | undefined;
    for (let i = this.log.length - 1; i >= 0; i--) {
      const s = this.log[i];
      if (s.midi !== midi) continue;
      if (Math.abs(s.down - at) <= 20) { best = s; break; } // the very press (its own time, or nearly)
      if (s.down < at - 1000) break;
    }
    if (!best) return Infinity;
    return best.end === undefined ? Infinity : best.end - best.down;
  }

  private open(midi: number): Sounded | undefined {
    for (let i = this.log.length - 1; i >= 0; i--) if (this.log[i].midi === midi && this.log[i].up === undefined) return this.log[i];
    return undefined;
  }
}

export const holds = new Holds();

/** Whether a note sounded long enough: held ms (real) against its written length (ms at speed 1) at the speed played. 0 length: not asked. */
export function letGoEarly(heldMs: number, writtenMs: number, speed: number): boolean {
  return writtenMs > 0 && heldMs < (HOLD_SHARE * writtenMs) / speed;
}
