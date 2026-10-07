# Seam (DRAFT, not dispatched): Blues Riff in C, the two-staff teaching edition

ability: A7a.1
requirement: `A7a1-bluesriff-restaff` (`docs/review/responses/a7a-drafts.md` §8, binding)
chain record: `docs/chains/A7a.1.yaml` (steps 7-9 name this edition; this seam changes no step)

Drafted 2026-10-07 by the A7a.1 probe from the facts under `docs/prompts/runs/A7a1/`, at base 523e5b65. Not reviewed, not dispatched. The orchestrator writes the dispatch sha here and reviews the three design decisions at the end (`two-gates-per-task`: design decisions only) before dispatch. Harness: `operating-procedure.md` §14, cited and not restated. Report: §11 and §12.

---

## Decision rationale (operating-procedure §10b)

- **Learner problem.** The chain's full-form TRANSFER (steps 7-9) needs a riff the learner plays in the right hand over roots in the left, all twelve bars. The source cannot be played as it is: it is three parts (Piano on two staves, Riff, Drumset), and the converter puts the riff, the rootless voicings and the drums on one treble staff (VERIFIED below). So no playable edition exists.
- **Solution classes considered.**
  1. *The converter as it is.* Rejected by fact: its upper staff holds 57 riff heads, 36 voicing heads and 144 unpitched drum heads (`converter-report.json`).
  2. *The excerpt cutter with `selection: right` on a built file.* Rejected: the cutter reads the parent's *built* file, where riff, voicings and drums are already merged on staff 1 as voices; a selection by staff keeps all three, and one by voice number would depend on the converter's voice numbering, not on the source's part identity.
  3. *A hand-written score module that types the riff and roots again* (`content/scores/authored/*.py`). Rejected: a second, retyped copy of the notes, faithful only by comparison, and the catalogue would label a third party's notes as this repository's score.
  4. *A raw-XML text filter* (delete part P3 and the Piano's staff-1 notes from the source XML). Not taken: removing staff-1 notes inside a two-staff part means rewriting `<backup>`/`<forward>` arithmetic by hand, the most error-prone step there is; the converter's own parser already splits the staves into separate parts.
  5. **A source-side part selection before normalisation**: parse the raw member with the converter's own parser (`convert.parse_source`), keep the part `Riff` and the Piano's lower staff (`P1-Staff2`), drop the Piano's upper staff (`P1-Staff1`) and `Drumset`, then run the unchanged `convert.normalise` and `write_mxl`. **Chosen.** It adds one small module, reuses the converter whole, and leaves the source untouched. The verifier (CK-7 extended) is an independent reader, never music21.
- **Why the chosen class.** The ruling's shape exactly (§8): upper staff the source riff events, lower staff the source root events, pitch, onset, duration, bar position and written B naturals preserved, voicings omitted, source intact. With two parts left, `collapse_to_two` merges nothing (`tools/content/convert.py:597-626`: `len(parts) <= 2` returns them as they are) and `order_as_grand_staff` puts the treble-clef riff above the bass-clef roots (`:393-410`).
- **What would reverse it.** The normalised edition fails CK-7 (a riff or root event changed, added or lost) in a way the module cannot avoid without editing `convert.py`; or the reviewer chooses catalogue route (b) below, which changes where the module lives but not the selection.
- **Real problem or proxy.** Real: the learner-facing file for steps 7-9. Placement stays out (waits on `A7a-hands-both-requirement` too, ruling §11).
- **Remaining uncertainty.** The B naturals are kept as written; what they do musically is not decided by anyone here (`ABILITY-MAP.md:316`). How any of it sounds: *unverified as music*.

## Goal

- **The reviewer's words** (§8): "Build a separate teaching edition rather than mutating the source ... upper staff: the source riff events; lower staff: the source root-bass events; preserve pitch, onset, duration, bar position and written B naturals exactly; omit the source's additional rootless piano voicings ... The re-staffing verifier must compare the selected source riff and root events bar-for-bar/event-for-event against the new edition, and mutation cases must catch a changed/missing pitch, onset or duration."
- **The writer's words.** One two-staff piano file whose every sounding event is a source riff event (staff 1) or a source root event (staff 2), and every such source event is in it; a checker, independent of the code that made the file, that says so and fails on each named mutation; the item buildable and openable in the personal library.

## Status labels

VERIFIED (observed by the probe on 2026-10-07; the builder re-checks), HYPOTHESIS (with its refuting test), OPEN, SETTLED, OUT OF SCOPE.

## Facts the seam rests on

All from the raw member, PDMX CID `Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi`, archive member `mxl/1/6/Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi.mxl`, sha256 `69d5bb7ee0e3cd6ff1aed15863a4d6340538a50b0108661b7657bd0d1b877481` (two streamings of the tarball, equal). A copy is kept at `docs/prompts/runs/A7a1/source/` with the same hash.

- **VERIFIED, the source's parts** (raw XML and music21, `readers.json`, `converter-report.json`): `P1` "Piano", two staves (`<staves>2</staves>`, clefs G2 and F4), staff 1 one three-note whole-note chord a bar (36 heads), staff 2 one whole-note root a bar (12 heads); `P2` "Riff", one staff, clef G2, 52 pitched events with 57 heads and 6 rests; `P3` "Drumset", percussion clef, 120 unpitched events with 144 heads and 48 rests. 12 bars of 4/4, `<divisions>16</divisions>`, key fifths 0, no `<harmony>`, no tempo mark (no `<metronome>`, no `<sound tempo>`), no repeat or ending, a final light-heavy barline, dynamics pp (Piano), mf (Riff), mp (Drumset), no tie in any part.
- **VERIFIED, two readers agree on every event**: reader A, a raw MusicXML walk (ElementTree; divisions, durations, backup, forward, chord flag, staff), and reader B, music21, agree on all 249 heads and 54 rests as (role, bar, onset, duration, spelled pitch, tie) (`readers.py`, `readers.json`).
- **VERIFIED, the table the edition must equal** (`event-table.md`, reader A, reader B agreeing):

| Bar | Plan | Lower staff: roots | Upper staff: riff | Omitted: voicing | Omitted: drum heads |
| --- | --- | --- | --- | --- | --- |
| 1 | I | C2:w@1 | C5:h.@1 Eb5:q@4 | Bb3+E4+G4:w@1 | 12 |
| 2 | I | C2:w@1 | F5:q.@1 G5:q@2.5 G5:8@3.5 F5:8.@4 r:16@4.75 | Bb3+E4+G4:w@1 | 12 |
| 3 | I | C2:w@1 | C5:q@1 B4:q@2 B4:q@3 B4:q@4 | Bb3+E4+G4:w@1 | 12 |
| 4 | I | C2:w@1 | B4:q@1 B4:q@2 B4:q@3 B4:q@4 | Bb3+E4+G4:w@1 | 12 |
| 5 | IV | F2:w@1 | C5:h.@1 Eb5:q@4 | Eb4+A4+C5:w@1 | 12 |
| 6 | IV | F2:w@1 | F5:q.@1 G5:q@2.5 G5:8@3.5 F5:8.@4 r:16@4.75 | Eb4+A4+C5:w@1 | 12 |
| 7 | I | C2:w@1 | C5:q@1 B4:q@2 B4:q@3 B4:q@4 | Bb3+E4+G4:w@1 | 12 |
| 8 | I | C2:w@1 | B4:q@1 B4:q@2 B4:q@3 B4:q@4 | Bb3+E4+G4:w@1 | 12 |
| 9 | V | G2:w@1 | C5:8.@1 C6:16@1.75 Bb5:8@2 G5:8@2.5 F5:8@3 G5:8.@3.5 Eb5:16@4.25 F5:8@4.5 | F4+B4+D5:w@1 | 12 |
| 10 | IV | F2:w@1 | Bb4:8.@1 C5:16@1.75 G5:16@2 r:16@2.25 F5:16@2.5 F5:16@2.75 Eb5:16@3 r:16@3.25 C4+C5:16@3.5 Eb4+Eb5:16@3.75 Eb4+Eb5:16@4 r:16@4.25 F4+F5:16..@4.5 C4+C5:64@4.9375 | Eb4+A4+C5:w@1 | 12 |
| 11 | I | C2:w@1 | C5:h.@1 r:q@4 | Bb3+E4+G4:w@1 | 12 |
| 12 | I | C2:w@1 | B4:q@1 B4:q@2 B4:q@3 B4:q@4 | Bb3+E4+G4:w@1 | 12 |

  `head:value@beat`; `+` heads struck together; w h. h q. q 8. 8 16.. 16 64; `r` a rest. Totals: roots 12, riff 57 heads and 6 rests.
- **VERIFIED, the B naturals and B flats** (both readers): the riff holds B4 eighteen times, bars 3 (beats 2-4), 4 (1-4), 7 (2-4), 8 (1-4) and 12 (1-4), each over the C7 voicing's Bb3; the riff's B flats are Bb5 in bar 9 beat 2 (over the G7 voicing's B4) and Bb4 in bar 10 beat 1. The voicings are rootless sevenths: over each root, the third, fifth and minor seventh (C: Bb-E-G; F: Eb-A-C; G: F-B-D). Bar 12 is I (root C2), where the C shuffle prints G7.
- **VERIFIED, what the converter does today** (`convert.convert_file` on the raw member, `converter-report.json`, `gates_br.out`): music21 reads four parts (the Piano's two staves as `PartStaff`s, Riff, Drumset); `collapse_to_two` writes "merged 4 parts into 2 staves by register": staff 1 = riff (57) + voicings (36) + drums (144 unpitched heads, kept as `<unpitched>`), staff 2 = roots (12); every converted event matches a source event by bar, onset, duration and pitch, and the staff-free pitch sets are equal (105 = 105). It adds 96 bpm ("no tempo in source"). The quarry's gate 2 rejects it ("round trip lost 57 note(s) and gained 57"): `pitch_multiset` keys the staff by part index, and the riff moved from part 3 to staff 1. A labelling result, not a lost note.
- **H1 (the mechanism), VERIFIED in scratch by one reader; the builder re-runs it.** `convert.normalise` on the score with only `Riff` and `P1-Staff2` left writes one part on two staves (clefs G2, F4), the riff alone on staff 1 and the roots alone on staff 2; its only note is "no tempo in source; added 96 bpm" (no merge); a raw MusicXML walk of the written file finds 69 sounding heads equal, as (staff, bar, onset, duration, spelled pitch), to the source's 57 riff and 12 root heads, nothing extra, no `<unpitched>`, and the riff's 6 rests at their source onsets (`docs/prompts/runs/A7a1/h1_scratch.py`, `h1_scratch.out`; the scratch file was not kept). *Refuted by* the builder's re-run disagreeing, or by the independent checker of Station 2.
- **HYPOTHESIS H2 (the quarry's gate 2 on the edition).** `round_trip_ok` against the *selected* source score (the two kept parts, in that order) passes; against the raw file it fails by construction (the omitted heads). The seam uses the first and says why.
- **VERIFIED, the tempo.** The file has no tempo; the PDMX CSV title is "Blues Riff in C (120 bpm)", a metadata string (the work title in the file is "Blues Riff in C"). The converter's 96 applies and the row is tempo-defaulted, as Blue Bossa's is, unless the reviewer rules otherwise (decision 3).
- **VERIFIED, the credits** (raw XML): work title "Blues Riff in C"; credit words "Berklee School of Music - Developing Your Musicanship" (sic) and "Daniels Elizabeth Calvin"; `<rights>05/19/2016</rights>`; encoded by MuseScore 3.6.2. Who wrote the riff is UNKNOWN; the credit line names a course, not a composer.
- **HYPOTHESIS H3 (what the app can measure).** The bar-10 sixty-fourth (C4+C5 at beat 4.9375) lasts 39 ms at 96 bpm, inside Keep tempo's 150 ms window (MODE-SHEET §2), so its rhythm is not measured; the right hand's octaves in sixteenths (bar 10) are the riff's widest demand. *Refuted by* the untaught-options probe on the built item (Station 4).

## Stations

### Station 1: the edition

**Do.** A new module (route per decision 1) that: reads the source by its pinned sha256 (refuse on mismatch); parses it with `convert.parse_source`; keeps the parts whose ids are `Riff` and `P1-Staff2`, by id and never by position or name heuristics; refuses if either is missing or a third pitched part remains; runs `convert.normalise(score, keep_lyrics=False, tempo_bpm=None)` and `write_mxl`; returns the conversion notes. No change to `convert.py`.

**Acceptance.** H1 re-run and stated; the edition's sha256 recorded; two staves; no `<unpitched>` element, no percussion clef, no voicing pitch at a voicing's onset on either staff (all read from the written file, not from the module's objects).

**Stop.** H1 refuted in a way only an edit to `convert.py` would fix: report, do not edit it.

### Station 2: CK-7 extended to a re-staffing (the verifier)

**Do.** A checker, independent of the module: a raw MusicXML walk (the probe's reader A, `docs/prompts/runs/A7a1/readers.py`, is the starting point) or partitura (CK-7's named reader, `INTAKE-GATE.md` G15 reuse table); never music21, which made the file. It reads the source's `Riff` and `P1` staff-2 events and the edition's staff-1 and staff-2 events as (bar, onset, duration, spelled pitch, tie) and requires: staff 1 equals the riff multiset; staff 2 equals the roots multiset; no other sounding event; the written spellings equal (B4 stays B4, never C♭5 or B♭4); bar count 12 and 4/4 in every bar. Rests: the riff's 6 rests at their onsets; any rest the converter adds is listed with its bar and must not move an onset.

**Mutation cases, each must fail** (fixtures written by script from the edition, never hand-edited): (1) one B4 in bar 3 changed to Bb4; (2) one riff head deleted (bar 10's C4 of the sixty-fourth); (3) one onset moved a sixteenth (bar 9's C6); (4) one duration changed (bar 10's F4+F5 double-dotted sixteenth to a dotted sixteenth); (5) one voicing head added to staff 1 (bar 1 E4); (6) one drum head added; (7) a root moved an octave (bar 5 F2 to F3); (8) bar 12's root changed to G2 (the shuffle's plan); (9) the staves swapped. And one case that must pass: the edition as written.

**Acceptance.** Edition passes; nine mutants fail, each naming its bar and event.

### Station 3: catalogue admission (route per decision 1)

**Do.** The edition into the personal library by the decided route; the build (`build.py --offline --render --personal`, or the npm content build); the render check on the lane's own port (not 4173), one item; G13 (both hashes, plus the edition's derivation from the source hash) and G14. Update the intake record `intake/Qmb7mkEf….md`: Personal library admission, G10, G13, G14, and a line naming the edition's identity under its claim checks (they hold only while that identity holds; re-run `readers.py` against it).

**Acceptance.** The item builds, opens and renders every cursor step; `hands` both; the checker green in the build or the content suite (decision 2 says which).

### Station 4: measured demands, for placement (no placement)

The untaught-options probe on the scratch build for blues.8 with the edition as a song option; report the demands it names. Do not edit a stage file or lesson.

## Decisions for the reviewer before dispatch

1. **Catalogue route.** (a) A `content/sources/pdmx.json` row whose `file` is the edition, `rawSha256` the source member's, `convertedSha256` the edition's, plus a validated `derivation` block (`{kind: "restaff", sourceSha256, keep: ["Riff", "P1-Staff2"], omit: ["P1-Staff1", "Drumset"], tool}`): the provenance stays the PDMX upload's and says what was done; cost, a schema field read by `import_pdmx.py` (a builder stops on a schema change unless the brief owns it). (b) An authored module under `content/scores/authored/` that loads the committed source and re-staffs at build: no schema change, but the row's source and hand provenance would read "this repository's score" (`build.py:596-609`), a false attribution. **The writer's recommendation: (a)**, because (b) states a false source.
2. **Where the source lives.** The checker must run in CI, which has no archive. (i) Commit the raw member (5,629 bytes) beside the edition (e.g. `content/scores/pdmx/source/<cid>.mxl`) and have the build verify its sha; (ii) keep it only under the probe's evidence and run the checker locally. **Recommendation: (i)**; it also makes the edition rebuildable. Either way the source is never edited.
3. **Tempo.** The converter's 96, tempo-defaulted (the file states none), or 120 from the PDMX title string (metadata, not notation). **Recommendation: 96, defaulted**, the rule every other admission follows; the lesson may name 120 as the uploader's title, not as the score's marking.

## Files

**Owned:** the re-staffing module (route a: `tools/content/pdmx/restaff.py`, new); its test and the mutants (`tools/content/tests/test_restaff.py`, fixtures written by script); route a's schema field in `import_pdmx.py` and its validation; one `pdmx.json` row by the guarded text splice (CLAUDE.md); the edition `.mxl` and, by decision 2, the source copy; the intake record's lines named in Station 3; `docs/08-test-map.md` one row; `docs/chains/A7a.1.yaml` header lines only.

**Not to touch:** `convert.py`, `quarry.py`, `excerpts.py`; every app file; stage files and lessons; `verified-facts.json`; `check_chains.py` (AID1's); the chart screen (PH2's); `rungState.ts` (HB1's).

## Out of scope

Placement; the lesson; the both-hands requirement (`A7a-hands-both-requirement`); what the B natural does musically (it stays as written, `ABILITY-MAP.md:316`); any listening claim; copyright and export.
