# The score-intake gate: the plan's first section

Drafted 2026-10-06 at HEAD 72c1b1b9. **Status: specified, not yet run end to end on a real item.** Every repertoire row in the plan stays CANDIDATE until it passes this gate. The first run is one public-domain row, Bizet's Habanera as the habanera model for a new latin.4 at Stage 4 (`briefs/probe-latin4-bizet.md`). The repeatable path is drawn from that run (section (e)), not designed ahead of it.

Copyright and public export are out of scope by the owner's decision (2026-10-05). They gate nothing here. The licence fields stay in the data because `import_pdmx.py` reads them; their values decide nothing in this gate.

Sources: the restart packet v3 in `../restart-2026-10-05/`, sections 12-14 (lines 700-768); `ABILITY-MAP.md` A7c.1 (`:408-424`), 5.2 (CK-4, CK-5, CK-7 at `:906-909`), 5.4 (IM-3 at `:937`), 8.5-8.6; `MODE-SHEET.md` section 2 (Keep tempo); `tools/content/pdmx/README.md`; the docstrings of `quarry.py`, `quarry_core.py`, `quarry_lanes.py`, `commit.py`, `import_pdmx.py`, `excerpts.py`, `score_checks.py`, `render_check.py` and `validate.py` (`summarise_xml.py` has no docstring; read from its code); `content/review/README.md`; how Por Una Cabeza entered (commit `ddd7f093`, `docs/pending-review.md:2413-2420`); `docs/review/pdmx-dump-2026-10-05/`; a read-only scan of `PDMX.csv` and a tar stream of four members, made with `quarry_core` on 2026-10-06 (scratch, not kept in the repository).

---

## (a) The checks

One check per row. **Origin** is packet section 13 (§13), or *added* with the reason. **Tool today** is the code that performs the check now. NO TOOL YET means no code performs it, and the probe does it by hand. PARTIAL means code covers part of the check, and the uncovered part is named.

| Id | Check | Origin | Tool today |
| --- | --- | --- | --- |
| G1 | Parses and normalises as MusicXML/MXL | §13 | `quarry.py` gate 1: `convert.convert_file` through music21 (one part, two staves, tempo, lyrics stripped); the raw read is `quarry_core.mxl_inner_xml` plus ElementTree |
| G2 | Not empty or effectively empty | §13 | `quarry.py` gate 3, `structure_failure`: fewer than 8 bars, no notes, or more than 20 % empty bars rejects |
| G3 | Not truncated or obviously corrupted | §13 | `quarry.py` gate 2 (round trip: the set of bar, staff and pitch must survive conversion) and gate 4 (`truncation_scan.py`, the grace-sixteenth truncation signature); at build, `score_checks.py --gate` fails on unlisted `high` rows (truncation, bar duration) |
| G4 | Pitched notation, not percussion or unpitched | §13 | PARTIAL. `quarry.py` gate 3 rejects a file with no pitched notes ("no notes"). Whether music21's unpitched notes count there is inferred from the code, not run. A piano file with an added unpitched part is flagged by no check; it shows only as a non-piano part in G6. By hand for the probe: `summarise_xml.py` prints an unpitched note as `x` |
| G5 | Parts and staves read from the XML, not from the CSV or MIDI metadata | §13 | `quarry_core.analyse`: reads `score-part`, `midi-program`, `part-name` and `<staves>` from the file. It uses the CSV programs only for a part with neither a program nor a name |
| G6 | Classify the asset's actual shape | §13 | PARTIAL (the classifier exists; the packet's taxonomy does not). `quarry_core.analyse` returns six classes: PIANO_GRAND_STAFF, LEADSHEET, MULTI_PIANO_PART, MIXED_WITH_PIANO, PIANO1, OTHER (a parse error falls to OTHER in `quarry_lanes.stage_shape`). The mapping to the packet's eight is below. Two gaps were observed on 2026-10-06. (i) A score of several all-piano parts with grand staves is labelled PIANO_GRAND_STAFF, because the grand-staff test runs before the part count: `QmR9aAkS2E1wDTUXT2q6iDhAE4tUWmptdbPe51u3ReLVW3`, a four-piano *Habanera* ensemble, came back PIANO_GRAND_STAFF. (ii) Nothing detects a voice part, so `vocal_with_accompaniment` cannot be told from `ensemble`. By hand for the probe: the `parts` list from `analyse`, plus the `summarise_xml.py` dump |
| G7 | Accept the supported piano shapes; classify unsupported ones separately | §13 | Same tools as G6; the rule is the table below. OPEN: whether the app can present a `piano_duet`. `convert.normalise` writes one part on two staves, which suggests two piano parts would be merged (inferred from the docstring, not run) |
| G8 | Sensible note, time and bar structure | §13 | `quarry.py` gate 3 (bar count, a time signature, tempo 30-320); at build, `score_checks.py` (bar duration, repeat structure) and `validate.py` (duration 5 s to 20 min) |
| G9 | Playable piano range | §13 | `quarry.py` gate 3 (A0-C8, `LOWEST_PIANO_MIDI` and `HIGHEST_PIANO_MIDI`); at build, `validate.notes_off_the_keyboard` |
| G10 | Render, readback, cursor and round trip | §13 | `quarry.py` gate 2 (round trip) and gate 5: the app's own loader and cursor-step parity in `app/tests/e2e/content-render.spec.ts`, driven by `render_check.py`. The build's render check repeats it on the catalogue item |
| G11 | Identity: the file is the work the row names | added: the CSV's titles mislead. In the 2026-10-05 dump, "Maria Elena" was a children's song and "Oblivion" a video-game theme (`docs/review/pdmx-dump-2026-10-05/README.md`) | PARTIAL. `quarry_core.identity` returns MATCH, TITLE_ONLY or MISMATCH. Two limits were observed on 2026-10-06. *L'amour est un oiseau rebelle*, the Habanera under its own first line, returns MISMATCH for the term "Habanera". The composer string "Author anonimo" is read as a named person, which turns *Contra Danza* into a MISMATCH. So the check orders the search, and a reader confirms identity from the notation (D2 `usableScore`, category `identity`) |
| G12 | Edition duplicates | added: two editions of one work in the catalogue must be a choice, not an accident | `quarry.py` labels `duplicate_of` (folded title plus composer); `commit.py` commits at most two editions of one work (`MAX_EDITIONS`) |
| G13 | Provenance and checksums | added: the file that passed the gate must be the file that ships | `commit.py` writes `rawSha256` and `convertedSha256` (re-hashed after the copy); `import_pdmx.py` verifies both on every build and fails naming the file |
| G14 | A legal catalogue item | added: the admitted file must build as an item the app can open | `validate.py`, run by `build.py`'s validate step: the file exists, the duration is plausible, ids are unique, and every option reference resolves |
| G15 | Excerpt-cut fidelity (only for an item admitted as an excerpt) | added: the learner is given the cut, not the source (CK-7) | NO TOOL YET. `excerpts.py` cuts with music21 and refuses a repeat, a volta or a jump inside the range. Nothing compares the cut's events with the source bars. Reuse table below |

