# Content-pipeline review for Fable

Research/review only. This is the bounded follow-up after the MIDI→MusicXML review. It does **not** propose another content architecture, detector campaign, or full rewrite.

The useful conclusion is simpler: most of the existing content machinery should stay. The recurring failures cluster at a few format/verification boundaries and at places where a broad mechanical reading was allowed to stand in for a musical judgement.

## Bottom line

Keep these:

- the PDMX archive/index/quarry as the large symbolic-score warehouse;
- web/published-source title research as cheap semantic discovery;
- the existing PDMX exact-CID extraction path;
- the existing 4–8-bar excerpt proposer/cutter;
- music21 as the Python notation/theory backbone;
- the current deterministic sight-reading identity/versioning and its soft phrase scorer;
- the difficulty model as a browse/ranking signal, not curriculum truth;
- the current demand system for narrow mechanical facts where its input model actually carries the fact.

Fix or delegate these instead of adding another layer:

1. independent event-level verification at source/conversion/cut/generation boundaries;
2. ABC conversion, especially chord fingerings;
3. clef/key changes in the score model instead of detector exceptions;
4. the few generator families whose hard constraints are implemented by thousands of retries or whose named style is only a homemade pattern;
5. Lab backing styles: use a mature accompaniment engine/pattern source rather than growing `backingLoop.ts` into a genre engine;
6. duplicated metre/theory semantics that have already drifted.

---

## 1. PDMX: keep the warehouse and quarry; strengthen the verifier

### What already works

`tools/content/pdmx/README.md` describes a genuinely useful workflow:

- 254,077 CSV rows indexed;
- 37,499 rows past the broad browse gates;
- exact CIDs can be streamed from the 1.9 GB archive without unpacking it;
- the selected score is then converted, structurally checked, rendered and manually reviewed;
- the full archive can also be used as a searchable local score shelf;
- committed PDMX material is deterministic and no later build needs the archive.

That is exactly the right role for PDMX: **warehouse, not authority**.

The web/title-search work from the old genre plans is also worth keeping. A noisy web result is cheap. The mistake was trusting the title/metadata/level before reading the score.

### Live weakness: the quarry's “round trip” does not verify rhythm

`tools/content/pdmx/quarry.py::pitch_multiset` records occurrences by printed bar, staff and MIDI pitch. It does **not** include onset or duration. The docstring says the gate is checking “the same notes, at the same moments,” but the implementation cannot detect a note moved earlier/later inside the same bar, or a duration changed while the attack pitch count stays the same.

That is a real verification gap and it is a much better place to spend effort than writing more musical heuristics.

### Simpler correction

Keep the current cheap structural/render gates, but make the post-conversion witness independent and event-level:

`raw/parent score → conversion/cut → Partitura note_array → compare`

Compare, where the source format can support it:

- pitch;
- onset in divisions/quarters;
- duration in divisions/quarters;
- staff;
- voice where meaningful;
- written spelling where meaningful;
- time-signature map;
- key-signature map;
- tie/tuplet structure where the operation is required to preserve it.

Partitura already exposes onset/duration in beats, quarters and divisions, pitch spelling, voice, staff, key and time signature in its note arrays. Use humlib/Verovio/MuseScore only to arbitrate a disagreement or rendering-specific question.

Do **not** run three parsers over every file.

### Live weakness: short useful material is rejected before it can become content

`quarry.py` has `MIN_BARS = 8`. That is a sensible heuristic for a general repertoire quarry, but it means a real 4–7-bar beginner piece/exercise cannot pass the normal quarry even if it is exactly the teaching material wanted.

Do not remove the broad gate globally. Give an **explicit researched-CID / teaching-candidate path** permission to keep a short score after the same correctness checks, or treat the whole short item as the passage. The web→title→PDMX route should not be defeated because the item is too concise.

---

## 2. Excerpts/snipping: the existing system is good; verify the cut independently

Do not build a new excerpt miner.

The existing `tools/content/excerpt_proposer.py` already does most of the hard product work:

- 4–8 bars by default;
- target-opportunity density;
- minimum occurrences;
- untaught-demand rejection;
- forbidden-demand rejection;
- physical-range checks;
- phrase-start / phrase-ending / pickup / length / texture signals;
- no level scalar in the score;
- exact parent identity and cut range.

