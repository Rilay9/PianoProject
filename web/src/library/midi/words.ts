// What the converter decided, in sentences. Ported (2026-10-13) unchanged from the old app's
// src/data/importStore.ts (`checkSentence`, `handsSentence`) on branch claude/piano-teaching-app-bo19td.

import type { ConversionReport } from './convert.ts';

/** The self-check's answer, in the words the tool itself prints. */
/**
 * Below this share of onsets already on the grid, the file was played rather than written (2026-10-14: on ASAP,
 * every one of 235 score MIDI files had at least 0.52 of its onsets on the grid, every one of 235 recorded
 * performances at most 0.047).
 */
export const PLAYED_BELOW = 0.25;

export function checkSentence(report: ConversionReport): string {
  // A played file's notes are all in the score, so the check passes; what it cannot say is whether the bars and
  // rhythms the grid gave them are the music's. Said first, because it matters more than the check.
  const played = report.onGrid < PLAYED_BELOW
    ? `The timing looks played rather than written (only ${String(Math.round(report.onGrid * 100))}% of the notes start on the beat grid), ` +
      'so the bars and rhythms are the app’s best guess: close if it was played to a click, wrong if the tempo was free. '
    : '';
  return played + checkWithoutTiming(report);
}

function checkWithoutTiming(report: ConversionReport): string {
  if (report.passed) {
    // Said plainly when the grid moved notes: the check compares the score with the notes after they were put on
    // the grid, so "all in the score" alone would hide how far a played file's timing was changed.
    const moved = report.moved > 0
      ? `; their timing was fitted to a grid, moving a note by at most ${String(Math.round(report.moved * 100) / 100)} of a quarter note`
      : ', at the times the file gives them';
    return `Checked: all ${String(report.notesIn)} notes the reader found are in the score${moved}, and every bar adds up.${joinedSentence(report)}${pedalSentence(report)}${tidySentence(report)}`;
  }
  const trouble: string[] = [];
  if (report.lost.length > 0) trouble.push(`${String(report.lost.length)} note(s) lost`);
  if (report.added.length > 0) trouble.push(`${String(report.added.length)} note(s) added`);
  if (report.changed.length > 0) trouble.push(`${String(report.changed.length)} note(s) on the other staff or held for another length`);
  if (report.brokenBars.length > 0) {
    trouble.push(`${String(report.brokenBars.length)} bar(s) that do not add up`);
  }
  if (report.unwritable.length > 0) {
    trouble.push(`${String(report.unwritable.length)} length(s) no note can carry`);
  }
  return (
    `The score was written, but the check found ${trouble.join(', ')}. ` +
    'Read it before trusting it.' +
    joinedSentence(report) + pedalSentence(report) + tidySentence(report)
  );
}

/** Lengths the pedal or an export's gate decided: said, because the file's own lengths were changed. */
function pedalSentence(report: ConversionReport): string {
  let out = '';
  if (report.gate !== null) {
    out += ` The file plays every note for about ${String(Math.round(report.gate * 100))}% of its written length, as notation programs export; the written lengths were restored.`;
  }
  if (report.pedalled) {
    out += ` ${String(report.pedalled)} note(s) the sustain pedal held on were written as long as they sound, to the next note of their hand at most, as a score writes them.`;
  }
  if (report.pedalCut) {
    out += ` ${String(report.pedalCut)} key(s) held past the next note of their hand were written to that note, one voice a hand as the published arrangements write it (under the pedal it sounds the same).`;
  }
  return out;
}

/** Notes given their chord's length or written to the next note (tidy.ts): said, as the pedal's are. */
function tidySentence(report: ConversionReport): string {
  const n = report.tidied.chords + report.tidied.gaps;
  if (!n) return '';
  return ` ${String(n)} note(s) let go a little before the rest of their chord, or a little before the next note, were written with the chord or to that note, as a score writes them.`;
}

/** Strikes written as one with another, said, because the count above leaves them out. */
function joinedSentence(report: ConversionReport): string {
  if (report.joined === 0) return '';
  return ` ${String(report.joined)} strike(s) of a key at the same moment as another strike of it, or a hair after ` +
    '(a part doubling another, or a near-zero-length note just before), were written as one note with it.';
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
    // Parts picked from a band file (not the file's piano parts): the app put the higher on the upper staff.
    const picked = report.scoreParts.some((k) => !report.fileParts.find((p) => p.key === k)?.piano);
    if (report.noteTracks === 2 && picked) {
      parts.push(`The two parts in the score are the hands: the higher (${report.parts[0] ?? '?'}) is the upper staff, the lower (${report.parts[1] ?? '?'}) the lower.`);
    } else if (report.noteTracks === 2) {
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
