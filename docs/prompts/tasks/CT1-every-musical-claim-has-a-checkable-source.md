# CT1 — a musical claim grants nothing it cannot support: contain unsupported claims at one shared boundary, deny by default, then rebuild what can be supported and test every mode (the content-truth work, whole, in three parts run in order)

**Version 2, 2026-10-03.** This reconciles the first CT1 draft (`a7cc4d6c`, held at `3e9d7f7b`) with the outside reviewer's review and replacement brief, which the owner relayed the same day. The reviewer's text is summarised here where it governs; its research sources and adversarial cases are carried in full below. The accepted and rejected amendments are listed at the end.

You are working in the piano-teaching PWA in this repository. **Read `CLAUDE.md`, `docs/prompts/operating-procedure.md` §11–§14 and `docs/00-invariants.md` first.** Every house rule applies to you.

## Why this exists, in five sentences

The app makes musical claims ("this piece practises a left-hand accompaniment") and uses them to choose music, to refuse music the learner is not ready for, to report rungs and, for sight-reading, to credit skills. A lane widening one detector exposed a semantic fault: `leftHandPattern` (`app/src/demands/detect.ts`) treats "the lower staff has several notes while the upper staff plays" as "accompaniment under a melody", so two-hand scales and arpeggios read as accompaniment (reproduced on current code: 16 of 25 committed scale, Hanon and arpeggio golden models). A second widening sits in `tools/content/claims.py:79–85`: Alberti, broken-chord, waltz, oom-pah, boogie and stride all map to that one broad demand, so a generic reading would certify every named style. Nobody in this process can hear music, and the owner cannot supply a musician; the four rows in `content/review/decisions.jsonl` are builders' `usableScore` notation checks, not teaching approvals. So the end is not a cleverer detector or another audit: **it is a rule enforced at the code's shared boundaries, deny by default, that an unsupported claim may restrict but never grant.**

## The rule (SETTLED, the owner's direction with the reviewer's correction)

- **Three questions, kept apart** (evidence-centred assessment design, Mislevy and Riconscente, PADI Technical Report 9):
  1. *Does this material contain X?* This is a fact, supported by notation evidence.
  2. *Does this task offer suitable practice of X?* This needs the fact plus a task fit.
  3. *Did the learner demonstrate X?* This needs a discriminating observation in this mode.

  Each needs its own support. A yes to one never implies the next.
- **Unsupported may restrict, never grant.**
  - A claim without support never makes an item count as teaching X, never establishes a rung's claim, never earns credit, and is never shown as the item's truth.
  - The same uncertain demand still counts as a possible prerequisite: it can keep an item out of automatic offers before X is taught. **Unknown is not absent**, so removing a judgement must never make difficult music look easier. `app/src/curriculum/eligibilityCore.ts:286` refuses an item with untaught demands; that refusal is a restriction and keeps working.
- **Deny by default.** A claim, demand, family contract or new mode with no declared support grants nothing at the shared resolver. This is what makes the rule hold for future content: a new item, generator or detector that skips the declaration simply teaches nothing until supported.
- **No new judgement classifier and no retuned threshold** for a musical interpretation in this lane. CL10a is superseded: reuse its notation fixes selectively (the clef in force, the key per bar, pickups, the simple-time metre, with their tests), never its texture or share rules.
- **Never teach wrong** outranks coverage. A rung that loses a positive claim is acceptable. A false claim, a silent bypass, a substitute objective or a completion path that cannot be met is not.

## VERIFIED at `b98169e2` (check again at your base)

- **`leftHandPattern` is semantically wrong.** The reviewer's probe imports the real detector on the 25 golden models under `app/tests/fixtures/scores/golden/` named `exercise.{scale,hanon,arpeggio}.*`: 16 positive. The script is in the appendix. CL10a's whole-catalogue oracle (`docs/prompts/runs/CL10a/checks-68805867.txt`) recorded 180 scale, 20 Hanon, 48 arpeggio and 8 chromatic positives at its own checkpoint, which never landed. Those are historical counts, not a current rerun.
- **`claims.py:79–85`** maps seven named accompaniment styles to `texture.left-hand-pattern`.
- **`app/src/curriculum/skillActivation.ts:41`**: the shipped skill activation is sight-reading rows only. Texture misreadings have not earned skill credit. They affect selection, rung reports, generated-content checks and prerequisite refusals. Trace each path separately; do not overstate the damage.
- **`content/review/decisions.jsonl`**: 4 rows, all `dimension: usableScore`, `basis: notation`, by D2 and D3 builders. Its schema (`app/src/review/record.ts`, `tools/content/review.py`) has item-level `usableScore` and `goodTeachingUse` only, with no claim, bar range or permitted use.

