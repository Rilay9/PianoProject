# CT1 — every concept the curriculum teaches is defined from published sources, checked in the actual notes, and aligned across rungs, generators and levels (the content-truth work)

> **STOPPED, 2026-10-03, by the owner: do not run this brief again.** One session given all of it drifted and repeated the mistakes in `docs/prompts/content-mistakes.md`. The work continues as small lanes, one at a time, each reviewed before the next; the first is the left-hand-pattern and named-figure fix. The cloud session's pushed work on `claude/content-truth` is reviewed as it stands.

**Version 3, 2026-10-03, the owner's direction:** *research each concept, make sure the rungs teach the concepts at the appropriate level, and make sure the generators, exercises, scales and content all align.* This replaces versions 1 and 2. Their containment idea survives only as a temporary safety net (part four). **Nothing in the catalogue or on a rung is deleted:** claims change; the music stays.

You are working in the piano-teaching PWA in this repository. **Read `CLAUDE.md`, `docs/prompts/operating-procedure.md` §11–§14 and `docs/00-invariants.md` first.** Every house rule applies.

## Why this exists

The app tells a learner what each rung teaches and which music practises it. It also uses those claims to choose music, to refuse music the learner is not ready for, and, for sight-reading, to credit skills. The claims rest on 19 broad detectors (`app/src/demands/detect.ts`, the demand vocabulary `content/curriculum/vocabulary/demands.json`), written early as quick heuristics. They were never checked against the concepts' published definitions.

**The proof that this matters:**
- `leftHandPattern` calls any bar where the lower staff has several notes under upper-staff notes "accompaniment", so two-hand scales and arpeggios read as accompaniment. Current code: 16 of 25 scale, Hanon and arpeggio golden models, by the reviewer's probe (appendix). CL10a's checkpoint: about 256 catalogue items (`docs/prompts/runs/CL10a/checks-68805867.txt`).
- `tools/content/claims.py:79–85` maps seven distinct named concepts (Alberti, Alberti bass, broken-chord accompaniment, waltz bass, oom-pah bass, boogie bass, stride bass) onto that one vague demand.

**These concepts are not matters of musical taste.** Each has a published, precise note-pattern definition. For example, Alberti is the low–high–middle–high figure through one chord (Hutchinson, *Arpeggiated Accompaniments*, musictheory.pugetsound.edu). Pattern definitions can be checked mathematically against the notes. That is the work here.

**What stays out of reach, stated plainly:** whether a piece is a *good* teaching example, whether a phrase is musical, whether an exercise teaches *effectively*. Nobody in this process can hear. The checks here establish that the concept is truly present where claimed and that the levels and generators agree. They do not establish that it is taught beautifully: say *unverified as music* where that applies.

**Check every batch against `docs/prompts/content-mistakes.md`** before you push it, and name the items checked in your entry.

## Part zero, first: the whole project's reuse map (the owner, 2026-10-03)

The owner: *every piece of this project is either predefined, easily found online, already built, or impossible.* Before any other part, classify every component of the app and its content, exhaustively, and make each class checkable with one search.

For every component, give: what it does in the app; its class; the standard, published source or library that already provides it, with a link; what the app does today (reuses it, or hand-built its own); and the decision, either replace the hand-built version with the established one or keep it, with the reason.

The four classes:
- **predefined:** a standard or a definition, such as MusicXML, MIDI, music-theory concepts, graded syllabi;
- **published:** findable data or content, such as public-domain scores, syllabus repertoire lists, theory texts' examples;
- **already built:** a maintained library, such as music21, a score renderer, pitch detection, spaced-repetition algorithms;
- **impossible here:** it needs a human ear or a teacher's judgement. Say so, and decide what the app does instead (claim less, or label it unverified).

Cover at least: score import and conversion, rendering, MIDI and microphone input, pitch detection, score following and scoring, the metronome and audio, every concept detector, key, chord and Roman-numeral analysis, difficulty estimation, curriculum ordering, the sight-reading and exercise generators, ear training, theory content, the review and spaced-repetition scheduling, and the lesson content. Find the rest from the code.