**Mapping from `analyse` to the packet's shapes (used by hand until G6 has code).** Option not taken: renaming `analyse`'s classes in code now. That would be gate code before the probe has shown which split matters.

| Packet shape | Supported? | Reading from `analyse` |
| --- | --- | --- |
| `solo_piano` | yes | PIANO_GRAND_STAFF with `n_parts` = 1 |
| `piano_duet` | yes (packet); app presentation OPEN (G7) | MULTI_PIANO_PART, or PIANO_GRAND_STAFF with `n_parts` = 2 (gap (i)) |
| `lead_sheet` | yes | LEADSHEET (one part, one staff, at least 8 `<harmony>` symbols) |
| `melody_only` | yes | PIANO1 with fewer than 8 `<harmony>` symbols |
| `vocal_with_accompaniment` | no | MIXED_WITH_PIANO when a part is a voice. Not detected (gap (ii)); by hand from part names and lyrics |
| `ensemble` | no | MIXED_WITH_PIANO or OTHER with several parts; PIANO_GRAND_STAFF with `n_parts` > 2 (gap (i)) |
| `non_piano` | no | OTHER with no piano part |
| `malformed` | no | a parse error, or a G1 or G3 failure |

**Shape is read from the raw file, never from the converted one.** `convert.normalise` rewrites every score as one part on two staves, so a converted file can no longer show what the source was.

### Reuse tables for the checks with no tool or a partial one (CLAUDE.md, "Reuse before reinvention")

**G4, pitched or unpitched**

| Candidate | Solves | Provenance | Licence | Fit | Adaptation | Leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- |
| `quarry_core.analyse` (existing code) | already walks every `score-part` and part | this repository | project | the natural home | count `<unpitched>` notes and `percussion` clefs per part | nothing for detection |
| MusicXML 4.0: `<unpitched>`, `<sign>percussion</sign>`, `<instrument-sound>` ids such as `drum.*` | the format states unpitched content explicitly | W3C Music Notation Community Group | W3C Community Final Specification Agreement | exact | read the three elements | a file that writes drums as pitched notes on a staff |
| music21 `note.Unpitched`, `clef.PercussionClef` | the same through the parser `quarry.py` already uses | music21 (already a dependency) | BSD-3-Clause | good, but slower than the raw walk | none | the same as the row above |