## The work, in three parts run in order in one session

Part one makes the app honest: nothing unsupported grants anything. Part two rebuilds what can be supported, so the app claims as much as it truthfully can. Part three proves the modes credit only what they observe. Run them in order on the same branch. Push a checkpoint at the end of each part, with its entry section and its checks, and go on to the next part without waiting, unless a stop condition below holds. If your session runs out, the last checkpoint and its entry say exactly where the next session resumes.

## Part one: containment and impact

**Branch:** `claude/content-truth` from the current head of `claude/piano-teaching-app-bo19td`. Write the base's full sha. Push only there: a push to the working branch deploys to the owner's phone. Never merge, never touch PR #1, never force-push. The orchestrator lands it.

**Do not edit** CL12a's files (`chatgpt/cl12a`): `app/src/curriculum/session.ts`, `sessionPurpose.ts`, `app/src/data/sessionRun.ts`, `app/src/ui/screens/TodayScreen.ts`, `PlanScreen.ts`, `app/src/ui/help.ts`. Finish everything else first. If containment needs one of them, report the exact dependency.

**Owned elsewhere:** CL17 owns the level scalar (`docs/design/one-level.md`). CL11's approved `docs/design/evidence-truth.md` semantics stand unless an explicit reviewed amendment changes them.

### 1. The inventory (before any change)

- **One row per claim definition**, not per prose instance. Each row gives:
  - the exact proposition, its source and its current support;
  - the scope (item, bars, generator recipe);
  - the learner-facing wording;
  - the selection, prerequisite and evidence readers, each named;
  - the owning code.
- **Cover every entry path:**
  - the build's detectors (`detect.ts`, `tools/content/demands.py`, `claims.py`, `validate.py`, `untaught_options.py`, `rung_audit.py`);
  - the curriculum vocabulary (`content/curriculum/vocabulary/demands.json`, `skills.json`, `concepts.json`, `stage-*.json`);
  - generated families (`tools/content/generate_exercises.py`, `family_contracts.json`, 57 contracts);
  - **runtime generation**: `app/src/engine/sightReading.ts`, `sightReadingScore.ts`, the reading controls, the prompt-drill factories, harmony, theory, Simon and special drills;
  - imports;
  - lesson prose (109 files): flag only, see below;
  - help;
  - every mode: Wait, Keep tempo, Listen, Free, Rhythm only, Blind, Perform, sight-reading and labs, prompt and ear drills, loops, hand selection, guide, names, reveal, tempo, self-report, imported material.
- **Enumerate modes and drill kinds from the registries and dispatch,** not from comments. Paths with no match fail a coverage check.
- **Output:** `docs/prompts/runs/CT1/inventory.md`, plus a machine-readable file, with the searches as runnable commands and the counts by class: fact; interpretation; app policy (a declared value with its rationale, never called a fact); authored; unknown.

### 2. Trace four cases end to end

Trace:
- a two-hand scale;
- a genuine sourced accompaniment example: the Alberti definition in Hutchinson, *Arpeggiated Accompaniments*, musictheory.pugetsound.edu, against a catalogue item that matches it;
- one runtime sight-reading phrase;
- one prompt drill.

For each, name every point where a narrower observation becomes a broader claim, and every safeguard that already holds. **The hypothesis to refute:** the failures come from promoting a narrow observation into a broad claim and reusing it across selection, assessment and prose. Where an existing boundary already prevents a consequence, keep it and narrow the finding.

### 3. Contain, at the shared boundaries

- **Build one pure resolver** that every reader asks: *may this claim be used for contains, for practise here, or for credit?* It answers from the claim's declared support. It denies by default and keeps prerequisite restrictions in force. Route the existing readers through it:
  - eligibility and candidates;
  - rung claims and reports;
  - family-contract checks;
  - the Skills screen's states;
  - evidence;
  - learner-facing *teaches/establishes* wording.
- **Withdraw positive authority** from:
  - `leftHandPattern`, `walkingBass`, `handsTogether` (beyond the overlap fact), `syncopation` and `beyondPosition` (beyond the span fact);
  - the seven style concepts mapped at `claims.py:79–85`.

  Withdraw it from any other proposition the inventory finds unsupported, saying why. They stay available as prerequisite restrictions.
