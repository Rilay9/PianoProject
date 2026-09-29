# Reviewer response — L120a `0bcd3be0`

Implementation HEAD: `0bcd3be0` (merged at `1b8d40c3`). Seam reviewed: **L120a, the read-only diagnosis of rung-own options the gate reads as untaught**.

## Verdict

**APPROVE L120a. L120b may proceed under the rulings below.**

The table is the diagnosis requested at the pre-build gate. It preserves the app's current refusal set rather than normalising it away, records incidental versus established without using incidence as an exemption, keeps the runtime reading row explicitly unread instead of inventing a Python copy of the app's reading-control map, and classifies each material-demand pair in the required order:

**material reading -> teaching ownership -> placement.**

The move from X1's 387 to 389 at this head is legitimate: the probe and the table identify the two newly added Q76 options, and the one build-unread runtime row is named separately rather than silently omitted.

The nineteen `READ_NOT_TEACHING` entries are accepted as the classifier's current readings. Each reason distinguishes a mere mention/example/task-list reference from actual instruction. None should be promoted to teaching ownership merely because a keyword appears in prose.

## Question 1 — a skip inside a taught five-finger position

**No: it is not automatically an untaught coping requirement merely because the notation contains a third.**

Keep the material fact: the score contains an `interval.skip`. Do **not** change the detector and do **not** pretend the earlier lesson taught interval reading.

The vocabulary already states the reason: `interval-reading` means reading the next note from the interval shape *instead of naming every note*, and its own note says a note-namer in a fixed position can play the same correct pitches. Therefore the current one-to-one `copedWithBy: "interval-reading"` relation is too narrow for the coping gate.

L120b must distinguish:

- **material demand present:** there is a skip in the notation;
- **one way of coping with it:** interval reading;
- **another valid way in constrained material:** the notes are inside a position/range whose note identities the learner has already been taught to read.

Do not solve this by moving every early skip or by setting `taughtAt` earlier for `interval.skip`. That would falsely say Stage 0 teaches reading by skips.

The gate needs an alternate-support rule for this case. The implementation shape may be a richer coping relation or a narrow contextual predicate, but it must prove these adversaries:

1. before 1.5, a skip wholly inside an already taught fixed position can be coped with through that earlier note-reading route;
2. before 1.5, a skip that leaves that known position / otherwise requires interval transfer does **not** get that exemption;
3. after 1.5, interval-reading support works normally;
4. evidence for interval-reading is still not inferred from a correct fixed-position run.

This is a **gate/support-model correction**, not a claim or placement correction.

## Question 2 — the three class-A readings

### A. key signature located on no sounding note

**Keep it as a reading problem, but state the correction precisely.**

The key signature is visually present; the detector has not hallucinated the notation. What is absent is an execution consequence in that item: if no altered letter sounds, the learner can play every written note correctly without applying that signature.

For the coping gate, a `key.signature` demand with zero affected sounding locations should therefore not be treated as a required coping demand for that item.

Do not erase the score's key-signature fact from notation/provenance. Correct only the material-demand interpretation used by the coping gate.

### B. 3/8 classified as compound metre

**This is a detector/semantic error. Fix it at the reading.**

Do not classify every 3/8 score as compound merely because the denominator is 8. 3/8 can be simple triple; the current 6/8-style rule is too broad.

The detector should require a metre that actually supports the compound reading (the established 6/8, 9/8, 12/8 family, or an explicit grouping fact if the representation later carries one). The L120a 3/8 pairs must not drive curriculum ownership or placement until that reading is corrected.

### C. written sixteenths in 3/8

**Overturn this one as a class-A doubt. The written sixteenths are real.**

A sixteenth note in 3/8 is still a sixteenth note the learner must read and time. The fact that it is half of an eighth-note counting unit changes the subdivision relationship; it does not make the written value disappear.

Remove `SIXTEENTHS_IN_THREE_EIGHT` as a presence doubt. Reclassify those pairs through teaching ownership/placement after the normal sixteenth rule below is fixed.

Do not “solve” them by pretending they are eighth-note notation.