**The reuse census** (`CLAUDE.md`, *Reuse before reinvention*). For every custom mechanism the map finds, record why it is custom, and what asset, library, dataset, reference implementation or published algorithm was searched for and rejected, with the reason. Cover at least:
- every generator family;
- every demand detector;
- every scoring and performance rule;
- every drill factory;
- every difficulty calculation;
- every theory or harmony operation;
- every content source;
- every progression mechanism.

Search open-source piano tutors and sight-reading trainers too, as reference implementations to compare against. Mark each mechanism KEEP CUSTOM, REPLACE WITH LIBRARY, REPLACE WITH DATA, ADAPT EXISTING, USE REAL CONTENT or UNSOLVED. The census may delete code, and that is welcome. Extend the map you already pushed; do not restart it.

Write it to `docs/prompts/runs/CT1/reuse-map.md`. Every row cites a source a reader can open with one search; list the searches you ran. Where the app hand-built something an established library or standard already provides, the replacement joins this work's plan, unless replacing it would break a working, tested path; then say why.

Parts one to three below apply the map to the concepts. Do part zero first and push it as its own checkpoint.

## Part one: each concept, defined and checked

The concepts are listed in `content/curriculum/concepts.json` (286 entries: time signatures, keys, scales, chords, positions, rhythms, textures and more) and mapped to demands in `tools/content/claims.py` (`CONCEPT_DEMANDS`).

**Classify every concept** into one of three kinds:
- **(a) definable in the notes:** a time signature, a key, a scale, a chord or inversion, an interval, a rhythm figure, an accompaniment figure, a position or range;
- **(b) definable in the performance only:** dynamics, pedal, articulation timing;
- **(c) not in the notes at all:** posture, listening, practice habits.

Start with the concepts the rungs claim; count how many rungs rely on each, and do the most-relied-on first. Include the concept tags items carry: an item's `concepts` list in the catalogue is an authored claim about that piece, with 315 distinct tags unvalidated per G12, ruled to be curriculum concept ids, with descriptive tags moved to their own field. Every tag that names a definable concept is checked by that concept's matcher.

**Use the established library first; write our own code last (the owner, 2026-10-03).** These concepts are defined in music theory and largely implemented in mature software, and the bugs came from hand-writing our own versions. `music21` 10.5.0 is already a dependency (`tools/content/requirements.txt`; the converter uses it). For every concept, first look for its implementation in music21. That covers keys, intervals, chords and inversions, Roman numerals, time signatures and beat strength, ties, tuplets and clefs, among others; confirm each in its documentation. Use that function at build time. The built catalogue carries its result, and the app reads it.
- **Custom code only where no established library implements the concept.** Expected: the named accompaniment figures, such as Alberti, waltz bass, stride, oom-pah, boogie and walking bass, and few others. Keep each one short, sourced and tested, as below.
- **The TypeScript detectors** (`detect.ts`) stay only where the app must measure in the browser: imported scores and runtime phrases. On the whole built catalogue they must agree with the library's result, and every disagreement is resolved by reading the score. The mature library is the reference.
- **Record the source of each concept's implementation** in `concepts.md`: the library function, or custom with its citation.

