# Second witnesses for PianoProject's musical facts

Research only, 2026-10-03. Nothing in the repo was changed. The probes ran in a throwaway venv
(music21 10.5.0, partitura 1.9.0, verovio 6.3.0, and the abc2xml fork, patched in the venv only).
The venv has since been deleted. The probe scripts are kept in the scratchpad
(`probe.py`, `sweep.py`, `sweep2.py`, `abccmp.py`) for anyone who wants to rerun them.

## 0. The fact that shapes everything else: music21 writes every shipped file

All the shipped `.mxl` files under `app/public/content/scores/` come out of the music21 writer:
- **Generated:** `generate_exercises.py` writes them with music21.
- **Authored ABC:** `author.py` sends them through `convert.cached_convert`, which parses with music21
  and writes with music21.
- **Kern, MuseTrainer, Mutopia:** each goes through `cached_convert`.
- **PDMX:** `content/scores/pdmx/*.mxl` is already normalised. A sampled file carries two
  `<software>` tags: `MuseScore 3.6.2` and `music21 v.10.5.0`.

The MuseScore originals are not in the repo. Per `import_pdmx.py` they are in the 4 GB archive,
which I did not look for on this machine.

**Consequence.** A music21 read-back of a shipped file is a check of music21 against itself. That
covers `independent_check.py`, `harmony_facts.py` and the key analysis in `score_checks.py`. It
cannot catch a fault the writer introduced; `convert.py:1148` documents one, the writer padding
short bars. It can catch only a fault that the generator's own logic put into the music21 stream.

The two places that really are independent of music21 today:
- the raw-XML readers in `score_checks.py` and `notation.py`, which are the project's own code;
- the app's own reader: OSMD 2.1.2 → `extractScoreModel.ts` → `detect.ts`, reached through
  `demands.py` and Vitest.

## 1. Facts, current mechanism, witnesses

**Confidence** is how sure I am of the recommended witness for this fact. "Probed" means I ran it here.