**G6 and G7, the packet's taxonomy (part count and voice detection)**

| Candidate | Solves | Provenance | Licence | Fit | Adaptation | Leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- |
| `quarry_core.analyse` (existing code) | six classes, parts, staves, programs, harmony count | this repository | project | most of it | test the part count before the grand-staff test (gap i); add voice signals (gap ii) | an arrangement that puts lyrics in the piano part |
| MusicXML `<instrument-sound>` (`voice.*`, `keyboard.piano`), `<lyric>`, part names | voice parts and piano parts named by the file | W3C Music Notation Community Group | W3C CFSA | good when the exporter writes them (MuseScore does) | read them in `analyse` | files that omit them |
| music21 `instrument.partitionByInstrument`, `instrument.Vocalist` subclasses | instrument identity from names and sounds | music21 | BSD-3-Clause | good | none beyond the call | the same as the row above |
| PDMX CSV `tracks` (General MIDI programs) | a hint | PDMX | dataset's own | metadata only (packet §13: never trusted for shape) | none | everything the XML says differently |

**G15, excerpt-cut fidelity (CK-7)**

| Candidate | Solves | Provenance | Licence | Fit | Adaptation | Leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- |
| partitura 1.9.0 (installed, research-only per `tools/content/requirements-research.txt`) | an event reader independent of the music21 cutter: onset, duration, pitch and staff, with ties merged | CPJKU | Apache-2.0 | good: CK-7 names it | a comparison of the cut's events with the source bars, bar-relative | the cutter's documented changes (an edge tie severed or dropped, a repeat sign neutralised) must be allowed explicitly |
| music21 | the same events | music21 | BSD-3-Clause | weak as a check: the cutter is music21, so the check would share its parse | none | independence |
| musicxml-io | a reader | open source | MIT | rejected by the map for snipping an unended tie (ABILITY-MAP 5.2, CK-7) | — | — |
| The probe's one-off comparison script | the one cut | the probe | project | enough for one item | kept as evidence beside the intake record, not wired into the build | every later cut, until a second cut shows the shape of a tool |

### What is not in the gate (the second step)

- Claim checks, for example CK-5's habanera and tresillo onset sets. "This item prints the figure the lesson names" is a musical claim, checked after admission.
- The D2 teaching-use decision (`goodTeachingUse`) and the placement gate CK-4.
- Level, difficulty and style.

---

## (b) The boundary

The gate answers one question: **is this file a sane, supported score asset?** It never certifies:

- musical quality;
- style;
- difficulty;
- arrangement quality;
- lesson fit;
- teaching usefulness (packet §13).

It also never certifies, restated for this project:

- that the notes are the composer's (an upload is an arrangement; fidelity to the work is a reader's `usableScore` decision);
- that a figure the lesson names is printed (a claim check);
- that anyone has heard it. No one in this process hears music, so every sound question stays *unverified as music*.

Score admissibility first, musical and pedagogical verification second (packet §13). Passing the gate admits an item to the **personal library** at most. **Curriculum** admission is a separate, later decision (packet §12, the three layers). Option not taken: one combined admission. It would let a gate pass read as a teaching decision, which §13 forbids.

---

## (c) The per-item intake record

One Markdown file per admitted item, at `intake/<CID>.md` beside this file (`intake/<path-slug>.md` for a non-PDMX source). Fields are `Name: value` lines, so `count_plan_distance.py` can read them.

Options not taken:
- a block inside `content/sources/pdmx.json`'s `review`: the build reads that file, nothing in the build would consume the block, and the file carries a re-serialisation hazard (CLAUDE.md);
- a JSONL ledger: harder for the outside reviewer to read.

Every candidate edition the item was compared with is listed inside the admitted item's record, not given a file of its own.

```
# Intake: <title as the score prints it>
Item: <catalogue id once committed; "not committed" before>
Source: PDMX CID <cid> (archive record 14648209, member <mxl path>) | <repository path>
CSV facts: title / song_name / composer / tracks / bars / rating, ratings, views / dedup flag (metadata: orders work, decides nothing)
Asset shape class: <packet class> (analyse: <class>; parts <n>; staves <list>)
Editions compared: <cid, shape, why not chosen> (one line each)

Checks
G1 parse and normalise: PASS | FAIL | BY HAND | NOT RUN - <tool and command> - <evidence: file, count, line>
G2 ... (one line for each of G1-G15, in order)

Excerpt: bars <from>-<to> (printed, 1-based, pickup counted), selection <both|right|left>
Reason for the cut: <musical boundary as read from the notation, and the option not taken>
Claim checks (second step, not the gate): <check, tool, result>

Personal library admission: ADMITTED | NOT ADMITTED - <date>, <pdmx.json id>
Curriculum admission: ADMITTED | CANDIDATE | NOT ADMITTED - <rung>, <role>, <D2 event id>
Public export: out of scope (owner decision 2026-10-05); not a gate, not recorded as a decision
By hand: <each step no tool performed, and who did it>
Unverified: <what no check covered, including "not heard">
```

