### Entry 173 — X40 — which tempo is authoritative: *Maple Leaf Rag*'s printed quarter = 100 for playback and the reader's opening (100) for import, the app's 120 from bar 1 being MuseScore's starting tempo on the words "Tempo Di Marcia" and "TRIO", read first at a position the edition itself prints 100; every MuseTrainer and kern file read through the app's reader, 15 sound-against-mark contradictions on 4 MuseTrainer rows pinned by a non-vacuous check, three kern rows found dropping their source's later tempo changes, no byte and no reader changed (2026-09-30)

**Base.** `eebafb5e`, origin's head at dispatch (the brief's premises cite `034d4039`; every pointer below was re-read at this base). Nothing committed, staged or stashed; the orchestrator commits the named files. Builds ran on 2026-09-30 in the worktree: the personal flavour into `app/public/content`, the strict flavour (`--no-personal`) into `build/x40/strict-content`.

**Product layer, first.** Nothing was heard and no screen was looked at. Which pace *Maple Leaf Rag* should play at is **unverified as music**: the evidence below decides which of the file's facts the app should obey, not whether 100 is a good tempo for this rag. The first edition prints no number at all.

## Judgement

- **Playback: the printed quarter = 100 is authoritative, and the app does not obey it today.** The MuseTrainer file prints quarter = 100 three times (pickup, bar 1, bar 51, the last twice). Each printed 100 carries its own `<sound tempo="100"/>` at the same position. The 120 the app plays from bar 1's second sixteenth to the end rides on two words-only directions, "Tempo Di Marcia" and "TRIO". "TRIO" is a section label, not a tempo. Each stands first at its position, and the reader keeps the first sound (`tempoFromXml.ts`:237). The reasons, strongest first:
  1. The reviewer's provisional product rule: a learner-visible numeric mark outranks a conflicting auxiliary sound at the same position.
  2. The mechanism. MuseScore 2.1.0 (the file's writer, `lg-209522180.xml`:6) starts every tempo text at `_tempo = 2.0` (120 a minute). It takes a figure from the words only when they read "note = number" (`tempotext.cpp`, `musescore-source.txt`). The corpus shows the pattern: 23 of the 160 words-only tempo directions in MuseTrainer files carry exactly 120, the most frequent single value (the next is 116, on 10), in files written by MuseScore 1.3 to 4.0 (`words-only-tempo.txt`, every one listed). The pattern supports the mechanism. That this edition's transcriber never set the 120 by hand stays inferred.
  3. The editor's own playback. MuseScore 2.1.0's `TempoMap::setTempo` overwrites the tempo at a tick, and `Score::fixTicks` sets each tempo text of a segment in turn, so the later 100 is MuseScore's tempo there. That rests on the source as read. That the exporter writes the texts in that order is **inferred** (`exportxml.cpp` was not read).
  4. The Sapp kern edition encodes `*MM100` and its built file plays 100 throughout.

  The first edition (John Stark & Son, 1899, `reference-edition/mapleleaf.pdf`) prints only "Tempo di marcia." over the pickup and "TRIO." at the trio. So 100 is the MuseTrainer transcriber's figure and Sapp's encoding, never Joplin's.
- **Import: the reader's opening is authoritative, and here it is 100.** The catalogue's `tempoBpm` should mean what the player opens at, one definition. For *Maple Leaf* both rows already say 100: the MuseTrainer row by a regex that takes the first `<sound tempo="…">` in the file (`import_musetrainer.py`:131–133), the pickup's; the kern row by the first `*MM` (`import_kern.py`:132, :314–316). The MuseTrainer regex agrees with the opening and not with bars 1–84 as the app plays them. It is a third definition, and it agrees with the reader's opening on 63 of 64 MuseTrainer rows and on all 102 kern rows that state `*MM` (Follow-up 7).
- **The hypothesis held for no row in the brief's sense.** The hypothesis: a source row or the importer carries a tempo the notation contradicts. No MuseTrainer row has a tempo field (premise 1 holds at the line). The seven kern `editionNotes` tempo sentences each agree with their own `.krn`, and for *Maple Leaf* and *Pine Apple Rag* with the reference edition (*Pine Apple*'s first edition prints "Slow March tempo. ♩ = 100", as its note says). For *Maple Leaf* the refuting condition holds: the MusicXML holds both facts, and the importer adds nothing. The data does part from what plays on other rows, in the other direction or at the catalogue:
  - three kern files lose their source's later tempo changes in conversion, so the reader faithfully plays a wrong file (Follow-up 3);
  - the catalogue's 145 on Bach's WTC I Prelude 2 is X32's known late tempo;
  - six MuseTrainer rows label the converter's default "authored via the edition" (Follow-up 5).
