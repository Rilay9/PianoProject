# What each check does

Keep this list current (owner, 2026-10-13): when a case is added, changed or removed, or the code a check covers
changes what it means, update its line here in the same commit, so a check can't quietly test something that
no longer exists.

| Check | Run | Covers | Cases |
|---|---|---|---|
| `scoring.mjs` | `npm run check:scoring` | Play along and Rhythm judging (`src/matching.ts`), including let go early (`src/holds.ts` rules) | 16 |
| `lab-judge.mjs` | `npm run check:lab` | The accompaniment lab's chord judging (`src/lab/judge.ts`) | 23 |
| `activity.mjs` | `npm run check:activity` | Activity files (`src/activity.ts`): every file in `public/content/activities` reads; mistakes are refused with their reason | one per activity file + 18 refusals |
| `midi.mjs` | `npm run check:midi` | The MIDI → MusicXML converter (`src/library/midi/`), ported from the old app with its unit tests; parity against the old Python converter's recorded answers (`fixtures/midi/parity/`) | 117 (+ 11 old cases printed as skipped, with the reason) |
| `notes-match.mjs` | `npm run check:notes` | Every note the score screen draws, lights and names matches the file, bar by bar, for every song in `public/scores` (builds, serves on :5193) | one per song; `--corrupt` must fail |

## scoring.mjs

- On time; a fast passage where a note lands after the next is due; a press goes to the nearer written note of its
  key; the same key in both hands is one press; late, early, missed and wrong together; timing judged as heard at
  half speed.
- Rhythm: any key counts, a chord pressed together is one tap; an extra tap and a missed beat.
- Holding: a half note held 900 of 1000 ms is held; let go after 400 ms is let go early; staccato is never judged;
  at half speed the written length doubles; a late note is only late (one problem a note); a note still sounding is
  never marked; in Rhythm a tap held to the next tap is fine, and a whole note let go at once is let go early.

## lab-judge.mjs

- A chord: all four down together; a small roll held; any voicing and octave; notes short and apart are never a
  chord (also at the style step); apart is fine at "your own way"; a missing 7th; an extra key; complete only
  300 ms after the beat is late; a key still held from before doesn't count; roots step: the root alone.
- Speed: chart time vs real time at half speed (late and on time) and at 1.5×.
- Holding: held to 1600 of 2000 is right; let go at 800 is amber and said; the pedal holding it counts; one note
  let go early is enough; still sounding is not short; at the roots step the length is yours.

## activity.mjs

- Reads every listed activity file.
- Refuses: an unknown screen; a score without its piece; a setting typo; a mode that isn't one; a tempo out of
  range; bars that end before they start; Ladder without bars; a chunk size Memorise lacks; a drill level typo; a
  lab step that isn't a kind; a lab part typo; a misspelt top-level field; Memorise bars (not offered yet); a
  misspelt ladder key; a ladder step of the wrong part; a step of the other part; a step not in its ladder; a
  fraction of a card.

## midi.mjs

- Reader: onsets in quarter notes; tempo, metre and key signature from the conductor track; the one note track;
  a note left down gets a length; running status; SysEx skipped; not-MIDI and truncated files said apart; no metre
  means 4/4, said; bar and beat lengths incl. compound metres. Merge: nothing dropped, onset order, file order kept.
- Hand split: every note in one hand; the boundary moves; crossing lines kept until they meet, and the two pinned
  failures (lines swap hands at a crossing; a simultaneous crossing cut by pitch); reach; the reach penalty.
- Quantise: snapping; one grid per bar; a too-short note keeps a unit; swing detected and written straight; straight
  not called swung; two strikes of one pitch pulled apart; the furthest move reported.
- Rhythm: which lengths one note-head carries; cutting a length into rhythms loses nothing and cuts at the beat; an
  inexpressible length handed back; held notes on a triplet grid tied; no chord crosses a barline.
- Writer: note-heads, dots and triplets for a length; spelling and octave from the letter; one instrument on two
  staves, the backup, both halves of a tie, no tempo when none is stated.
- Hands: two tracks kept as recorded (`crossed-hands.mid` tells this from a split); one track split; three merged
  then split; three kept is refused; the hands sentence says which.
- Import (`two-hands.mid`, at the converter's level): title from the file name, one part on two staves, the check
  sentence, 16 notes, the tracks kept, metre and tempo read; a file with no notes and a non-MIDI file refused with a
  sentence naming the file.
- Swap (`left-hand-first.mid`): staves exchanged, clefs kept, twice gives the file back; one staff, two parts and an
  unmarked note refused. New for the library: where each answer came from; swap on request equals `swapHands`; a
  stated tempo replaces the file's, out of range refused; a swap on one staff refused and said.
- Parity with the Python converter, five files (`two-hands`, `crossed-hands`, `one-track-two-hands`, the rendered
  exercise clean and jittered): tracks, metre/tempo/key, grid per bar, swing counts, quantised events, hands, key,
  self-check, the notes read back, and the split where the reference has one.

## Browser checks

Throwaway Playwright scripts used while building (not committed; listed in the session notes with what each
checks). They are written for one change and are not kept up to date; anything worth keeping becomes a check here.