| Fact | Current mechanism | Producer of shipped file | Non-circular witness(es) | Circular choices to avoid | Known disagreements | Confidence |
|---|---|---|---|---|---|---|
| Bar durations (bar full / over / under) | `score_checks.bar_duration_faults` (raw XML, per voice, own code); `independent_check.check` (music21 `m.duration` vs `barDuration`) | music21 writer (all routes) | partitura (`part.iter_all(Measure)` + note onsets/ends in divisions); verovio (MEI measure contents; it reports invalid timemaps on load); for kern, the source itself via Humdrum `census`/humlib | music21 read-back of a music21-written file: the writer runs `makeRests(fillGaps=True, timeRangeFromBarDuration=True)` before writing (`convert.py:1148`), so a short bar always comes back full | music21 calls the polonaise's 1-division overflow overfull (noted in `score_checks`); partitura and music21 onsets on `chopin-polonaise-op53` drift by up to 0.0003 quarter (probe) | High for partitura (probed, agrees on 120/120 sampled files' written notes, within that tolerance) |
| Key signature (fifths) | `notation.describe` (raw XML); `extractScoreModel` keeps the first key (detect.ts says key changes are not modelled) | music21 | partitura `KeySignature.fifths`; verovio MEI `keySig@sig`/`staffDef@key.sig`; XSD for well-formedness only | music21 `KeySignature` on a music21 file | Partitura and music21 agreed on 120/120 files (probe). Verovio agreed on the files compared individually | High |
| Time signature | `notation.describe`; detectors read `timeSignatureAt` from the model | music21 | partitura `TimeSignature`; verovio `meterSig` | music21 | 120/120 agree (probe) | High |
| Pitch and spelling (letter + MIDI) | OSMD → model `accidental` (T41), detectors `keySignature`, `chromatic`; `independent_check` "not the key's own" | music21 (spelling for Mutopia comes from the .ly per `import_mutopia.py`) | partitura `step`/`alter`/`midi_pitch`; verovio `pname` + MIDI value **for MusicXML input** (see disagreements); for ABC sources, abc2xml; for kern, the kern tokens (accidentals are explicit in kern) | music21 `pitch.name` on a music21 file | The (letter, MIDI) multiset agreed for all compared files after probe artefacts were removed (see §3). **Verovio on Humdrum input:** on `peacherine.krn`, line 16, `16ee-L` under `*k[b-e-a-]`, `getMIDIValuesForElement` gave 76 (E natural) where the token is E♭ (75). The MEI note had no `@accid.ges`. Do not use verovio's per-note MIDI value as a pitch witness for kern without applying the key signature yourself | High for partitura; Low for verovio on kern |
| Note values, onsets, written durations | Model `duration`, `tiedDurations`; detectors `eighths`, `shorterThanQuarter`, `sixteenths`, `dottedQuarters`, `syncopation` | music21 | partitura (`quarter_map` of `start.t`/`end.t`); verovio timemap `qstamp` (performance order: unfolds repeats and endings, offsets arpeggios) | music21 offsets on a music21 file | Partitura shifts a pickup to negative onsets (−0.5 on `QmNR8…`, a convention, not an error). Verovio timemap ≠ printed order when repeats or voltas exist (`QmNRFZ…`, `QmNSZQ…`) | High (partitura) |
| Tuplets | Model `tuplet` (`TupletLabelNumber`), detector `triplets` | music21 | partitura `Note.tuplet_starts/stops`, `symbolic_duration`; verovio MEI `<tuplet>` | music21 | `exercise.independence.*.2v3` (48 `<time-modification>`): all three readers agree on 80 notes, onsets and durations (probe). Nested or odd tuplets (polonaise 5/58-quarter values) agree within the 0.0003 drift | Medium–High |
| Ties (sounded-note merge) | Model `tiedDurations`; detector `ties` | music21 (`makeTies` in generator) | partitura `notes_tied` / `tie_next`; verovio MEI `<tie>` control events | music21 `stripTies()` — see next column | **music21 10.5.0 `stripTies()` under-merges** chains in multi-voice bars: on `bach-wtc1-prelude-1` bar 32 it leaves the C2 half-tie unmerged and splits the 3-note C3 chain; on PDMX `QmNNEw…` (bars 40, 51–52, chords tied across a barline) it leaves 11 extra notes. Partitura and verovio agree with each other there. Partitura has open issues on ties (CHANGES.md; "tie across staff break" on its tracker) | Medium (two independent readers agree; no third) |
| Grace notes | Ignored by detectors; OSMD gives them a duration (detect.ts comment) | music21 | partitura `GraceNote` class; verovio `@grace` on note **or on a parent `<chord>`** | — | **partitura 1.9.0 `note_array(include_grace_notes=True)` raised `ValueError` (is_grace_chord)** on `QmNNEw…`. Default `note_array` returns graces as zero-duration rows. Verovio puts `@grace` on the chord for grace chords (40 in the Berceuse), so filtering on `note@grace` alone over-counts | Medium |
| Voices, staves, hands | Model `staff`; detectors `handsTogether`, `leftHandPattern`, `walkingBass`; `render_check` hands flags | music21 (`convert.py` merges parts into one 2-staff part; writes `<voice>` numbers it minted) | partitura `Note.staff`/`voice`; verovio MEI `staff@n`/`layer@n` | music21 voices on a music21 file (the writer re-homes strands and pads voices, `convert.py:446–470`) | `QmNNEw…` uses voices 1, 2, 3, 5, 6, 7 and the readers agree on pitches per staff (probe, staff not compared on every file) | Medium |
| Clefs (and `bassClef`, `ledgerLines`) | Detectors **assume** staff 1 = treble, staff 2 = bass (detect.ts header) | music21 | partitura `Clef(sign, line, staff)`; verovio `clef`/`staffDef@clef.*` | — | All three agree on the files probed. The real gap is the detectors' assumption, not the reading | High that the readers can witness it |
| Chord symbols | `notation.describe` (raw XML `<harmony>`); `harmony_facts` (music21 `ChordSymbol`); app `score/harmony.ts` | music21 | verovio MEI `<harm>` text (gave `B♭m7`, `E♭7`, `A♭Maj7`, matching music21's `B-m7`, `E-7`, `A-maj7`); partitura `ChordSymbol` (counted 3 and 12, matching, but the `root`/`kind` I read showed only `B`/None — alteration not seen in those fields; not examined further) | music21 `ChordSymbol` on a music21 file | music21 yields `ChordSymbol` as a Chord in `.notes` with quarterLength 0 (my first probe was inflated by this, as `abc_tools.playable_notes` already notes); music21 #1294 (`stripTies` and chord symbols); verovio #1277 (assertion on `<harmony>` without `root-alter`, old) | Medium (verovio) |
| Fingering | `abc_tools.extract_fingerings`/`apply_fingerings` (ABC), `extract_fingering.py`, model `fingering` via `parseFingering` | music21 | ABC source read by abc2xml; partitura `Note.technical` → `Fingering`; verovio `<fing>` | music21 articulations on a music21 file | **Real finding, see §3.3:** chord fingerings in the ABC sources are absent from the shipped files. Partitura issue #515 (fingering parsing) | High (abc2xml + partitura) |
| Beaming | music21 writes beams (`independent_check` says so and excludes beaming) | music21 | None that *judges*: partitura and verovio only read the `<beam>` music21 wrote. A judgement needs a rule source (beaming conventions in Gould, *Behind Bars*) or an engraver that beams on its own: MuseScore re-beams on import; LilyPond auto-beams | Any reader of the written `<beam>` | — | Low: no non-circular *tool* found in this container |
| Ranges / hand span / per-bar lowest–highest | `demands.py` `hands` (from the model); `range()` in detect.ts | music21 | partitura per-staff min/max MIDI per measure | music21 | — | High (cheap) |
| Onsets for playback and assessment | OSMD iterator → `ScoreModel` steps (`extractScoreModel.ts`); tempo from `tempoFromXml.ts`; `render_check` cursor parity | music21 file read by OSMD | verovio timemap (unfolds repeats and endings as performed); partitura `note_array` with `performance` unfolding (`pt.score.unfold_part_maximal`, not probed) | music21 `expandRepeats` on a music21 file | Verovio timemap applies arpeggio offsets (`QmNSZQ…`: +0.03–0.06 quarter); OSMD reads a metronome note value as quarters (X3c, `extractScoreModel` header) | Medium (verovio repeat semantics are not proven equal to OSMD's) |
| Schema validity | none | music21 | `xmllint --schema` against the W3C MusicXML XSD (`w3c/musicxml` gh-pages, 4.x) | — | 7/7 sampled files validate (generated, authored, PDMX, imported). Validity proves structure only: not bar sums, not pitches | High, narrow |
| Demands (eighths, syncopation, triplets, compound metre, chromatic, beyond-position, hands-together, LH pattern, bass clef, ledger lines, ties, intervals) | `detect.ts` is the one definition, by design (`demands.py` docstring forbids a second) | — | **Witness the inputs, not the detectors:** compare the model's per-note facts the bridge already returns (`positions`, `hands`, `printedBars`) with partitura's note-level facts. Do not reimplement detectors in Python | A Python reimplementation of `detect.ts` (the "two ports" failure, pending-review Entry 53) | — | — |

## 2. Candidate witnesses: versions, licences, maintenance, cost

| Tool | Version, licence (verified) | Reads | Shares code or assumptions with the writer? | Runs here? |
|---|---|---|---|---|
| music21 | 10.5.0 (PyPI upload 2026-06-17), BSD-3-Clause — https://pypi.org/project/music21/ , https://github.com/cuthbertLab/music21 | MusicXML, ABC, kern, MIDI | **Is the writer** for every shipped file | Yes (pinned) |
| partitura (CPJKU) | 1.9.0 (2026-05-25), Apache-2.0, py>=3.10 — https://pypi.org/project/partitura/ , https://github.com/CPJKU/partitura | MusicXML, MEI, kern, MIDI, match | Independent MusicXML parser (lxml). No music21 dependency | Yes: pip install worked. It was the fastest of the three readers across the sweep |
| Verovio | 6.3.0 (2026-08-19), LGPL-3.0-only (npm: LGPL-3.0-or-later) — https://pypi.org/project/verovio/ , https://github.com/rism-digital/verovio , https://www.verovio.org | MusicXML, MEI, ABC, Humdrum (via humlib); outputs MEI, SVG, MIDI, timemap | Independent C++ importer. Its Humdrum route is Craig Sapp's humlib, the same author as the craigsapp kern editions (good for kern, but not independent of that edition's author) | Yes: pip wheel installed. Per-note `getMIDIValuesForElement` calls dominated its runtime on large files. Use the timemap or MEI in bulk instead |
| abc2xml (W. Vree) | upstream https://wim.vree.org/svgParse/abc2xml.html (egress-blocked here). Fork https://github.com/SpotlightKid/abc2xml , version 220, LGPL | ABC → MusicXML | Independent of music21's ABC parser | Yes, after replacing `getchildren()` (removed in Python 3.9) **in the venv copy**. The fork is stale; upstream has later versions |
| abcjs | 6.7.1, MIT, npm modified 2026-09-21 — https://www.npmjs.com/package/abcjs | ABC (own parser, JS) | Independent | Not tried |
| OSMD | app uses 2.1.2 (latest npm 2.2.0, BSD-3-Clause) — https://github.com/opensheetmusicdisplay/opensheetmusicdisplay | MusicXML | It is the *consumer*. It is an independent witness of the music21 writer, but it is not a judge of what the learner should see, being the thing that renders it | Yes (Vitest bridge, Playwright) |
| MuseScore CLI | `mscore -o` conversion — https://handbook.musescore.org/appendix/command-line-usage | MusicXML, MIDI, MSCZ | PDMX originals were *written* by MuseScore 3.6.2, so MuseScore reading them back is circular | **Absent** here (`command -v mscore musescore mscore4 musescore4` → none). MuseScore 4 headless needs an extracted AppImage or `xvfb-run` (`xvfb-run` is present); `-platform offscreen` no longer works in MU4 (https://github.com/musescore/MuseScore/issues/17247) |
| W3C MusicXML XSD + xmllint | XSD from https://github.com/w3c/musicxml (gh-pages/schema); xmllint is installed | Structure | — | Yes. The xml.xsd and xlink.xsd imports must be localised |
| symusic | 0.6.0, MIT — https://pypi.org/project/symusic/ | MIDI, ABC (not MusicXML) | — | Not tried. Relevant only to the Mutopia MIDI route |
| Humdrum tools (humlib, humextra `census`) | https://github.com/craigsapp/humlib | kern | Independent of music21's kern parser (which `convert.py:109` says once dropped most of a file) | Absent here |
| musicxml-interfaces (JS) | 0.0.21, AGPL-3.0, last modified 2022 | MusicXML | — | Rejected: stale, and AGPL |

## 3. Probe results (observed)

### 3.1 Three readers on the same shipped files (music21 vs partitura vs verovio)

**Sample.** 120 files, chosen with a fixed-seed `shuf` (not every file):

| Folder | Files sampled |
|---|---|
| generated | 40 of 1,200 |
| pdmx | 40 of 542 |
| authored | 15 |
| imported | 25 |

**Hand-picked files.** These were probed individually:
- `exercise.coordination.c.hold`
- `exercise.independence.c.2v3`
- `exercise.ii-v-i.a-flat`
- `exercise.blues.twelve-bar-shuffle.c`
- `bach-wtc1-prelude-1`
- four PDMX files

**Written notes: music21 vs partitura.** Compared on onset, letter, MIDI and written duration.
- 116/120 identical, 4/120 not.
- The 4 differences were float drift on tuplets, at most 0.0003 quarter. The polonaise and prelude 28-19 were checked with tolerance, and the remaining two are the same tuplet pattern.
- Key and time signatures agreed on 120/120.

**music21 vs verovio.** Compared on the letter-and-MIDI multiset (MusicXML input).
- The sweep run had a probe bug: no timemap was rendered before the MIDI lookups, so pitch came back None.
- After the fix, every rerun file agreed except for extra notes from verovio.
- For 3 files I traced those extras to grace *chords*: Berceuse 40, Nocturne op. 27/2 14, Polonaise 12. In each, the count of notes under `chord@grace` equals the excess.
- The 4th file, PDMX `Qmaug…` (+10), was not traced, so the same cause is inferred, not observed.
- `exercise.coordination.c.hold.mxl`: all three report 12 notes, key 0, 4/4, 3 bars, with identical onsets, pitches and durations.

**Sounded notes (ties merged).** As listed in the ties row of §1, music21 `stripTies()` left tie chains unmerged in multi-voice bars where partitura and verovio agree. The two observed cases:
- Bach WTC I/1, bars 32–33: 2 extra notes;
- PDMX `QmNNEw…`: 11 extra notes.

Any second witness on sounded notes should use partitura `notes_tied`, not music21 `stripTies`.

### 3.2 XSD

7/7 sampled files validate against the W3C MusicXML XSD (4.x schema from the gh-pages branch).

### 3.3 ABC sources: abc2xml (independent) vs shipped file (music21 route), both read by partitura

**33/33 agree** on onsets, letter + MIDI, durations, key and time, and chord-symbol count. The
shipped files are one part on two staves; abc2xml writes two parts, as expected.

**Fingering disagrees in 7/33 files.** abc2xml carries every `!n!` from the source; the shipped
file has fewer.

| File | Fingerings in source | In shipped file |
|---|---|---|
| greensleeves.68 | 80 | 52 |
| happy-birthday.simple | 55 | 25 |
| when-the-saints.f | 41 | 17 |
| row-row-row-your-boat | 51 | 35 |
| jingle-bells.g | 58 | 25 |
| greensleeves.chords | 82 | 37 |
| greensleeves.waltz | 112 | 52 |

**Mechanism.** It was checked on three files:
- The missing counts equal the source's `!n!` inside `[...]` chords: 28, 30 and 24.
- In shipped greensleeves.68, none of the 14 chords carries a `<fingering>` on any note.
- `abc_tools.extract_fingerings` counts a chord as one event and keeps a single `pending` finger, so
  the fingers of a chord overwrite each other.
- `apply_fingerings` then attaches that finger to the music21 `Chord`. The export contains no
  fingering on chord notes, so that finger is lost as well.

**What the learner meets.** Left-hand chord fingerings written in the ABC are not on the page. I
have not looked at the rendered page.

### 3.4 Kern sources vs shipped (partitura)

**Verovio's per-note MIDI value cannot serve as a pitch witness here.** On Humdrum input it ignores
the key signature for notes without `@accid.ges` (see the pitch row in §1).

**Instead I compared the kern pitch tokens, which carry explicit accidentals, with a naive parser.**

| Result | Rags |
|---|---|
| Match exactly | easy-winners, elite-syncopations |
| Shipped has 2 more | peacherine |
| Differ by up to 29 (bethena) | the other 9 of 12 |

**Cause of the residuals: attributable but not resolved.** The most common residual pitch is F4 or
F5. The rags carry a `**dynam` spine, which my parser read as notes ("f", "ff"). The files also have
grace tokens and spine splits (`*^`). Humdrum `census` or humlib would be the right witness for this
route, and neither is installed.

## 4. Recommended second-witness combinations

### 4.1 Generated exercises (music21-written): partitura read-back

**Use it for:** bar sums in divisions, key and time, pitch spelling, onsets, durations, tuplets,
tie merges, staff assignment and fingering.

**What it proves:** that the bytes say what `independent_check` assumes music21 meant. It is
independent of the music21 writer's padding, voice minting and tie export.

**What it does not prove:**
- that the generator's musical intent is right (that stays `independent_check`'s promises plus a
  teacher);
- beaming;
- what OSMD draws.

**Cost:** cheap, and partitura is pip-installable here. Add it alongside music21, not instead of it.

### 4.2 ABC-authored files: abc2xml on the source vs the shipped file, both read by partitura

**What it proves:** the ABC → music21 → MusicXML route preserved notes, key, metre, chord symbols
and fingerings. It has already caught the chord-fingering loss (§3.3).

**What it does not prove:** that the ABC itself is musically right, or that the two-voice layout
matches the source's intent.

**Caveat:** abc2xml has no maintained PyPI package. Pin a vendored copy, or use abcjs as the second
ABC reader.

### 4.3 PDMX (MuseScore → music21-normalised): partitura plus verovio on the shipped file

**What it proves:** the normalised file is self-consistent across two independent readers. In the
probe they disagreed only on grace and tie handling, where music21 `stripTies` was the outlier.

**What it does not prove:** fidelity to the MuseScore original, because the original is not in the
repo. A source-to-shipped check needs the archive file, read by partitura on both sides.

**Avoid:** MuseScore reading back its own export.

### 4.4 Kern imports: Humdrum `census` or humlib on the source vs partitura on the shipped file

**What it proves:** the music21 kern parser (with `prepare_kern`) dropped or invented no note.

**Avoid:**
- verovio's per-note MIDI values on Humdrum input (the key-signature problem in §1);
- music21 on both sides.

### 4.5 Mutopia (MIDI + .ly spelling): verovio or partitura on the shipped file vs the edition's MIDI

**What it proves:** note-onset and pitch-class identity against the MIDI. The importer already
refuses lost or gained notes, but with its own converter's read-back. A note-level comparison of
the MIDI with symusic or partitura (`load_performance_midi`) would be independent.

**Spelling:** only the .ly can witness it, and python-ly was rejected for rhythm, not for pitch.

### 4.6 What the app reads (OSMD model) vs partitura

**The comparison:** the bridge's existing `positions`, `hands` and `printedBars` against partitura's
per-bar facts.

**What it proves:** the detectors were fed what the file says. This matters most for the gaps the
detectors' own header names: clef assumed from staff, first key only, and grace-note durations.

**What it does not prove:** whether a demand definition is pedagogically right.

### 4.7 Every route: `xmllint --schema` as a cheap structural gate

**What it proves:** the file is structurally valid MusicXML.

**What it does not prove:** anything musical.

## 5. Open, for whoever acts

- **Chord-fingering loss on ABC chords (§3.3).** Observed in the files, not yet seen rendered. The
  fix belongs in `abc_tools.extract_fingerings`/`apply_fingerings`, plus a check that music21
  exports fingering on chord members. Out of scope for this research.
- **Beaming.** No non-circular tool in this container judges it. MuseScore (absent) or LilyPond
  (absent) would re-beam independently, and they would be a third opinion, not ground truth.
- **Not checked:**
  - partitura's repeat unfolding against OSMD's iterator;
  - partitura ChordSymbol alteration fields;
  - abcjs;
  - Humdrum tools (not installed);
  - anything audible.

## Sources
- music21: https://pypi.org/project/music21/ ; issues https://github.com/cuthbertLab/music21/issues/1294 , https://github.com/cuthbertLab/music21/issues/352 , https://github.com/cuthbertLab/music21/issues/2024
- partitura: https://pypi.org/project/partitura/ ; https://github.com/CPJKU/partitura/blob/main/CHANGES.md ; https://github.com/CPJKU/partitura/issues ; https://github.com/CPJKU/partitura/issues/515
- Verovio: https://pypi.org/project/verovio/ ; https://github.com/rism-digital/verovio/issues/1277 , /4458 , /4459
- OSMD: https://www.npmjs.com/package/opensheetmusicdisplay
- MusicXML XSD: https://github.com/w3c/musicxml
- abc2xml: https://wim.vree.org/svgParse/abc2xml.html ; https://github.com/SpotlightKid/abc2xml
- abcjs: https://www.npmjs.com/package/abcjs
- MuseScore CLI: https://handbook.musescore.org/appendix/command-line-usage ; https://github.com/musescore/MuseScore/issues/17247
- symusic: https://pypi.org/project/symusic/
- humlib: https://github.com/craigsapp/humlib
