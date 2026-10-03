# Content-finish plan (Blocker 1)

Status: **draft for review, 2026-10-03.** No CF step begins until this plan is reviewed and frozen. After each step: hand back, get a review, then start the next numbered step. Never start "whatever looks next".

Governing documents: `docs/review/product-convergence-current.md` (Blocker 1: 1A, 1B, 1C), `docs/prompts/charter.md`, `docs/prompts/content-mistakes.md`, and the standing checklist `docs/prompts/anti-drift-checklist.md`.

## Preflight, before every action

Name these five in five short lines. If you cannot, do not act. After finishing, stop rather than picking another task.

1. **Plan step:** CF*n*.
2. **Unit of work:** one sentence, either a class or mechanism, or a small candidate set for one need. Never "the next item".
3. **Learner problem:** what the learner gets wrong or gets wrong material for.
4. **Ownership/reuse disposition:** KEEP, DELEGATE, CURATE, VERIFY NARROWLY, ADVISORY ONLY or UNKNOWN.
5. **Finish condition:** the step's acceptance, below.

## The evidence the plan is built from

There are three representative learner needs. They are **evidence for designing mechanisms, not rungs to edit.**

| Need | What the learner gets now (`content/curriculum/stage-2.json` at `638883e`) | Sources |
|---|---|---|
| **N1. Hands together: the left hand holds while the right moves** (rung 2.1) | <ul><li>Four project-authored hands-together songs (`content/scores/authored/*-ht.abc`): Ode to Joy, Twinkle, Jingle Bells, Mary.</li><li>One PDMX song (*Simple Gifts*).</li><li>A drill.</li><li>Generated items: `exercise.five-finger.c-major.both`, `exercise.coordination.{c.hold, c.change, g.hold}` and `exercise.ostinato.a.fifths`.</li></ul> | generated; project-authored; user-uploaded |
| **N2. Eighth notes and counting** (rung 2.2) | <ul><li>Eight songs: three bundled, five PDMX.</li><li>A rhythm drill and a sight-reading drill.</li><li>Generated items: `exercise.rhythm.{eighths, quarter-eighths, waltz-quarter-eighths}.4bar` and `exercise.swing-pair.c`.</li></ul> | generated; real, mostly user-uploaded |
| **N3. First chords C, F and G, that is I–IV–V** (rung 2.3) | <ul><li>Lesson `content/lessons/2.3.md`.</li><li>Drill `drill.chord.c-f-g`.</li><li>Generated items: `exercise.cadence.c.{root, voice-led}`.</li><li>Seven songs.</li></ul> | lesson text; generated; real |

### What the rung 2.3 experiment showed

These are observed findings. The edits that produced them were reverted, because they were implementation before the plan was approved.

1. **Three of N3's seven songs are in other keys with other chords.** Read with music21 from the shipped files:

   | Song | Key | Chord symbols |
   |---|---|---|
   | *Was wollen wir trinken* | A minor | Am, G |
   | *Dark Eyes* | D minor | Dm, A7, B♭, Gm6 |
   | *Auld Lang Syne* | E♭ major | E♭, B♭7, A♭ |

   Nothing caught this. In `docs/prompts/rung-claims.md`, rung 2.3 establishes no claim, because nothing measures chord symbols or I–IV–V. **This is a class problem, so it goes to CF2. It is not three edits.**

2. **The cadence family's chords are what it promises.** music21's `roman.romanNumeralFromChord` names them in all 12 major keys for both voicings, and a broken V7 was red 12 times. This was the shape of a CF1 checker, and it was confirmed on one family.

3. **One sentence in lesson 2.3 overclaims.** "Nearly every folk, hymn and pop song is mostly these three" has no source. This is a CF6 lead.

4. **A test pins lesson wording.** `app/tests/unit/lessonClaimsAboutMusic.test.ts` fixes lesson sentences, including 2.3's song counts. Any CF2, CF5 or CF6 change to a rung's songs or its lesson changes that test in the same commit.

## CF1. Independent verification of generated exercises (scheduler 1A)

