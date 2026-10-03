# Content-source failure history (research, read-only, 2026-10-03)

Scope of what was read: `docs/prompts/content-mistakes.md` (all), `docs/00-invariants.md` §1a, `docs/03-content-pipeline.md` §§1–5, targeted greps of `docs/pending-review.md` (42,999 lines; read by grep and by the entries named below, **not read in full**), the backlog's named rows, `docs/prompts/views/audit/part-12.md`, `docs/handoff-2026-09-09.md` §5ai/§5aj, `docs/decisions/2026-09-05-p5-authored-content.md` §1, `docs/prompts/runs/CF1–CF3`, every `content/sources/*.json` comment, `content/score-checks.allow.json`, `content/review/decisions.jsonl`, and the module docstrings of `validate.py`, `score_checks.py`, `render_check.py`, `truncation_scan.py`, `licensing.py`, `review.py`, `fetch.py`, `author.py`, `abc_tools.py`, `generate_exercises.py` and the four importers. `git log` holds 156 commits here (a shallow history); only three commit messages matched source terms. Nothing was built, run or heard. Citations are `file:line`; "pr" = `docs/pending-review.md`, "bl" = `docs/prompts/backlog-2026-09-25.md`.

---

## 1. PDMX (MuseScore user uploads, Zenodo record 14648209)

### 1.1 What it provides; licence as recorded
- 542 committed rows (`content/sources/pdmx.json`: 461 `cc-zero`, 81 `publicdomain`; `compositionStatus` pd 367 / unknown 154 / in-copyright 21; `tempoDefaulted` true on 169 — counted from the file today).
- Licence column is "the uploader's claim about the *edition*" — every row `publicdomain`/`cc-zero`, "including Yiruma and Billie Eilish arrangements" (`docs/03-content-pipeline.md:72`). Composition status is a label, not a gate, under D23; strict build placeholders non-`pd` (`docs/03:28-36`).
- Every row is `levelSource: estimated` and `review.decision: keep` (pdmx.json, counted). A quarry keep is neither review bit (`docs/03` §4a, `review` bullet; pr:19538 "0 score reviews and 0 teaching-use reviews (the 542 PDMX quarry keeps are neither)").