**For each concept of kind (a) that needs custom code** (and, for library-backed concepts, steps 3 to 5):
1. **Research its definition.** Use a published music-theory or pedagogy source: a theory text, Open Music Theory, the Puget Sound textbook, a graded-syllabus document. Cite it, quoting at most a phrase. Write the definition as a precise rule over the notes. Example: Alberti bass is a left-hand figure of four equal notes per group, in the order lowest, highest, middle, highest, all from one chord, repeating.
2. **Implement it as its own matcher.** One concept, one matcher. Never one broad demand standing in for several named concepts, so the seven styles get seven matchers. Reuse the score model and its fixes. CL10a's notation work on `chatgpt/cl10a` (`ce47aef2`) may be reused selectively: the clef in force, the key per bar, pickups, the simple-time metre, with their tests. Never reuse its texture or share rules.
3. **Prove it against examples you did not invent.**
   - **Positive cases:** the source's own examples, where they are short and quotable as notes, plus catalogue items the source's definition plainly fits.
   - **Near-miss negatives:** the things the definition must reject. A two-hand scale, Hanon and a two-hand arpeggio are not Alberti or accompaniment. A broken chord with a different order is not Alberti.
   - **Held back:** keep some cases out until the matcher is written, and report them separately.
   - The appendix's 16 known false positives must all come out negative for every accompaniment concept.
4. **Run it on the whole built catalogue.** Record per item where it matches, by bar and hand.
5. **Record it.** Write one row in `docs/prompts/runs/CT1/concepts.md`: the concept, its kind, its definition, its source, its matcher's file, its test cases, and its catalogue count.

Concepts of kind (b) are claimed only where the input can observe them; list which inputs can. Kind (c) is lesson-only: the app claims none of them about a piece. List them both.

## Part two: alignment, which is what the owner asked for

1. **Rungs.** For every concept a rung claims to teach, at least one of the rung's playable options must contain it by the matcher, with the bars named. List every rung where none does, as a curriculum gap: a missing piece, not a deleted rung.
2. **Generators.** Every generated family (`tools/content/generate_exercises.py`, `family_contracts.json`) must produce what its contract says. Run each concept's matcher on every generated item of a family that claims it. Do the same for the runtime generators (`app/src/engine/sightReading.ts`, `sightReadingScore.ts`, the prompt drills), over their parameter domains: exhaustively where the domain is small, otherwise by boundaries and seeded samples, stated as samples. A family whose output does not match its claim is a generator bug: fix the generator. Do not change the claim to fit.
3. **Levels.** Research how the published graded syllabi order each concept: RCM, ABRSM, and a widely used method series such as Faber or Alfred, where they state it. Cite the document and grade. Compare with the rung where the app first teaches it and first requires it (`content/curriculum/stage-*.json`, the needs-versus-taught gate in `tools/content/validate.py` and `app/src/curriculum/eligibilityCore.ts`). Report every concept the app teaches much earlier or later than the sources agree. Do not reorder the curriculum yourself: that is the owner's decision, so hand back the list with your recommendation.
4. **Prerequisites.** A piece is offered only after the concepts it contains are taught (`eligibilityCore.ts:286`). Rerun that gate with the new matchers, and itemise every option that becomes offered earlier or later.

## Part three: the modes credit only what they observe

Today, credit is switched on for sight-reading only (`app/src/curriculum/skillActivation.ts:41`). For every mode that credits or reports a concept, a test drives the real engine and record path with the attempt that must not pass:

| Objective | The attempt that must not earn credit |
| --- | --- |
| Reading unfamiliar music | the same phrase replayed, revealed or memorised |
| Rhythm | the right pitches with the defining rhythm flattened |
| Two hands | one part played, or the guide supplying the other |
| A requested passage | only other bars played |
| Ties and articulation | right attacks with early releases, unless releases are measured |
| Chords and ear drills | the wrong quality or inversion (an allowed alternative voicing is accepted) |
| Fingering, wrist, relaxation | not observable from note events; never credited |
| Dynamics, pedal | credited only where the input reports them |

## Part four: the safety net while parts one and two run

- **Until a concept has its sourced matcher,** its claim may still restrict (keep a piece out of offers before the concept is taught), but may not grant. It cannot say a piece teaches it, cannot establish a rung's claim, cannot earn credit.
- **The rule lives in one resolver** that every reader asks, and it denies by default: a new concept, demand or family without a sourced definition grants nothing. That keeps future content aligned. It is a temporary floor, not the goal: as each concept gets its matcher, its claims return.

## Environment, branch and checks