- **Classify propositions, not detector names.** For example, a key signature is not the tonal key; a staff is not a hand or a voice; written values are not performed durations. Keep narrow internal measurements, and never let them return under new names with positive authority.
- **Evidence:** if inference semantics change, bump `EVIDENCE_DEFINITIONS` with one idempotent recompute, as CL11b did:
  - raw observations and history are preserved;
  - missing data becomes unknown, never reconstructed;
  - previously inactive generated material is never activated.
- **Validator:**
  - a new demand, claim kind, family contract or mode without a declared support class fails the build;
  - each rule gets a red-first test;
  - the original false classifications are kept as counterexample tests that the final paths refuse.

### 4. The impact report: the end of part one

`docs/prompts/runs/CT1/impact.md` holds the full before/after on the built catalogue. For each rung it gives:
- the automatically offered tasks left;
- the practice music left;
- whether every completion condition can still be met (a non-empty music list is not enough if its required skill can no longer earn evidence);
- changes to outstanding and to already-completed progress, kept separate;
- every learner-facing sentence that changed: where, before, after, why.

**Stop and hand back** if:
- a required rung becomes unreachable;
- a learner would lose music they had;
- a needed stored change goes beyond the evidence-definitions recompute.

Each stop comes with one concrete decision and its alternatives.

## Parts two and three

- **Part two, the claim contract (restores supported coverage):**
  - extend the vocabulary, the family contracts and the review record with typed claim, range, use and source identity (append-only, old rows explicitly not upgraded);
  - certificates with witnesses bound to content bytes, excerpt bounds, generator version and seed, and the definition and validator versions;
  - published expert annotations admitted with attribution for exactly what they support, for example the Couturier, Bigo and Levé Mozart texture dataset, ISMIR 2022, for its classical repertoire only.
- **Part three, the independent checks and the modes:**
  - a Python reading of the notation facts from the original MusicXML (music21 10.5.0 is already in `tools/content/requirements.txt`; no production helpers), against a small externally grounded reference set split into development and held-out cases, compared by witness and location over the whole catalogue with exact coverage counts;
  - transformation tests (metamorphic testing) within stated invariants;
  - per-realization checks on runtime-generated phrases and drills, with a verified fallback for the same objective or an honest "unavailable";
  - the adversarial-attempt tests in the table below, through the real record and evidence path.
- **Lesson prose:** static scans flag likely unlinked musical assertions, and every flagged sentence either links to a supported claim or is listed; rewriting lessons into structured claims is not in this work.

**Part two is done when** the record carries typed claim, range, use and source, old rows not upgraded; every positive authority the resolver grants names a witness bound to its content version; and every claim part one withheld is listed as restored (with its source) or still withheld (with what would support it).

**Part three is done when** the independent notation reading covers the whole built catalogue with exact counts and every disagreement resolved or quarantined; every runtime generator checks each realization before offering it; and every row of the table below is a passing test through the real record and evidence path.