`tools/content/excerpts.py` also handles the nasty notation boundary cases already discovered:

- carries clef/key/time/tempo in force into the first cut bar;
- severs edge ties;
- neutralises edge repeats;
- refuses unsafe internal repeats/endings/jumps;
- records parent checksum and exact printed range.

That should be reused.

### What to improve

After a cut, compare the resulting MusicXML against the corresponding parent-bar events with a parser that did not perform the cut. Partitura is the obvious Python witness. `musicxml-io` is also worth prototyping on the browser/TypeScript side because it now supports MusicXML/ABC parsing, measure insertion/deletion, note/tie/tuplet operations, validation and serialization; its API is still marked unstable, so prove it against PianoProject's adversarial files before depending on it.

The cutter itself can remain music21. **The cutter does not need to be independent; the verifier does.**

---

## 3. ABC/authored scores: this is a real live correctness seam

The current ABC route has custom workarounds because music21 does not preserve everything PianoProject authors write.

`tools/content/abc_tools.py`:

- rewrites inline voices into block voices;
- re-applies declared clefs;
- manually scans `!n!` fingerings because music21 drops them.

The fingering scanner treats `[CEG]` as **one note event with one pending fingering**, and `apply_fingerings` then attaches one fingering to the parsed chord object. That explains the research packet's confirmed defect: seven of the 33 shipped ABC-sourced files lose chord fingerings; `greensleeves-68.abc` has 80 source fingerings and the shipped MusicXML has 52.

`convert.py::source_note_events` also deliberately returns `None` for ABC, so ABC does not receive the independent source-note loss gate that MusicXML and Kern receive.

### Better/simpler approach

Do not keep making the hand-written ABC scanner smarter until we have tested mature alternatives on the 33 real files.

Prototype these against the existing ABC corpus, especially the seven chord-fingering failures:

1. **musicxml-io ABC → Score → MusicXML**. It currently supports ABC voices, clefs, chords, per-note durations/ties, grace notes, tuplets and decorations, and can serialize MusicXML. Its API is young/unstable, so this is a measured prototype, not an automatic migration.
2. **abc2xml** as an independent reference. Its parser treats decorations on notes inside chords as per-note objects; verify specifically whether PianoProject's numeric fingering convention reaches MusicXML correctly.
3. Keep the current route only for the constructs the alternatives demonstrably fail.

Minimum acceptance is not “the output renders.” Compare source facts and output facts: note count, pitches, voice/staff, clefs, fingerings, ties, tuplets, chord symbols and bar durations.

This is a good candidate for deleting custom code if the prototype succeeds.

---

## 4. Score model / demand facts: carry the notation instead of adding exceptions

`ScoreModelData` already carries full tempo and time-signature maps, but only one `keySig` and no clef map. `detect.ts` therefore documents two assumptions:

- staff 1 is treble and staff 2 bass;
- the first key is the key for the whole piece.

This has already leaked into product work:

- `build.py::clef_misread` has to flag `clef.bass` and `pitch.ledger` as unreliable for one-staff bass/clef-changing material;
- the excerpt proposer refuses to propose left-only cuts because moving a bass line to staff 1 would make the detector read it as treble;
- `chromatic`/key-signature demands can be wrong after a modulation.

This is not a reason for more detector heuristics. It is a missing mechanical fact in the model.

### Simpler correction

When Fable touches this area, add **clef-in-force and key-signature-in-force maps** to the score model in the same spirit as `tempoMap` and `timeSigMap`. Then mechanical detectors read the actual notation.

That can delete/retire special-case “unreliable demand” handling and unlock honest left-hand excerpt mining.

Do not use this change to reopen named-style classification.

---

## 5. Static exercise generators: mostly keep music21; delete accidental complexity around it

The generator inventory shows that most families are straightforward musical constructions:

- scales/arpeggios/chords/intervals;
- rhythm templates;
- cadences;
- coordination patterns;
- articulation/repetition/pedal exercises;
- accompaniment figures.

music21 remains the right backbone for pitch spelling, key/chord/interval facts and MusicXML construction. Another general notation library does not obviously make those families simpler.

