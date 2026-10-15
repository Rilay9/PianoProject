# What each check does

Keep this list current (owner, 2026-10-13): when a case is added, changed or removed, or the code a check covers
changes what it means, update its line here in the same commit, so a check can't quietly test something that
no longer exists.

| Check | Run | Covers | Cases |
|---|---|---|---|
| `scoring.mjs` | `npm run check:scoring` | Play along and Rhythm judging (`src/matching.ts`), including let go early (`src/holds.ts` rules); every count compared, and where named which notes are painted and which presses are wrong (2026-10-14) | 17 (16 judging cases and the pedal-holds block) |
| `lab-judge.mjs` | `npm run check:lab` | The accompaniment lab's chord judging (`src/lab/judge.ts`), the sentence the learner reads after a red chord (`sayHit`), the Roots step with other chord notes and outside keys, and improvising's notes from the lab's own guides (2026-10-14) | 32 |
| `activity.mjs` | `npm run check:activity` | Activity files (`src/activity.ts`): every file in `public/content/activities` reads and is in its index; the piece, set or chart each names exists and its bars are inside the piece; what one of each kind reads to; mistakes are refused with their reason (2026-10-14: index, names, read results, four more refusals) | 40 today (the count is printed) |
| `midi.mjs` | `npm run check:midi` | The MIDI → MusicXML converter (`src/library/midi/`), ported from the old app with its unit tests; parity against the old Python converter's recorded answers (`fixtures/midi/parity/`); bars from every time signature, the file's keys, played files told apart, and where every note lands read by the check's own parser, voices, swing, drums, repeated strikes and lengths (2026-10-14), a band file's parts and picking them, beams, held notes, the pedal, count-ins and a default C major (2026-10-15), a channel that changes instrument and a one-track file's part names (review B7-01/02), releases as a player lets the keys go and the check's staff and length (review M1–M3, B3-03), a played file with the pedal written one voice a hand and a notation export's gate undone (owner's answers A5, A6), rests that show the beat | 205 (+ 6 old cases and 4 parity hand splits not applicable, printed as skipped with the reason) |
| `readability.mjs` | `npm run check:readability` (in `npm run check`) | How cluttered the MIDI converter's scores are (2026-10-15): per score, rests (one voice's rests drawn one after another are one), short rests, rests drawn on another voice's notes, rests hiding the beat, voices beyond one a staff, ties, tuplets, 32nds, counted from the MusicXML (rest symbols printed, not guarded); six catalogue scores (`public/catalogue`) made into MIDI as a notation program exports them and as a player lets the keys go, and the owner's two songs when `PIANO_SONGS` names their folder (never committed); fails when any count rises above the recorded one, or fewer of a catalogue conversion's notes are as the engraving writes them (`--record` prints new records) | the counting on a hand-built bar + 12 conversions (14 with the songs) |
| `pdf.mjs` | `npm run check:pdf` | The PDF reader's modules (`src/pdf/`): finding the lines (systems) on a page, reworked 2026-10-14; cuts, page cache, detection order (ported from the old app); six generated PDF pages, a page stored as JPEG 2000 (`fixtures/pdf/jpx.pdf`, made by `make-jpx-pdf.py`) and the old fixture through pdf.js's Node build with its JPEG 2000 decoder (fails if its canvas library cannot load); adding and removing a line keeps the other lines' splits (2026-10-14) | 58 (+ 7 old screen cases printed as skipped, with the reason) |
| `notes-match.mjs` | `npm run check:notes` | The pitches the score screen draws in each bar (spelled, sorted) are the file's, for every song in `public/scores`, and for the three committed MIDI fixtures as the app converts them; not where in the bar, how long, or which staff; every run also changes one note in the app's copy of the first song and must catch it (builds, serves on :5193, refuses if the port already answers; `PIANO_CHROMIUM` names a browser when Playwright's own is not installed) | one per song + 3 converted + the caught change; `--corrupt` must fail |
| `browser.mjs` | `npm run check:browser` | In the built app at phone size: backups (every file in the zip, a missing file named, an unreadable library refused), a slow PDF open overtaken, the Adjust handles by keyboard, a band file imported and played (the sheet's Band row, the panel's band, each part handed its notes as the song's clock reaches them, none when switched off; a band file with no piano part: the guessed parts, ticking others converts again, the choice kept with the piece and its band played), the first ▶ tapped while the band is still being read (it waits for it; a stop meanwhile is kept), a split placed by hand kept through + line, the lengths the judges are given (staccato, a slur end, a note before a rest) as the score screen decides them, + Add tapped twice, the catalogue asked for again, a Memorise start from a visit that was left; review 2026-10-15 (S2): a restore putting back files lost from records still there, taps while a PDF opens, a deleted PDF's saved state, the two-pane highlight, a score file and a chart unreachable once; with a stand-in MIDI keyboard (2026-10-15): Hands changed mid-run and while paused, a key behind Simon's and Drills' Level panel, an activity whose piece is missing or whose open was overtaken, a mouse let go off the on-screen keys (builds, serves on :5194; `--url` checks a build served elsewhere; `PIANO_CHROMIUM` as for check:notes) | 54 |
| `wake.mjs` | `npm run check:wake` | The screen wake lock (`src/wake.ts`): a lock granted after you left is let go; one request at a time | 4 |
| `practice.mjs` | `npm run check:practice` | The Play along judge (`src/practice.ts`) around a mash: none of its keys counted as wrong keys, a right note inside it still counted | 4 |
| `exercise.mjs` | `npm run check:exercise` | The exercise screen's judges driven with stand-ins (2026-10-15): a timed name-only Drill card holds the key pressed, not the written octave's; Simon's best is the whole chain played in one go, not one finished from the miss | 10 |

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

## exercise.mjs

- Drills, name only and timed (a C4 half note at 80): C5 let go after 100 ms is let go early, held 1400 ms is clean;
  the same for C4 (controls); at rung 3 a C5 is a wrong key and the C4 missed. The first fails before 2026-10-15 (the
  hold was looked up by the written C4, found nothing, and counted as held).
- Simon, a five-note passage read from the music: chains 1-3 whole are bests 1-3; chain 4 missed at its last item and
  finished from there (the replay asks for that item only) is not a best of 4 nor the game's longest; chain 5 whole is
  a best of 5; with "the whole chain again" chain 4 replayed whole is a best of 4. The third fails before 2026-10-15.

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