### 1.2 Recorded failures
| What was wrong | Caught by / when | Status |
|---|---|---|
| Pedagogical claims never established: `jazz.7` rootless voicings/tritone subs over Jingle Bells jazz etc.; latin, hymns, technique.4–7 likewise; `concepts_for()` derives only coarse claims | Reviewer's audit Part 12 (`docs/prompts/views/audit/part-12.md:9-33`), bl R38 (bl:528) | Gate built in E (R38 status "built"); content-mistakes #17 |
| Corpus mostly unusable: 254,077 → 37,499; easiest band 70 of 80 melody-only lead sheets | part-12.md:42-48; bl R39 (bl:529) | Closed as an inventory measure; rows ≠ opportunities |
| Metadata conflated/wrong: *Scarborough Fair* credited to Simon & Garfunkel; `compositionStatus` unknown on most rows | bl R15 (bl:507) | Identity model (composition→arrangement→edition) built; titles remain unverified attributions |
| `composer_name` is `NA` for 22,111 of 36,150 deduped rows; 59 of 306 quota rows | `content/sources/composers.json` _comment; `docs/03:72` | Falls back to `artist_name` |
| Mojibake: composer 坂本龍一 double-encoded (`docs/03:72`); *Were you there* title with seven corrupted characters and a chord symbol "C"+Korean text — `commit.py` copies title verbatim and slugs the id | Entry 25 (pr:2508-2514) | Row dropped; advice: quarry another copy |
| *Sillyâss (Two-Step)* — title copied verbatim into Library/id; only one archive copy | Entry 44 (pr:8063-8070) | Owner decision, recorded |
| Same piece under two ids (seven high containment pairs: Bach prelude, Beethoven sonatina, Swan Lake, Maple Leaf, Passacaglia …) | `score_checks.py` containment, Entry 23 (pr:2003-2005) | 14 ids dropped, spliced as text (Entry 34, pr:4104-4122) |
| `duplicate_of` is hash-based and missed identical notation (*De Colores*, *Steal Away*) | Entry 25 by reading (pr:2498-2502) | Recorded; score_checks containment now covers whole-catalogue overlap |
| PDMX dataset's own `subset:deduplicated` flag rejected Bach C-major prelude, Maple Leaf, K.545, Ballade 1 | handoff-2026-09-09.md:3264-3272 (§5aj) | Flag demoted to a label; `work_key`/`best_editions` choose editions |
| Mislabelled titles: Beethoven *Écossaise* titled in G, written in F; Chopin Op.50/1, 59/3 titled in wrong keys; Clementi "Sonatina No1-2" actually Op.36/1 third movement; K.1e file containing K.1f | score_checks key/title/containment; Entry 34 (pr:4124-4140) | Retitled with old title in review note |
| Truncated copies: *Streets of Laredo* 17 of 34 bars ("half the tune"); *Minuet in G minor* first 16 of 32 bars | score_checks truncation (`content/score-checks.allow.json`, the two `truncation|copies` rows) | Retitled "(first half…)" / "(first 16 bars)", lessons say so; not replaced because the commit step needs an ear review |
| Wrong bar sums / mis-barred files: *El Choclo* 44 of 49 bars; *Kohler Sonatina* 66/113; Kreisler *Liebesleid* 49/156; *Doctor Gradus* mis-barred from bar 44; *Jimbo's Lullaby* overruns; *Holy Holy Holy*; *Home on the Range* two bars merged | score_checks bar-duration (allow.json entries) ; `docs/03:628-634` | Allowed with reasons; most "on no rung"; Liebesleid dropped from a rung; whether to refuse self-contradictory files "is still open" (`docs/03:633-634`) |
| *The Old Rugged Cross*: both editions 6 and 4 time signatures in 19/24 bars of a triple-time hymn — "passes every machine gate because the file is valid; it is the barring that is wrong" | Entry 25 by reading (pr:2515-2519) | Not kept |
| Grace-note bagpipe writing (*Joyful Joyful*, 72 of 134 notes grace) | score_checks grace-density (allow.json) | Allowed; only grace-free copy levels too high |
| Files repaired by hand: Czerny 299/7,8,10, Mozart K.2, *Royal Garden*, *Riverside*, *Super Mario Land 2*, *Mandinga*, *Soul Eater*, *I Got Rhythm*, *Arabesque*, *I Remember You*, *Weary Blues* | Entry 34 (pr:4141-4144) | Repaired; `convertedSha256` respliced |
| Tempo printed as "= N" with glyph missing (7 rows: Wabash, Margie, Limehouse, Singin', Weary, Storyville, Tishomingo) → converter default | E1 Entry 101 → bl E32/E50 (bl:687, 705) | Built E50 (re-converted, identities related) |
| Only the first tempo mark survived conversion | bl E57 (bl:712); Entry 183 (pr:36663) | Built; 96 of 542 PDMX rows changed, 93 re-committed, 3 held (would falsify lessons); 6 transplanted because today's converter no longer reproduces their committed files (pr:36840) |
| Defaulted tempo printed as ♩=96 on 169 PDMX files | bl E59 (bl:714) | Built: sound-only default |
| Chord-symbol accidentals in a private-use font glyph drew boxes ("E6 □ 13") | E1 → bl E31 (bl:686) | Closed: renderer maps glyphs |
| Level disagreement: stored level differs from model on 308 of 542; index prints 4.5 when no model fitted | bl X37 (bl:761), R31 (bl:524) | X37 re-check waits on next quarry; R31 ruled "no fake scalar" |
| `maxSimultaneousRight` counted chord symbols as notes (*O Worship the King*) | Entry 25 (pr:2504-2507) | Filters added to `difficulty.py` (`docs/03:277-290`): 35 rows were carrying `hand-crossing`/`wide-span` off a chord symbol |
| Wrong genre bucket (a Petzold minuet filed under pop) | `docs/03:72` | Row-level `genre`/`tracks` override |
| Licence only user-declared: *Mandinga*, "a 1990s Chilean band song whose uploader claims public domain" | Entry 36 (pr:4820-4821) | Not refused by any gate (D23 label only) |
| Placement from the PDMX feature record / titles: four wrong placements out of eight from titles | `docs/00-invariants.md:83-89` | `requires` + `validate.notation_requirements` refuse it |
| A kept PDMX *Kumbaya* lacks the chord symbols the rung requires while the dropped one had them (MAX_EDITIONS=2) | Entry 25 (pr:2492-2497) | Owner decision |
| Render gate (quarry gate 5) not run on the 93 re-converted files (E57) nor E50's seven | pr:36852 | Open |
| PDMX "Beyer Nro 8–10": numbering not Peters', no edition; "Reinagle Allegro" file is titled "Renaissance Dance" — attribution unsupported | CF3 (`docs/prompts/runs/CF3/RESEARCH.md:51-56`) | Not proposed |
| *Simple Gifts* (one staff, no LH) on the hands-together rung 2.1; PDMX lead sheets with chords outside I/IV/V on 2.3 | CF3 RESULT.md:51-53, CF2 RESULT.md | Proposals pending owner |

### 1.3 Guardrails today, and gaps
- Quarry six machine gates: convert, round-trip note for note, structure, truncation scan, Chromium render with step parity, duplicate detection (`tools/content/pdmx/README.md:175-178`); stop rules at >½ machine rejection or >40 % review drop (README:198-204). `import_pdmx.py` verifies every checksum (docstring).
- Gap: the README's step 4 says "you, with your ears" and "Nothing here can tell you whether a transcription is any good" (README:206-219), yet Entry 25 states "Nothing on either page has been heard. Every one of the 76 decisions was made from the notation" (pr:2527-2531). The keep's reviewer identity is an open wording question (pr:21022, 21028).
- Gap: licence is never verified beyond the uploader's claim; `compositionStatus` comes from a free-text composer string (`licensing.py` docstring).
- Gap: `commit.py` copies titles verbatim and rewrites `pdmx.json` whole (pr:4106-4108); text splicing is the documented workaround (`CLAUDE.md` JSON hazard).
- Gap: no check reads note spelling, voice/hand assignment or wrong notes against any edition.

### 1.4 Lessons for expanding from PDMX
1. Treat title, composer, arranger, year and licence as unverified attributions; check against a published edition before teaching from the name.
2. Read the notes through the matchers before any placement or claim; never place from title or quarry features.
3. Search for duplicates by notation, not hash or title; one work, at most two editions.
4. Expect wrong barring, merged bars, overfull voices and mojibake in valid files; the gates pass them.
5. Check tempo marks (missing glyph, defaulted, later changes) and chord-symbol glyphs.
6. Prefer a curated source (Mutopia, OpenScore) over a raw row (content-mistakes #17, lines 44); use PDMX as a quarry, never as the curriculum (part-12.md:66-70).

---

## 2. Mutopia (LilyPond editions; MIDI + .ly route)

### 2.1 Provides; licence
- One imported row: *Pine Apple Rag (repeats written out)*, `song.ragtime.joplin-pine-apple-rag.mutopia` (`content/sources/mutopia.json:31-51`). Also two derived tables: `hanon-mutopia.json` (Hanon 1–20; edition CC BY-SA 4.0, credited) and `clementi-op42-fingering.json`.
- Licence read from each `.ly` header (`license`, else `copyright`); Joplin folder all "Public Domain" (`docs/03:93,99`). Files pinned at revision `2144afd6` with sha256 (`mutopia.json:25-29,39-40`).

### 2.2 Recorded failures
| What | Caught | Status |
|---|---|---|
| python-ly 0.9.10 does not implement `\alternative`: writes both endings in turn, doubles repeat marks (*Maple Leaf*: 85 written bars vs 145 played) — all 16 single-file Joplin editions | Q76 discriminating test (`docs/03:105-108`; `mutopia.json:58`) | Route abandoned for MIDI |
| 10 of 16 refused outright (python-ly header UnboundLocalError on *Eugenia*, *Peacherine*; *Elite Syncopations* no notes; music21 "voice overflows its bar" on 7) | same (`mutopia.json:59-76`) | Refused, recorded |
| On *Pine Apple Rag* python-ly closes the LH first bar after a quarter, pushes a bar-ending chord into the next bar, puts a two-voice block's next bar in the same measure | `docs/03:113-117` | Refused |
| A passing detector on a wrong conversion: only *Maple Leaf* as python-ly wrote it unaltered kept the LH pattern in every bar, and that score plays both endings every time — "a passing detector does not vouch for a conversion" | Entry 136 (pr:27782-27788) | Lesson recorded |
| Multi-file editions (`\include`: *Bethena*, *Solace*) not followed | `mutopia.json:75-76` | Not converted |
| MIDI route loses spelling: converter wrote D♭ for C♯ and G♭ for F♯ — 95 notes on *Pine Apple Rag* | Entry 136 (pr:27791) | Fixed: spelling aligned from the `.ly`; unspelled/foreign spelling refuses the row (`docs/03:129-133`) |
| MIDI carries no repeats or voices: repeats written out, two voices merged into chords | `docs/03:136-138`; row's `editionNotes` | Accepted and declared on the row; "busier to read than the edition" (pr:27777-27778) |
| *Magnetic Rag*: spelling gate refuses (unspelled upper notes), LH leaves pattern, MIDI tempo LilyPond default (edition's `\tempo` commented out) | `mutopia.json:55` (`notTaken`) | Not taken; open question (pr:27880) |
| Fetch outage: a missing/unpinned file became a "ladder.md is stale" error, then a placeholder | Q80, Q83/84, Q88 (pr:28448, 29233; `docs/03:432-450`) | Placeholder with reason; deploy guard refuses publishing it |
| Title cut on phone header "(repeats …" | Entry 136 picture (pr:27754, 27876) | P3, open |
| Hanon No. 41 claim not checkable: Mutopia holds only Part I | Entry 84 (pr:17720) | Claim removed |
| `lilypond` not on the machine; LilyPond-backed conversion never run | `docs/03:120` | UNKNOWN whether it would fix python-ly faults |

### 2.3 Guardrails / gaps
- Pinned revision + sha256 on both files; licence re-read; composition year checked (`import_mutopia.py` docstring); MIDI converter read-back refuses lost/gained notes or bars that don't add up; spelling gate; metre must match the table.
- Gap: note-loss gate does not count `.ly` or `.mid` (`docs/03:473-476`); voices merged into chords are accepted, so notation is not the edition's.
- Gap: the MIDI route was tried on ragtime.8's two rags only (`mutopia.json:58`).

### 2.4 Lessons
1. Never assume python-ly's MusicXML is right; check endings/repeats and bar contents against the `.ly`.
2. A MIDI route needs the edition's spelling re-imposed and refuses what cannot be spelled.
3. Pin revision and checksum; a fetch failure is a placeholder, never a silent shrink.
4. Say on the row what the page is not (repeats unfolded, voices merged).
5. Mutopia is the preferred curated source, but each edition still needs its own conversion verdict.

---

## 3. KernScores / Humdrum (craigsapp) and NIFC Chopin first editions (incl. NIFC Polish)

### 3.1 Provides; licence
- craigsapp: five repos CC BY-NC-SA 4.0 (bundled only in the personal build); `beethoven-piano-sonatas`, `chopin-mazurkas`, `chopin-preludes` state no licence (Chopin preludes a bare `!!!YEC`) and must stay excluded, re-proved each build by `assert_excluded()` (`docs/03:70`; `kern.json` `mustStayExcluded`).
- NIFC `humdrum-chopin-first-editions`: CC BY 4.0, 191 solo-piano works after one publisher per piece (`docs/03:71`). NIFC `humdrum-polish-scores` (8,918 files, CC BY 4.0) is opt-in and unused — "nothing in `02` asks for it yet" (`docs/03:71`; `fetch.py:136-147`). No failures recorded for it (none searched beyond these lines).
- Refused collections with reasons: `humdrum-tools/bach-wtc` and `inventions` ("Rights to all derivative electronic formats reserved"), `craigsapp/hummel-preludes` (bare copyright), `art-of-the-fugue` (no rights record), Essen folksongs (single-line, terms unclear) (`kern.json` `checkedAndRefused`).

### 3.2 Recorded failures
| What | Caught | Status |
|---|---|---|
| music21's Humdrum importer drops notes at a spine split inside a split; the Op.56/1 mazurka lost over half its notes; every check (render, step parity, validator) passed it; only the production build threw | CI runner render failure traced, §5aj (handoff-2026-09-09.md:3248-3262) | 52 NIFC works skipped with that reason (kern.json groups, counted) plus `joplin/searchlight.krn` (kern.json items); "Twenty-six pieces with losses under one percent are still on rungs" (handoff:3260-3261) |
| Note-loss gate built afterwards: >2 % refuse, ≤2 % warn (`docs/03:455-503`) | — | Built; blind spot: a note in the wrong bar passes (`docs/03:504-506`) |
| OSMD refuses 13 NIFC files ("Invalid note initialization object") though they round-trip | kern.json groups (13 `skip` rows, counted) | Skipped |
| Mistitled: Op.6 No.5 does not exist — file is Op.7 No.5 ("Cinq Mazurkas") | Entry 34 (pr:4113); kern.json skip | Dropped |
| Duplicates: Op.72/2, Écossaises 2 and 3 | kern.json skip rows | Skipped |
| Composer spelled eleven ways, one "Fryderyk Chopipn" | kern.json `_composers_comment` | Every spelling listed; unknown name stops import |
| Joplin *Cleopha*: mid-bar `=||` strain change → music21 filled the short bar, whole second half a bar late; and later key signatures dropped (second half printed with one flat instead of two) | `docs/03:551-608` | Fixed: `declare_partial_bars`, `drop_seam_bars`, `place_loose_attributes` |
| Overfull bars from NIFC conversions (Op.10/12 b.80, Op.50/1 b.88 inner voice holds fifteen bars, Op.59/3, Op.7/4, polonaises, rondo) — "no committed MusicXML to edit" | score_checks bar-duration (allow.json) | Allowed with reasons |
| Only the first `*MM` survived: Rondo Op.16 Allegro vivace at 48; Waltz Op.70/1 Meno mosso at 264; *Combination March* 120 at 100 | X40 Entry 173 (pr:33929, 34017-34020) | Fixed E57 (pr:36671) |
| 60 NIFC rows printed ♩=96 that no edition states | X40 (pr:33930; 34020) | Fixed E59 (sound-only) |
| `import_kern.kern_facts` takes the first `*MM`; null on the 60 rows that play 96 — a third tempo definition | X40 follow-up 7 (pr:34024-34029) | Recorded P3 |
| `fetch.py` probe hung on a credential prompt and silently cost all 21 Chopin first editions | `fetch.py:166-178` docstring | Fixed (`GIT_TERMINAL_PROMPT=0`, timeout caught) |
| Missing clone (kern/joplin) failed tests/build; now a placeholder with fetch reason | Q82 Entry 145 (pr:30044) | Built |
| Strict (public) build placeholders every Sapp Joplin rag; ragtime.8 stride unestablished until Mutopia | `docs/03:401-405`; Entry 136 | Partly mitigated by Mutopia row |
| Count of the 73 kern exclusions by reason at build time | — | **UNKNOWN** (build not run; table counts above are from kern.json only) |

### 3.3 Guardrails / gaps
- `import_kern.py` re-reads repo LICENSE, `!!!YEM/!!!YEC`, `!!!ODT/!!!PDT`, `!!!COM` from disk and excludes a row whose stated year disagrees (docstring); note-loss gate; `level-banded` tag for group-default levels (`kern.json` _comment).
- Gap: craigsapp/NIFC clones are `git clone --depth 1` of HEAD (`fetch.py:211`), revision recorded in SOURCES.md, not pinned as Mutopia is — an observation from the code, not a recorded failure.
- Gap: titles for NIFC come from a group `titleTemplate`, which produced the Op.6/5 mistitle; the group level is a default, not a judgement.

### 3.4 Lessons
1. Count notes source vs converted on every Humdrum file; a render that passes proves nothing about lost notes.
2. Check every strain change, mid-bar barline and key change in ragtime/dance forms.
3. Read every `*MM`; never let a converter default look like an edition's mark.
4. Read licence per repo and per file; silence and a bare copyright are refusals.
5. Verify opus/number titles against the file's own printed title.

---

## 4. MuseTrainer (`musetrainer/library`, 69 MusicXML files)

### 4.1 Provides; licence
- 64 table rows, 10 excluded (`musetrainer.json`, counted). The repo makes one blanket "Public Domain" claim, no LICENSE, no per-file terms (`musetrainer.json` _comment; `fetch.py:72-80`). Files copied verbatim unless they need normalising (`import_musetrainer.py` docstring).

### 4.2 Recorded failures
| What | Caught | Status |
|---|---|---|
| Composition mislabelled: *Mariage d'Amour* (de Senneville 1979) filed as Chopin "Spring Waltz" (×2); "G Minor Bach" is Luo Ni's 2015 arrangement, not BWV 578 (×2); "Hungarian Sonata" by Clayderman | `musetrainer.json` `exclude` entries | Excluded |
| Edition rights unclear: Bella Ciao (commercial site), Canon in D 3 (bare "2016"), Danse Villageoise (bare ©, Beethoven attribution unverified), Für Elise fingered (commercial site) | same | Excluded |
| *Happy Birthday* import: C7 over E with B♭ **misspelled A♯**; V7 without root; printed symbols (C, G7) understate the inversions | CF3 (`runs/CF3/RESULT.md:81`), CF2 (`runs/CF2/RESULT.md:55`) | Recorded for CF4/CF5, not fixed (`CF3/RESULT.md:115`) |
| *Maple Leaf Rag* plays 120 against printed 100 (words-only `<sound tempo="120">`); 15 sound-vs-mark contradictions on 4 MT rows (Satie, BWV 565 prints "♩=10", `g-minor-bach.alt` prints 80 plays 90/95) | F3a → X40 Entry 173 (pr:33808, 33925-33928) | Pinned by `tempoSoundAgainstMark.test.ts`; file repair deferred — "the MuseTrainer importer copies verbatim; it has no repair step today" (pr:33925) |
| 6 MT rows printed default ♩=96; their provenance said `tempo: authored, via the edition` (false), so tempo-sensitive demands trusted | X40 (pr:33930-33931; 34021-34023) | Print fixed by E59; provenance fact fix status UNKNOWN (not confirmed in this read) |
| `measure_facts` takes first `<sound tempo>` in file order; WTC I Prelude 2 reads 145 vs 100 | pr:34026-34029 | Recorded P3 |
| Two/three copies of one work under different ids (Chopin Prelude Op.28/4 `.alt` differs at bar 17 only; Maple Leaf; K.545; Petzold minuet) | score_checks containment, Entry 34 (pr:4180-4195) | Some dropped; repoint suggested |
| `collapse_to_two` dropped every note of a third part while reporting "merged" (MT G minor Bach, *School of Ragtime*) | §5aj (handoff:3319-3321); `docs/03:458-460` | Fixed; note-loss gate |
| P2 grace-16th truncation defect in OSMD: scan over the 69 MT files found six short bars, none with a short grace | `truncation_scan.py` docstring | Scan made permanent |
| Missing clone → validation failures; now placeholders | Q82 (pr:30044-30134) | Built |
| The authored *Happy Birthday* and *Ode to Joy* were "checked against" MT editions (`decisions/2026-09-05-p5-authored-content.md:16-19`) — one of which carries the A♯ error | inference from the two records together | Not recorded as a failure anywhere I found |

### 4.3 Guardrails / gaps
- Per-file composition and edition judgement in the table; note-loss gate on conversion; strict build placeholders non-PD compositions (six *Beautiful* rows, `docs/03:403`).
- Gap: blanket licence; levels in the table are hand-set ("nothing here is derived from the audio or the notation", `musetrainer.json` _comment); verbatim copy means upstream spelling/tempo faults ship unchanged; clone not pinned (`fetch.py:211`).

### 4.4 Lessons
1. A blanket "Public Domain" claim answers neither question by itself; judge composer and arranger per file.
2. Read spelling and inner voices, not just the symbols.
3. Check `<sound tempo>` against printed marks.
4. Do not use an MT file as the verification reference for an authored tune without checking it first.

---

## 5. Authored ABC (`content/scores/authored`, 33 `.abc` + `.py`)

### 5.1 Provides; licence
- Folk, hymn, holiday and teaching arrangements; `license=CC0`, `arranger=PianoPath` in every `%%pianopath` header (33 of 33 files carry `license=`, counted). Rule: write a melody only if checkable against a library edition or short and unambiguous; otherwise skip (`decisions/2026-09-05-p5-authored-content.md:11-22`).

### 5.2 Recorded failures
| What | Caught | Status |
|---|---|---|
| *Happy Birthday (simple)* missing the A in "happy birthday dear NAME" (B held two beats instead) | Full read §5ai, 2026-09-14 (handoff:3021-3026) | Fixed (handoff:3204) |
| *Frère Jacques* bell figure ends up a fifth instead of down a fourth | handoff:3027-3031 | Fixed: drops to G3, shift fingered |
| *Amazing Grace* rhythm could not be stated; authored file removed; 34 Part F tunes skipped for want of a reference | P5 decision (:34-36) | Open; `pdmx-wants.json` `verify` list (34 titles) is the intended reference |
| *Ode to Joy (full)* bar 12: finger 5 on G3 under a thumb on C4, unplayable | T22/F0 → bl R48 (bl:234) | Fixed T53 |
| *Jingle Bells (chorus)* ends on the half cadence with a C symbol over a G melody note; *Twinkle* mislabelled as "LH holds"; *Old MacDonald* and *Merrily* have no eighths on the eighths rung; *London Bridge* zero-length rests | CF3 (RESULT.md:37-39, 63-65, 115) | Proposals pending owner |
| music21's ABC reader drops `!p!`/`!f!` dynamics | Entry 136 (pr:27877) | Open (P2) |
| music21 ABC inline-voice form `[V:1]` parsed as one concatenated part + one empty part | `abc_tools.py` docstring | Fixed by rewriting to block form |
| ABC first bar numbered 0 | `docs/03:982-986` | Fixed (`renumber_measures`) |
| ABC per-voice duplicate tempo marks were why `normalise` kept only the first mark — which then broke kern/PDMX later marks | pr:36800, 36806 | Fixed E57 |
| Placement by title: *12 Bar Blues* (RH-only melody) on the LH-chords rung etc. | `00-invariants.md:83-89` | `requires`/`notation_requirements` gate |
| Note-loss gate cannot count `.abc` | `docs/03:473-474` | Gap |
| 10 of 33 `.abc` files mention no edition, check or reference in their text (grep for edition/checked/verified/reference/cid; a wording-based search, so a sample) | this read | Unverified provenance of those melodies (the §5ai full read lists them as "checked note by note against the tunes", handoff:3222-3225, without naming a reference) |

### 5.3 Lessons
1. Check every authored melody against a named edition (or the scan, as CF3 proposes for Beyer) and name it in the header.
2. Dynamics and articulation may be dropped by the ABC reader; check the output.
3. A short tune "everyone knows" is still where wrong notes hide (Happy Birthday).
4. Declare simplifications on the row and in the lesson.

---

## 6. Generated exercises (`generate_exercises.py`, `study.py`)

### 6.1 Provides; licence
- Scales, arpeggios, chords, Hanon-style cells, harmony/latin/genre families, rhythm rows, studies (`docs/03:76`); CC0, provenance `generated` with family/version/seed.

### 6.2 Recorded failures
| What | Caught | Status |
|---|---|---|
| Arpeggios misspelled (B major with E♭, F minor7 with G♯, B♭7 with G♯ …) | T53 Entry 84 (pr:17900-17916) | Respelled |
| Triad inversions in eight keys misspelled (B major as B E♭ F♯; A♭ as G♯ C E♭) | D0 measured demands, Entry 90 (pr:19106) | Spelled by interval (v2); spelling policy D0a Entry 91 (pr:19333) |
| Swing pair spelled by semitone count: G♯ for A♭ in B, A♭, D♭, G♭ (none shipped) | CF1 independent music21 check (`runs/CF1/RESULT.md:48-52`) | Fixed |
| `syncopation` family holds no syncopation by the app's rule; "tremolo in thirds" moves one major third; 12 of 16 walking-bass items not a walk | Entry 90 (pr:19106) | Targets made honest |
| "minor-hook" rendered in C major; docstring promised four bars over two | `00-invariants.md:111-114` | Recorded as rule |
| Open voicings exceed physical span | D0 physical gate (pr:19100-19103) | Narrowed or declared large-hand |
| `fingeringVerified` true with no source on 49 items | Entry 90 (pr:19106 bullet 4 area) | Set false |
| One broad claim for six named accompaniment styles (`claims.py:79-85`) | content-mistakes #1 | CQ1 narrowed (git `41a8400`) |
| 71 family/rung/untaught-demand combinations (sixteenths taught nowhere) | Entry 90 | Recorded |
| Builder notation checks are not teaching approvals: the four `decisions.jsonl` rows are `usableScore`, basis `notation`, "Not heard" | content-mistakes #12; `content/review/decisions.jsonl` | Standing rule |

### 6.3 Guardrails
`confirm_physical`, `confirm_musical`, `confirm_playable`, family contracts, `test_key_spelling`, `independent_check.py` (CF1: N1/N2 families only; "No other family was checked", RESULT.md:58). Gap: beaming not checked (music21 writes it); three rhythm patterns name no note value (RESULT.md:64).

### 6.4 Lessons
Spell by interval via music21, never by semitone; verify each family's promise from the written notes with an independent reader; prefer a real excerpt where one teaches the same thing (content-mistakes #14).

---

## 7. Others found
- **Beyer Op. 101 (IMSLP/Internet Archive scan, Peters 2721)**: LH written in treble clef until p.40 — an edition choice to record (CF3 RESEARCH.md:26-28). Proposed as authored transcription; nothing imported.
- **Owner-imported files ([FOUND]/[MIDI])** never enter the repo (`docs/03:67-68`); the detectors read a one-staff bass-clef part as treble (pr:21327; 3 options on 1.3, pr:29389) — affects authored LH arrangements and LH excerpts.
- **IMSLP**: manual last resort (`docs/03:74`); no failures recorded in what was read.

---

## 8. Cross-source: the checks that exist

| Check | Where it runs | Catches | Does not catch |
|---|---|---|---|
| `licensing.py` | importers, `validate --strict-license`, `pdmx/composers.py` | Composition year vs 1930; edition licence NC/ND | Truth of an uploader's/blanket claim; PDMX status is a label only |
| Importer gates | `import_kern` (licence/year re-read, `assert_excluded`), `import_pdmx` (checksums), `import_mutopia` (pins, read-back, spelling), `import_musetrainer` (table) | Tampered/missing files, unlicensed repos, MIDI spelling | MT/kern content faults copied verbatim |
| Note-loss gate (`convert.py`) | every converted `.krn/.xml/.mxl` | >2 % notes lost | `.abc/.ly/.mid`; notes in wrong bar; wrong pitches/spelling (`docs/03:504-506`) |
| `score_checks.py --gate` (step 7a) | whole catalogue | key-signature vs title/final bass, grace density, truncation vs other copies, bar duration, containment, title structure, repeat structure; high rows fail unless allow-listed | Wrong notes, misspellings, clefs/hand assignment, licence, metadata truth; medium/low never fail |
| `truncation_scan.py` | converted files | OSMD grace-16th bar truncation | Any other truncation (score_checks' truncation is by copy comparison) |
| `render_check.py` (step 10, only with `--render`) | Chromium | Render failure, cursor-step parity; reports pace, hands, console | Not run on E50/E57 re-conversions (pr:36852); passed note-lossy kern files (handoff:3251-3253) |
| `validate.py` | step 9 | Schemas, files present, licences, durations, ids, `notation_requirements`, claims, evidence gate, off-keyboard notes (note only) | Musical correctness of any score |
| `review.py` / `decisions.jsonl` | merge of human decisions | Records `usableScore`/`goodTeachingUse` bound to identity | Holds 4 rows, all generated items, basis `notation`, none heard; no corpus item has a review |
| `independent_check.py`, `harmony_facts.py` | CF1/CF2 tools, not wired into build | Generated bar fill, key spelling, family promises; printed harmony | Only N1/N2/N3 scope |

**What none of them catches** (from the records above): a wrong note or a misspelling inside an imported score (MT *Happy Birthday* A♯ found only by a person reading, CF3); a note placed in the wrong bar; a wrong attribution or year (found only by reading: *Mariage d'Amour*, Op.6/5); a voice or hand on the wrong staff/clef; a title that names a different movement; an uploader's false licence; and anything audible — "Nothing here has been heard" is stated by `score_checks.py`, `score-checks.allow.json` and every decision row.