Where a finite domain exists, **enumerate it whole**. Every key, quality, hand and declared variant is usually cheaper and stronger than clever property sampling.

Use a second parser after writing; do not ask the generator to certify itself.

### Where another library *would* simplify generation

Use OR-Tools CP-SAT (or a constructive algorithm) when a family has accumulated genuine combinatorial search/backtracking constraints.

The runtime sight-reader gives a concrete warning sign: its own comment says one reachable recipe keeps all its promises only about once in 370 random draws, and `PROMISE_ATTEMPTS` has grown to **4096** so a seed rarely fails. That is rejection sampling paying for hard constraints.

A cleaner split is:

`hard constraints → constructive/CP-SAT candidate(s) → existing soft phrase scorer → music21/TS writer → independent parse`

CP-SAT should **not** judge musicality. Its job is only to satisfy facts like range, allowed durations, required characteristic degree, leap cap, motif recurrence, target-note count, chord membership or cadence position and to say INFEASIBLE when the recipe really conflicts.

Do not add it to simple families that already construct a valid answer directly.

---

## 6. Runtime sight-reading: keep identity/scoring; stop treating homemade style patterns as authoritative style

The deterministic seed/version identity and the version-2 soft scorer are valuable. They solve real product problems and should stay.

But `LEFT_HAND_PATTERNS` exposes why named style needs a different approach:

- `alberti`: scale-index pattern `[0,4,2,4]`;
- `broken`: the same pattern slowed down;
- `walking`: `[0,2,4,5]`, described as root–third–fifth–sixth.

That last one is not a robust definition of jazz walking bass. The static walking-bass generator elsewhere in the repo is already different: root–third–fifth–**approach note to the next root**. Old E1 work also left genuine and false walking-bass passages, and the research packet now has FiloBass as a source-backed corpus.

### Better approach

Keep generic mechanical labels generic. For a **named style exercise**, derive a small explicit contract from verified real examples/source material and then generate under that contract.

Examples:

- Alberti: a source-backed low–high–middle–high triadic figure can be mechanically exact.
- walking bass: chord-time alignment + root/chord-tone/approach behaviour from verified lines, not “four LH quarters”.
- waltz/oom-pah: beat-position + bass/chord-role contract, backed by actual repertoire/method examples.
- boogie/stride: build only after a real source/pattern set exists; UNKNOWN is better than another broad proxy.

CQ1's rule remains: a broad accompaniment reading cannot certify a specific named style.

---

## 7. One mechanical rule has already drifted: compound metre

`app/src/demands/detect.ts` was corrected so 3/8 is **not** treated as compound; it requires more than one group of three eighths (6/8, 9/8, 12/8, …).

The runtime sight-reading scorer still defines compound as `beatType === 8 && beats % 3 === 0`, which includes 3/8. The detector's own comment says the generator/reading-controls/MIDI-import copies still carry the older rule, and currently generated content does not ask for 3/8.

That makes it latent rather than harmless architecture.

Do not add another test matrix around all the copies. Put the metre arithmetic in **one shared implementation** at the layer that can be shared, or delegate the Python side to music21 and parity-test the single TS implementation against it.

This is the kind of standard musical fact libraries should own or anchor.

---

## 8. Lab/backing: do not turn `backingLoop.ts` into a genre engine

The current backing loop is intentionally generic:

- bass = root on beat 1, fifth on beat 3;
- kick on odd-numbered beats in code positions 0/2;
- snare on the intervening beats;
- hats on beats/offbeats;
- simple whole/block/Alberti/broken comp patterns;
- the `walking` comp case is actually backbeat block chords because the bass is meant to carry the walk.

That is perfectly adequate as a metronomic practice bed. It is not an authentic jazz/blues/Latin/boogie/waltz arranger, and extending it style by style would recreate mature accompaniment software badly.

### Better/simpler experiment

Prototype **JJazzLab Toolkit** or **MMA** offline/build-time for the styles that need authentic bass/drums/comping. JJazzLab already takes chord symbols + style and generates separate bass/drums/guitar/piano/etc. tracks; its current jjSwing engine explicitly provides walking bass and drums, and track overrides let a caller replace/mute individual parts.

That separation is pedagogically useful too:

- learner practises walking bass → backing omits bass except in demo;
- learner practises comping → backing can keep bass/drums and omit piano;
- learner practises melody → backing can supply harmony/rhythm section.

Do not make a Java/JJazzLab runtime dependency before a small offline prototype proves useful output. Export deterministic MIDI/patterns at build time if that is enough.

---

## 9. Difficulty/placement: keep the mechanical features, demote the scalar

`tools/content/difficulty.py` has the right conceptual split:

- `features(score)` = measurable facts;
- `estimate(...)` = one model-derived level.

Keep that. The scalar is useful for browsing, candidate ordering and coarse safety. It is not evidence that a piece teaches a rung.

The existing excerpt proposer correctly does **not** use the whole-piece level in its window score.

RubricNet or other published piano-difficulty descriptors can be used as a second ranking signal later, but only after the hard taught/untaught requirements and exact passage facts. No new level oracle is needed to add content next week.

---

## 10. Testing: concentrate tests on transformations, not on the existence of more tests

The recurring content failures are boundary failures. Test those boundaries directly.

### A. Source/import/normalise/cut

For representative and adversarial files:

`source facts → operation → independent parser facts`

Compare the facts the operation promises to preserve. Do not byte-compare a file that is intentionally normalized.

### B. Generated finite families

Enumerate every supported key/quality/hand/variant. Let music21 or the source tables establish theory facts; let Partitura/humlib read the written file.

### C. Seeded runtime generation

Keep fixed-seed identity tests. Add generated-input/differential tests over many seeds for the hard contract. Use fast-check only if it genuinely gives shrinking/value beyond simple deterministic seed ranges.

### D. Mutation

Use mutation testing on changed custom semantic code when it will answer a real question. Do not make whole-repo mutation a standing gate.

### E. Known adversaries

The repo already owns the best regression fixtures:

- generated fingering/spelling failures;
- triplet/swing confusion shapes;
- walking-bass false positives;
- chord-fingering loss;
- key/clef changes;
- irregular bars/tuplets;
- PDMX mis-titles/truncations/wrong notes;
- excerpt repeat/tie boundaries.

Keep turning *real failures* into small fixtures. Stop inventing hundreds of speculative mutants by hand.

### F. Batch the expensive checks

A content item does not need a complete app/test/browser chain immediately after every edit. Run local/targeted transformation checks while a bounded content batch is being prepared; run the broader content build/render/app suite once the batch is stable.

---

## 11. The simplest end-to-end content system

### Real music

`learner characteristic/need`
→ cheap web / method / old genre-plan title research
→ exact title/composer match in PDMX or stronger symbolic corpus
→ inspect actual score
→ existing excerpt miner finds useful bars
→ verify source/edition where material matters
→ independent parser verifies the cut/transformation
→ Fable/owner curates placement.

The internet is the semantic index PDMX lacks. PDMX is the score warehouse the internet lacks.

### Controlled exercise

`learner characteristic/need`
→ reuse source-backed musical pattern or mechanical theory fact
→ construct directly with music21/Tonal, or CP-SAT only when constraints are genuinely combinatorial
→ write notation
→ independent parse
→ adversarial/finite-domain tests
→ ship.

### Lab/style

`learner role + chords + style`
→ source-backed style/pattern or mature backing engine
→ mute the part the learner is meant to supply
→ deterministic exported backing/pattern where possible
→ verify timing/harmony mechanically
→ ship.

---

## 12. Priority for Fable — not a new programme

If Fable is adding content next week, the minimum high-value order is:

1. **Do not rewrite PDMX/excerpts.** Use them.
2. Put an independent event-level witness after PDMX conversion and excerpt cutting.
3. Fix/delegate the ABC chord-fingering path before relying on authored ABC for lots more material.
4. Carry clef/key maps when work next touches demand extraction; stop accumulating misread exceptions.
5. For new generated families, use direct construction; use CP-SAT only where current rejection/backtracking proves the need.
6. Replace named-style homemade patterns with source-backed contracts as each named style is actually taught.
7. Prototype mature Lab backing offline instead of extending the generic loop style by style.
8. Batch expensive verification after bounded content batches.

Then add the content. Do not start another audit because this file exists.