**Branch:** `claude/content-truth`, from the current head of `claude/piano-teaching-app-bo19td`.
- Write the base sha.
- Push only to `claude/content-truth`: a push to the working branch deploys to the owner's phone.
- Never merge, never touch PR #1, never force-push.

**Do not edit CL12a's files** (`chatgpt/cl12a`): `app/src/curriculum/session.ts`, `sessionPurpose.ts`, `app/src/data/sessionRun.ts`, `app/src/ui/screens/TodayScreen.ts`, `PlanScreen.ts`, `app/src/ui/help.ts`. If you need one, report the exact dependency.

**Other owners:** CL17 owns the level scalar. CL11's `docs/design/evidence-truth.md` stands. If evidence semantics change, bump `EVIDENCE_DEFINITIONS` with one idempotent recompute, as CL11b did.

**Setup and checks:**
```sh
pip install -r tools/content/requirements.txt      # music21 10.5.0 is already there
cd app && npm ci && cd ..
python3 tools/content/build.py                     # online, as CI does
python3 tools/content/validate.py --allow-nc --personal
python3 -m unittest discover -s tools/content/tests -t tools/content
cd app && npx tsc -b && npm run lint && npx vitest run
```

- Rebuild before tests that read built content.
- Playwright: `--workers=2`, if browsers exist. If not, name the specs for the orchestrator.
- Record every command with its exit code; nothing unrun is reported as passed.

## How the work converges

The list is finite: the concepts, the families, the rungs. Each concept is done when its row in `concepts.md` is complete. Each family is done when its output matches its claims. Each rung is done when its claims are present in its music or listed as a gap.

Push a checkpoint after each batch of concepts, with its rows and the catalogue rerun. Then go on without waiting. If the session runs out, the last checkpoint says where to resume.

**Stop and hand back only for:**
- a curriculum reorder;
- a rung with a gap no catalogue item fills;
- a stored-schema change beyond the evidence recompute.

## Done when

- **The reuse map (part zero) is complete,** every row sourced.
- **Every concept is classified,** and every kind (a) concept has its sourced definition, matcher, tests and catalogue row.
- **The alignment reports are complete:** rungs, generators (build and runtime), levels against published syllabi, prerequisites.
- **The modes' attempt tests pass** through the real record path.
- **The safety-net resolver is in place** and denies by default.
- **Three pass/fail checks, rerun by the orchestrator at landing and reported yes or no with the item lists:**
  1. Every known false positive gets no accompaniment or named-style claim: the 16 in the appendix, and CL10a's parallel-exercise items re-derived at your base.
  2. A test concept with no sourced definition grants nothing.
  3. A piece containing a concept not yet taught at a rung is still kept out of that rung's automatic offers.
- **The docs are updated in the same change:**
  - `docs/08-test-map.md`;
  - `docs/02-curriculum.md`;
  - `docs/04-ui-spec.md`, where words change;
  - `docs/prompts/checks.json`, for a new browser spec's helpers;
  - `operating-procedure.md`: no concept claim without a sourced definition and its tests, and an established library's implementation before any hand-written one.
- `docs/prompts/runs/CT1/ENTRY.md` begins `### Entry 231 — CT1`, with:
  - the judgement first: what a learner meets now;
  - the counts;
  - the mechanism;
  - the gaps;
  - the level disagreements;
  - what was not done;
  - where this brief was wrong;
  - the base sha.
- **House rules:** never name an AI model; no number measured on one machine stated as general; *unverified as music* where it applies.

## Before reporting, the checklist (`CLAUDE.md`; answer each in the entry)

Five questions, in tier order (`operating-procedure.md` §11). A correction is owed only
where the answer would change what the owner or the next agent does; wording alone never
earns a turn.

1. **Product.** Did I look at the result the way a learner meets it, and what would a
   piano teacher say about it? If I did not look or cannot judge, that leads the report.
