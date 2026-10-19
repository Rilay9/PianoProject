# What each check does

Keep this list current (owner, 2026-10-13): when a case is added, changed or removed, or the code a check covers
changes what it means, update its line here in the same commit, so a check can't quietly test something that
no longer exists.

| Check | Run | Covers | Cases |
|---|---|---|---|
| `scoring.mjs` | `npm run check:scoring` | Play along and Rhythm judging (`src/matching.ts`), including let go early (`src/holds.ts` rules); every count compared, and where named which notes are painted and which presses are wrong (2026-10-14); a pad tap cut by the next tap is not let go early (2026-10-16, the walk-through) | 19 (18 judging cases and the pedal-holds block) |
| `lab-judge.mjs` | `npm run check:lab` | The accompaniment lab's chord judging (`src/lab/judge.ts`), the sentence the learner reads after a red chord (`sayHit`), the Roots step with other chord notes and outside keys, and improvising's notes from the lab's own guides (2026-10-14) | 32 |
| `activity.mjs` | `npm run check:activity` | Activity files (`src/activity.ts`): every file in `public/content/activities` reads and is in its index; the piece, set or chart each names exists and its bars are inside the piece (a piece: one of the app's scores or, by its `u-` id, a catalogue piece, with the index's bar count: `tests/named-pieces.mjs`, 2026-10-15); what one of each kind reads to; mistakes are refused with their reason (2026-10-14: index, names, read results, four more refusals; 2026-10-15: an unknown `u-` id, bars past a catalogue piece's end, a catalogue id without its `u-`); 2026-10-15, interfaces review: each file's title is text and a lab ladder's step words are known ones, which the reader lets through; 2026-10-16 (lesson 1): help rung 0 ("keys, no music") and the `keys` field read, grown only as needed, and refused when wrong; 2026-10-16 (rhythm sets): an activity's rhythm set only in Drills, not at rung 4 or "notes only" (three refusals and a control) ; Free play's `names` and Simon's `goal` read and refused (2026-10-16); the consistency pass (2026-10-16): `names: false` read on every screen, refused when not true/false; after the walk-through (2026-10-16): `fingers` (Free play, Simon, Drills), Free play's `groups` and `click` read, eleven refusals; the letters test activity read (2026-10-17) | 138 today (the count is printed) |
| `path.mjs` | `npm run check:path` | The path's content format (`src/lesson/read.ts`, `text.ts`) and when a step counts as done (`src/lesson/result.ts`; owner, 2026-10-15): every rung and lesson in `public/content/path` reads and is in the index; what each names exists (pieces and bars, sets, activities, files; a piece in a score block or a step's activity may be a catalogue piece by its `u-` id, 2026-10-15); each step's target fits its activity; the test content uses every block kind; a set's `kind` optional, and a given one known; what blocks read to; 24 refusals with their reasons; targets met and not met for each screen, near the line; MusicXML written in a lesson: a whole file whose bars fit their time signature (V13); a set's `play` (re-check V32); a catalogue piece named by a score block and a step, and the content check refusing an unknown `u-` id and bars past its end (2026-10-15); every set and chart a step names, and a score block's set item in its set (2026-10-15, interfaces review: the reader takes any); fix round 2026-10-15: a looped lab run never meets `cleanRounds` (F07), Drills `clean` from full sets only (owner, F10), a score step with no target done only by a run in its own mode that reached the end of its bars (owner, Q5); 2026-10-16: test rungs marked and hidden from the learner (`shownIndex`), a rung's `test` refused when not true/false; the shipped index as a learner sees it, lesson 1's rung first and the test rung hidden; 2026-10-16: the `rhythm` kind known, a step's rhythm set in Simon refused ; lesson 2 and the rhythm sets read with the rest ; ChatGPT's review of lessons 1-2 and its ledger (2026-10-16): a target counts only runs played as the step sets them, an introduction done when its set is played through; the consistency pass (2026-10-16): played as the step sets it on every screen and for steps with no target (the score's mode, hands, bars and timing; the lab's chart, part, step and loops; Memorise's piece and hands; Practise as…), Memorise done when a chunk is learned, the lab a whole round, Watch and Free play visited only with the evidence (a key, the music to its end) and the log's evidence kept per step; each new case seen failing on the rules before (dce50d76); after the walk-through (2026-10-16): a step's headline is its best whole run played as set (Simon's best chain), the misses again is practice (never "stopped early", never played through), the learner's words of `through()`, a "find it" set in Simon refused, the test rung's five lessons; the headline cases seen failing on 352b8ee0's `result.ts` | 198 today (the count is printed) |
| `midi.mjs` | `npm run check:midi` | The MIDI → MusicXML converter (`src/library/midi/`), ported from the old app with its unit tests; parity against the old Python converter's recorded answers (`fixtures/midi/parity/`); bars from every time signature, the file's keys, played files told apart, and where every note lands read by the check's own parser, voices, swing, drums, repeated strikes and lengths (2026-10-14), a band file's parts and picking them, beams, held notes, the pedal, count-ins and a default C major (2026-10-15), a channel that changes instrument and a one-track file's part names (review B7-01/02), releases as a player lets the keys go and the check's staff and length (review M1–M3, B3-03), a played file with the pedal written one voice a hand and a notation export's gate undone (owner's answers A5, A6), rests that show the beat | 205 (+ 6 old cases and 4 parity hand splits not applicable, printed as skipped with the reason) |
| `readability.mjs` | `npm run check:readability` (in `npm run check`) | How cluttered the MIDI converter's scores are (2026-10-15): per score, rests (one voice's rests drawn one after another are one), short rests, rests drawn on another voice's notes, rests hiding the beat, voices beyond one a staff, ties, tuplets, 32nds, counted from the MusicXML (rest symbols printed, not guarded); six catalogue scores (`public/catalogue`) made into MIDI as a notation program exports them and as a player lets the keys go, and the owner's two songs when `PIANO_SONGS` names their folder (never committed); fails when any count rises above the recorded one, or fewer of a catalogue conversion's notes are as the engraving writes them (`--record` prints new records) | the counting on a hand-built bar + 12 conversions (14 with the songs) |
| `pdf.mjs` | `npm run check:pdf` | The PDF reader's modules (`src/pdf/`): finding the lines (systems) on a page, reworked 2026-10-14; cuts, page cache, detection order (ported from the old app); six generated PDF pages, a page stored as JPEG 2000 (`fixtures/pdf/jpx.pdf`, made by `make-jpx-pdf.py`) and the old fixture through pdf.js's Node build with its JPEG 2000 decoder (fails if its canvas library cannot load); adding and removing a line keeps the other lines' splits (2026-10-14) | 58 (+ 7 old screen cases printed as skipped, with the reason) |
| `notes-match.mjs` | `npm run check:notes` | The pitches the score screen draws in each bar (spelled, sorted) are the file's, for every song in `public/scores`, and for the three committed MIDI fixtures as the app converts them; not where in the bar, how long, or which staff; every run also changes one note in the app's copy of the first song and must catch it (builds, serves on :5193, refuses if the port already answers; `PIANO_CHROMIUM` names a browser when Playwright's own is not installed) | one per song + 3 converted + the caught change; `--corrupt` must fail |
| `browser.mjs` | `npm run check:browser` | In the built app at phone size: backups (every file in the zip, a missing file named, an unreadable library refused), a slow PDF open overtaken, the Adjust handles by keyboard, a band file imported and played (the sheet's Band row, the panel's band, each part handed its notes as the song's clock reaches them, none when switched off; a band file with no piano part: the guessed parts, ticking others converts again, the choice kept with the piece and its band played), the first ▶ tapped while the band is still being read (it waits for it; a stop meanwhile is kept), a split placed by hand kept through + line, the lengths the judges are given (staccato, a slur end, a note before a rest) as the score screen decides them, + Add tapped twice, the catalogue asked for again, a Memorise start from a visit that was left; review 2026-10-15 (S2): a restore putting back files lost from records still there, taps while a PDF opens, a deleted PDF's saved state, the two-pane highlight, a score file and a chart unreachable once; with a stand-in MIDI keyboard (2026-10-15): Hands changed mid-run and while paused, a key behind Simon's and Drills' Level panel, an activity whose piece is missing or whose open was overtaken, a mouse let go off the on-screen keys; a panel opened over what is running pauses it (owner, 2026-10-15, A3: the score's modes, Memorise's passes and test, Simon, Drills, the lab's ⚙; Watch as a control), turning the phone in Wait for me while the piano leads on; Home, the tabs, Path and lessons (2026-10-15: where things open and how ← and Back come back, links, a reload, a lesson step tagged and its feedback in the export, steps never locking, Switch, Exercises and Practise as…, the metronome, Settings' theme, a little score playing, the video offline); a lesson naming a catalogue piece (2026-10-15: a step's first open adds it, online and offline, two Starts at once add it once, listed in Music, deleted and added again, a score block naming one, an unknown `u-` id and an unreachable file said with nothing marked); offline saving only in the installed app (owner, 2026-10-15: a browser tab starts no save and Settings says to install; the installed app saves); Wait for me on the on-screen keys with no MIDI allowed, tapped by position (owner, 2026-10-15: the bottom bar no longer over the keys, a tap starts the run and moves on, both hands' first notes on the keys and pressed together, every note wanted now on the keys for 24 steps); a piece that can't be drawn (review 2026-10-15, P01: never the piece before's music under its title, on every way in; bars of rests in a row drawn upright); the full PDMX set on the phone (owner, 2026-10-15: setup from the sample zips, the default view, hidden flags and labels, search, Open without adding, + Add, offline in a tab, Remove, a copy interrupted and resumed, not enough room, several parts added later; needs the sample set, skipped with a line when it is missing; the fix round of the final reviews (2026-10-15, 51 checks: section below)); teaching the app (owner, 2026-10-15, 36 checks: the four hints, the install card, How the app works, the first message kept through a phone's relayout; section below); reference videos as rows (owner, 2026-10-16, 10 checks: section below); rhythm sets in Drills (2026-10-16, 27 checks, `--only rhythm` runs them alone: section below); lesson 1's app pieces (2026-10-16, 40 checks: keys, no music, with no note names through a miss; per-step keys tapped by position, and fixed for a score run; Free play's keys 42% tall; test rungs hidden from the learner: section below) (builds, serves on :5194; `--url` checks a build served elsewhere; `PIANO_CHROMIUM` as for check:notes) ; ChatGPT's live review of lesson 1 (2026-10-16): a MIDI prompt nobody answers (Simon from the lesson and Drills open, a keyboard allowed later is heard), a result's Next is the lesson page at the next part, Free play from a lesson step shows its task with the columns hidden (Show for that visit only) ; the lesson steps after the reviews of lesson 1 (`--only lessons`, 10: the task on its own line in Free play and above Simon's music, no note names in lesson 1's Free play, the copying game ending at a chain of 3) ; the review of lessons 1-2 (F1 a reading card waits, F4 missed grey with a key, F5 Free play from the middle; A3 Next after the last step, A4 Lesson back at the step) ; the consistency pass (2026-10-16, `--only consistency`, 54: section below; older checks changed for it: the summary is the strip, Free play steps need a key to be visited, a key starts the next run only after a moment, the "no keyboard" wording, an activity's title on the task line) ; after the beginner walk-through (2026-10-16, `--only walkfix`, 74: section below; `PIANO_PORT` serves on another port) ; the exercise keys moved along the piano (2026-10-17, `--only movekeys`, 30: section below) ; lesson 1's capabilities (2026-10-17, `--only lesson1caps`, 50 when all run (a part that cannot run is one failure): Read / Watch, the keyboard in the page, Simon's goal, Keep going and no waiting, by ear, finger-number cards: section "Lesson 1's capabilities"; walkfix's by-ear case now "listen again", the whole pattern replayed) | 624 (with the sample set, 2026-10-17) |
| `wake.mjs` | `npm run check:wake` | The screen wake lock (`src/wake.ts`): a lock granted after you left is let go; one request at a time | 4 |
| `practice.mjs` | `npm run check:practice` | The Play along judge (`src/practice.ts`) around a mash: none of its keys counted as wrong keys, a right note inside it still counted; judged against the clock as heard (2026-10-16): presses 120 ms after the clock on time when the sound is heard 120 ms late, late with the piano on the MIDI keyboard, and the delay asked for the way the key was played (screen or MIDI) | 7 |
| `exercise.mjs` | `npm run check:exercise` | The exercise screen's judges driven with stand-ins (2026-10-15): a timed name-only Drill card holds the key pressed, not the written octave's; Simon's best is the whole chain played in one go, not one finished from the miss; Drills deal a pool like a shuffled deck; a set or game left part way logged as what it was played as, each item with its number (final review F06, interfaces F10); help rung 0 "keys, no music" in Simon and Drills: heard, keys lit, no staff at any point (2026-10-16); rhythm sets (2026-10-16): generated cards read back by the check's own reader, 500 dealt per set, refusals, a card judged as tapped, the first tap, the clock as heard (`sound.ts` `heardDelayMs`), the timing check's rule and which delay applies (`calibration.ts`): section below; the consistency pass (2026-10-16): the marks' tokens in style.css equal result-marks.ts, the one-line key only for the kinds present, a lesson step's Drills set done (Back to the lesson, a key after the settle; none outside a step), a mash in Simon ending the game with its result; after the walk-through (2026-10-16): the drift rule (`drift.ts`), "find it" sets (`find.ts`: cards, refusals, a card in Drills), Simon by ear keeping your turn; find-it cards by letter, and the letters view's refusals (2026-10-17) | 104 |
| `flow.mjs` | `npm run check:flow` | Read in time's timing and judging (`src/flow/engine.ts`, owner 2026-10-18): a card placed on the clock (rests no notes, the end a whole bar), 3/4 at 120, the clicks; taps on time, early, late, extra, a missed note (once), the score line; eighths 250 ms apart (a tap halfway between two is extra); keys: wrong and right; lengths judged (short at half, held at 90 %, held to the next tap) and not; speeding up after three good exercises. | 10 |
| `notecards.mjs` | `npm run check:notecards` | Notes in words and the note cards (owner 2026-10-18; `src/staff-words.ts`, `src/exercise/notecards.ts`, `src/lookup-content.ts`): every line, space and ledger note of both staves placed as the staff has it, middle C either way, accidentals not moving a note; a wrong key's words (the letter, an octave off, a black key, a chord, no staff); single-note pools and refusals; intervals both ways and together, each card's size counted in keys against its name, line/space looks, refusals; chord names from a card's name; Look it up's lines and spaces rows, its chords against tonal's spellings, its intervals against their labels. Shown to fail with the bass staff moved a step. | 15 |
| `content.mjs` | `npm run check:content` (in `npm run check`) | The content formats no other check reads (2026-10-15, interfaces review; `docs/app-features.md` §1, §5b, §5c, §6): the song list (`public/scores/index.json`: every field, ids, files there, every score file listed), every exercise set (its items and `from`, stricter than `exercise/items.ts`, which takes options of another kind or type, an empty set, a misspelt `from` field, and hung on a chord octave that is not a whole number, now refused by the reader itself: four octaves run through it in a child process with a time limit, 2026-10-15; the sets without MusicXML read with the app's reader), the lab's index, charts and styles (read with `lab/music.ts`, plus the nested keys and instrument names it ignores, each chart's style there and in its metre), and the catalogue index's header, rows and files; the help text (`src/help/help.md`, 2026-10-15) read with `help/read.ts`, every section the app opens there and every `data-help` in `index.html` naming one; rhythm sets (2026-10-16): `generate` read by the app's own reader of it, refused on other kinds, a rhythm set's non-MusicXML items and its `from` / `rhythm` / `play` refused (eight refusals); "find it" sets (2026-10-16): `find` read by the app's reader, refused on other kinds, with items, misspelt (four refusals); the letters view (2026-10-17): another view, a notes item, on a rhythm set (three refusals). Each rule also refuses a bad case of its own | 105 today (the count is printed) |

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

- Reads every listed activity file. A named piece is looked up by `tests/named-pieces.mjs` (shared with path.mjs): the
  app's scores (bars: the highest printed measure number) or a catalogue piece by `u-` + its catalogue id (bars: the
  index's count, bars as printed; for a file whose pickup is numbered 0 that is one more than its last bar's number, so
  the check is that much looser there).
- A catalogue piece (2026-10-15): a score and a memorise activity naming `u-de5f6a78874c` read and are found, its count
  is the index's 8; refused: `u-000000000000` (in neither), bars 5-9 (past its 8), `de5f6a78874c` without its `u-`.
  Shown failing before: an activity file naming the catalogue piece failed "its piece is in the scores".
- Refuses: an unknown screen; a score without its piece; a setting typo; a mode that isn't one; a tempo out of
  range; bars that end before they start; Ladder without bars; a chunk size Memorise lacks; a drill level typo; a
  lab step that isn't a kind; a lab part typo; a misspelt top-level field; Memorise bars (not offered yet); a
  misspelt ladder key; a ladder step of the wrong part; a step of the other part; a step not in its ladder; a
  fraction of a card.
- Content rules the reader lets through (2026-10-15, interfaces review): every shipped activity's `title` is text (the
  reader quietly uses the id) and a lab ladder's written-out step has only `kind`, `name`, `detail`, `doing` (the reader
  ignores a misspelt word); each refuses its bad case. Shown failing on `blues-roots.json` with `doing` misspelt.
- Lesson 1 (2026-10-16): help rung 0 ("keys, no music") read by a Simon and a Drills activity, rungs 1–5 still
  themselves; `keys` as one range (every kind of screen) and per kind of screen; a score (Wait for me) and a Drills
  activity with keys; `keysToShow`: C4–B4 with the octave's black keys stays C4–B4, grown to D5 for a C♯5 and from A3
  for an A♯3, none for a screen not named. Refused: rung 6, -1, "keys"; keys "C4", "H4-C5", high to low, one key, off
  the piano, ending on a black key, an unknown screen name, a bad range for a screen, `{}`, a number, on Memorise, on
  the lab, on a score in Play along. Run against the source of f506b240: 4 fail and the run stops at `keysToShow`.

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
- Engraving (2026-10-15): a note held from a beat in the longest whole-beat value that keeps the bar's middle
  (dotted half and dotted eighth, not tied quarters; off the beat still cut at the beat); eighths beamed by the beat
  and a half bar of plain eighths as four; a NUL left out of a track name; the sustain pedal (a key let go under it
  sounds until it lifts, not past the next strike; a bass held by it written to the next note; a legato overlap cut,
  a held melody not); silent bars before the first note left out, the band with them; a stated C major over music
  plainly in G read from the notes.
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
- A channel that changes instrument (review 2026-10-15, B7-01): each note is the instrument in force where it starts:
  piano then bass on one channel (the bass is the band, not written), bass then piano, piano-bass-piano (one piano part),
  a change on another track counted by its time, a change after a count-in moved back with the notes, a change at a
  note's moment counting for it and a note before any change being the piano; a choice saved as "track:channel" still
  takes the whole channel. A one-track file named for the song (B7-02): its parts named by instrument (and channel
  where two share one), a track holding one instrument keeping its own name. 8 of these 10 fail on the code before.
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

## readability.mjs

- The counting, on one bar built by hand: each count as built; fooling cases (the other voice's note removed: no rest
  on a note; a hidden rest printed: one more rest; one voice: no extra voice) each move their count.
- Rests and the beat (2026-10-15, Gould's rule, the coordinator's decision): a rest split at the beat (an eighth to the
  beat, a half from the middle) is one rest of two symbols hiding nothing; a half rest from beat 2 and a quarter rest
  from beat 2½ each hide the beat; a half rest on beat 3 does not; 6/8 and 12/8 cases (a beat is a dotted quarter).
  The six engravings have none. On the converter before the rule: Seize 4, Warmness 6, four catalogue versions 1-4.
  Rests were counted per symbol until then, so a correctly split rest counted as clutter.
- Inputs: Someone You Loved, Fix You, Falling, Mary Did You Know, Your Song and Bach's Prelude I from the catalogue,
  each written to MIDI from its own notes twice: every note at 95% of its length (the gate measured in the owner's
  Seize the Day export) and each key let go between 85% and 100% of its length (seeded). Both converted (the converter's
  own check must pass); the engraving's counts are printed beside them. The owner's Seize the Day and Warmness on the
  Soul with `PIANO_SONGS=<folder>`.
- Fails when a count is higher than `RECORD` or fewer of a version's written notes are as the engraving has them
  (staff, pitch, onset, length, ties joined; until 2026-10-15 the played version was matched with the export's
  conversion, which moved whenever that conversion improved). The match tried on a perfect input first: the pieces
  exported whole match 745/745, 666/673, 922/923, 482/482, 323/323, 533/533. Ties are joined within a voice (keyed by
  staff alone until 2026-10-15, a tie was joined across voices: one note lost from Fix You's and Falling's MIDI). Lower counts print "better: update the
  record". No threshold is invented: the record is the converter's own measured output (2026-10-15, after the
  owner's answers A5 and A6). On the converter before `tidy.ts` it fails on every played input (e.g. Falling played:
  rests 157 for 41, extra voices 167 for 88); on the converter before A5 and A6 (0d3267fd) 41 lines fail with the songs,
  28 without, and it is no better than the current one on any count.