- **The pattern.** Every sound-against-mark contradiction is inside a verbatim MuseScore export: 4 of the 55 MuseTrainer files copied as they are, and none of the 162 kern or 9 converted files, because music21 writes a mark and its sound from one `MetronomeMark`. The contradictions come in two forms:
  - **A stray first sound at a position whose printed mark has its own agreeing sound:** *Maple Leaf* (120 on words), Satie (60 in the mark's own direction, 76.0002 in the next).
  - **A printed number that does not follow its only sound:** Bach's Toccata BWV 565 (quarter = 10 printed, 20 or 36 sounding) and `song.beautiful.g-minor-bach.alt` (80 printed, 90 or 95 sounding). Below R there is Liszt's *La Campanella*, whose sounds sit 3 below its marks. These look intentional: a performer's timing written as tempo changes, the text left behind. They are the corpus's cases where the provisional rule would override an apparently intended sound (brought back, Question 2).

  The kern side's faults are of another kind. Three files drop their later `*MM`. Sixty-six files (60 kern, 6 MuseTrainer) print the converter's default "♩ = 96", which no edition states.

## Item 1 — *Maple Leaf Rag*, every tempo fact

| # | fact | file and line | read by (app line) |
|---|---|---|---|
| 1 | The source row states no tempo; no MuseTrainer row has a tempo field (the only "tempo" string is the concept `tempo-change`) | `content/sources/musetrainer.json`:632–647; :548 | — |
| 2 | The built file is the clone's file byte for byte: sha256 `5fe979be…` for the clone's `scores/Maple_Leaf_Rag_Scott_Joplin.mxl`, the personal and strict builds' `scores/imported/song.ragtime.joplin-maple-leaf-rag.mxl`, and the catalogue's `source.checksum` | `import_musetrainer.py`:317–318 (verbatim copy), :110–121 (a single part with a tempo is never normalised; :117 "no tempo of its own"); `.gitignore`:36 | — |
| 3 | Pickup (`<measure number="0">`, ordinal 0): quarter = 100 with `<sound tempo="100"/>`, before the eighth rest, at 0:0 | `lg-209522180.xml`:104–113 (:107–108 the mark, :112 the sound) | `tempoFromXml.ts` `tempoEvents` :252–264 → event 0:0 100 `sound`, mark 100; `extractScoreModel.ts`:375 places it |
| 4 | Bar 1 (ordinal 1), after a sixteenth rest (:155–161): the words "Tempo Di Marcia" with `<sound tempo="120"/>`, then quarter = 100 with `<sound tempo="100"/>`, both at 1:0.25 | :162–168 (:164 words, :167 sound); :169–178 (:172–173 mark, :177 sound) | `resolve` :225–243 keeps the first sound (:237) and the first mark (:238) → event 1:0.25 **120** `sound`, mark 100 |
| 5 | Bar 51 (ordinal 51): "TRIO" with `<sound tempo="120"/>`, then quarter = 100 with 100, twice, all at 51:0 | :13203–13209 (:13205, :13208); :13210–13219; :13220–13229 | → event 51:0 **120** `sound`, mark 100 |
| 6 | What plays: 100 for the pickup and bar 1's first sixteenth, 120 from 1:0.25 to the end (bar 51 restates 120); the opening 100 | `reader-dump.jsonl` (the app's reader on the built file) | `openingTempo` :273–275; the score model's tempo map (`extractScoreModel.ts`:375, the default :503 unused here) → engine, label, count-in, measurement |
| 7 | Catalogue `tempoBpm` 100.0 (MuseTrainer row): the regex's first `<sound tempo="` in the file, the pickup's :112 | `import_musetrainer.py`:131–133 | `DevMicroscopeScreen.ts`:788–789 (dev: "the catalogue says ♩ = N" only when it differs from the model's opening; both 100, so the 120 is never flagged there); `build.py`:952–953 (`provenance.facts.tempo` = authored, via the edition); `excerpt_proposer.py`:996, :1068 (`physical_gate`: the catalogue's tempo only where a window has no readable mark); `render_check.py`:321 (fills a missing value only); `ChordChartScreen.ts`:530–537 (a chart's bpm seed, not reached for a piece with no chord symbols, :512 dead-ends first) |
| 8 | Kern source: `!!!OMD: Tempo di marcia`; `*MM100` in all three spines; `!!!OMD: Trio` | `content/scores/imported/kern/joplin/kern/mapleleaf.krn`:6, :17, :456 | `import_kern.py`:132 (`_TEMPO_RE`), :314–316 → catalogue `tempoBpm` 100.0 (kern row) |
| 9 | Kern source-table prose: "Marked 'Tempo di marcia'; the rag that made Joplin's name…" (agrees with :6 and with the reference edition) | `content/sources/kern.json`:283 (row :259, `variantOf` :276) | — |
| 10 | Kern built file `song.ragtime.joplin-maple-leaf-rag.kern.mxl`: one quarter = 100 with `<sound tempo="100"/>` at 0:0; "Tempo di marcia" became `<movement-title>` and "Trio" a `<miscellaneous-field name="humdrum:OMD">`, neither a direction | the built MusicXML (raw scan; `table.tsv`) | reader → one event 0:0 100: plays 100 throughout |
| 11 | Reference edition, the scanned first edition (Copyright 1899 by John Stark & Son): page 1 prints "Tempo di marcia." over the pickup and **no metronome mark**; page 3 prints "TRIO." and no tempo; page 2 nothing | `content/scores/imported/kern/joplin/reference-edition/mapleleaf.pdf`, pages 1–3 (decoded read-only by `scripts-pdf_page.py`, looked at, not kept) | — |

**The mechanism for the 120 is a supported hypothesis, not a fact about this file.** MuseScore 2.1.0's source gives a tempo text 120 until its words state a figure. The table shows 120 on 23 words-only tempo directions, including "Allegretto", "a tempo", "Tempo I", "Meno mosso." and "Andantino con moto", in files by MuseScore 1.3, 2.0.2, 2.1.0, 2.2.1, 2.3.2, 3.5.2 and 4.0.0. Other words-only directions carry tailored values (137 of the 160). What would refute it for *Maple Leaf*: the MuseScore file (`.mscz`, not in the clone) showing a tempo set by hand on those texts.

## Item 2 — the table

The full table is `table.tsv`: 226 rows, every MuseTrainer and kern row that builds a file in the personal flavour. The strict flavour's 174 (58 MuseTrainer, 116 kern) are byte-identical files with the same `tempoBpm`, a subset. Its columns:
- id and source;
- the source-table tempo (a field, or the `editionNotes` sentence quoted), and for a kern row its `.krn`'s `*MM`, `!!!OMD` and `!LO:TX` tempo statements with lines;
- every printed mark, with position and quarter-note value;
- every `<sound tempo>` by position in score order, with its words;
- what plays: the reader's opening and its bpm at each disagreeing position;
- the catalogue's `tempoBpm`, and whether it equals the opening;
- the verdict, the shape, and what the importer did (source against built).

What plays comes from the app's reader (`reader-dump.jsonl`, `tempoEvents` and `openingTempo` through `toMusicXml`, run by `scripts-reader-dump.table.ts`). The raw sound list comes from a read-only ElementTree scan beside it, **labelled as the raw scan, not the reader** (`scripts-raw_scan.py`; its output, 377 KB, was not kept, and its per-position content is in `table.tsv`). `summary.txt`, `disagreements.txt` and `kern-mm.txt` are the views.

**By counts (clean rows summarised).**

| | MuseTrainer (64) | kern (162) |
|---|---|---|
| agrees | 50 (23 print marks each with an agreeing sound, 23 state sounds only with no printed mark, 4 both; 1 of the 50, WTC I Prelude 2, has a catalogue that differs from its opening) | 102: 99 play every `*MM` their `.krn` states; **3 drop the later ones** |
| no tempo (defaulted): the source states none; `convert.py` wrote 96 as a printed mark and a sound | 6 | 60 (the Chopin first editions that state no `*MM`; catalogue `tempoBpm` null) |
| sound contradicts the mark beyond R (the check's findings) | **4 rows, 15 positions** | 0 |
| two different sounds at one position, no contradiction | 4 | 0 |
| catalogue `tempoBpm` = the reader's opening | 63 equal, **1 differs** | 102 equal, 60 null |
| importer | 55 verbatim copies (one, Chopin's Ballade 1, a failed normalisation copied as it is); 9 converted (6 no-tempo, 3 multi-part keeping their one tempo: 100, 58, 70.0002 = the source's) | converted by `convert.py`, all from the cache |

**Every disagreement in full** (`disagreements.txt`; "silent" = at the bar's end, superseded at the next bar's start before any note; the four columns are what each candidate rule would play, and no rule is applied anywhere):

| row (writer) | at (ordinal:offset) | the file there | today (first sound) | last sound | a sound agreeing with the mark | mark over sound |
|---|---|---|---|---|---|---|
| *Maple Leaf Rag* (MuseScore 2.1.0) | 1:0.25 | 120 on "Tempo Di Marcia"; 100 with quarter = 100 | **120** | 100 | 100 | 100 |
| | 51:0 | 120 on "TRIO"; 100 with quarter = 100; 100 with quarter = 100 | **120** | 100 | 100 | 100 |
| Satie, *Gymnopédie no. 1* (MuseScore 1.3) | 0:0 | 60 with quarter = "ca. 76" on "Lent et douloureux"; 76.0002 (empty words) | **60** | 76.0002 | 76.0002 | 76 |
| | 0:1 (to the end: no later tempo) | 61.9998; 69; 72; 76.0002 (all empty words, no mark) | **61.9998** | 76.0002 | 61.9998 | 61.9998 |
| Bach, Toccata BWV 565 (MuseScore 3.6.2) | 0:0.25, 0:2.375, 1:0.25 | 20 with quarter = 10 | **20** | 20 | 20 | 10 |
| | 0:1.125, 0:3.5, 1:1.125 | 36 with quarter = 10 | **36** | 36 | 36 | 10 |
| | 2:4 (silent) | 20 with quarter = 10 | 20 | 20 | 20 | 10 |
| `song.beautiful.g-minor-bach.alt` (MuseScore 2.3.2; personal-build) | 15:3, 28:0, 45:0, 61:0 | 90 with quarter = 80 | **90** | 90 | 90 | 80 |
| | 64:1 | 94.9998 with quarter = 80 | **94.9998** | 94.9998 | 94.9998 | 80 |
| Brahms, *Hungarian Dance no. 5* (MuseScore 2.1.0) | 65:0 | 40 with quarter = 40; 50 with quarter = 50 (two printed marks) | **40** | 50 | 40 | 40 |
| | 67:1 | 20 with quarter = 20; 40 with quarter = 40 (two printed marks) | **20** | 40 | 20 | 20 |
| Debussy, *Clair de lune* (MuseScore 3.6.1) | 70:3 | 45 on "45"; 48 on "48" | **45** | 48 | 45 | 45 |
| | 25:4.50208, 65:4.5, 67:4.5 (silent) | 57, 42, 24, 18; 93, 90; 75, 72 (numbers as words) | — | — | — | — |
| Debussy, *Arabesque no. 1* (MuseScore 3.5.2) | 4:4, 74:4 (silent) | 116 on "rit."; 97.9998 on "98" | — | — | — | — |
| Chopin, Prelude op. 28 no. 4 `.alt` (MuseScore 3.6.1) | 16:4 (silent) | 48 on "48"; 50 on "50" | — | — | — | — |
| Bach, WTC I Prelude 2 (MuseScore 2.0.2) | opening | the first tempo (145) stands after notes have sounded, so the app opens at its default 100 (X3d's rule, X32) | catalogue says **145**, the app opens at 100 | | | |
| Chopin, Rondo op. 16 (NIFC kern) | from `.krn`:271 and :872 | the first edition prints "Più mosso ♩ = 152" (`!LO:TX`:272, `*MM152`) and, for the Rondo itself, "Allo. vivace ♩ = 96" (`!!!OMD`:867, `*MM96`:872); the built file keeps only the Andante's quarter = 48 | **48 throughout** | | | |
| Chopin, Waltz op. 70 no. 1 (NIFC kern) | from `.krn`:351 and :796 | "Meno mosso. ♩ = 96" (`!!!OMD`:350, `*MM96`), then "tempo I°" with `*MM264` (:796); the built file keeps only 264 | **264 throughout** | | | |
| Joplin, *Combination March* (kern) | from `.krn`:45 | "Tempo di Marcia." (`!!!OMD`:46) with `*MM120` after the Andante introduction's `*MM100`; the built file keeps only 100 | **100 throughout** | | | |

**Every unequal sound/mark pair below R** (so neither a finding nor excused by R; `summary.txt`):
- MuseScore's per-second rounding (79.9998 against 80, ratio 1.0000…) on 11 rows.
- *La Campanella*'s sounds 3 below its marks: 88/91, 70/73, 61/64, 58/61, ratio 1.034 to 1.052.
- `g-minor-bach.alt`'s 85 and 86 against 80 (1.0625, 1.075) and 75 against 80 (1.067).

**The seven kern `editionNotes` tempo sentences against their files** (item 3's only permitted fix):

| sentence | file | verdict |
|---|---|---|
| Entertainer "marked 'Not fast.'" | `!LO:TX` :16 | agrees |
| Peacherine "Not too fast." | OMD :6 | agrees |
| Easy Winners "Not fast." | OMD :7 "Introduction. Not fast." | agrees |
| Maple Leaf "Tempo di marcia" | OMD :6 and the reference edition | agrees |
| Solace "Very slow march time" | OMD :5 | agrees |
| Bethena "Valse Tempo" | OMD :8 | agrees |
| Pine Apple "Slow March tempo. [quarter]=100 … printed on the first edition" | OMD :6 and `reference-edition/pineapple.pdf` page 1 | agrees |

No sentence is contradicted, so no `editionNotes` line changes. MuseTrainer's one `editionNotes` (Happy Birthday) states no tempo.

## Item 3 — fixes: none applied, each recorded

No data is both proven wrong by the read and fixable without moving an identity. Every fix below changes a built file's bytes, a reader or an importer, all outside this lane. Each is deferred and put to the reviewer (E50a's former-identity path, and E50's `repaired_identities.json` relation for a repaired file, now exist). None is a per-row tempo override in an importer.

| row | change | mechanism | identities it moves |
|---|---|---|---|
| *Maple Leaf Rag* (MT) | play 100 at 1:0.25 and 51:0 | **(a)** a reader rule at one position (X3d's): a sound agreeing with a co-located printed mark beats one that does not; or **(b)** a repair of the file: the two words-only `<sound tempo="120"/>` removed or set to 100, through a sanctioned repair step with a former-identity relation (the MuseTrainer importer copies verbatim; it has no repair step today) | (a) none; (b) 1: `song.ragtime.joplin-maple-leaf-rag` (`5fe979be…`) |
| Satie, *Gymnopédie no. 1* (MT) | play ca. 76 (the printed mark, and MuseScore's last sound) at 0:0 and from 0:1 | (a) the agreeing-sound rule fixes 0:0 only; 0:1 has no mark, so only a "last sound at a position" rule (MuseScore's own) plays 76 there; or (b) the file's 60, 61.9998, 69 and 72 removed | (a) none; (b) 1 |
| Bach, Toccata BWV 565 (MT) | the printed "quarter = 10" made to say what plays (20/36), or left | a repair of the printed text | 1 (none if left) |
| `g-minor-bach.alt` (MT) | the printed "quarter = 80" made to say 90/95 where it sounds so, or left | a repair of the printed text | 1 (none if left) |
| Chopin Rondo op. 16, Waltz op. 70 no. 1, *Combination March* (kern) | every `*MM` kept at its own position | `convert.py` (E50a's file) keeps only the first `MetronomeMark` (`existing_tempo[1:]` removed, :1557–1565, written for ABC's per-voice duplicates); keep each at its offset and remove only same-offset duplicates | 3: `song.classical.chopin-rondo-op16.nifc`, `song.classical.chopin-waltz-op70-1.nifc`, `song.ragtime.joplin-combination-march` (and any converted file outside MT/kern with a later tempo: not searched) |
| 66 defaulted rows (60 NIFC kern, 6 MT: `song.folk.bella-ciao`, `song.holiday.carol-of-the-bells.easy`, `song.classical.beethoven-fur-elise.easy`, `song.folk.happy-birthday`, `song.folk.happy-birthday.alt`, `song.classical.petzold-minuet-g-bwv-anh114.alt`; list in `defaulted.txt`) | the default 96 written as a `<sound tempo>` only, so the page prints no number the edition lacks | `convert.py` `insert_tempo` (:1333–1350) writes a `MetronomeMark`, which music21 exports as a printed `<metronome>` | 66 |
| the 6 MT defaulted rows' catalogue fact | `provenance.facts.tempo` inferred, not "authored via the edition" | `build.py`:952 decides from `tempoBpm`'s truthiness, and the MuseTrainer importer reads `tempoBpm` from the converted file (`import_musetrainer.py`:316) | none (catalogue fields) |
| Bach WTC I Prelude 2 (MT) | catalogue `tempoBpm` 100, the opening | the catalogue's reader (Follow-up 7) | none |

## Item 4 — the check

`app/tests/unit/tempoSoundAgainstMark.test.ts`, six cases.

- **The finding** is exactly the brief's: an event whose `from` is `'sound'`, that has a `mark`, and where the larger of `bpm` and `mark.quarters` over the smaller exceeds R. It is read through `tempoEvents` and `toMusicXml`, the unzip `demandsOfFiles.test.ts` uses.
- **R = 1.1**, with its case in the test. Nothing between 1.1 and 1.2 in the corpus agrees. The only pairs there are `g-minor-bach.alt`'s 90 and 95 against a printed 80, a contradiction a learner with a metronome meets, so they are pinned, not excused by a wider R.
- **Pinned list** (15 entries, each naming its row and X40), compared in both directions:

  | row | positions |
  |---|---|
  | *Maple Leaf* | 2 |
  | Satie | 1 |
  | BWV 565 | 7 |
  | `g-minor-bach.alt` | 5 |

- **Never vacuous.** Missing content fails and never skips (`nonvacuous.txt`, all four probes red):
  - the built folder missing;
  - *Maple Leaf*'s MuseTrainer file absent;
  - any MuseTrainer or kern row with a built file whose file is not read.

  The count read equals the catalogue's MT and kern rows with a built file in the flavour under test: 226 personal, 174 strict. The flavour is inferred from whether any personal-tagged row has a file. A pinned finding on a personal row may lack its file only in the strict flavour. The `personal-gap` probe shows that a personal row without its file in the personal flavour fails.
- **Red first**, with the list empty (`red-empty-list.txt`, exit 1): the 15 new findings, *Maple Leaf* among them: `"song.ragtime.joplin-maple-leaf-rag @1:0.25 sound 120 against mark 100"`, `"… @51:0 sound 120 against mark 100"`.
- **Green** once filled: personal 6 of 6 (`green-personal.txt`), strict 6 of 6 with `PIANOPATH_TEMPO_CHECK_CONTENT=build/x40/strict-content` (`green-strict.txt`: 10 findings, `g-minor-bach.alt`'s 5 excused as a strict placeholder).
- **Synthetic cases:**
  - a pair that agrees (100/100);
  - a pair at exactly R both ways (110/100 and 100/110), none, and just beyond it (111/100), one;
  - a mark with no sound (plays the mark's own number, `from: 'mark'`), none;
  - two sounds at one position (words 120 then the printed 100 with 100: one finding, 120 against 100; the reverse order: none).

## Item 5 — identity

No built file's bytes, no reader and no importer changed. The ladder and the catalogue were not regenerated as a change: the worktree's builds are local, and the build's two regenerated tracked reports were put back, under *Deviations*.

## Verification layers and mutants

- **Unit:** the new test, red then green, with the synthetic cases above.
- **Data:** the table and item 1, every value with its line.
- **Chain:** `npx tsc -b --noEmit` 0; `npm run lint` 0; the one test file 0 (both flavours); `python tools/docs/checks_for_paths.py` on the files touched 0 (the test file and every file in `docs/prompts/runs/X40/`, 31 matched, 0 unmatched; the map's minimum is tsc, lint and this unit file).
- **Product:** nothing a learner hears changes.
- **Mutant (a)**, the comparison disabled (`false && …`), `mutant-a.txt`, exit 1: 3 of 6 fail. Stale: the 15 pinned, *Maple Leaf*'s two among them. Also the synthetic "just beyond R" and "two sounds" cases fail.
- **Mutant (b)**, R = 1.25, `mutant-b.txt`, exit 1: 3 of 6 fail. Stale: *Maple Leaf*'s two entries (1.2) and `g-minor-bach.alt`'s five (1.125, 1.1875), plus the same two synthetic cases. Satie (1.267) and BWV 565 (2.0, 3.6) still found.
- Exit codes: `exit-codes.txt`.

## Premises checked at the lines

- Premises 1–6 hold at `eebafb5e`. *Maple Leaf*'s built file still equals the clone's; both copies carry MuseScore 2.1.0 and encoding date 2017-05-21.
- Premise 3's "the app plays 100 in the pickup, 120 from bar 1's second sixteenth and from bar 51" is confirmed by the app's reader.
- **Corrected: kern rows and the strict flavour.** The brief and the dispatch note say kern rows are tagged `nc-personal-build` and absent from the strict build. Only the 46 Joplin kern rows (CC BY-NC-SA) are. The 116 Chopin first editions (CC BY 4.0) build in both flavours, and a MuseTrainer row whose composition is not free (`personal-build`, 6 rows, `g-minor-bach.alt` among them) is a strict placeholder. The check and its comment follow the tags, not the source name.
- **Added to premise 5:** the kern built file carries "Tempo di marcia" as its `<movement-title>`, not as a direction over bar 1.
- The brief's "is a metronome mark printed, or only 'Tempo di marcia'?": only the words.

## Done

- Item 1: every *Maple Leaf* tempo fact with file, line and consumer; the reference edition's pages read. Authoritative for playback: the printed 100. For import: the reader's opening, 100. The 120's mechanism is a supported hypothesis.
- Item 2: the table over all 226 rows (`table.tsv`), counts above, every disagreement in full, the raw scan labelled.
- Item 3: no `editionNotes` sentence is contradicted, so none edited. Every identity-moving fix is recorded per row with its mechanism and identities, and deferred.
- Item 4: the check, red with the list empty, green in both flavours, non-vacuous (four probes), synthetic cases.
- Item 5: no identity moved; nothing regenerated as a change.
- Both mutants killed; the chain green.
- *Technical verdict:* a check now holds every sound-against-mark contradiction in the corpus to a pinned list. The reader, the importers and every built byte are as they were.
- *Pedagogical verdict:* nothing taught changes. No lesson, level, rung or learner-heard tempo moves; *Maple Leaf* still plays 120 from bar 1 until the reviewer rules. Whether 100 suits the rag, and whether BWV 565's and the G minor arrangement's written timings are musical intentions, is **unverified as music**.

## Not done

- **Any reader, file or importer change:** outside X40 by the brief and the reviewer's approval.
- **Playwright and the Score screen:** not run, per the brief. OSMD's drawing of the printed marks (the 66 "♩ = 96", BWV 565's "♩ = 10") was not looked at. That they are printed is read from the files (`<metronome>` with no `print-object="no"`: 0 of the 226 files hide a tempo statement).
- **MuseScore's exporter order:** not read (the fetch could not hold `exportxml.cpp`), so "MuseScore played 100" stays inferred.
- **Mutopia:** its clone was not copied (the harness names kern and MuseTrainer), so its one row was a placeholder in both builds; it is outside the table.
- **Converted files outside MT and kern with a dropped later tempo:** not searched.

## Deviations, with reasons

- **The two tracked reports the build regenerates, restored.** `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md` changed only because the Mutopia file was absent from this build. They were written back from `git show HEAD:<path>` with the checkout's line endings: no checkout, reset or stash. `git status` then showed them clean.
- **The strict flavour was built** (`--no-personal --out build/x40/strict-content`) to show the check green and non-vacuous there, as the dispatch note requires. The test takes `PIANOPATH_TEMPO_CHECK_CONTENT` for it, default `public/content`.
- **R stays 1.1** although one edition's pairs lie between 1.1 and 1.2. Those pairs are contradictions, not agreements (the test states the case).

## Follow-ups (recorded, not built)

1. **P2, *Maple Leaf* plays 120 from bar 1 against its printed 100** (X40's own row). This is the reviewer's decision (Question 1). Identity: none by the reader rule, 1 by a repair.
2. **P2, Satie, data only as the brief says (X38's named gap).** The app plays 60 on beat 1 and 61.9998 from beat 2 to the end. The page prints ca. 76; MuseScore's last sound, and the music21 build, give 76.0002.
3. **P0 for three rows' playback, in `convert.py` (E50a's file): a converted score keeps only its first tempo mark.**
   - Chopin's Rondo op. 16 plays its Allegro vivace, printed ♩ = 96, at the introduction's ♩ = 48.
   - The Waltz op. 70 no. 1 plays its Meno mosso, printed ♩ = 96, at 264.
   - *Combination March* plays its "Tempo di Marcia" (`*MM120`) at the introduction's 100.

   Moving 3 identities; attach to the converter's cluster (E50a/E50).
4. **P2, the converter's default printed as an edition's mark.** 66 rows show "♩ = 96", which no edition states (60 NIFC kern, 6 MT). Under the provisional rule a printed number is authority, so a default must not look like one. Moving 66 identities.
5. **P2, a false provenance fact:** the 6 MT defaulted rows say `tempo: authored, via the edition`.
   - Their tempo-sensitive demands are therefore trusted (`build.py`:958–962 distrusts them only when inferred).
   - The inventory's count of converter-supplied tempos (232 in the committed `inventory.md`) misses them.

   No identity moves (`build.py` and the importer are not this lane's).
6. **P3, printed text that does not follow its sound** (BWV 565 ×7, `g-minor-bach.alt` ×5, *La Campanella* below R), and **two printed marks at one position** (Brahms ×2). Upstream editions; the reviewer's legitimate-case question (Question 2).
7. **P3, the catalogue's regex reader, a third definition** (operating procedure §7):
   - `import_musetrainer.measure_facts` takes the first `<sound tempo="…">` in file order (double-quoted only, blind to the opening rule and to mark-only files);
   - `import_kern.kern_facts` takes the first `*MM`.
   - On this corpus it differs from the reader's opening on 1 MT row (WTC I Prelude 2: 145 against 100) and is null on the 60 kern rows that play 96.
   - Recommended source of truth: the reader's opening. The build-side equivalent already exists: `difficulty.opening_quarter_bpm()`, which equals the app's opening on 2,011 of 2,012 scores (X31a).
   - Downstream: `tempoBpm` on WTC I Prelude 2, the excerpt proposer's physical gate, render-check durations, and the dev microscope's note.
   - Attach to X34's cluster (the store's regex `writesTempo`), not a new row.
8. **Observation (P3):** the kern built files carry the tempo word as `<movement-title>`. Whether any screen shows it as a title was not looked at.

## Questions for the reviewer

1. **The shape of the deferred fix for *Maple Leaf*, and whether Satie shares it.**
   - **(a) A reader rule at one position (X3d's), no bytes moved.** Measured on the corpus (`disagreements.txt`), against today:
     - *a sound agreeing with a co-located printed mark*: changes 3 positions on 2 rows (*Maple Leaf* ×2 → 100, Satie's beat 1 → 76.0002), and nothing else;
     - *mark over sound* (the provisional rule): changes 15 positions on 4 rows, adding BWV 565's pauses at ♩ = 10 and the G minor arrangement flattened to 80;
     - *last sound at a position* (MuseScore's own tempo map): changes 13 positions on 6 rows (7 audible), adding Satie from beat 2 at 76, Brahms 40 → 50 and 20 → 40, and *Clair de lune* 45 → 48.
   - **(b) A repair of the file** through a sanctioned step with a former-identity relation: 1 identity.
   - Recommendation: (a) with the agreeing-sound rule, as the narrowest statement of the provisional rule's intent, and a ruling on whether "last sound" should decide a position with no mark (Satie's beat 2).
2. **Should "the first sound at a position" give way to a sound that agrees with the printed mark?** This is X3d's rule, not this lane's. The corpus shows the legitimate cases the reviewer asked to see. Apparently intentional differences exist only where a position has **one** sound that disagrees with its own printed number (BWV 565, the G minor arrangement, *La Campanella*). The agreeing-sound rule never overrides those; the provisional "mark outranks sound" rule would.
3. **The converter's two faults** (Follow-ups 3 and 4) move 69 identities through `convert.py`. Is a converter seam wanted under E50a's relation, and should the default stay audible but unprinted?

## Files

- `app/tests/unit/tempoSoundAgainstMark.test.ts` (new).
- `docs/prompts/runs/X40/`:
  - `ENTRY.md`;
  - the full table and its views: `table.tsv`, `summary.txt`, `disagreements.txt`, `kern-mm.txt`, `defaulted.txt`, `words-only-tempo.txt`, `mt-sources.json`, `reader-dump.jsonl`;
  - the check's runs: `red-empty-list.txt`, `green-personal.txt`, `green-strict.txt`, `mutant-a.txt`, `mutant-b.txt`, `nonvacuous.txt`;
  - `musescore-source.txt`, `exit-codes.txt`, `build-personal.log`, `build-strict.log`, `cleanup.txt`;
  - `scripts-*` (run from `build/x40/`; paths relative to it; `scripts-cleanup.sh` from this folder).
- Cleanup (`cleanup.txt`): `app/node_modules`, the copied clones (`content/scores/imported/{kern,musetrainer}`), `build/cache`, the builds' outputs under `build/` and `app/public/content` (not the tracked `audio`), `app/public/dev`, and the lane's temp state `build/x40` deleted; `app/dist` was never made.
- Not changed: `app/src/**`, `tools/content/**`, `content/**` (no `editionNotes` line needed a change), every lesson.

## Post-action gate

- The table and the check were read back against the built files and the sources. The intent (which fact is authoritative, with evidence, no reader change) is answered, and the one product decision is left to the reviewer.
- No owner or reviewer ruling is overridden. Learner truth, evidence, material identity and curriculum are untouched.
- The new work found is recorded and attached to existing clusters:
  - X3d for the rule;
  - E50a/E50 for the converter;
  - X34 for the catalogue's reader;
  - X38 for Satie.
- VERIFIED: the table's values, the reference edition's text, the check's red, green and mutant lines. NOT YET VERIFIED: what OSMD draws, MuseScore's export order, any sound. HYPOTHESIS: the 120 as MuseScore's starting tempo on these texts, and the intent behind BWV 565's and the G minor arrangement's sounds.

## Doc rows

- `docs/08-test-map.md`, the unit list, after `tempoLadder.test.ts`: "- `tempoSoundAgainstMark.test.ts` — every built MuseTrainer and kern score through the app's unzip and tempo reader: a sound the reader plays against the printed metronome mark at its position, beyond R = 1.1, pinned in both directions (15 findings on 4 MuseTrainer rows, *Maple Leaf Rag*'s 120 against its printed 100 at bars 1 and 51 among them; none on a kern row); never vacuous: the built folder, *Maple Leaf*'s file and every MuseTrainer and kern row with a built file in the flavour under test; the rule's synthetic cases (agreeing, exactly R, a mark alone, two sounds at one position) (X40)."
- `docs/08-test-map.md`, the tempo-map row (*The tempo map*, X3d; X3e), its tests column: add "`tempoSoundAgainstMark.test.ts` (X40: the corpus's sound-against-mark contradictions pinned; seen red with the list empty)".
