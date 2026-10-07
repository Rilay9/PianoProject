# Build brief: the sight-reading quality lane (FABLE §2 step 6; 2026-10-06)

**Governs:** `docs/prompts/FABLE.md` §2 step 6, §3 (the generated-content block), §4, §5 (which replaces every human-reader step in `GENERATOR-ADDENDUM.md` §5 and in `briefs/wave1d-sightreading-experiment.md`), §7; the review response `docs/review/responses/a3a8771d.md`, "Which work follows Bizet", item 3: one bounded lane covering level progression, a fixed corpus with boundary and adversarial cases, independent readers and property exploration, and the smallest correction that recurring failures support. **Base:** HEAD `860e459f` or later; the dispatch line states the sha. **Runs in parallel with** the Bizet slice (`briefs/probe-latin4-bizet.md`); the two lanes own disjoint files (§10).

**Not a learner-facing ability brief.** It carries no `ability:` line, no instructional chain, no failure route and no independence test. **Its consumer** is Today's daily sight-read, together with the session's reading slot and the rung drills, which share its one rule (`readingOffer`, `session.ts:2564`; `readingOptions`, `:2220`). Its other consumer is the sight-reading rows that `docs/prompts/PACKET-TRACE.md` marks MISSING: lines 68, 129, 130 and 131. The lane also advances the PARTIAL rows 69, 70, 75, 93, 116 and 128, and names the method its family uses for row 74.

## Decision rationale (§10b)

1. **Learner problem.** Today's daily read is the one reading strand a learner meets in every session. Its phrases are checked only by the generator reading back its own output, using its own scorer (`sightReadingDistribution.test.ts`; PACKET-TRACE rows 70 and 83). No independent reader has checked them. Nothing has measured them against a sourced level progression or against real music of the same level. Two consequences follow:
   - The base rows write no key signature anywhere in core, although `key.signature` is taught at 3.1. They write no 3/4 anywhere, although 1.4 teaches it.
   - Nobody knows which other dimensions lag in the same way, or run ahead of the teaching.
2. **Solution classes considered.**
   - Dispatch 1(d) as approved: L1–L4, 55 items, and a human notation read.
   - Apply 1(d)'s data change untested.
   - Rebuild phrase logic from extracted cells (FABLE §5 method 1).
   - This lane. It runs all seven levels as the learner meets them, uses a fixed 374-item corpus, two independent file readers, a theory witness, Hypothesis over the parameter space, and real-music reference sets as evidence. It ends with the smallest correction the recurring failures support.
3. **Chosen path, and why.**
   - FABLE §5 removes the human read that 1(d) depended on.
   - 1(d)'s L1–L4 scope rested on "L5–L7 have no consumer", which is false at HEAD (see Facts).
   - Applying the data change untested is how earlier faults shipped.
   - Cells are a new generation strategy. Nothing yet shows that the current one fails in the way cells would fix.
4. **What would reverse it.**
   - The installs are refused: the lane stops before step 1.
   - The two readers disagree beyond 1(d)'s stop share.
   - The recurring failures are about phrase shape rather than parameters. In that case the correction is a generator change, which this lane drafts and does not build (§7).
5. **Real problem or proxy.** The proxies are "the corpus ran", "the table exists" and "Hypothesis found nothing". The real problem is solved when every level carries each property marked established by a named witness or marked UNKNOWN, every recurring failure is named with examples, and the one bounded correction has reached the daily read with the same seeds showing it holds.
6. **Remaining uncertainty.**
   - Nothing in this process hears the phrases, and every report says "not heard".
   - App levels are not exam grades. A divergence from ABRSM, RCM or Faber is a decision recorded with its reason, not a defect.

## Facts the contract rests on

**VERIFIED** at `860e459f`, observed for this brief:
- **Installed libraries.**
  - partitura 1.9.0 imports under `py -3.11` and is already pinned in both `tools/content/requirements.txt` and `requirements-research.txt`.
  - music21 10.5.0 imports.
  - `import hypothesis` raises `ModuleNotFoundError`.
  - Listing `app/node_modules` shows no `musicxml-io`. That is the only place searched.
  - `rolldown` is in `app/node_modules`.
  - Node is v24.19.0.
- **What partitura reads.** Its MusicXML importer reads articulations, slurs, staff, voice and key signature (a grep of `partitura/io/importmusicxml.py` and `score.py`).
- **The nine rows** (`content/catalog.static.json` `drill.params`) and the rungs that list them (a walk of `content/curriculum/stage-*.json`):