- Not covered: how close to the published arrangement (photos only); a real player's releases beyond the seeded model.

## midi.mjs additions (2026-10-15, S4)

- Releases: a chord let go up to 0.15 of a quarter apart is one chord of one length in one voice; a written eighth
  beside a dotted eighth exported at 95% stays two lengths; quarters let go 0.15 early are quarters with no 16th rests;
  a written 16th rest is kept; a first voice's rest under a held second voice's note is not drawn, one only partly
  under it is. The three "one" cases fail with their step off; the near misses fail with looser limits (1/4, 3/10).
- The check's staff and length (B3-03): the score as written compares perfect; a dotted eighth and 16th rest rewritten
  as two eighths (bar still adding up) is named as held for another length; the hands swapped is named note by note as
  on the other staff, where the time-and-pitch lists stay empty (what the old check passed).

## midi.mjs additions (2026-10-15, owner's answers A5 and A6)

- A5, a played file with the pedal (two hands, ragged chord releases, CC64): a bass key held under the pedal past its
  hand's next note is cut there, one voice; cut too where the pedal changes while the key is down (owner, 2026-10-15); kept in a file whose
  chords are let go together (an export); a silence after the pedal lifts measured from the lift (0.15 before the next
  note: no rest), under an eighth taken for the pedal changing (0.3: no rest; 0.9: a rest, the note written as long as
  it sounded). Each case fails with its step off (cut, the export guard, the silence from the lift, the eighth, the
  sounded length).