- **Learner problem.** A controlled drill that does not train what it says, such as a left hand that doesn't hold, or eighths beamed or counted wrongly, teaches the wrong thing quietly.
- **Systemic responsibility changed.** Today the generator's own contract and the app's detectors, via the bridge (`test_measured_demands.py`, `demandsOfFiles.test.ts`), vouch for generated items. Both are project code, so agreement between them is corroboration and not proof (content-mistakes #5). CF1 adds a **checker outside both**: music21 reading the written file. Its rule is that the checker never imports the maker's tables.
- **Reuse gate, to run at the start of the step.** Provisional answers:
  - **music21: KEEP.** It is already pinned at `tools/content/requirements.txt` `music21==10.5.0`. It provides standard facts: durations, beams against the metre, chord naming, voice and staff separation.
  - **Hypothesis: evaluate.** It is not installed here. Adopt it only if one property test replaces a hand-listed set of examples across seeds and keys, and only if it plugs into the current generator calls without a refactor. Verify its version, licence and known issues on its package page and repository first.
  - **Partitura or Verovio:** only where a second parser would settle a disputed MusicXML reading.
  - **OR-Tools: not expected.** N1's and N2's makers do no combinatorial search.
  - **Deletion.** Record which hand-listed example tests the property checks would let us delete.
- **Mechanisms.** `tools/content/generate_exercises.py` (the N1 and N2 makers, unchanged unless a checker finds a defect), `family_contracts.json` (the named property per family), and one new checker module under `tools/content/` with its test.
- **Acceptance.**
  - For N1's and N2's families, a checker states each family's named property from the notes. Examples:
    - "each left-hand note sounds through at least one right-hand onset";
    - "every value is a quarter or an eighth, and eighths are beamed within the beat for the metre".
  - The checker runs over every shipped item of those families and over generated keys and seeds.
  - At least one deliberate break per property is caught (red).
  - Any defect found is fixed in the maker as a class.
  - Before the step starts, the full unit suite has a baseline on a clean, unmutated tree. The run taken during a rebuild means nothing.
- **Stop.** N1's and N2's families only. Breadth is CF4's job.

## CF2. Checking that content placed on a rung supports the rung's promise (scheduler 1A/1B seam)

- **Learner problem.** A rung says "C, F and G", and the learner is handed a minor-key song with B♭ and Gm6.
- **Systemic responsibility changed.** Today a piece reaches a rung because someone listed its id. Nothing compares what the score establishes with what the rung promises, for any promise the detectors do not already measure.
- **Reuse gate.** Provisional answers:
  - **music21: KEEP.** Use `harmony.ChordSymbol` for printed symbols, the key signature, and `roman` for naming against the key.
  - **Known issue to check on the real files first:** how MuseScore-exported chord kinds parse (`Gm6`, `A7`, slash chords).
  - Inferring harmony from the notes, by chordifying the left hand, is **advisory only**. A score with no printed symbols and no readable left-hand chords is **UNKNOWN, to be curated**. It is never inferred into authority.
  - No harmonic classifier.
- **Mechanisms.**
  - A small declared vocabulary per checkable promise, stored as rung data. For example, N3's "I, IV, V(7) in C".
  - One checker producing **verified, contradicted or unknown** per placed option.
  - The output joins the existing rung report (`claims.py`, written into `docs/prompts/rung-claims.md`) rather than a new report.
- **Open question for the owner, needed before CF2 is built.** Does rung 2.3 promise C, F and G literally, or I–IV–V in any key? It already offers *Jingle Bells* in G. This is a pedagogical choice: the checker enforces the answer; it does not make it.
- **Acceptance.**
  - On N3, the three songs above come out contradicted and the remaining four come out verified or unknown.
  - Deliberate breaks are caught: a C-major song relabelled F, and a song with a stray A♭.
  - The step changes no song placement itself. Placements change in CF4 or CF5 from the checker's output.
- **Stop.** N3's promise type, chord vocabulary and key, only. Other promise types go to CF4 only if they can be stated mechanically.

## CF3. Real-repertoire sourcing and curation for N1–N3 (scheduler 1B)

- **Learner problem.** Transfer material that is weak, wrongly placed or user-uploaded and unchecked.
- **Systemic responsibility changed.** Choosing real music becomes a recorded method, `need → sources → small candidate set → exact passage → teaching-use record`. It is no longer listing ids.
- **Reuse gate.**
  - **Published methods** (RCM, ABRSM, Faber, Alfred): evidence of which skills come when and which public-domain tunes they use. Never an automatic crosswalk, and never copied content.
  - **Candidate pools:** existing holdings first (the catalogue and `content/sources/excerpts.json`), then public-domain repertoire (Mutopia, IMSLP, OpenScore). PDMX is a candidate source and never an authority (content-mistakes #17).
  - **Search tools:** only if they cut search work.
- **The authored arrangements.** Decide, without assuming either answer, whether N1's four project-authored hands-together songs are deliberate teaching arrangements worth keeping or homemade stand-ins for better sourced material (content-mistakes #14).
- **Mechanisms.** The existing teaching-use review record (`content/review/decisions.jsonl` and `review.py`); the rung report counts it, and it currently holds 0. Also the excerpt machinery (`excerpts.py`) for exact passages.
- **Acceptance.** Each need has a few selected pieces or passages. Each has a record with:
  - source and provenance;
  - the exact need and passage;
  - why it fits;
  - what was checked mechanically (with CF1 and CF2 checkers where they apply);
  - what remains judgement.
- **The limit no one here can lift.** No one in this process hears music, so suitability rests on reading the notation plus published-method evidence and is marked *unheard*.
- **Stop.** Three needs, a small set each.

## CF4. Scaling the proven checks (breadth)

- **Precondition.** CF1 and CF2 have been reviewed and accepted.
- **Learner problem.** The same defects in every family and on every rung that N1–N3 do not cover.
- **Systemic responsibility changed.** The checkers move from three needs to every generated family whose contract names a property the checker can state, and every rung whose promise CF2's vocabulary can state.
- **Reuse gate.** No new tool. Extending a checker to a property it cannot state honestly is refused, and the property is left **unknown**.
- **Mechanisms.** The CF1 and CF2 checkers, `family_contracts.json`, the rung data, and the rung report.
- **Acceptance.**
  - Every covered item lands in **verified, contradicted or unknown**. Counts are reported from the run on the current tree.
  - Contradictions sharing a cause are fixed once, at the maker, the mapping or the source.
  - The result is a finite flagged list, not one task per item.
  - Passing items are not inspected by hand.
- **Stop.** The covered classes have all run and their class fixes are in.

## CF5. Curating the flagged, learner-critical remainder

- **Learner problem.** Items the checkers flag or cannot decide, where the learner actually meets them.
- **Systemic responsibility changed.** Human judgement is applied only here, and only where it is needed.
- **Selection.** Contradicted or unknown items from CF4 that are also on a learner-critical path:
  - Today or the session selects them;
  - a curriculum step needs them;
  - they are real-music transfer;
  - they grant or support a learner-facing claim.

  Nothing is curated just because it exists in the catalogue.
- **Acceptance.** Each selected item is kept with a teaching-use record, moved, replaced (by the CF3 method) or removed from the path. A rung left with nothing to teach is a CF3 sourcing gap, not an empty rung (content-mistakes #7).
- **Stop.** The selected set is done.

## CF6. Factual truth of the lessons (scheduler 1C)

- **Learner problem.** A lesson states something false or unsupported as fact.
- **Scope.** Only lessons on the paths that survive CF4 and CF5. The existing lesson-audit findings are leads, not a checklist.
- **Rules.**
  - A false theory or history claim is corrected from an authoritative source.
  - A standard fact is checked with music21 or a published text where that is cheap. Rung 2.3's chord facts were checked this way.
  - An unsupported assertion is sourced, weakened or removed.
  - A teaching judgement is recorded as a curated decision. It is never "fixed" by an AI.
- **Mechanisms.** `content/lessons/*.md`, and `lessonClaimsAboutMusic.test.ts`, updated in the same commit.
- **Stop.** No known false or unsupported authoritative statement remains on those paths.

## CF7. Content acceptance through the learner journey (to Blocker 2)

- **Path.** need → Today or session → lesson → controlled practice → generated exercise → real-music transfer → evidence and summary → next step. Run it for N1–N3 on the current tree.
- **Acceptance.**
  - Generated items come from checked families.
  - Transfer material carries a teaching-use record.
  - The lesson text has passed CF6.
  - The source chooser picks generated, real, full-piece or external material for the stated reason.
  - "Unknown" grants nothing.
- **Stop.** Hand back. Blocker 2 owns the wider journey.

## When the content phase is done

- Generated-content claims for the covered families are independently checked.
- The proven checks have run across every class they can legitimately state.
- Contradictions have been fixed by class wherever possible.
- Learner-critical real music has passage-level teaching-use records.
- Learner-facing factual statements on the surviving paths are sourced and true.
- Unknowns grant no teaching or progression authority.
- The N1–N3 journeys run on trustworthy content.

Then stop. No further content programme follows from momentum.

## Not in this plan

- Rung-by-rung or item-by-item review.
- CT1 or CQ2+.
- A detector-perfection campaign.
- A universal harmony or accompaniment classifier.
- A generator-framework rewrite.
- A mass music21 migration.
- An 87-box lesson cleanup.
- Score/UX work. The parked U122d branch `claude/blocker1` stays parked. A full unit run there showed 2 failures whose names were not captured. That gets checked if and when the branch is resumed.