---

## (d) "Plan finished", and the distance from it

**Definition.** The plan is finished when all three hold:

1. Every rung has a decision (real excerpt, generated drill, or both) with its source named.
2. This gate is specified.
3. No open question remains except those only a listener could answer.

A real excerpt counts only once its item has passed this gate and holds a curriculum admission in an intake record.

Option not taken: "every repertoire item admitted". That would make the plan wait on builds the plan itself schedules.

**Counting.** `count_plan_distance.py`, beside this file, counts from `ABILITY-MAP.md`, `content/sources/pdmx.json`, `intake/` and this file. **The map is keyed by ability block and station, not by rung, so the count is per station.** A CONTROL station is the drill decision; a MODEL/TRANSFER or MUSIC station is the real-score decision. Per-rung counting is not done, because the rung each station serves is named only in prose ("Tracks:" lines).

Two parts of the count are hand classifications inside the script, listed there: the open questions of section 8.6, and one prose state change (A7c.3 CONTROL, the G14 contract). Output on 2026-10-06, after this file was written. It is abridged: the 22 applied-amendment lines, the 3 lines left for a hand check, the open-item list and the IM list are omitted; run the script for the full output.

```
PLAN DISTANCE (count_plan_distance.py)
Stations: 112 in 28 blocks; as tabled: EXISTING 18, REPAIR 27, NEW 26, SOURCE-NEEDED 9, SHARED 28, NO-SEPARATE-ARTIFACT 4
  after 22 'State X -> Y' amendment lines: EXISTING 17, REPAIR 28, NEW 29, SOURCE-NEEDED 6, SHARED 28, NO-SEPARATE-ARTIFACT 4
  stations with no decided source (SOURCE-NEEDED after amendments): 6
    A7a.2 MODEL/TRANSFER
    A7b.1 MODEL/TRANSFER
    A7b.1 MUSIC
    A7c.4 CONTROL
    A7c.4 MODEL/TRANSFER
    A7c.4 MUSIC
PDMX CIDs named in the map: 31; shipped 4; not shipped (need the intake gate) 27
IM ids named: 14 (IM-1 ... IM-14)
Intake records: 0; admitted to the curriculum: 0
Section 8.6 items: 21; closed 3, listener-only 2, open 14, out-of-scope 2
Gate specified: yes (5/5 section headings in INTAKE-GATE.md)
DISTANCE: 6 stations without a decided source + 14 imports (IM ids) without a curriculum admission + 14 open questions + 0 gate not specified
  ceiling beside it: 27 PDMX CIDs named in the map and not shipped
```

**Read it as three numbers that only go down: 6, 14 and 14.**
- The 14 imports are the map's own list (IM-1 to IM-14). The 27 CIDs are a ceiling: they include comparison editions and optional-shelf scores that no station depends on.
- The 14 open questions are the map's section 8.6 as written on 2026-10-05. Records written after the map are not read; for example, `WAVE1-FACTS.md` may already answer item 1.
- **Stale, found while drafting:** item 10 (7) says Bizet and *Contra Danza* "were not dumped". Both are in `docs/review/pdmx-dump-2026-10-05/` (xml and summary, "added on the second request"). The item stays open because the printed-habanera check has still not been run; the probe answers it.

---

## (e) What the probe must report, so the repeatable path can be extracted

Per station of the brief, in order:

1. **Each step, by tool or by hand.** The exact command or the exact manual act, its input and its output file. The count of manual steps, and which of them a script could take next time.
2. **Which tool did what.** For each of G1-G15: the tool, whether it ran on a single CID without a full shortlist, and any flag or staging it needed. If `quarry.py` refuses a CID that is not in `candidates.json`, say so; that is the first finding for the repeatable path.
3. **Where a tool was wrong or silent.** For example G6's ensemble label or G11's misses: the item, the expected answer and what the tool said, recorded and not fixed in the lane.
4. **Decisions a person made.** Edition choice, cut, teaching use, wording: who made each one, the option not taken, and what would reverse it.
5. **What the next item reuses as it is**: commands, the scan script, the cell-check script, the record template. **What it reuses only after a change**, named: for example the G6 part-count rule or a CK-7 comparison. **What it cannot reuse.**
6. **The record.** The intake record file complete under (c); the line for `docs/pending-review.md` and the IM-3 and A7c.1 amendment lines for the map, drafted for the orchestrator, who owns both files.
7. **Unverified**, in those words: what no check covered, and that nothing was heard.