- A6, a notation export's gate: found at 95% and 90% (within 0.005), none in a file exported whole or played; not
  fooled by a file of mostly halves (the first share from 1 down that explains half the notes is 0.995 there); a
  half note before a sextuplet written as a half with no ties (with the gate off: 11/6 in tied pieces); a triplet
  quarter still one (the guard against releases moved to 16ths, which made it a dotted eighth and a 16th rest).

- Rests that show the beat: a silence from beat 2 to 4 is two quarter rests (was a half rest on beat 2); Seize bar 3's
  shape has no rest hiding the beat (was a half rest on beat 2½); a half rest on beat 3 stays one. The first two fail
  on the converter before the rule.

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
  vanish and shift the page's later splits; both fail on the old code). Lines may overlap (owner, 2026-10-14): a
  bottom below the next top, a top above the previous bottom, but never past the previous top (order kept);
  overlapping lists read pair by pair, an older sorted list reads as before; removing the right line where lines
  overlap. The five overlap cases fail on the code before overlap.
- The fixture pages pass pdf.js its JPEG 2000 decoder folder with forward slashes (a Windows path failed every page).
- Ported unchanged: reading position after cuts change; the background detection order. Also the page cache never
  evicting a page on screen (`pageCache.ts`) and a system drawn out of its page (`region.ts`) with its height on
  screen: modules the reader does not use (nothing in `src` imports them, 2026-10-14), so these 6 cases protect
  nothing on screen until it does.
- If `@napi-rs/canvas` (it comes with pdfjs-dist) cannot load, the real-page cases fail rather than being skipped.
- Skipped, printed with the reason: the old screen's 7 cases (its own screen is not ported). `PdfDocument.ts`
  (browser pdf.js, Vite worker) and the reader screen are checked in the browser (session scripts), not here.

## path.mjs

- Reads `public/content/path/index.json` and every lesson; the folder and the index agree; pieces and bars, sets,
  activities (by id, and written out) and files named by blocks exist; each step's target is checked against its
  activity once read (`checkTarget`); every block kind is used by the test content; every set's `kind` is known.
- Reads to: a score block's source (a piece's bars, a set's item, a MusicXML file or inline), keys with "-" fingers, an
  inline step's activity and target, a tip's label, a video as a row (`"size": "row"`, and left out); YouTube ids from five link forms (not another site); text with a
  heading, bold, italics, a link and two kinds of list.
- Refuses: an unknown kind, a misspelt or missing field, raw HTML, a link that is not https, a file outside the folder
  or of the wrong type, a video that is not YouTube or ends before it starts or whose `size` is not "row", a score with two sources or too long,
  keys that are not pitches, fingers not one a note or not 1–5, a step id twice, an inline activity with a mistake, a
  target its screen cannot judge, of another screen, out of range, or onTime in Wait for me; a lesson or index field
  typo, a lesson in two rungs, a rung id with spaces; a target that does not fit the activity named by id.
- Done: drills `clean`, simon `chain`, score `onTime` (a run and a loop pass) and `bpm` (a clean pass only), lab
  `cleanRounds` (a late bar, or a stopped round, is not clean), each met and not met at the line; with a target only
  when met, without one any run, no run not done; Watch and Free play done on coming back (Wait for me is not).
- Fix round (2026-10-15): a lab run that looped one bar, three clean rounds, does not meet `cleanRounds: 1` (F07); a
  Drills "misses again" set of 4 clean, a set stopped early and one left do not meet `clean: 4` (owner, F10: full sets
  only; the older Drills case now gives a full set); a score step with no target (owner, Q5): in a Wait for me step a
  Play along run stopped after two notes, a Play along run to the end and a Wait for me run not through are not done, a
  Wait for me run round its bars is; in a Play along step a run stopped part way is not, one to the last note
  (`reachedEnd`) or a pass round its loop is. Run against the old `lesson/result.ts`: these 5 lines fail (86 of 91).
- Shown failing (2026-10-15): with `test-chords-and-band.json`'s first block's kind changed to "quiz", and with a set's
  kind removed, the check fails on those lines.
- Pieces (2026-10-15): a score block's piece and a step's activity's piece (written out or in its file; the step's was
  not checked before) are found with `tests/named-pieces.mjs`, the app's scores or a catalogue piece by `u-` id; a score
  block and a step naming `u-de5f6a78874c` read and are found; refused by the content check: a score block naming
  `u-000000000000`, a step's bars 7-9 past the piece's 8. The test lesson `test-catalogue-piece` is checked with them.

- MusicXML written in a lesson (review 2026-10-15, V13): two bars of 4/4 and a bar with a chord read; a fragment, an
  over-full bar (four quarters and a whole note in one 4/4 bar: the old test lesson's example) and a bar with no time
  signature are refused. The over-full and no-time cases failed before the rule (accepted).

- A set's `play` (re-check V32): none given is Wait for me; a mode, hands and tempo read; an unknown mode, Ladder, an
  unknown field and a tempo out of range are refused.

- Names a lesson's reader takes on trust (2026-10-15, interfaces review): every set or chart a step's activity names
  (written out, or in its file) is listed, and a score block's set item is one the set has (a set cut `from` a score is
  not counted); bad cases refused: item 99 of chords-c, a set and a chart "nope". Shown failing with the test lesson's
  item changed to 12.

## content.mjs

- The app's reader itself (interfaces review F1, fixed 2026-10-15): a chord `octave` of "five", 4.5, 10 and -1 is
  refused with its reason ("should be a whole number 0 to 7"). Each runs in a child process with an 8 s limit; before
  the fix three never returned (ETIMEDOUT) and -1 was accepted.
