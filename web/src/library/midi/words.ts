// What the converter decided, in sentences. Ported (2026-10-13) unchanged from the old app's
// src/data/importStore.ts (`checkSentence`, `handsSentence`) on branch claude/piano-teaching-app-bo19td.

import type { ConversionReport } from './convert.ts';

/** The self-check's answer, in the words the tool itself prints. */
export function checkSentence(report: ConversionReport): string {
  if (report.passed) {
    return (
      `Checked: all ${String(report.notesIn)} notes the reader found are in the score, ` +
      'and every bar adds up.'
    );
  }
  const trouble: string[] = [];
  if (report.lost.length > 0) trouble.push(`${String(report.lost.length)} note(s) lost`);
  if (report.added.length > 0) trouble.push(`${String(report.added.length)} note(s) added`);
  if (report.brokenBars.length > 0) {
    trouble.push(`${String(report.brokenBars.length)} bar(s) that do not add up`);
  }
  if (report.unwritable.length > 0) {
    trouble.push(`${String(report.unwritable.length)} length(s) no note can carry`);
  }
  return (
    `The score was written, but the check found ${trouble.join(', ')}. ` +
    'Read it before trusting it, or convert the file with a different grid on the command line.'
  );
}

/**
 * What happened to the hands, in a sentence — and it has to be the true one.
 *
 * Two note tracks are **kept as recorded**, so the sentence says so and names
 * nothing about a split; one track is split, and three or more are merged and
 * then split. Saying "merged" over a file whose hands were kept would tell him
 * the app decided something it did not, and saying "kept" over a split would
 * hide the one decision he most needs to check.
 */
export function handsSentence(report: ConversionReport): string {
  const parts: string[] = [];
  if (report.hands !== 'split into two') {
    if (report.noteTracks === 2) {
      parts.push(
        `The file’s two tracks were kept as recorded: the first (${report.parts[0] ?? '?'}) ` +
          `is the upper staff, the second (${report.parts[1] ?? '?'}) the lower. ` +
          'Which hand plays what is the arrangement’s own answer, not one the app made.',
      );
    } else {
      parts.push(`The file’s own parts were kept as recorded: ${report.parts.join(', ')}.`);
    }
    return parts.join(' ');
  }
  if (report.noteTracks > 1) {
    parts.push(
      `The ${String(report.noteTracks)} tracks with notes in them ` +
        `(${report.noteTrackNames.join(', ')}) are more than a piano’s two staves, ` +
        'so they were merged into one line first.',
    );
  }
  const right = report.handMedian.right;
  const left = report.handMedian.left;
  parts.push(
    'The hands were split by the shape of the lines rather than at a fixed middle C' +
      (right !== undefined && left !== undefined
        ? `, and the right hand’s middle note sits ${String(right - left)} semitones above the left’s.`
        : '.'),
  );
  parts.push('A crossing of the hands is where this is most often wrong — check those bars.');
  return parts.join(' ');
}