| Row | Level | Params | Listed at |
| --- | --- | --- | --- |
| `-1-left` | 1 | 4 bars, left hand, fifths 0, 4/4 | 1.3, 1.4 |
| `-1` | 1 | 4 bars, right hand, fifths 0, 4/4, skips | 1.5 |
| `-2-right` | 2 | 4 bars, right hand, fifths 0, 4/4, eighths, skips | 2.2, 2.5 |
| `-2` | 2 | 4 bars, both hands, fifths 0, 4/4, eighths | 3.4, classical.3 |
| `-3` | 3 | 8 bars, both hands, fifths 0, `["6/8","4/4"]`, syncopation, triplets | 4.5, 4.6 |
| `-4` | 4 | 8 bars, both hands, fifths 0, 4/4, accidentals | 4.6, technique.5 |
| `-5` | 5 | 8 bars, both hands, fifths −3..3, 4/4, syncopation | theory.6 |
| `-6` | 6 | 8 bars, both hands, fifths −4..4, 4/4, triplets | chords-pop.8, theory.9 |
| `-7` | 7 | 8 bars, both hands, fifths −4..4, 4/4, triplets, no sixteenths | jazz.8 |

- **Which row each core rung reads** (`anchorFor`, `session.ts:2368-2387`: the latest lesson at or before the learner's position that lists a reading row):
  - 0.1–1.2: no listed row, so the lowest-level row stands in, unanchored.
  - 1.3–1.4: `-1-left`; 1.5–2.1: `-1`; 2.2–3.3: `-2-right`; 3.4–4.4: `-2`; 4.5–4.7: `-3`.
- **L5–L7 have consumers.** `anchorFor` also walks non-core units for the learner's active tracks, so rows `-5`, `-6` and `-7` reach the daily read at theory.6, chords-pop.8, theory.9 and jazz.8. PACKET-TRACE row 93 ("L5-L7 have no consumer") is wrong at HEAD. The report proposes that status edit.
- **The level table** (`sightReading.ts:352-451`):

| Level | Right-hand range | Largest melodic move | Max fifths | Lengths | Left hand | Ties / rests | Other |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L1 | 60–67 | 1 step | 0 | quarter, half, whole | none | no / no | |
| L2 | 60–72 | 2 steps | 1 | adds eighth, dotted half | whole | no / no | |
| L3 | 60–72 | 3 steps | 1 | eighth, quarter, half | whole | yes / yes | |
| L4 | 57–79 | 4 steps | 2 | adds dotted quarter | chord | yes / yes | |
| L5 | 57–81 | 5 steps | 3 | | alberti | | syncopation, chord tones on strong beats |
| L6 | 55–84 | 5 steps | 4 | | broken | | triplets |
| L7 | 55–86 | 6 steps | 4 | adds sixteenths | walking | | |

  Every level is diatonic major (`MAJOR_STEPS`, `:272`). Version 2 is in force (`:178`).
- **Taught rungs** (`content/curriculum/vocabulary/demands.json` `taughtAt`):

| Demand | Taught at |
| --- | --- |
| `interval.step` | 1.1 |
| `clef.bass` | 1.3 |
| `interval.skip` | 1.5 |
| `interval.leap` | 2.1 |
| `texture.hands-together` | 2.1 |
| `rhythm.eighths` | 2.2 |
| `rhythm.dotted-quarter` | 2.4 |
| `rhythm.ties` | 2.4 |
| `key.signature` | 3.1 |
| `pitch.chromatic` | 3.3 |
| `pitch.ledger` | 3.4 |
| `texture.left-hand-pattern` | 3.6 |
| `rhythm.sixteenths` | 4.4 |
| `rhythm.syncopation`, `rhythm.triplets`, `metre.compound` | 4.5 |

  The vocabulary has no triple-metre demand and no articulation demand, so `heldToRung` (`readingControls.ts:302`) cannot hold back a 3/4.
- **Seeds.** `dailySeed(dayKey)` (`sightReading.ts:3127`) is FNV-1a over the `YYYY-MM-DD` string that `dayKey` (`progressStore.ts:123`) writes.
- **Real pieces on core rungs.** Distinct real items with a file in core `songOptions`, per stage (script over `app/public/content/curriculum.json`): stage 1: 18; stage 2: 30; stage 3: 19; stage 4: 18.
- **The physical gate** `family_contracts.physical_facts` and `physical_faults` (`tools/content/family_contracts.py:298-523`) read a score through music21. Its limits:
  - span within an octave (`AN_OCTAVE = 12`);
  - hand moves beyond an octave are faults;
  - register A0–C8.
- **Test scopes.**
  - `app/tsconfig.app.json` includes only `src` and `tests/unit`.
  - `app/vitest.config.ts` includes only `tests/unit/**/*.test.ts`.

**HYPOTHESES the run tests:**
- **H-a.** The recurring failures at L2–L4 are parameter lags (a signature and 3/4 taught but never written by a base row), not phrase-shape faults. *Falsifier:* recurring failures of required properties 1–11 or of the closure features inside the O stratum.
- **H-b.** L1's lengths fill a 3/4 bar without a dotted half (the 1(d) hypothesis). *Falsifier:* stratum C's `-1` 3/4 cases refuse or fail bar sums.
- **H-c.** The generator writes no articulation at any level. *Falsifier:* either reader counts one.

**OPEN, settled by this lane:** the level spec's unrecorded source cells; whether the 1(d) data table is realisable as it stands; whether the generated phrases sit inside the real-music reference on any feature.

## 1. The level progression the lane audits (settled)

**Scope: all seven levels and all nine rows, as the learner meets them.**
- Primary view: each row at each rung that lists it, held to what that rung has taught, which is what `readingOptions` writes.
- The level tables on their own are the boundary stratum.
- *Not taken:* L1–L4 only (1(d)). Its premise, that no consumer reads L5–L7, is false.
- *Not taken:* the generator's level tables as the primary view. They are not what Today serves.

**What counts as a failure.**
- The app's own teaching defines it:
  - a phrase that contains a dimension before the rung that teaches it;
  - a dimension a rung teaches that no base row writes anywhere in that strand;
  - a written phrase that breaks a required property (§4).
- Published progressions (ABRSM 2025–26 p.16, RCM 2022, Faber, as read in `SOURCE-CHECK-reading.md` C1, C2, C3 and C6) inform `LEVEL-SPEC.md`. They never create a defect by themselves.
- A dimension the sources place earlier than the app teaches it, or that the app teaches nowhere (minor keys, articulation), is a recorded divergence with its reason. It is out of scope for this lane: a lesson must come first.
- The comparison grade for a level is the `abrsmGradeApprox` of the stage of the rung that anchors it.
- *Not taken:* the sources as requirements (rejected by the reviewer's correction 4 to the addendum).
- *Not taken:* mapping level numbers to grades (there is no basis for it).

**Per dimension** (orchestration contract §5). "App now" comes from the Facts. "Witness" names what establishes the measure (§3).

| Dimension | Generator control; app now | Sources as read | Measured from the files; witness |
| --- | --- | --- | --- |
| Note range | `rhKey`/`lhKey` per level, `ledger`, `position` | ABRSM Initial: five-finger position, tonic to dominant; G1: any five-finger position; G3: outside it. RCM L2: beyond the five-finger position | Lowest and highest note per hand; ledger-line count. partitura, musicxml-io |
| Directional and interval reading | `maxLeap` steps 1→6; `skips`, `leaps` | Faber 2A: "reading by interval" (C3). No table cell read for interval order | Generic interval of each melodic move from spelled pitches; step, skip and leap shares. partitura; music21 for interval names |
| Position changes | `position` control; L1 is one position | As note range | Number of five-step windows the melody needs, counted greedily in order (custom: no library defines it); span of the melody |
| Key | `maxFifths` 0,1,1,2,3,4,4; rows at L1–L4 write 0 | ABRSM G1, RCM L1: G and F; ABRSM G2: D; RCM L5: two sharps or flats | Written signature; every pitch's spelling against the key. partitura, musicxml-io; music21 `Key` as theory witness |
| Metre | 4/4 on every row; no hold for 3/4 | ABRSM Initial 4/4 (and a 2/4 line); G1 3/4 | Written time signature; bar sums. Both readers |
| Rhythm | Lengths per level | No note-value cell was read as text (1(d)). The dotted quarter's level is unsourced | Set of durations used; dotted values; triplets (time modification). Both readers |
| Compound metre | 6/8 on `-3` (4.5) | ABRSM G3 3/8, G4 6/8 | As metre |
| Leaps | `maxLeap`, `leaps` | No cell read | Leap share; leap recovery (a step back after a leap) |
| Texture | Hands; left hand none → whole → chord → alberti → broken → walking | ABRSM G2: hands together; RCM L1: grand staff | Staves sounding; share of onsets shared by both hands; notes sounding at once per staff |
| Articulation | None written (H-c) | ABRSM Initial: staccato, legato phrases; G1: slurs, accents; G2: ties | Count of articulations and slurs per item. Both readers |
| Accidentals | `accidentals` promise (`-4`); `pitch.chromatic` taught at 3.3 | ABRSM G1: "occasional accidentals (within minor keys only)" | Notes outside the key signature, per item |
| Density | Not a table parameter | No cell read | Onsets per bar per hand; distinct pitch-and-duration events per item |
| Length | 4 bars (L1, L2 rows); 8 bars (L3+) | ABRSM up to 8 bars by G3; RCM L1 four measures | Bar count |

**Step 1, `LEVEL-SPEC.md`.** Complete this table into one row per dimension per level, L1–L7. Each row gives:
- the app's value;
- each source's value, with its page or URL;
- the decision, with its reason.

Rules for the cells:
- Cells that `SOURCE-CHECK-reading.md` did not record may be read from the official ABRSM and RCM PDFs at the URLs it gives. That fetch is a download, approved at dispatch.
- A cell neither recorded nor read says "not read".
- No cell is copied from `levelFacts`, the dossier or this brief's table.
- Every dimension also gets two rung columns:
  - the rung where the curriculum teaches it, taken from the vocabulary or, for 3/4, from `1.4.md:23`;
  - the first rung where a base row writes it.

## 2. The fixed corpus and its denominator (settled before the run)

**The manifest is written before any phrase is generated.** `MANIFEST.json` in the run folder lists every item. Each entry gives:
- the stratum, row, rung and options;
- the seed and version 2;
- the expected outcome: **WRITE** (the contract applies), **REFUSE** (with the reason expected from `unrealisable()` or `SightReadingRefusal`) or **KNOWN-DEFECT** (predicted to break a named property).

A refusal is an outcome counted in the denominator, never a dropped item. The manifest is not edited after the first generation. A case found later goes into a named stratum for the next run.

| Stratum | What | Items |
| --- | --- | --- |
| **O**, the consumer | The 15 row-at-rung pairs above, each through `readingOptions(item, undefined, seed, taughtAtRung(curriculum, rung))`. Seeds: `dailySeed` of the eight days 2026-11-02 to 2026-11-09, which are the daily read's own draws | 15 × 8 = **120** |
| **BC**, consumer boundaries | The anchored row held at rungs 0.1 and 1.1 (unanchored, the earliest daily reads) and at 2.1, 3.1, 3.3, 4.4 and 4.7 (the most-taught rung still reading an older row; 3.1 is the first rung with a signature taught and no row writing one). Seeds: the first four O days | 7 × 4 = **28** |
| **BL**, level-table boundaries | Per level L1–L7, through `sightReadingOptionsFor` with the level's own defaults (L1: right hand; L2+: both hands; 4 bars; fifths 0) except the one case: fifths −max; fifths +max (at L1, ±1, expected REFUSE or clamp); 3/4; 2/4; 6/8; left hand alone; 16 bars. Seeds `level × 1000 + 1` and `+ 2` | 7 × 7 × 2 = **98** |
| **A**, adversarial (outcome declared) | Two keys beyond the level (L4 fifths 3; L7 fifths −5). Five contradictions: skips off with leaps on (L3); 6/8 alone with syncopation (L3); ties with 1 bar (L3); eighths off at L5; position with ledger (L4). Each at 2 seeds. Seed extremes 0, −1, 2147483647, −2147483648, 4294967295 on `-1`@1.5 and `-7`@jazz.8. The 3/4 hold gap: `-1-left` with `timeSig "3/4"` held at 1.3 (KNOWN-DEFECT: nothing holds it). `metre.compound` off on `-3`@4.5 (`withoutDemand`; expected 4/4 only), 4 seeds each | 14 + 10 + 4 + 4 = **32** |
| **C**, the candidate data | 1(d)'s target rows, single-valued so that every combination is covered on purpose: `-1`@1.5 × {4/4, 3/4}; `-2-right`@2.2 and @2.5 × {4/4, 3/4}; `-2`@3.4 and @classical.3 × {4/4, 3/4} × fifths {−1, 0, 1}; `-3`@4.5 and @4.6 × {6/8, 4/4, 3/4} × {−1, 0, 1}; `-4`@4.6 and @technique.5 × {4/4, 3/4} × {−1, 0, 1}. Seeds `9000 + k`, k = 1, 2 | 48 × 2 = **96** |
| **Total** | | **374** |

**How results are reported per stratum.**
- The shipped generator, as the learner meets it: O + BC (148).
- Robustness: BL + A (130).
- The candidate only, before any change: C (96).

Mechanical results are n/N per stratum. Strata are never pooled into one rate.

**Rerun rule (FABLE §5).** After any change, the same 374 items are regenerated from the same manifest, and the report shows every result before and after. A change that moves any result it did not intend is a stop (§11).

**How the phrases are produced.** Through the app's own code path, never a reimplementation, and with no file under `app/src/` changed:
- **Export tooling.** A lane-owned export under `app/tests/research/` with its own vitest config, following the precedent of `sightReadingDistribution.test.ts`'s `D1_TABLE` report. It stays outside CI's unit include and `tsconfig.app.json`.
- **Output.** Each item's MusicXML (`generateSightReading(...).musicXml`) and its result fields go under the worktree's `build/sr-quality/` (reproducible from the manifest, not kept).
- **The taught set per rung.** Each rung's taught set is exported as data with the corpus, so the checks never call the app.
- *Not taken:* an env-gated case in `tests/unit/`. It would run in CI on every push, prove nothing there, and need a test-map row.

## 3. The readers (settled; installed first)

**Installs, before step 1.** Both are downloads approved at dispatch. Without that approval the lane stops.
- **Hypothesis.** Pinned in `tools/content/requirements-research.txt` as `hypothesis==6.168.0`. That is the line `GENERATOR-ADDENDUM.md` §7's probe measured. If that exact release is not on the index, pin the newest 6.168.x and say so in the file. Install with `py -3.11 -m pip install -r tools/content/requirements-research.txt`.
- **musicxml-io 0.10.3** (npm, MIT). Pinned in the same file as a **comment line**, because the file is a pip requirements file and a non-pip line would break `-r`. The comment carries the exact install command:

  ```
  npm install --no-save --prefix build/sr-quality/readers musicxml-io@0.10.3
  ```

  It installs under the worktree's `build/`. It never goes into `app/package.json` or `app/package-lock.json`. The file's existing musicxml-io comment is replaced by that pin.

**One choice per property (FABLE §7), recorded in the report.**

| Property class | Witness | Why it is independent enough |
| --- | --- | --- |
| File events (pitch spelling, onset, duration, staff, voice, ties, key, metre, bar sums, articulations, slurs) | **partitura** 1.9.0, with **musicxml-io** 0.10.3 as a second reader on every file | The phrases are written by the app's TypeScript `musicXmlWriter.ts`. Neither reader shares code with it, and the two readers share no code with each other. Every disagreement is listed per file and property. A property on which the readers disagree is not established for that file, and no claim is made for it |
| Theory facts (diatonic set of a key, scale degree, interval name, the chord a left-hand bar spells, its root) | **music21** 10.5.0 as a theory witness, never as a reader of a file it wrote | It does not generate these phrases, and the app's `MAJOR_STEPS` and `anyRomanToChord` are not consulted |
| Playable hand distribution | **`family_contracts.physical_facts` and its limits**, imported read-only. It reads the file with music21, which is independent of the TypeScript writer | The repo's existing gate. No new limit |
| Parameter space | **Hypothesis**, driving the real generator through a Node worker over a bundle of `app/src/engine/` built under `build/` (`rolldown` is already in `app/node_modules`; the bundle's source sha is recorded). The mechanism is the builder's choice within those constraints; the report says which | It explores options nobody chose, and shrinks each violation to a minimal case |
| Detectors for the rung's demands (eighths, ties, dotted quarter, sixteenths, triplets, syncopation, compound, signature, chromatic, ledger, skip and leap, hands together) | **Kept custom**, in the run folder, written in Python from the vocabulary's definitions over partitura events | No library defines "the rung's taught demand". They are not the app's detectors (`app/src/demands/`, `readingControls.ts`) and do not import them |

*Not taken:* the generator's own read-back and scorer (`helpers/sightReadingPage.ts`, `sightReadingScore.ts`, `levelFacts`) as oracle. They are the circular witness that PACKET-TRACE row 83 names. *Not taken:* fast-check in TypeScript. FABLE §7 and the dispatch name Hypothesis, and the checks are already in Python.

## 4. The musical contract for the family (FABLE §5; job SIGHT-READING)

**Pedagogical contract.**
- *Isolated:* unseen reading of the rung's taught demands at the level's envelope.
- *Allowed:* the demands the rung has taught, plus the row's promises.
- *Forbidden:* every demand the rung has not taught.
- *Envelope:* `LEVEL-SPEC.md` for the level.

**Required, established by a named check.** Each one is a pass or a failure per item.

| # | Property | Established by |
| --- | --- | --- |
| 1 | The key as asked, or the clamp `unrealisable()` names. Every pitch spelled diatonically to it unless `accidentals` is promised | partitura and musicxml-io (signature, step/alter); music21 `Key` (diatonic set) |
| 2 | The metre as asked; every bar sums to the metre | Both readers (divisions per bar) |
| 3 | The bar count as the row | Both readers |
| 4 | Hands and staves as the row | Both readers (staves sounding) |
| 5 | Range per hand within `LEVEL-SPEC.md`, and within A0–C8 | Both readers; physical gate |
| 6 | No melodic interval beyond the level's cap, as the controls set it; L1, and `position: true`, within one five-finger position | Spelled generic intervals over partitura events; music21 interval |
| 7 | The rung's hold: no demand the rung has not taught, and every promise of the row present | The kept detectors, against the exported taught set |
| 8 | Playable hand distribution: span within an octave per hand at each onset, and no hand move beyond an octave | `physical_facts` and its existing limits |
| 9 | Determinism: the same options, seed and version give identical bytes | Two generations compared (stratum A's seed extremes, and Hypothesis H2) |
| 10 | Never silent: anything not written as asked is refused, or named by `unrealisable()` | Hypothesis H1; strata A and BL |
| 11 | At L5–L7, where the level claims `chordTones`, every right-hand note on a strong beat is a tone of the bar's left-hand chord | music21 chord from the bar's left-hand pitches; strong beats taken from the written metre |

**Evidence: comparison with real pieces of the same level.** These are never gates.

- **Reference set per level.** Real items (type song or excerpt, with a file, not generated) in the `songOptions` of the rungs where that level's rows anchor:

| Level | Rungs |
| --- | --- |
| L1 | core 1.3–2.1 |
| L2 | core 2.2–4.4 |
| L3 | core 4.5–4.7 |
| L4 | 4.6 and technique.5 |
| L5 | theory.6 |
| L6 | chords-pop.8 and theory.9 |
| L7 | jazz.8 |

  - The piece list and its count go into `REFERENCE.json` before any feature is computed.
  - A level whose list is empty has its comparison marked UNKNOWN, never padded.
- **Windows.**
  - Melodic features are taken from the upper staff's skyline: the highest sounding pitch at each onset.
  - Left-hand features come from the lower staff, and only for generated items that have a left hand.
  - Each piece is cut into consecutive complete windows of the generated item's bar count. The report gives per-piece medians and window counts.
- **Features.** The FABLE §5 list, plus three more:
  - rhythm-motif reuse per four bars;
  - step/leap share;
  - leap recovery;
  - contour reversals;
  - interval-sequence repetition;
  - phrase end on a stable degree (1, 3 or 5) with a longer value;
  - implied cadence at the phrase end (left-hand root V→I, left-hand items only);
  - range and register;
  - density (onsets per bar per hand);
  - share of hands together;
  - consonance of right hand against left hand on strong beats.
- **How features are computed.** Each feature is defined in `features.py`'s docstring before the run and computed by the same function on both sets from partitura events. Interval and degree names come from music21.
- **The claim sentence.** "Within the real-music reference for level L on feature F, corpus N" means the generated O-stratum median lies inside the reference's interquartile range. It is a description used only in that sentence. Every number is shown either way.

**Diagnostics, reported with no bound** (no cited source sets one):
- beams crossing a felt beat;
- accidental churn in a bar;
- ledger lines per bar;
- articulation and slur count (H-c);
- parallel fifths and octaves between the hands (music21).

**UNKNOWN, with the claim narrowed:**
- phrase structure as question and answer;
- the quality of motive and variation, beyond the reuse counts;
- cadence and closure as quality, beyond the two features;
- harmonic skeleton and function at L1–L4 (the generator targets no harmony there: `sightReading.ts:453-460`);
- the left hand's relationship to the melody at L2–L4, beyond consonance;
- voice leading between the hands, as quality;
- stylistic pattern (the family claims none);
- whether a phrase reads as music.

For each UNKNOWN the family claims only "meets contract SR-L" and the reference sentence. It never fills an UNKNOWN with taste.

**Allowed claims** (FABLE §5): "meets contract SR-L"; "property P established by Q"; "within the real-music reference for level L on features F, corpus N"; "P is UNKNOWN"; "not heard".

**The family's `musical_properties` map.** It is drafted in the report from this section, for the future `docs/chains/A1.2.yaml` `generated` entry. It is not written there.

## 5. Property exploration with Hypothesis

**Settings, fixed before the run:**
- `derandomize=True`
- `database=None`
- `deadline=None`
- `max_examples=300` per property

**The domain** is written as strategies in `properties_test.py` before the run, each edge with its reason. It covers:
- every value a shipped row writes;
- every `READING_CONTROLS` `on`/`off` patch at each listing rung;
- the level-table extremes;
- one step beyond each edge: fifths beyond `maxFifths`, bars 1 and 17, the metres 2/4, 3/4, 4/4, 3/8, 6/8, 9/8 and 12/8, and seeds across the 32-bit range.

**Properties:**
- **H1, never silent.** A phrase keeps every promise and the asked key and metre (or the clamp is named), or the generator refuses with reasons. Options with an empty `unrealisable()` that still refuse are reported as a contract gap: `generatorContract.test.ts` claims otherwise for the combinations the curriculum asks for.
- **H2, determinism.**
- **H3.** Required properties 1–5 on every written example, through partitura.
- **H4, the hold.** `heldToRung(options, taughtAt(r))` for a drawn core rung r writes no demand untaught at r. The 3/4 gap is expected and named in advance; it is not a finding.

Each shrunk counterexample is reported as a minimal options set with its seed. It is added to a named stratum for the next run, never to this run's 374.

## 6. The report

`REPORT.md` in the run folder, in this order:
1. The spec decisions.
2. The manifest's counts per stratum.
3. The required properties as n/N per stratum and per level.
4. **Recurring failures by level and property.** A failure recurs when the same property fails on more than one item of a level, whether across seeds or configurations. A single failure is listed as an isolated example. Each recurring failure gives up to three examples, each with item id, seed, bar, what each reader saw, and the expected value.
5. Reader disagreements.
6. Hypothesis: examples run per property, and the counterexamples.
7. The reference comparison per level and feature: generated and reference medians and IQRs, with N pieces and windows.
8. The diagnostics.
9. The `LEVEL-SPEC.md` rung columns: taught at, and first written by a base row, per dimension.
10. The correction (§7): built or drafted, with before and after.
11. Proposed PACKET-TRACE status edits, including row 93's consumer error.
12. The drafted `musical_properties` map.
13. A drafted `docs/pending-review.md` entry, itemised where / what / before / after / why.
14. Every not-done line.

Every musical statement carries "not heard".

**A text export for the outside reviewer's ordinary artefact review.** The lane has no reader step. The export goes in `co/`, in files under 300 KB, one block per item: id, stratum, row, rung, seed, version, key, metre, then per bar per hand each note's name, octave and value, plus the item's check row. It covers a declared sample:
- 2 per level from O;
- one item per recurring failure;
- one item per refusal reason.

The report states the sample's n and the number left unread. Nothing in this lane waits on that review, and its findings are evidence with their own denominator.

## 7. The smallest correction the recurring failures support

The lane takes the smallest class the recurring failures support, and builds it only when it is bounded.

1. **Data on a shipped row.**
   - The scope is the `drill.params` of the sight-reading rows in `content/catalog.static.json`, spliced as text (`CLAUDE.md`).
   - Each value must be one the generator already writes at that level, and must be held by the rung's taught set. A 3/4 goes only on rows whose every listing rung is at or after 1.4, because nothing holds 3/4 back.
   - If H-a holds, the expected candidate is 1(d)'s target table. It may be built only as far as stratum C showed each parameter realisable with no refusal and no required failure. A parameter that C faulted keeps its current value, and the report says why.
2. **A lesson sentence** where the data change first reaches the learner (as in 1(d)'s edits 2 and 3), quoted before and after from the base.
3. **A control-map change** in `readingControls.ts`, a vocabulary demand (for example triple metre), or a generator change under a new version. Examples: articulation, minor keys, phrase shape, cells (FABLE §5 method 1).
   - These are **drafted only**: the change, its red-first test, and the before-and-after differential on the 374.
   - Each is a product rule or a re-definition of every seed's phrase on Today, so FABLE §10 puts it under review before it is built.

**Bounded** means all of the following:
- only classes 1 and 2;
- the 374 rerun shows the targeted failures gone and no other result moved;
- after `npm run content:build`, these are green: `npx vitest run` (including `generatorContract.test.ts`, `sightReadingPromises.test.ts`, `sightReadingDistribution.test.ts`, `sightReadingUnchanged.test.ts`, `composedContract.test.ts`), `npx tsc -b`, `npm run lint`, `npm run build`;
- `py -3.11 tools/content/lint_absolutes.py --lesson <rung>` passes for each changed lesson;
- one new unit test, `app/tests/unit/sightReadingProgression.test.ts`, with its `docs/08-test-map.md` row. For each changed row at each listing rung, over seeds 1–30 through `readingOptions`, it pins the following:
  - the new dimension appears at the rungs that teach it;
  - it never appears before;
  - it never appears at a rung where `key.signature` is untaught.

The change touches no screen, so it needs no browser spec. Anything else is drafted, not built.

## 8. What the lane never does

- No new generator, family, dataset or phrase-cell contender.
- No human-reader step, and nothing that waits on one.
- No invented threshold. Bounds come only from the level spec's decided cells, the physical gate's existing limits, and the contract in §4. Reference distributions are never gates.
- No change to the Score screen or to any file under `app/src/`.
- No change to the vocabulary, the curriculum JSON or the generator's level table.
- No listening claim.
- No rights, licence or export question (out of scope by the owner's word).

## 9. Generated content (FABLE §3)

- **Job:** SIGHT-READING.
- **Demand isolated:** unseen reading at the rung's taught set.
- **Varies:** the seed (pitches and rhythms), and the key and metre within the row's list.
- **Fixed:** the row's other params, the rung's hold, and version 2.
- **Musical properties:** §4.
- **Libraries and verifiers:** §3.
- **Adversarial and boundary cases:** strata BC, BL and A, and §5.
- **Review denominator:** 374 mechanical, by stratum. Hypothesis examples are counted apart. The reference N is stated before the run. The outside sample's n and its unread count are stated.
- **Transfer out of generation:** the real pieces on the same rungs, which form the reference set itself. Unchanged by this lane.

## 10. Files

**Owned, created:** `docs/prompts/runs/sightreading-quality/`, which holds:
- `LEVEL-SPEC.md`, `MANIFEST.json`, `REFERENCE.json` and `REPORT.md`;
- the scripts `check_corpus.py`, `features.py`, `properties_test.py` and the musicxml-io reader script;
- the check tables, and `co/`.

Also owned and created: `app/tests/research/` (the export and its vitest config).

**Owned, changed:** `tools/content/requirements-research.txt`.

**Owned only if the correction is built (§7):**
- `content/catalog.static.json`, the sight-reading rows' `drill.params` only;
- the named `content/lessons/<rung>.md` sentences;
- `app/tests/unit/sightReadingProgression.test.ts`;
- one row in `docs/08-test-map.md`.

**Drafted in the report, not applied:** the `docs/pending-review.md` entry, the PACKET-TRACE status edits, the A1.2 `generated` entry, and every class-3 change.

**Must not touch:**
- everything under `app/src/`, including `app/src/score/`, `app/src/demands/`, `engine/sightReading.ts`, `readingControls.ts`, `sightReadingScore.ts`, `musicXmlWriter.ts`, `curriculum/session.ts` and `ui/screens/ScoreScreen.ts`;
- `content/curriculum/vocabulary/*` and `content/curriculum/stage-*.json` (stage 4 is the Bizet slice's);
- the hand and cells seams' files: `tools/content/demands.py`, `excerpts.py`, `validate.py`, `content/sources/*`, `content/review/*`;
- `tools/content/family_contracts.py` (imported read-only);
- `tools/content/requirements.txt`, `app/package.json` and its lock;
- the workflows, `docs/chains/`, `FABLE.md`, `PACKET-TRACE.md`, `ABILITY-MAP.md` and `GENERATOR-ADDENDUM.md`;
- every other catalog row.

## 11. Stop conditions, and the harness

**The lane stops and reports when:**
- the installs are not approved, or fail;
- the manifest would need editing after generation began;
- `unrealisable()` refuses more than 10 % of the planned O or C parameter sets (1(d)'s rule);
- partitura and musicxml-io disagree on more files than 1(d)'s stop share (2 in 55, applied to the 374);
- a rerun moves a result the correction did not intend;
- a premise here does not reproduce. The lane says so, takes the better path inside the files owned, and names the alternative it rejected.

**After a built correction**, the lane does not proceed if any of these is red: `generatorContract.test.ts` (report the move it names and do not edit `readingControls.ts`), `sightReadingUnchanged.test.ts`, or `sightReadingDistribution.test.ts`.

**Harness:** `operating-procedure.md` §14. This lane adds only the following:
- the two installs above, both under the worktree;
- `build/sr-quality/` for the generated files, the bundle and the readers;
- no Playwright run.

The builder does not commit, push, stash, check out or reset, and never names an AI model. Every item is done, or gets an explicit not-done line.

**Reply** in at most ten lines:
- the counts per stratum, and the reader disagreements;
- the recurring failures by level and property;
- Hypothesis's counterexamples;
- the levels with an UNKNOWN reference;
- the correction, built or drafted, with its rerun result;
- the proposed PACKET-TRACE edits;
- anything not done.
