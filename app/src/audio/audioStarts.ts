/**
 * Counts each sound handed to the audio clock, for the end-to-end tests (U67).
 *
 * The Score screen's `Hear it` was silent after a reload, and nothing a test
 * could read said so: the session had been built before the first tap with no
 * audio context, the cursor moved, and a test that watched the cursor passed.
 * So the count is taken where a sound is actually scheduled: `Piano.start` with
 * its samples loaded, and the metronome's click. A test can then tell a
 * demonstration that sounds from one that only moves.
 *
 * It writes only into `window.__pianopath.audioStarts` (`app/testHooks`), and
 * does nothing where the hooks are not installed (the unit tests, any page that
 * never ran `installTestHooks`). Nothing in the app reads it.
 */
export type AudioStartSource = 'piano' | 'metronome';

export function countAudioStart(source: AudioStartSource): void {
  const hooks = (globalThis as { __pianopath?: { audioStarts?: Record<AudioStartSource, number> } })
    .__pianopath;
  const counts = hooks?.audioStarts;
  if (counts) counts[source] += 1;
}