2. **Mechanism.** What caused the fault, which test told that cause from the alternatives,
   and did the change act on the mechanism?
3. **Evidence.** Which claims are observed and which inferred; for every "all", "none" or
   "both", the scope actually examined and what is unchecked; for an absence ("not on this
   machine", "no such file"), the place the record says it lives, looked at, and the item
   tested directly (`test -e`, the exact path), never read off a listing; output cut by
   `head` or a limit is a sample, never grounds for "none" or "all"; what has not been heard.
4. **Consumers and record.** Who else reads what changed; the spec, test map and record
   updated in the same change, with the reason.
5. **Addressee.** For every request, question or claim: who acts on it, and can they? The
   owner decides and relays and never listens; the reviewer reads text and cannot hear, run
   or look; builders and the orchestrator cannot hear. A capability no actor has is stated
   as *no one in this process can decide this* and the item stays open, never moved to a
   later actor or phase. A paragraph its addressee does nothing with is cut. An owner
   correction is applied and confirmed by the change, in one line, without apology.

**Reply with:**
- the head sha;
- what a learner meets now;
- the concepts done and remaining;
- the rung gaps;
- the level disagreements;
- the generator fixes;
- the three pass/fail checks;
- what you could not run.

## Appendix: the 16 known false positives (the reviewer's probe at `b98169e2`; Node 24, exit 0, 25 golden models examined)

```js
// build/ct1-review/probe.mjs, run from the repository root
import { registerHooks } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
registerHooks({ resolve(s, c, next) {
  try { return next(s, c); }
  catch (e) { if (s.startsWith('.') && !s.endsWith('.ts')) return next(s + '.ts', c); throw e; }
}});
const { detect } = await import('../../app/src/demands/detect.ts');
const dir = 'app/tests/fixtures/scores/golden/';
const rows = readdirSync(dir).filter(f => /^exercise\.(scale|hanon|arpeggio)\..*\.json$/.test(f))
  .map(f => { const m = JSON.parse(readFileSync(dir + f)); return { id: m.id, present: detect(m, 'leftHandPattern').present }; });
console.log(JSON.stringify(rows, null, 2));
console.log({ examined: rows.length, positive: rows.filter(r => r.present).length });
```

**The positives:**
- `exercise.arpeggio.{a-minor,c-major,f-major,g-major}.2oct.both`;
- `exercise.scale.{a-harmonic-minor,a-melodic-minor,a-natural-minor}.1oct.similar.both.2`;
- `exercise.scale.{c-major,f-major,g-major}.1oct.{similar,contrary}.both.2`;
- `exercise.scale.{c-major,f-major,g-major}.2oct.similar.both.2`.

## Record

lane: CT1 · closes: — · entry: 231
index: Every concept the curriculum teaches is defined from published sources, checked in the actual notes, and aligned across rungs, generators and levels (`CT1-every-musical-claim-has-a-checkable-source.md`) | build | drafted 2026-10-03 (`CT1-every-musical-claim-has-a-checkable-source.md`); Entry 231
in-flight: drafted 2026-10-03 (`CT1-every-musical-claim-has-a-checkable-source.md`): version 3, the owner's direction; each concept researched and matched in the notes, rungs, generators and levels aligned, the modes' attempt tests, a deny-by-default safety net; nothing deleted; supersedes CL10a (Entry 231)
state: with-reviewer 2026-10-03: the owner's prompt for a cloud session, with the outside reviewer before it is pasted (Entry 231)
- held 2026-10-03: Part D would let untaught music through (eligibilityCore.ts:286); being revised with the reviewer's replacement under the rule that uncertainty only restricts
- approved 2026-10-03: version 3, the owner's direction (research each concept, align rungs, generators and levels; nothing deleted), with the reviewer's corrections kept (restrict never grant, three questions apart, runtime generation, the modes); dispatchable to a cloud session
- held 2026-10-03: stopped by the owner; one session with the whole scope drifted; continued as small lanes, the first being the named accompaniment figures