The adversarial cases part three must cover (the reviewer's table, kept whole):

| Objective or task | Adversarial attempt or condition | Required outcome |
| --- | --- | --- |
| Reading unfamiliar music | replay the same phrase, hear or reveal its answer, a memorised or blind run | keep the practice result; never certify first-sight reading |
| Rhythm discrimination | correct pitches with the defining rhythm flattened; a tolerance that accepts both rhythms | no credit for the finer rhythm |
| Two-hand task | play one selected part, or let guide playback supply the other | credit only the learner-observed part |
| Accompaniment classification | two hands play the same scale or arpeggio | no accompanied-melody or named-style certification from overlap |
| Tie or articulation target | correct attacks with premature releases or rearticulation | require the release observation, or narrow the feedback to what was measured |
| Fingering, relaxation, wrist | same pitches and timing with different physical technique | note events cannot tell; no automatic certification |
| Dynamics and pedal | flat velocity or a switch pedal; correct notes without the control | follow device capability; unsupported is unmeasured, never success |
| Chord or ear drill | wrong quality, inversion or bass; answer leakage; an allowed alternate voicing | reject the defined error, accept the declared alternative |
| A requested passage | play only unrelated bars, or omit the target | no target evidence from an aggregate pass |
| Transfer | a new seed or transposition of the same recipe | a new id is not demonstrated transfer |

## Environment and checks

```sh
pip install -r tools/content/requirements.txt
cd app && npm ci && cd ..
python3 tools/content/build.py      # online: it fetches the score library, as CI does
python3 tools/content/validate.py --allow-nc --personal
python3 -m unittest discover -s tools/content/tests -t tools/content
cd app && npx tsc -b && npm run lint && npx vitest run
```

- Rebuild before any test that reads built content.
- **Never use `tsc --noEmit -p`:** it checks nothing.
- **Browsers, if available:** Playwright with `--workers=2`, one suite at a time. If browsers are not available, name the specs for the orchestrator, who also captures and looks at the pictures of any changed screen.
- Record the exact head, every command and its exit code, and anything unrun. An environment failure is never green, and an updated expected output is never evidence.

## Done when (part one; parts two and three above)

**Three pass/fail checks the owner holds this work to. The orchestrator reruns them at landing and reports yes or no with the item lists:**
1. Every known false positive gets no accompaniment or named-style claim, in any use (contains, practise here, credit, learner wording). The known false positives are the 16 golden models in the appendix and CL10a's recorded parallel-exercise items in `docs/prompts/runs/CL10a/checks-68805867.txt`, re-derived at your base.
2. A deliberately added test demand with no declared support grants nothing at the resolver.
3. An item whose withdrawn demand is untaught at a rung is still kept out of that rung's automatic offers.

- Every section of part one exists.
- **The resolver:** it is in place, it is the only route for positive authority, and it denies by default.
- **The counterexamples are refused** by the active paths; the valid reference cases still pass under their scope.
- **The coverage check** fails on any unmatched entry path.
- **The impact report** is complete, with no rung silently unreachable.
- **The docs are updated in the same change:**
  - `docs/08-test-map.md`;
  - `docs/04-ui-spec.md` and `docs/02-curriculum.md`, where words or claims change;
  - `docs/prompts/checks.json`, for a new browser spec's helpers;
  - the rule written into `operating-procedure.md` where every builder reads it.
- `docs/prompts/runs/CT1/ENTRY.md` begins `### Entry 231 — CT1`. It holds:
  - the judgement first: what a learner meets now;
  - the counts by class, before and after;
  - the mechanism, with file and line;
  - the cases;
  - the impact;
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
- the claims active and withheld, by use;
- curriculum reachability;
- the counterexamples refused;
- the unrun checks;
- the stops, if any.

## Reconciliation: the reviewer's amendments (`b98169e2` review, 2026-10-03)

**Accepted:**
- **A:** fact, task and achievement kept apart.
- **B:** propositions, not detector names.
- **C:** two implementations corroborate, not prove; external references, counterexamples and metamorphic tests (moved to CT3).
- **D:** the review rows are not teaching approvals; extend the record with typed scope (moved to CT2).
- **E:** unknown is not absent; prerequisite restriction kept. This is the core of this lane.
- **F:** no musician dependency; a checklist is optional coverage only.
- **G:** runtime generation and every mode inventoried here, checked in CT3.
- **The broad-to-subtype widening** at `claims.py:79–85`, withdrawn here.
- **The reachability check,** made this lane's stopping point.

**Changed by the orchestrator:**
- **The reviewer's three slices are three parts run in order in one session**, each with a finite, mechanical done-when and a pushed checkpoint, so the work converges and cannot grow into an open audit. It stops only on the stop conditions.
- **Deny by default at one resolver** is made explicit as the mechanism that keeps future content honest.
- **Lesson prose:** flag-only here.

**Rejected:** none.

## Appendix: the reviewer's reproduction probe (`b98169e2`, Node 24; exit 0, 25 examined, 16 positive)

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

The positives, by family:
- **arpeggios:** A minor, C, F and G major, two octaves, both hands;
- **scales:** A harmonic, melodic and natural minor, one octave similar; C, F and G major one octave similar and contrary; C, F and G major two octaves similar.

## Record

lane: CT1 · closes: — · entry: 231
index: A musical claim grants nothing it cannot support: unsupported claims contained at the shared boundaries, deny by default, and what each rung can still teach (`CT1-every-musical-claim-has-a-checkable-source.md`) | build | drafted 2026-10-03 (`CT1-every-musical-claim-has-a-checkable-source.md`); Entry 231
in-flight: drafted 2026-10-03 (`CT1-every-musical-claim-has-a-checkable-source.md`): version 2, reconciled with the reviewer's replacement; the restrict-never-grant rule at one resolver, the inventory with runtime generation and every mode, four traced cases, containment, the impact report; then the claim contract and the mode checks, in order; supersedes CL10a (Entry 231)
state: with-reviewer 2026-10-03: the owner's prompt for a cloud session, with the outside reviewer before it is pasted (Entry 231)
- held 2026-10-03: Part D would let untaught music through (eligibilityCore.ts:286); being revised with the reviewer's replacement under the rule that uncertainty only restricts
- approved 2026-10-03: version 2 reconciles the owner's direction with the reviewer's review (accepted A to G; three parts run in order in one session: containment, the claim contract, the checks and modes); dispatchable to a cloud session