- Shipped content: `scores/index.json` (fields, needed fields, id form, no `u-`/`ex-` ids, unique, the file a `.musicxml`/`.xml`
  in `scores/`, `source` fields, an https licence link, a known `kind`) and every score file listed; every set file listed
  and every listed one there, its items and `from` as §6 says, and the sets with no MusicXML read by `readSet`; the lab
  index's two lists and folders, each style and chart read by `readStyle`/`readChart`, `improvise`, `steps` (and step
  words), `instruments` (a FluidR3 sound or piano), patterns as text, a chart's style there and in its metre; the
  catalogue index (every field `catalogue.ts` reads, each row's length, id, kind, bars, its file there).
- Refuses (each rule's own bad case, 38): song entries with a misspelt field, no file, no composer, a missing file, an
  `.mxl`, a `u-` id, an id twice, an unknown kind, a `source` typo, a list that is not one; set items with a chord octave
  "five" (the app hangs on it), an option of another kind, `together`/`arpeggio` as text, no items, items as a list or not
  numbered, a name not text, a pitch or chord that is not one, a MusicXML item naming an `.mxl`; passages with a misspelt
  field, no score, a score not listed, bars past the end, a staff as text; charts with a misspelt `improvise` or `steps`
  key, a misspelt step word, a bar not text, a style not there or in another metre, a metre "4/0"; styles with a
  misspelt instrument part, an instrument that is no sound, a drum pattern not text; a catalogue row a value short, an
  index without `bars`.
- Shown failing (2026-10-15) on real files changed by hand: a song entry with `licence`, a chord `octave: "3rd"` in
  chords-c, `improvise: { scales }` in blues-c: three FAIL lines, exit 1.
- Not here: MusicXML items and passages (the reader needs the browser's DOMParser; they are read in the browser).
- Test rungs (2026-10-16): every shipped rung titled "Test:" is marked `"test": true`; the check still reads the test
  rung and its three lessons; `shownIndex` hides a test rung and keeps a real one, and keeps both when test content is
  asked for; the shipped index as a learner sees it has no rungs yet; a rung's `"test": "yes"` is refused. Against the
  source of f506b240: 5 of these fail (the index unmarked, no `shownIndex`, `test` an unknown field).

## exercise.mjs

- Drills, name only and timed (a C4 half note at 80): C5 let go after 100 ms is let go early, held 1400 ms is clean;
  the same for C4 (controls); at rung 3 a C5 is a wrong key and the C4 missed. The first fails before 2026-10-15 (the
  hold was looked up by the written C4, found nothing, and counted as held).
- Simon, a five-note passage read from the music: chains 1-3 whole are bests 1-3; chain 4 missed at its last item and
  finished from there (the replay asks for that item only) is not a best of 4 nor the game's longest; chain 5 whole is
  a best of 5; with "the whole chain again" chain 4 replayed whole is a best of 4. The third fails before 2026-10-15.
- Drills deal a pool like a shuffled deck (owner, 2026-10-15, A1): three notes-only cards, each skipped with Next.
  40 sets of 5 each hold all three items; 40 sets of 6 each hold every item twice; an endless set of 300 cards has
  the three items in every three cards in turn and never the same card twice running (across every reshuffle); a new
  set never starts with the card the last one ended on. The first three fail on the code before (cards drawn at random:
  e.g. C4 D4 C4 D4 C4); the last two are controls that passed before too (it already never drew a card twice running).
- The log (final review F06, interfaces F10; 2026-10-15): a lesson step's Drills set (5 cards) with two cards played,
  then another set chosen from the menu (which ends the activity): logged as the first set, at the step's level, with
  the step's tag; each card with its item number `n`. Your own set, a card played, then the level changed: logged at the
  level played. Simon, the step's set, chain 1 played and a wrong key in chain 2, then another set: logged as the first
  set with the tag, the miss with its item's number. All five fail on the code before (logged as the new set and level,
  no tag, no `n`).
- "Keys, no music" (help rung 0, 2026-10-16): Simon on a pool of the five black keys of C4–B4, opened as an activity
  at rung 0, chains 1–3 played back (a best of 3), then a miss and Hear again: every round is played (sound), the keys
  lit are the set's, and the staff is drawn 0 times. Drills at rung 0, notes only: the card is played with its key lit,
  then a right card and a wrong one skipped: the staff is drawn 0 times, the result included. All four fail on the
  code before (staff drawn 25 and 4 times, nothing lit, nothing played).
- Rhythm sets (owner, 2026-10-16; `src/exercise/rhythm.ts`), the generator checked by a reader of the check's own: each
  card read back from the item Drills plays (groups, lengths, bars) into note values; every bar adds up to its metre, no
  value past its bar's end, an eighth only as the first of a pair on a beat, only the set's values, the feature in every
  card, a note first, the metre right. 500 cards dealt by Drills (endless, each skipped) for each shipped rhythm set and
  four hand-made specs (eighths and rests in 3/4 over 4 bars; 2/4 with a half rest as the feature; every value in one bar
  of 4/4; a whole rest as the feature), and never the same card twice running (a pool of one: always that one). Five
  cards of each are printed. Quarters alone: the one steady-beat card. The reader itself refuses five fooling cards (a bar
  a beat short, a rest first, eighths off the beat, a value not allowed, no feature). The app's reader refuses, with its
  reason: an unknown value, a whole in 3/4, a dotted half in 2/4, a feature not in the values, bars 0 and 5, a metre not
  offered, a misspelt field, rests only, halves alone in 3/4, a whole rest as the feature of a one-bar card, `generate`
  on another kind, a notes item in a rhythm set, a rhythm set with neither.
- A card judged as tapped (quarter quarter half | whole at 72, built by the generator's `cardItem`): on time and held
  clean; one note 150 ms late, one 150 ms early, the whole not tapped, an extra tap, the half let go after 600 ms and the
  whole after 1000 ms each named ("1 note late" …); the half held 1300 ms clean; MIDI keys 60, 61, 99 and the pad mixed,
  clean; no note name and no "wrong key" in anything said.
- The first tap (owner, 2026-10-16): on Ready at rung 3 starting on the first note, the tap that starts the set is the
  card's first note (the clock running); tapping the next two of four leaves exactly one missed; a tap on the result
  goes on to the next card as its first note. All three fail with the first-note hand-over switched off (tried
  2026-10-16: the start tap was swallowed, "2 notes missed").
- The clock as heard: taps 120 ms after the clock with the clicks heard 120 ms late (a stand-in) are clean, the same
  taps with no delay are "3 notes late", and with the metronome off nothing is taken off. `Sound.heardDelayMs` with a
  stand-in audio context: 0 before any sound, base 10 + output 50 = 60 for the piano and the clicks, the piano on the
  MIDI keyboard 0 (the clicks still 60), neither figure given 0, base alone 10.
- The timing check's rule (`src/calibration.ts`): 8 clicks at 80; the median of the six counted taps (81 for taps 78–88
  ms late); the first two clicks' taps change nothing; one stray tap of six allowed; refused: 3 of 6 tapped, taps 200 ms
  apart, a median of +450 or −120; 200 kept, marked large; a second tap on a click is extra. Which delay applies: none
  kept, the browser's 60 for both ways of playing; 150 kept for screen taps used for screen taps only; the piano on the
  MIDI keyboard 0 even then; reset, back to 60.

## After the beginner walk-through (2026-10-16; design/2026-10-17-walkthrough/build-notes.md)

- scoring.mjs: a pad tap still held when the next tap came 233 ms early is not let go early (the next is early; fails on
  352b8ee0's `matching.ts`); let go before the next tap, it still is.
- exercise.mjs: `drift()`: steady and ±40 ms wobble not named, 7% faster "faster", 7% slower "slower", 3% not, one late
  tap at the end not, three taps nothing; `find.ts`: C3–B4 lower / higher / any gives six cards with the right keys and no
  note names, a cut-off group is not one, six refusals, "middle" of three; a find card in Drills: the starting key is no
  answer, a white key "not that group" (red, the group outlined), Again then the group: right on a retry; Simon by ear:
  four wrong keys keep the turn, no hearts, nothing outlined or named, the note replayed, then "Found by trying keys".
- activity.mjs: `fingers` per pitch and per key, `groups: false`, `click` (default 4 beats); refused: a finger 6, a
  pitch that is not one, `{}`, fingers on the score, groups as text or on Simon, click without bpm, at 400, with 8 beats,
  misspelt, on Drills.
- path.mjs: the headline cases (Simon 3 then a by-ear 0: "Longest chain 3"; 3 of 5 then the misses again: "3 of 5 cards
  clean" with the practice said; the misses again never played through; two sets: "the best of 2 runs"); `through()` in
  the learner's words; a find set in Simon refused.
- content.mjs: a find set reads (4 cards); refused: `find` on another kind, items on a find set, an unknown place, no `find`;
  the letters view (2026-10-17) refused: another view, a notes item, on a rhythm set.
- exercise.mjs (2026-10-17): find by letter (C3–B5, C D E at four places: twelve cards, "a D, higher up" D5; what each
  place means over all the keys, said while only part shows: "the lowest D", "the middle one of the Cs", "any E"; three
  refusals); the letters view's reader refusals (another view, on a rhythm set, with play, no written rhythm).
- browser.mjs `--only walkfix` (74), on the test lesson `test-walkfix`, touch taps by position, at 360×780 and 844×390
  where layout matters: a find-it card (words, the starting tap no answer, a white key red with the group outlined, Again
  then right; the Level panel without rungs or timing, the step's 4 cards ticked); the set picker inside a step lists the
  lesson's sets; the steady beat at help 0 (the beat line drawn, early taps orange, "You sped up", the count-in 1–4 sampled
  all through, the counter on Again, a tap in the demo goes to the count-in, a missed beat ringed grey, every Set done
  line in view); Hear it on a card to read then waits; Free play (groups 2 and 3, "the middle" and the 88 keys drawn,
  fingers 2-3 / 2-3-4, a held key cyan by CDP touch, "the top" at the end, Show's names off with the reason and 22 px
  boxes, the step's click on and toggled off with groups off); Simon by ear keeps the turn; Home's Start opens the lesson
  page at step 2's part; a done lesson is not Up next; Switch's "Skip ahead" only after an undone earlier lesson; the
  path's last lesson's bar ("not written yet", Practice); after a reload the cover not over Ready and the first pad tap
  starting the set; the keyboard's lowest key (Again on a card, a new set at Set done); 44 px controls and 22 px radios
  in a Level panel inside the screen; a letters card (2026-10-17: Merrily's first two bars; the letters under the notes,
  keys not pad, two and four bars with no sideways scrolling at both sizes; right: clean; a wrong key: that note grey, the
  key red, the right one outlined; the half let go early: orange) and the note values under the letters (the ink inside
  each head: quarters filled, half and whole open); a find-it card by letter (no key names, C3–B5 reached exactly, a
  window of it at 360 px since 2026-10-17: D4 brought on screen with ‹, "a D, higher up" counting D5 only, the D5
  outlined on screen after the miss). The bug cases (13, 17, 22, 27, 29, 1, 2, 3, 23) were seen failing on 352b8ee0 with the
  scratch versions of these cases (its reader cannot read the test lesson's new fields, so this section aborts there).

## The exercise keys moved along the piano (2026-10-17; `node tests/browser.mjs --only movekeys`, 30)

Owner, 2026-10-17: the exercise screens' keys move with ‹ › when no MIDI keyboard is connected (`exercise/keys.ts`,
`key-shift.ts`; app-features §4 "Moving the keys"). Phone contexts with touch, taps by position (a white key low down, a
black key near its tip), at 360×780 and 844×390; sets swapped in by route: a find set over C2–B5 (four octaves, wider
than a sideways window) and two cards of notes three octaves apart (C3 E3 G3, C6 E6 G6). Per size:
- No MIDI keyboard, a find set wider than the window (C3–B5 upright, C2–B5 sideways): ‹ › and the small piano shown, a
  window of 24 / 36 semitones, the reach exactly the set's keys, no names in the range; › on Ready moves the keys and
  starts nothing.
- Eight find cards: started with the keys in at least two places and never where the card before started; ‹ and › on
  each card leave it your turn with the score line unchanged; each answer brought on screen with the arrows and tapped:
  clean every time; each card says what its place means over all the keys ("Lower down: the lowest E you can reach
  with ‹ ›", "the highest", "the middle one").
- The stand-in MIDI keyboard: no ‹ ›, C2–B5 drawn whole (C2 to B5 exactly).
- Drills at help 1, notes only, the two wide cards: sampled every 20 ms through demos and turns, every lit key inside the
  keys drawn (and drawn); the lit keys tapped by position for both cards; Set done.
- A card waiting to be read (help 3, counted in): an arrow moves the keys, still "Read it", no count-in.
- Simon at help 1 with the wide items: ‹ › shown, every lit key on screen while the chain is given.
- No page errors in each.
Run on the build of 8ee04add (before the change, `--url`): 18 of 30 failed (the arrows, the window, the starts, the arrows
during a card and while reading, the place words, the exact reach with MIDI, the keys moving for lit keys, Simon's arrows); the 12 passing
are the no-page-errors cases and "each answer reached and tapped" (there every key was drawn).

## Lesson 1's capabilities (2026-10-17; design/2026-10-17-lesson1-owner/spec.md)

The six capabilities the owner's lesson 1 spec lists (app-features §3, §4, §6, §8b, §8c):
- exercise.mjs (Simon and Drills driven with stand-ins, every drawing, lit / red / outlined key, sound and word recorded):
  Simon at keys-no-music with a goal of 6 on every key of an octave: five misses before the goal (onMiss "from-miss" set)
  each free, the whole pattern of 3 again, no hearts; at 6 "You did it: a pattern of 6", Keep going and Back (no Again in
  a step), the entry logged at once (ended goal, 6); the highest key Back to the lesson, the lowest Keep going (and by ear a
  plain key at the goal is Keep going, never Back: owner, 2026-10-17, follow-up); to 8, the first miss "Game over: longest
  pattern 8", one entry still (goal, 8, keptGoing, afterGoal over); no staff and no name at any point. No waiting: the key
  that started the game (and one pressed while it is held) does not cut the pattern, a fresh one does and is the first
  note; the same while the grown pattern plays, after a miss (in the pause before it plays again) and during Hear it. By
  ear on the five black keys, goal 5: four misses free, the whole pattern again each time; the goal, Keep going, its first
  miss "Game over: longest pattern 6"; nothing lit, revealed, red or outlined and no staff or name, ever. Hear it at rung
  2 (music and sound, no keys lit) and Show me at 4 (the music, nothing played or lit). Drills by ear (notes only and
  timed) and keys-no-music: no staff or name at any point, the result too; by ear nothing on the keys; the 8 s hint adds
  nothing at 0. Finger-number cards: the shipped test set reads (two cards, phrases 7 6 8 5); each card's five hand keys
  from the finger map (a card leaving out finger 4 gets F4, not the left hand's D3); the format's refusals; a card played:
  "Finger numbers" on the score line, the numbers shown and lit as it plays, a key cutting the demo short as the first
  note, a wrong key red then cleared with the right one outlined, "✓ Done, 1 wrong key" waiting with Next and Again, the
  left card "✓ Clean", the set logged played through, no key lit and no staff. (The old by-ear case, "a miss plays the
  note again and you keep trying", is replaced: the owner's 2026-10-17 answer is the whole pattern again.)
- activity.mjs: a Simon goal of 4 refused (at least 5), goal 5 reads; (path.mjs: a step's Simon target chain of 4 refused
  too; the target cases moved from 3 to 5, test-chords-and-band's step to 5); a finger-number set's cards against the activity's
  `fingers` (a mismatch refused, in Simon refused, agreement passes; `tests/finger-cards.mjs`).
- path.mjs: an optional step (`"optional": true`, follow-up): read, not counted (0 of 2), the next step skipping it, the
  lesson done with it left to offer, named Step 1, Optional, Step 2; refused when not true or false.
- path.mjs: Read / Watch and the keyboard read to their fields; refused: a video that is not YouTube, no title, an end
  before the start, a keyboard on a black key, with no keys, `groups` not true / false, a misspelt field; the test lesson's
  finger step agrees with its map; the test rung's six lessons; Simon's headline "Longest pattern 3".
- content.mjs: the finger set's fields; refused: one finger too many, no hand, a chord, `fingers` without the view.
- (2026-10-18, the week's lesson) exercise.mjs: made-up tunes (200 different cards a set in C3, G2, G4, C4 positions,
  every note in its five, bars exact, a note first, the home key last, only steps, thirds and repeats; refusals); rhythm
  sets given as a list of specs (each card answers to one). content.mjs: generated melodies and lists of specs read by the
  app's own readers; refused: a black-key position, `items` beside `generate`. browser.mjs `--only week` (16): each of the
  18 steps' activities opens on its screen (scores with notes drawn); Read in time at 360×780 and 844×390 with touch: the
  layout (pad on screen, two lines inside the screen), the count-in, taps by position judged as they land (early, late,
  missed, an extra tap counted for the exercise it fell in), Stop's summary and log entry, Keep going; reading in time
  with a stand-in keyboard (a wrong key marked, two octaves of keys); Drills' Keep going after a set of chord cards; the
  lesson page's blocks. Screenshots to `web/r3shots-week/` (not committed).
- (2026-10-18, lesson 2) exercise.mjs: letter-name cards: the shipped `ode-to-joy-names` reads (right then left, two
  lines of 15 letters, the lengths 1.5 0.5 2 at each line's end, 32 beats a card, the left an octave lower); refused:
  fingers on a card, a beat short, an empty phrase, no hand; a card played with `miss: "quiet"` and Show key / Names:
  "Key names" on the score line, Hear it lighting each letter and its key, a wrong key named with nothing outlined, Show
  key outlining E4, "✓ Played through: 1 wrong key, Show key once", the names on for a moment counting ("names shown"),
  Hear it then a clean try "✓ Clean", no staff, letters on the keys only when asked (each case seen failing on a
  deliberately broken drill.ts). path.mjs: the keyboard's `names: "letters"`, `fingers`, `play`, `tempo`, `hide`, `find`
  read; refused: names another word, hide without letters, play off its keys or not pitches, tempo with no play, find of
  a letter not on its keys, of one letter, of a black key, fingers not a map. content.mjs: the names set's fields and
  `beats`; refused: fingers on a names card, a beat short, an empty phrase.
- browser.mjs `--only lesson1caps` (45), on the test lesson `test-lesson1-caps`, touch taps by position, at 360×780 and
  844×390, screenshots to `web/r3shots-lesson1/` (not committed): Read / Watch (Read first, no video in the page; Watch puts
  the player in, Read takes it out; offline the title and "needs the internet"); the keyboard (C3–B4, the groups 2 3 2 3,
  no labels, a black key held off centre sounds on the app's piano and looks pressed, a stand-in MIDI key shows on it,
  nothing logged); Simon keys-no-music (a free miss with the key red and the right one outlined, the whole pattern again;
  a key while the pattern plays cutting it short at least twice; "You did it: a pattern of 6" with Keep going and Back;
  at 360 Keep going to the first miss, "Game over: longest pattern 7", Back to the result "Longest pattern 7" and "Target
  met"; no staff, name or label throughout); by ear (a miss: "Not that one: listen again", nothing shown, the whole
  pattern again; nothing lit, marked, drawn or named through given, Hear it, a miss and again); finger cards ("Right
  hand", phrases 7 6 8 5 lit as it plays, no key lit; the five hand keys numbered; the card fitting its room with each
  phrase on one line; a key cutting the demo; a wrong key red then cleared, the right one outlined; at 360 "✓ Done, 1
  wrong key" waiting); at 360 a key on the screen at the goal keeps going (not Back); the optional step (its card
  "Optional · …", the bar "0 of 2 steps done" and Start step 1, the needed ones done: "Lesson done: all 2 steps" with
  Optional step ▶, done too: no longer offered). No page errors in each. Each part reports a failure if it cannot run to its end.
Run on b3b74ac1's code (`git stash` of `web/src` and `index.html`, the new tests and content kept): check:exercise 17
failed (every new Simon and Drills case, the finger cards' reader and play, the mash's "longest pattern"; the one passing
new case, Drills at keys-no-music drawing no staff, was built 2026-10-16); check:activity 1 (goal 4 accepted); check:path
11 (the two block kinds unknown, the test lesson refused, the headline); check:content 1 (view "fingers"); browser
`--only lesson1caps` 10 of 10 parts (the test lesson refused); a throwaway on the walk-through lesson's by-ear step
reproduced the owner's report there (Hear it: the staff and lit keys in 14 of 30 samples; a miss marked red), none after.

## Browser checks

`browser.mjs` (2026-10-14) keeps the cases from ChatGPT's review of that day (`docs/review-2026-10-14.md`). Each makes
its race happen on purpose: the offline cache blocked (it would answer before a slowed download), a download
slowed, a big file's bytes held back in the page (`Blob.arrayBuffer`), a library storage that fails to open. Run
against the build before the fixes (`--url`), 8 of its 14 cases failed; the other 6 are the shared ones (a full
backup, no page errors, and the Memorise control). Not in it: the library store's lost update (shown with the store
module through the dev server: 0 of 10 records kept three simultaneous changes before, 10 of 10 after) and the PDF
Adjust stale draw (no way found to force it; fixed by reading). The B7-03 block (review 2026-10-15) holds a MIDI
file's bytes back 2.5 s in the page and taps ▶ as soon as the score is drawn: the first run must hand the band its notes
(before the fix it handed none), and a stop while the band is read must keep nothing playing (a control: it passed
before too). Other Playwright scripts used while building stay
in the session notes; anything worth keeping becomes a case here.

Its block "Review 2026-10-15, section S2" (five cases, each with a no-page-errors case) failed 5 of 5 on the build
before its fixes (`20d02f84`, run with `--url`): a backup restored after the library's files were cleared (records
kept) must put back all three files, the MIDI original too; two taps on the music while a big PDF opens (its bytes
held back 3 s) must not save the PDF shown before as this one (its page 1 lines and tilt must be its own); deleting a
PDF must remove its `piano-web.pdf.v1` entry and keep another PDF's; at 844×390 (two panes) the marked row must be
the piece whose page shows, the first time too; a score file and a chart aborted on the library's first open must be
there on the second.

The cases of the review of 2026-10-15 (practice, judging and input) play keys through a stand-in for the browser's MIDI
(`window.__key`): Play along with both hands then R pressed (the run ends with its summary, logged as both); paused by
silence, R, then carrying on (logged as the right hand with only the new run's notes); a key behind Simon's and
Drills' Level panel starts nothing (closed, it does); an activity naming a missing piece is said and not logged with
your runs, one that opens is (control), and a Simon activity overtaken by opening Simon from the menu while its sets
load is not; a mouse pressed on an on-screen key and let go off the keyboard lets it go (score in Wait for me, Free
play, Simon). Run against the build before these fixes (`--url`), all 7 of these checks failed (the page-error ones
pass on both).

**Routes changed, not checks (2026-10-15, Home and the tabs):** the app now opens to Home, so the cases reach their
screens the new way: the library is the Music tab (`library()`), backup and the log's export are in Settings
(`settingsPage()`), Simon, Drills, the lab and Free play are in Practice (`practice()`), and the cases that played the
first piece open `?piece=bach-bwv514` (what the app opened before). The catalogue + Add case counts the app's pieces
(`__pianoDebug.pieces()`) instead of the song list (gone: Music lists them). Two cases needed a timing change: B7-03 waits
for the held MIDI read as well as the drawing (with nothing drawn before, the two land together), and the
"unreachable once" library case sets its failing routes before the page loads (Home reads the charts for its recent
list before Music opens). The A3 panels "Keyboard controls" and "Songs" were removed from its list: neither can open over
a piece any more (Keyboard controls is in Settings, the song list went).

The block "Home, the tabs, Path and lessons" (2026-10-15): opens to Home; the tabs at the bottom upright and a rail at
844×390 and 820×1180; Music → a piece (score full height, no tabs) → ← back to Music, and with Android Back, Music →
Home; a reload on Path stays there; `?piece=` and `?activity=` open over Home and Back/Done is Home; Practice → Simon →
Done back to Practice; a lesson step from Home: its activity opens tagged with the step, played with the stand-in
keyboard in Wait for me, ← back to the lesson page with "This time: …", the step marked played, Hard and a note reach the
exported log with step, lesson and rung; steps never lock (the last step first, done on coming back from Free play, the
earlier ones "skipped"); Switch… opens another lesson in the page's place and Path's You are here follows; Exercises opens
a scales set in Drills, Practise as… → Simon (same set, same place), Done back to Exercises; the metronome clicks and
Done stops it; Settings' theme applies; a little score's ▶ plays and lights its keys; offline, the video block is a card.

The block "The visual review of the new top level" (2026-10-15, `design/2026-10-15-home/visual-review.md`; 26 checks, 18
of them failed on the build before the fixes, the 8 page-error ones passed): V10 a Wait for me lesson step played
round its loop is "played through" and done, one note only "tried"; V18/V17/V28/V12 at 320×568 and 844×390, the last
step of lesson 2 (Free play) is "visited" not "done ✓", the result says the lesson is done and offers the next lesson,
Again and the way on are in the fixed bar in view, Back from the result is the lesson page; V19 Back with Switch… open
closes only the sheet; V30 an earlier lesson not started is "Open"; V21 a reload in a lesson step comes back to it with
its choices (Wait for me, right hand, loop) and ← to the lesson page, a reload in Simon comes back to Simon and ← to
Practice; V27 Carry on reopens a logged Play along run with its mode, tempo and loop; V11 with every other host refused
(online), the video block is the card; owner's answers: a MusicXML exercise (Melody 1) opens on the score, and every
tool's way out is ← at the top left. Layout items (V01–V05, V08, V14–V16, V23, V26, V29, A3 keys) were measured with a
throwaway script (listed in the session notes), not committed.

The block "The re-check of the fix round" (2026-10-15; 11 checks, 4 of them failed on the build before the fixes):
V33 every way into a lesson step (the lesson page's Start, Home's Start, the result's Again and Next, Next lesson then
Start) has the address that a reload turns back into the step with its choices (Wait for me, right hand, looped) and ←
to the lesson page (Again and Next lost the lesson before); V31 opened straight into a step by its address, before the
first tap the screen says "Tap anywhere to start" and keys move nothing, after the tap the words go and keys move the
marker (before: no words); V32 a MusicXML exercise (Melody 1) opens in Wait for me and its row says so (before: Watch).
V34 (memorised marks on Music's rows at 390 and 320) and V02 (Home's tablet layout) were checked with a throwaway script.

The block "Owner's answer A3" (2026-10-15) opens a panel over each kind of thing that judges your keys and plays keys
behind it through the stand-in MIDI keyboard. Score, Play along (BWV 514, both hands), once with each panel (Tempo and
sound, Display, ⋯, Keyboard controls, Songs, ⓘ): started by its first note, two keys the score does not have played
behind the panel; it must be paused (not playing, the marker still), say "Paused while a panel was open", carry on from
the note at the marker, and log no wrong keys. Rhythm: paused, carries on. Wait for me and Memorise's waiting pass and
notes test: the right keys behind the panel do not move the marker (Memorise: and no hint lights in 3.5 s; without a
panel it lights by then), closed they do. Memorise's timed pass and notes + rhythm test (every bar marked learned in
storage first): behind Settings not playing and waiting for your turn again; closed, the first note starts it. Simon
(five notes): the wanted key behind Level counts nothing, closed it finishes the chain; Level opened just after the ✓:
no turn starts behind it, closed the chain is given again and it is your turn at chain 2. Drills: a notes-only card
played whole behind Level is still waiting, closed it comes out clean; a timed card (scales) whose clock runs does not
reach its result behind Level, closed it is back at the count-in. The lab (accompaniment, Roots, bar 1 looped so a
round is one bar): ⚙ opened in the second round leaves it paused with the clock still and keys behind it unplayed;
closed, it is in a count-in and then at the start of that round; the log has rounds 1 and 2 once each, round 2 judged
on what came after (all missed: the keys behind ⚙ did not count). Wait for me (left hand yours), the viewport turned
to 844×390 while the piano leads on to your next note: still running and your next notes move the marker. Control:
Watch plays on behind Tempo and sound. Run against the build before (`0d3267fd`, `--url`), the 20 A3 cases failed
(e.g. Play along still playing, the marker 2–3 notes on, 2 wrong keys logged; the lab stopped by ⚙; Wait for me ended
by turning); the control and the page-error cases passed, and so did every earlier case.

The block "A lesson or activity naming a catalogue piece" (owner, 2026-10-15; 17 checks) uses the test lesson
`test-catalogue-piece`, whose step names `u-de5f6a78874c` (Mary Had A Little Lamb in the catalogue). Fresh storage,
online: before Start the piece is not in the library and the step's card names it by its catalogue title; Start adds it
(one record and its file in `piano-library`, origin catalogue, the PDMX source, CC0) and opens it on the score with the
step in the address; the message line says it was added; Music lists it; deleted there, the next Start adds it again.
Two Starts 150 ms apart with the file held back 2 s (and the page's own saving for offline stopped at its sample list,
which also fetches the file): the file fetched once, one record, one screen, "added" said once, and ← comes back to the
step's result. Offline: a context with the service worker allowed, saved for offline, the network cut, then the step:
the piece added and opened. A score block naming it (the lesson swapped in) adds it and draws. A `u-` id in neither
(the lesson swapped in) and the file unreachable: said, the lesson page stays, nothing added, the step marks nothing.
Run against the code before (16c6f682 with the new lesson; `--url`), 10 of these failed ("there is no piece"); the
unknown-id case and the page-error ones passed there too. An overtaken launch cleared the newer Start's step (`lesson/page.ts`), so ← showed
no result: fixed with it; on a build with only that fix taken out, the "← comes back to the step's result" case fails
and the other 16 pass. The offline case marks its page as the installed app (`window.__pianoInstalled`, which main
needs before it saves for offline).

The block "The full PDMX set on the phone" (owner, 2026-10-15; 43 checks) runs on the small sample set
`web/tools/catalogue/full_set.py sample` makes outside the repo (default `../catalogue-work/full-sample/` beside the
repo folder, or `PIANO_PDMX_SAMPLE`; 300 files a kind, zips named and split 3 + 2 as the real ones), never the real
2 GB; without it the block prints one "skip" line. Each case is a plain phone tab (no permission granted), and the
zips are picked through the setup's own button: the mouse at the button, then the file chooser it opens. One visit:
before setup the tab offers the two choices; the three pdmx-a zips are copied whole into OPFS (`pdmx-full`, sizes
compared with the files) and rows are listed; the default is piano, most viewed first, none of the hidden flags'
files listed and the count exactly the sample's unflagged piano files; the chip's number is the sample's hidden piano
files; a row with *notes outside the piano* (found by searching its title) carries those words; the chip's sheet shows
*most bars empty* files again, labelled; a search lists exactly the rows whose title or composer has a word starting
so (counted from the sample's list); a row's page has the facts, the first bars drawn, the plain note, + Add and Open;
Open draws the score and ▶ plays it with nothing added to the library; a tempo changed is kept under its `u-` id; a
reload comes back to it; + Add tapped twice adds one record (origin catalogue, PDMX source, the list's licence), and
the piece is in Yours (the piece is one not in the catalogue, so its file can only have come from the zip); a piece in
both, added from the full set, shows added in the Catalogue tab; Settings says the size, and Remove deletes the folder,
the tab offers setup again and the added piece stays. Separately: `estimate()` mocked to 1 MB free: "Not enough room …
Nothing was copied" and no zip stored; a copy failed part way (`window.__pianoCopyHold` throws in pdmx-a2.zip): said,
the other two whole, that one not kept; all three picked again: only it copied (the others' write times unchanged);
the page reloaded in the middle of a copy (held there): pdmx-a1.zip kept, the other two asked for, then copied; offline
in a tab (service worker allowed, the network cut after setup, then a reload): rows listed, a page's first bars
drawn, Open draws the score; refused: a MusicXML file picked as a zip ("is not one of the full PDMX set’s zip files") and a pdmx-b zip picked for piano + lead sheets + melodies ("holds several-part scores, which you didn’t choose"), nothing copied; several parts added later (Add several parts… under the list): the Kind chip offers them,
only they listed, and their page has the several-parts warning.

Route changed, not a check (2026-10-15): Music's tabs now always show (the Full PDMX tab offers its setup), so the
"catalogue unreachable once" case looks at the Catalogue tab itself, which still shows only with a catalogue.

Shown failing: on the build before (`e167e673`, `--url`) all seven cases fail (there is no Full PDMX tab; each case
reports the step that stopped it and the run carries on). On the new build with a deliberate break (each restored
after): hidden flags not hidden: the default view, the chip's count, the sheet and the search fail; `estimate()`
ignored: not enough room fails; the score read without the zip: Open, the reload and offline fail; Remove doing
nothing: Remove fails; + Add fetching from the catalogue instead of the zip: + Add, in Yours and kept after Remove fail
(with the most viewed piece, which is in the catalogue too, + Add had passed: the case now uses a piece that is not);
copied zips not skipped: resumed fails; a zip marked copied before its bytes: interrupted and closed mid-copy fail.

The fix round after the full set's review (2026-10-15, `design/2026-10-15-pdmx-phone/visual-review.md`):
- Block "A piece that can't be drawn" (P01; 10 checks; no sample set needed). A plain tab, taps by position. One of the
  app's scores (mozart-k2) unreachable from the start (Music reads every score for its facts and keeps what it read),
  opened from Music after BWV 514 was drawn: no `#score svg` left, the screen says "could not be opened", and its Back
  (tapped where it shows) is Music; then served as text that is not MusicXML: "could not be drawn", from Music, from
  its page's Memorise, and by its address. The cause: a two-staff file with bars 3-6 whole rests in both staves (made
  in the check), added with + Add and opened upright: 8 notes, 8 bars, drawn. With the fixes taken out (the failure
  panel, the cleared drawing, multi-bar rests off and the guard in chunkRanges) 6 of the 8 fail (the two page-error
  checks pass), with the stale case showing BWV 514's 145 notes under "Minuet in F K. 2".
- In the full-set block: the hidden files are a link in the count line, not a chip ("24 hidden files ›"; owner's
  answer 1); the tab's number equals the list's pieces with every kind (P12); Title A–Z puts files with no title last
  (P11); showing a hidden flag says "7 flagged files shown, 17 hidden ›" in files (P05); after a reload into a piece
  opened from Full PDMX, ← comes back to Full PDMX with its search (P07); Settings' row says "Your browser may delete
  this copy…" while `persisted()` is false (owner's answer 2), and the setup says it in a tab and not in the installed
  app, and no longer "asked to be kept safe"; a set zip picked with Music's + Add says to use Full PDMX (P06); a small
  file's size is in KB (P03); Add several parts… is in the Kind sheet. With each fix taken out in turn (breaks2.py in
  the session notes), each of these checks fails; the layout items (P02 four rows sideways and at 320, P04 progress in
  view, P08, P09, P10, P13) were measured with throwaway scripts, listed in the session notes.
- Re-check (2026-10-15, P14, P15): after the failed draw, from Music and from Memorise, nothing to start is shown (the
  score's bottom bar and ▶, Memorise's panel and ▶ Start) and no key is lit (two checks); with the fix taken out, the
  score showed ▶ and 4 lit keys, Memorise its panel and 3 lit keys. Title A–Z over every kind sorts by each title from
  its first letter or digit and opens on a real title, and every sample title with no letter or digit is flagged
  "no title" by full_set.py (two checks); with the phone's rule taken out the sort opened on "[ID 1-138a]" and failed.

The block "Fix round of the final reviews" (2026-10-15; `design/2026-10-15-final-review/fixes.md`; 51 checks) runs
each case in a plain phone tab (touch, no MIDI permission; one case `isMobile`, as the tour ran) with taps by position,
and the stand-in keyboard where a keyboard is the point (one input, or none: MIDI allowed, none connected). Cases: a
step's Wait for me run logged, a reload, then ←: the run counts (F15); Back while Memorise's score is held 4 s: Memorise
stays shut (F08); Edit fingering, Back, another piece: its play controls (F01); a Play along run stopped by a tap logs
`fromBar`/`toBar` (interfaces F9) and Loop during a run logs it with its summary (F02); a band MIDI's file replaced by
one with no band: no band (F09); Memorise on an exercise score survives a reload (F18); a step's Drills, Practise as…
Simon and back: the step's 5 cards, and the address follows (F22, F11), and a reload after Practise as… is Simon (F11);
feedback tapped and cleared leaves no entry (F05); Switch… from a step's result: no Open for its own lesson, the chosen
lesson takes the lesson page's place, Back is Home (F13); Free play's big name for C3+E5, C4+C5, C4+E4 (F16); a set file
aborted the first time Drills opens is there the next (F20); Play along and Rhythm with MIDI not allowed or no keyboard
say so and start nothing, and Drills' Ready says there is nothing to play on only with no keyboard and no keys on the
screen (F17; owner, 2026-10-15: four states, no keys with MIDI not allowed or none connected, the keys shown, a keyboard;
the old line, said with the keys showing too, failed it); a reload in the PDF reader comes back to the PDF (F12);
sideways, Rename under the "Added" toast takes the tap (F14); a deleted piece leaves Home's recent list and its old link
names no id (F19); Memorise's opening line follows Settings (F21); BWV 514's two-parts warning not on Home and the tabs,
still where it opens (tour); Ladder's bar picking ended by choosing Play along (tour); a backup of version 99 refused,
nothing merged (interfaces F6); Back during Play along: Home, no summary, the run logged (owner, F04); a Play along run
to Melody 1's end logged `reachedEnd` (owner, Q5); Wait for me sideways with no keyboard says the owner's line, no keys
(owner); a restore joins Memorise's learned bars from both phones (owner). Run alone (the file's preamble and this
block) against the build of 7aba56a3 (`--url`): 29 of the 51 failed, every case above (the other 22: 21 "no page
errors" lines and F15's setup line); this build: all 51 passed. The BWV 514 case runs `isMobile`, adds one resize and
records every text the message line shows: its earlier forms passed on the old build in some runs.

The block "Teaching the app" (owner, 2026-10-15; `docs/app-features.md` §7d; 36 checks) runs each case in a plain phone
tab (touch, no MIDI permission) with taps by position, the stand-in keyboard only where a keyboard is the point (Simon
with one connected). Cases: the tap-to-stop tip shows as a run's bars fade, a tap where the tip sits stops the run (the
message line takes no tap), the tip is stored as used and the next run says nothing, Settings → Show tips again brings it
back; shown on 3 runs stopped by Back and not the 4th; after an update (`window.__pianoHintSince` makes the tip newer) a
tip already used stays used, the newer one shows once and is stored at its new version; each mode's line when picked;
the hands label Piano:/You: at 390×844, 320×568, 844×390 and 820×1180 with every bar control on screen; Simon's Ready line
only with no keyboard and no keys on screen; Wait for me turned sideways mid-run with no keyboard says the owner's line,
and upright again it goes; the install card in a tab with the menu words, Install after a faked `beforeinstallprompt`
(its default stopped, the prompt called), gone after `appinstalled` and a reload, ✕ kept through a reload, none in the
installed app (`window.__pianoInstalled`); How the app works from Settings with every section, Back closing only it;
How this screen works from the score, Memorise, Simon, Drills, the lab, Free play, the metronome, the PDF reader, Music,
Home, Practice, Path and a lesson page, each opening its own section marked and in view; Back from the help over the
score; the hint store made by a run in a backup zip and back after a restore; on a phone (`isMobile`) with a resize after
opening, the two-parts warning and an activity's title still on the message line. Run alone (the file's preamble and
this block) against the build of 52e5a51a (`--url`): 22 of the 36 failed, every case above (the other 14 are the
"no page errors" lines); this build: all 36 passed.

The block "Reference videos as rows" (owner, 2026-10-16; `docs/app-features.md` §8c; 10 checks) uses the two
`"size": "row"` videos at the end of the test lesson "Test: the Minuet's opening", in a plain phone tab (touch, no MIDI
permission) with taps by position (the touchscreen at the row's middle). YouTube's still and player are answered by the
check (a 1-pixel picture, an empty page), so it needs no network. Cases: the two rows are drawn as rows (no player,
44–110 px tall) in one list under the heading "Videos", the last thing in the lesson, while the full video above is
still a player; a tap on the first plays it in place (an iframe on www.youtube-nocookie.com with its start, 120) and the
second stays a row; ✕ Close turns it back into a row; opening the first and then the second leaves only the second
playing (start 240); offline, each row stays one compact row (44–90 px, no still: its title, the "internet" note and
the watch link with its start), and a playable row again when back online; with YouTube's hosts refused while online,
each row is the compact row with the "can't be reached" note; no page errors in each. Run
against a build with only the reader's new field (rows drawn as full players): the 7 checks of what is drawn failed, the
3 page-error checks passed; this build: all pass. The compact offline row (2026-10-16): the offline and unreachable
cases failed on the build with the full-size card in each row (173 and 196 px), and pass now.

The block "Lesson 1's app pieces" (2026-10-16; `docs/app-features.md` §3, §8b `keys`, §8c test rungs; 40 checks) runs
in a plain phone tab (touch, no MIDI permission), upright at 360×780 and 390×844, with taps by position: the mouse at a
key's centre and 12 px either side of it, as a finger lands (a key about 30 px wide, the lesson plan's goal, takes a tap
anywhere in its middle 24 px). The lesson's own content is written separately, so the check serves its activities
(`check-l1-freeplay`: Free play, keys C4–E5; `check-l1-simon`: Simon at rung 0, keys C4–B4) and a set of the five
black keys of C4–B4 (`check-black`). Free play: exactly C4–E5 drawn and labelled; every black key at least 29 px wide
and on top at its centre; every group of two and of three tapped in turn (C♯ D♯, F♯ G♯ A♯, C♯ D♯), each at the
centre and ±12 px, shows that key pressed and no other; › moves to C5–E6; the keyboard is at least 40% of the
height tall (328 px at 360×780; it had been 108 px: a style overridden by mistake, fixed 2026-10-16). Simon: exactly C4–B4 drawn, black keys at
least 29 px; the Level panel offers "0 Keys + sound, no music"; a chain of 3 played back by tapping the lit keys by
position (alternating centre, −12, +12), each wanted key seen lit while given, Best 3; no staff drawn at any point.
No note names at rung 0 (decided 2026-10-16): Simon (`check-l1-simonnames`, again from the miss) through chain 1, the
first of chain 2 right, a wrong key, the chain given again and the turn from the miss, and Drills (`check-l1-drills`,
one card) through a wrong key, Skip and the set's results: the exercise screen's text never holds a letter with an
octave or with ♯/♭; the miss says "Not that one: the right key is outlined" and the right key is outlined. On a build
of this code with only the names put back (scratch): both fail (the keys' "C4" label, a dot "A♯", "Wanted G♯4 · you
played D4", "1. F♯4: …").
The score (`check-l1-score`: K. 2, right hand, bars 1–4, Wait for me, keys C5–B5 upright): the range is fixed for the
run, C5–B5 with every key the right hand plays in bars 1–4 (E4–B5), the same at every step of bars 1–4 with every key
played on it; in Play along the screen's own keys.
Test rungs (`learnerContext`: a context without the test flag): the shipped content shows no "Test:" on Path or Home;
with a placeholder real rung served by the check and a saved current lesson that is a hidden test lesson, Home's Up next
is the real lesson, Path shows the real rung only, and `piano-web.path.v1` is unchanged; with the flag (every other
context in the file, wrapped once at the top), Path shows the test rung as before. Run alone against the build of
f506b240 (`--url`): 28 of the 40 failed (the activities with `keys` refused, no rung 0, the learner shown the test
lesson); the controls that passed: page errors, the saved progress, the checks' view. Also run there, by a throwaway
copy with the old keyboard (Free play from `?tool=freeplay`, C3–C5; Simon at rung 1 without keys, C4–C6): black keys
14.4 px at 360 and 15.6 px at 390; taps at a black key's centre hit it, taps 12 px off land on the white keys beside it
(C♯3 −12 → C3, +12 → D3), and the Simon chain ended at Best 1 (C♯4 → C4). On the build of the first round (keys that grew during a run, names at rung 0, Free play's 108 px): 6 failed (the
two heights, the two score lines, the two names lines). This build: all 40 pass.

### Rhythm sets in Drills (2026-10-16; `node tests/browser.mjs --only rhythm`)

A plain phone tab (touch, no MIDI permission), taps by position: pointer events sent to what lies at the pad's centre
(`elementFromPoint`), timed in the page from the app's own schedule (`__pianoDebug.drill()`: the card's steps, the clock
and the delay it takes off for what is heard), each held 90% of its room. Activities are served by the check.
- 360×780: the pad shown, full width, 328 px tall (`min(42vh, 360px)`), on top at four points, no keyboard; the Level
  panel without rung 4 and "notes only", its words saying the pad; Practise as… without Simon, saying why; a card at rung
  3 tapped on the beat, holding the halves, clean; every tap's sound started within 20 ms of its pointerdown (measured
  0.1–0.5 ms); the card drawn with one staff line; a card with its second note 250 ms late "Not quite · 1 note late",
  one amber mark, no note name.
- The first tap: on Ready, one tap (rung 3, starting on the first note) starts the set and the card's clock; all notes but
  the last tapped from there leave exactly "1 note missed"; a tap on the result goes on to card 2, its clock started.
- The timing check: with none kept, a card tapped 180 ms after the clock is late (the headless browser reports 58 ms);
  the check offered on the first visit, run by position on its pad with taps 180 ms after each click, keeps about 180
  (179 measured); then the same 180 ms taps come out clean; the offer is not made again.
- Rung 0: the steady-beat card's eight quarters light the pad eight times as it plays, no staff.
- 844×390 and 820×1180: the pad shown (828×117, 804×360), on top, inside the screen, no keyboard; a tap presses it and
  sounds; a card tapped by position clean.
- For the report: in a set of notes, an on-screen key tapped by position starts an audio source (the piano); the first
  key of a visit fetches the samples and sounds only if still held when they arrive.
Screenshots when `RHYTHM_SHOTS` names a folder.

### The consistency pass (2026-10-16; `node tests/browser.mjs --only consistency`)

The owner's cross-app pass (`docs/app-features.md` §7e). Plain phone tabs (touch, no MIDI permission) tapped by position
(off a key's centre), and a stand-in MIDI keyboard (`window.__key`) where keys matter; the test lessons
`test-minuet-opening`, `test-chords-and-band` and `test-consistency` (Memorise, Watch and a `names: false` Drills step).
Screenshots in `web/r3shots-consistency/` (360×780 and 844×390).
- One set of marks: a Drills card (first note on time, the next two 320 ms late, the rest left), a score Play along run
  round its loop and a Memorise pass with a hint and a wrong key: grey notes ringed (`.slip-ring`), orange ones, none
  green, the same one-line key; the missed keys outlined `rgb(37, 99, 235)`; with `names: false` no note named in the
  card's words or on the keys. At 360×780 and 844×390 (the score's one-line layout draws through `<use>` from
  `#score-src`, outside `#score`: counted there).
- The score's strip: shown at the end of the run, no dialog open, Back to the lesson in a step, "a key starts the next
  run" with a keyboard; a key (after the settle) starts the next run, the strip and marks gone; the step's result calls
  the Play along run practice for a Wait for me step. Wait for me round its bars, stopped: the strip, and the highest
  edge key goes back: played through.
- The task line on the score, Memorise, Simon, Drills, the lab and Free play, one `.step-task` style; "Practice now: not
  counted for the step" after another mode (score), set (Simon), help level (Drills, gone when changed back) and part (lab).
- Back to the lesson at a step's end: Drills' Set done (tap), Memorise's chunk learned (a key), the lab's result (a key,
  its count-in started by a key on its steps), the score's strip (Watch to the end; Wait for me by the highest key).
- The step's result page by the edge keys: lowest Again, highest Next; the lesson page takes none.
- The one-time keyboard hint (a learner's context, where the other sections' `__pianoNoKeyboardHint` is not set): shown
  when a keyboard first connects, Not now for good (also after a reload), Set them up opens Keyboard controls asking for
  the lowest key, never without a keyboard.
- Visited only after a key: Free play left at once "Opened, nothing played" (not marked), with a key tapped visited;
  Watch left at once, then heard to the end (stops after one round in a step, the strip with Back to the lesson).
- The marks' contrast read back from a screenshot of a card (light and dark themes): grey and orange at least 3:1
  against the paper beside them.
