# What each check does

Keep this list current (owner, 2026-10-13): when a case is added, changed or removed, or the code a check covers
changes what it means, update its line here in the same commit, so a check can't quietly test something that
no longer exists.

| Check | Run | Covers | Cases |
|---|---|---|---|
| `scoring.mjs` | `npm run check:scoring` | Play along and Rhythm judging (`src/matching.ts`), including let go early (`src/holds.ts` rules); every count compared, and where named which notes are painted and which presses are wrong (2026-10-14) | 17 (16 judging cases and the pedal-holds block) |
| `lab-judge.mjs` | `npm run check:lab` | The accompaniment lab's chord judging (`src/lab/judge.ts`), the sentence the learner reads after a red chord (`sayHit`), the Roots step with other chord notes and outside keys, and improvising's notes from the lab's own guides (2026-10-14) | 32 |
| `activity.mjs` | `npm run check:activity` | Activity files (`src/activity.ts`): every file in `public/content/activities` reads and is in its index; the piece, set or chart each names exists and its bars are inside the piece; what one of each kind reads to; mistakes are refused with their reason (2026-10-14: index, names, read results, four more refusals) | 40 today (the count is printed) |
| `midi.mjs` | `npm run check:midi` | The MIDI → MusicXML converter (`src/library/midi/`), ported from the old app with its unit tests; parity against the old Python converter's recorded answers (`fixtures/midi/parity/`); bars from every time signature, the file's keys, played files told apart, and where every note lands read by the check's own parser, voices, swing, drums, repeated strikes and lengths (2026-10-14), a band file's parts and picking them (2026-10-15) | 164 (+ 6 old cases and 4 parity hand splits not applicable, printed as skipped with the reason) |
| `pdf.mjs` | `npm run check:pdf` | The PDF reader's modules (`src/pdf/`): finding the lines (systems) on a page, reworked 2026-10-14; cuts, page cache, detection order (ported from the old app); six generated PDF pages, a page stored as JPEG 2000 (`fixtures/pdf/jpx.pdf`, made by `make-jpx-pdf.py`) and the old fixture through pdf.js's Node build with its JPEG 2000 decoder (fails if its canvas library cannot load); adding and removing a line keeps the other lines' splits (2026-10-14) | 54 (+ 7 old screen cases printed as skipped, with the reason) |
| `notes-match.mjs` | `npm run check:notes` | The pitches the score screen draws in each bar (spelled, sorted) are the file's, for every song in `public/scores`, and for the three committed MIDI fixtures as the app converts them; not where in the bar, how long, or which staff; every run also changes one note in the app's copy of the first song and must catch it (builds, serves on :5193, refuses if the port already answers; `PIANO_CHROMIUM` names a browser when Playwright's own is not installed) | one per song + 3 converted + the caught change; `--corrupt` must fail |
| `browser.mjs` | `npm run check:browser` | In the built app at phone size: backups (every file in the zip, a missing file named, an unreadable library refused), a slow PDF open overtaken, the Adjust handles by keyboard, a band file imported and played (the sheet's Band row, the panel's band, each part handed its notes as the song's clock reaches them, none when switched off; a band file with no piano part: the guessed parts, ticking others converts again, the choice kept with the piece and its band played), a split placed by hand kept through + line, the lengths the judges are given (staccato, a slur end, a note before a rest) as the score screen decides them, + Add tapped twice, the catalogue asked for again, a Memorise start from a visit that was left (builds, serves on :5194; `--url` checks a build served elsewhere; `PIANO_CHROMIUM` as for check:notes) | 27 |
| `wake.mjs` | `npm run check:wake` | The screen wake lock (`src/wake.ts`): a lock granted after you left is let go; one request at a time | 4 |
| `practice.mjs` | `npm run check:practice` | The Play along judge (`src/practice.ts`) around a mash: none of its keys counted as wrong keys, a right note inside it still counted | 4 |

`midi.mjs` and `pdf.mjs` run under one small describe / it / expect (`tests/shim.mjs`; it was copied into both, 2026-10-14).

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
- Also: improvising counts every chord change, played at and landed; 6/8 is counted in two beats; a slash chord is
  refused.
- The sentence after a red chord (2026-10-14): an extra key named from the chord's key signature (C7 + E♭, Cm + A♭,
  Am + B♭, Gm + E♭, E + D♯, D + C♯).

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
  means 4/4, said; bar and beat lengths incl. compound metres; a re-strike sent before the last note-off at one
  tick, running status across a meta event, a release paired with its own channel, and the tempo in force at the
  start rather than the first in file order (2026-10-14: the first three lost or cut notes silently before). Merge: nothing dropped, onset order, file order kept.
- Hand split: every note in one hand; the boundary moves; crossing lines kept until they meet, and the two pinned
  failures (lines swap hands at a crossing; a simultaneous crossing cut by pitch); reach; the reach penalty.
- Quantise: snapping; one grid per bar; a too-short note keeps a unit; swing detected and written straight; straight
  not called swung; two strikes of one pitch pulled apart on a finer grid; a run of one key faster than the grid
  written as the run, not crept forward (Op. 78: it came out twice as long); a strike a hair before another of its
  key joined and said; a strike rounded onto the barline not pushed past the next bar's; a unison between kept
  tracks kept on both, a doubled part joined; a note rounded onto the barline given the new bar's grid; the
  furthest move reported, measured after all of it (2026-10-14; these fail on the converter before the fix).
- Rhythm: which lengths one note-head carries, exactly the writer's (a breve to a 64th; a longa used to pass); cutting
  a length into rhythms loses nothing and cuts at the beat; a long note cut into heads; a length between two grids
  cut into the fewest heads; an inexpressible length handed back; held notes on a triplet grid tied; no chord crosses a barline.
- Writer: note-heads, dots and triplets for a length; spelling and octave from the letter; one instrument on two
  staves, the backup, both halves of a tie, no tempo when none is stated.
- Hands: two tracks kept as recorded (`crossed-hands.mid` tells this from a split); one track split; three merged
  then split; three kept is refused; the hands sentence says which.
- Triplets (2026-10-14): every triplet note of a converted file lies inside a marked group (`<tuplet>` start and
  stop), which is what OSMD draws the "3" from; it grouped none before (checked with OSMD 2.2.0's reader in a
  cloud session, not drawn).
- Import (`two-hands.mid`, at the converter's level): title from the file name, one part on two staves, the check
  sentence, 16 notes, the tracks kept, metre and tempo read; a file with no notes and a non-MIDI file refused with a
  sentence naming the file.
- Swap (`left-hand-first.mid`): staves exchanged, clefs kept, twice gives the file back; one staff, two parts and an
  unmarked note refused. New for the library: where each answer came from; swap on request equals `swapHands`; a
  stated tempo replaces the file's, out of range refused; a swap on one staff refused and said.
- Parity with the Python converter, five files (`two-hands`, `crossed-hands`, `one-track-two-hands`, the rendered
  exercise clean and jittered): tracks, metre/tempo/key, grid per bar, swing counts, quantised events, hands, key,
  self-check, the notes read back, and the split where the reference has one.
- Where every note lands (2026-10-14): the written MusicXML read by the check's own parser (`barsOf`), not the
  converter's read-back, each bar compared with the file as built: the pickup file, and a two-hand file with a
  pickup, 3/4 then 2/4, G then B♭ major and a run of 32nds (15 notes by bar, staff, beat, length and spelling). On a
  copy that shifts every note an eighth late these fail (the converter's own "nothing lost" asserts still pass).
- The band (2026-10-15): in a file with a piano track, a bass, a guitar and drums, only the piano is written and the
  bars run to the band's end; each part is named with its General MIDI sound; its notes in quarter notes, in time
  order; a one-track (format 0) file's parts found by channel; a band file with no piano: its parts listed with
  instrument and range, the tune and the bass guessed (and said), the higher on the upper staff; parts chosen are
  written and the rest is the band; every General MIDI program has a FluidR3 sound, and the piano family is 0-7.
- Swing and drums (2026-10-14): running eighths in 6/8 and triplet eighths in 4/4 are not called swung (27 of
  ASAP's 235 classical files were); a file with two piano tracks and a drum track keeps the two as the hands, writes
  no drum note as a pitch and says how many it left out. These fail on the converter before the fix.
- Voices (2026-10-14): a half-note melody over moving eighths in one hand is voice 1 (stems up, no ties) over voice 3
  (stems down); chords whose notes end together stay one voice and the second voice is left out of that bar; every
  voice of every bar adds up; a note held under a moving melody gets a third voice (5) and the moving notes keep
  theirs (owner: up to 3); a played file keeps one voice a staff. The two melody cases fail with the split turned off.
- Bars (2026-10-14): a pickup written as its own short metre is a short bar 0, written implicit in the next bar's
  metre; a metre change inside a bar ends the bar there; bars go on in the last metre; a converted file with a pickup
  and a later 3/4 (every time signature read, the 3/4 written where it starts, every bar adding up). These fail on
  the converter before 2026-10-14.
- Keys (2026-10-14): the file's key written with its mode and spelled from it; a lone C major the notes contradict
  taken for a sequencer's default; a key change written at its bar with the notes after it spelled from the new key.
- Played or written (2026-10-14): the share of onsets already on the grid (1 for the clean exercise, under ¼ for the
  jittered one), and the check sentence saying the bars and rhythms are a guess for the played one only.
- Not here: how close a conversion is to the published score. That was measured once on ASAP's 235 score MIDI
  files against their MusicXML (not redistributable: CC BY-NC-SA), with the numbers in `docs/app-features.md` §5c.

## pdf.mjs

- Finding lines (`systems.ts`), built pages, each case a failure measured on the old detector or an old case: five
  even lines a staff; a stray rule before it doesn't shift it; a too-faint fifth line filled in; uneven lines are no
  staff; a grand staff with ordinary margins is one system (the old one looked for the brace at the page edge); two
  grand staves; a lead sheet one staff per system; three staves kept together; a blank page nothing; a grey page with
  clutter; thick scan lines; a tilted page (its tilt found); a short last system; a dark binding strip doesn't join
  systems; bands never overlap and hold their lines; runs to rows; RGBA to grey. (Run against the old detector these
  fail 16 of the cases: they test the fixes.)
- Real-looking pages (`fixtures/pdf`, generated 2026-10-14 from public-domain MusicXML laid out by OSMD; true counts
  by eye): simple.pdf (a short last line); scan.pdf p1 (tilted 1.2°, grey, specks, blur, a binding edge) and p2
  (−0.8°, beams crowding the lines); leadsheet.pdf (one staff a line, a quarter-width last line); chopin.pdf p2 (a
  one-bar ending); text.pdf (prose: no systems); and the old `two-systems.pdf` with its cuts worked out from its
  generator. Each must give exactly the true systems and staves; on simple, leadsheet and scan p1 every line's
  half-line split must cut nothing but staff lines. On scan p1 (tilted 1.2°) the split must also fall between notes
  on the page turned straight the way the reader shows it (the old detector cut 17–35 dark pixels on four of seven
  lines; review 2026-10-14).
- `moveCut`: a line's bottom dragged onto its top, or its top onto its bottom, keeps a line (a thinner one used to
  vanish and shift the page's later splits; both fail on the old code); two lines may still touch.
- Ported unchanged: reading position after cuts change; the background detection order. Also the page cache never
  evicting a page on screen (`pageCache.ts`) and a system drawn out of its page (`region.ts`) with its height on
  screen: modules the reader does not use (nothing in `src` imports them, 2026-10-14), so these 6 cases protect
  nothing on screen until it does.
- If `@napi-rs/canvas` (it comes with pdfjs-dist) cannot load, the real-page cases fail rather than being skipped.
- Skipped, printed with the reason: the old screen's 7 cases (its own screen is not ported). `PdfDocument.ts`
  (browser pdf.js, Vite worker) and the reader screen are checked in the browser (session scripts), not here.

## Browser checks

`browser.mjs` (2026-10-14) keeps the cases from ChatGPT's review of that day (`docs/review-2026-10-14.md`). Each makes
its race happen on purpose: the offline cache blocked (it would answer before a slowed download), a download
slowed, a big file's bytes held back in the page (`Blob.arrayBuffer`), a library storage that fails to open. Run
against the build before the fixes (`--url`), 8 of its 14 cases failed; the other 6 are the shared ones (a full
backup, no page errors, and the Memorise control). Not in it: the library store's lost update (shown with the store
module through the dev server: 0 of 10 records kept three simultaneous changes before, 10 of 10 after) and the PDF
Adjust stale draw (no way found to force it; fixed by reading). Other Playwright scripts used while building stay
in the session notes; anything worth keeping becomes a case here.
