// Tap timing calibration (owner, 2026-10-16, decided with options): the delay the browser reports for its sound
// (sound.ts heardDelayMs) may not be the whole delay (a Bluetooth headset, the touch screen's own lag), so the app could
// call accurate taps late. A short check measures it: the app plays CALIBRATION.clicks clicks at a steady tempo, you tap
// along, and the median of how far your taps come after the clicks (the first two clicks left out, while you find the
// beat) is kept for this device and this way of playing (taps on the screen, or a MIDI keyboard: their delays differ).
// When one is kept it is used instead of the browser's figure (it already holds it); see Sound.heardDelayMs.
// No DOM here, so the checks run it in Node (tests/exercise.mjs); the panel that runs it is screens/calibrate.ts.

export type TapInput = 'screen' | 'midi';
export interface Calibration { ms: number; at: string; taps: number }

/**
 * The run and its limits. 8 clicks at 80 a minute: 6 s. A run is refused when fewer than 4 of the 6 clicks counted got
 * a tap, or the taps are spread more than 120 ms (largest less smallest, after leaving out the one farthest from the
 * median: one stray tap allowed). Tapping along with a metronome, people's taps scatter by some tens of ms (in the
 * tapping literature, a standard deviation of roughly 20–50 ms at this pace), so 120 ms over five taps is a run that was
 * not steady. A median below −100 ms (taps well before the sound) or above 400 ms (more than any audio path should add)
 * is refused; beyond ±150 ms it is kept, with a note to run it again.
 */
export const CALIBRATION = { clicks: 8, bpm: 80, drop: 2, minTaps: 4, spreadMs: 120, lo: -100, hi: 400, large: 150 } as const;

export type CalibrationResult = { ok: true; ms: number; taps: number; large: boolean } | { ok: false; reason: string };
export const TRY_AGAIN = 'Try again: tap steadily with the clicks';

const median = (xs: number[]): number => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/**
 * A run judged: clicks and taps on one clock (ms). Each tap belongs to the click it follows by −150 to +600 ms (at 80 a
 * minute a beat is 750 ms, so a tap up to 400 ms late is still its own click's; a tap before the first click's window is
 * the one that started the run, or a stray, and is left out); a click's first tap counts, later ones are extra.
 */
export function judgeCalibration(clicks: number[], taps: number[]): CalibrationResult {
  const offsets: (number | null)[] = clicks.map(() => null);
  for (const t of [...taps].sort((a, b) => a - b)) {
    const k = clicks.findIndex((c) => t - c >= -150 && t - c < 600);
    if (k >= 0 && offsets[k] === null) offsets[k] = t - clicks[k];
  }
  const used = offsets.slice(CALIBRATION.drop).filter((x): x is number => x !== null);
  if (used.length < CALIBRATION.minTaps) return { ok: false, reason: `${TRY_AGAIN} (${used.length} of ${clicks.length - CALIBRATION.drop} clicks had a tap)` };
  const mid = median(used);
  const kept = used.length > 4 ? [...used].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid)).slice(0, -1) : used;
  const spread = Math.max(...kept) - Math.min(...kept);
  if (spread > CALIBRATION.spreadMs) return { ok: false, reason: `${TRY_AGAIN} (your taps were ${Math.round(spread)} ms apart from each other)` };
  const ms = Math.round(mid);
  if (ms < CALIBRATION.lo || ms > CALIBRATION.hi) return { ok: false, reason: `${TRY_AGAIN} (${ms} ms is outside what the sound's delay can be: ${CALIBRATION.lo} to +${CALIBRATION.hi} ms)` };
  return { ok: true, ms, taps: used.length, large: Math.abs(ms) > CALIBRATION.large };
}

const KEY = 'piano-web.calibration.v1';
type Stored = Partial<Record<TapInput, Calibration>> & { offered?: boolean };
function read(): Stored { try { const v = JSON.parse(localStorage.getItem(KEY) ?? '{}'); return typeof v === 'object' && v ? v : {}; } catch { return {}; } }
function write(s: Stored): void { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* this visit only */ } }

/** The kept calibration for this way of playing on this device, if any. */
export function calibrationFor(input: TapInput): Calibration | null {
  const c = read()[input];
  return c && typeof c.ms === 'number' && Number.isFinite(c.ms) ? c : null;
}
export function saveCalibration(input: TapInput, c: Calibration): void { write({ ...read(), [input]: c }); }
/** Forgets one way of playing's calibration, or both. */
export function resetCalibration(input?: TapInput): void { const s = read(); if (input) delete s[input]; else { delete s.screen; delete s.midi; } write(s); }
/** The offer on a rhythm set's first visit: made once (answered either way). */
export const calibrationOffered = (): boolean => !!read().offered;
export const markCalibrationOffered = (): void => write({ ...read(), offered: true });