## Question 3 — who owns sixteenths?

### Ragtime

**Yes: `ragtime.5` owns sixteenth subdivision on its path.**

The lesson explicitly teaches the common sixteenth-eighth-sixteenth figure, says the subdivisions are straight/even, and instructs the learner to count sixteenths aloud. That is instruction, not a passing mention.

Add the appropriate concept/mapping there so descendants on the ragtime path inherit an honest teaching owner.

### Technique

**`technique.6` can own it, but only by making the ownership explicit.**

The lesson already teaches “four notes to the beat” as an even measured target and places the learner in pages of sixteenths. That is enough pedagogical substance to support a sixteenth/subdivision concept, provided L120b adds the explicit curriculum claim rather than inferring ownership from the word alone.

Descendant technique rungs then inherit it. Do not separately declare every later technique rung a new teaching owner.

### Latin.7 and holiday.7

**No separate owner merely because they use or describe sixteenths.**

Those advanced lessons use sixteenth material to teach performance/hand problems. They should inherit a prior subdivision teaching owner. Do not add redundant “sixteenth” teaching claims to them just to clear the gate.

### Core path

**Use 4.4 as the first honest core owner, with an actual small teaching addition; do not force it into 3.5.**

3.5 is a sustain-pedal lesson and does not teach sixteenth reading. Adding a sixteenth concept there because *Canon in D (easy)* happens to contain them would be exactly the kind of claim corruption L120 is meant to prevent.

4.4 is the natural core home: the learner is explicitly working on Hanon streams at a controlled metronome tempo, and the lesson can honestly add the missing instruction that those written sixteenths are four subdivisions of a quarter-note beat and must be kept even.

Therefore L120b should:

- add the real sixteenth/subdivision teaching content and concept/mapping at 4.4;
- let later core/branch material inherit it;
- **move, replace, or simplify any pre-4.4 core option whose sixteenths genuinely require that reading**, including the 3.5 easy Canon if its measured sixteenths survive the corrected detector/support reading;
- not widen the definition of “taught” merely to keep those placements.

This preserves the curriculum's pedagogical sequence instead of inserting rhythm instruction into the pedal lesson.

## The nineteen “mention but not teaching” readings

**Keep all nineteen as not-teaching for L120b unless a lesson's actual text is substantively rewritten.**

The reasons in `READ_NOT_TEACHING` are consistent with the ownership rule:

- placement-test task lists ask, not teach;
- middle C's own ledger line is not “ledger lines beyond middle C”;
- a definition/example of a later rhythm is not instruction in using it;
- a piece description is not instruction in the demand;
- a chord root or key-signature pitch is not chromatic-note reading;
- “syncopated pedalling” is pedal terminology, not rhythmic syncopation;
- a shuffle off-beat is being taught as swing, not as the app's syncopation skill.

Do not let keyword presence become curriculum truth.

## L120b sequencing

L120b may now dispatch, but split its corrections by ownership so one class cannot hide another:

1. **A-reading fixes:** correct 3/8 compound semantics and zero-location coping; remove sixteenths-in-3/8 from A.
2. **Gate support semantics:** add the alternate fixed-position/note-name coping route for early interval material without awarding interval-reading skill.
3. **B ownership fixes:** existing claim/mapping repairs, including ragtime.5, technique.6, and core 4.4 sixteenth ownership.
4. **C placement fixes:** only after the first three recompute the table; move/simplify the genuine leftovers.

Re-run the table after each class. Do not edit all 641 pairs against the original snapshot and hope the causes remain independent.

## Verification basis

I reviewed the prior L120 gate response, Entry 149, the landed `untaught_options.py` classifier and its tests, the vocabulary definitions for `interval.skip`, `interval-reading`, and `subdivision`, and the relevant lesson text at 1.5, 2.2, 3.5, 4.4, ragtime.5, technique.6, latin.7 and holiday.7.

The full-suite load failures described in the handoff do not change the L120a mechanism because the affected files pass in isolation and the known line-ending pair remains separately recorded. L120a itself changes no learner-facing behavior.
