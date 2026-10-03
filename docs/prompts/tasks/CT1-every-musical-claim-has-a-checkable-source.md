# CT1 — every musical claim the app makes has a source that can be checked, and nothing unchecked teaches, gates or counts as evidence (a design and build; the content-truth lane)

> **HELD, 2026-10-03: do not run this brief.** Part D is flawed. Taking the judgement demands out of every gate would let untaught music through: `eligibilityCore.ts:286` refuses an item whose demands are untaught. The rule must be that uncertainty may only restrict, never grant. This brief is being revised together with the outside reviewer's replacement.

You are working in the piano-teaching PWA in this repository. A small team of AI agents builds it; the owner directs it. **Read `CLAUDE.md` first, then `docs/prompts/operating-procedure.md` §11–§14.** They are the house rules, and every one applies to you.

## The problem, in one paragraph

The app tells a learner what each piece and exercise teaches ("this rung's music establishes a walking bass"). It uses those claims to choose music, to gate what is offered, and to count a run as evidence of a skill. Many of the claims come from code that reads the notation: 19 detectors in `app/src/demands/detect.ts`, run over every score by the content build. Some detectors read plain notation facts. Others encode a musical judgement, and nobody in this process can verify such a judgement. Every agent here, the orchestrator and the outside reviewer included, can read notation but cannot hear music. On 2026-10-02/03, lane CL10a widened one judgement rule from "every bar" to "three quarters of the bars". The corpus diff then showed two-hand scales, Hanon, arpeggios and chromatic scales (180 + 20 + 48 + 8 items) reading as "a left-hand accompaniment pattern under a tune". A trained musician would never say that. The builder's own tests had all passed; an oracle set chosen by someone else caught it. The owner's question is: *where does it end?*

**It ends here.** The app may only assert, gate on, or count as evidence a musical claim whose source can be checked:
- **a notation fact**, which a test can verify mechanically against the score;
- **a human decision**, recorded with who and when.

Everything else is unverified. Unverified claims are never learner-facing truth, never a gate and never evidence.

## SETTLED (the owner's direction, 2026-10-03; do not re-argue)

1. **Shrink what the app claims; do not make judgement detectors cleverer.** No new heuristic, threshold or classifier for a musical judgement in this lane.
2. **Notation facts stay measured.** Clef, ledger lines, steps, skips, leaps, eighths, notes shorter than a quarter, sixteenths, dotted quarters, ties, triplets, compound metre, key signature and chromatic notes are facts. They keep their detectors, now proven against an independent implementation (below).
3. **The judgement detectors are demoted:** `leftHandPattern`, `walkingBass`, `handsTogether`, `syncopation`, `beyondPosition`. They may remain as internal hints. They stop deciding anything a learner sees, anything that gates material, and anything counted as evidence. If you find another detector that encodes a judgement, treat it the same way and say why.
4. **A judgement claim stands only on a recorded human decision.** The record already exists: `content/review/decisions.jsonl` (4 rows today), written through the dev microscope (`app/src/ui/screens/DevMicroscopeScreen.ts`). Reuse it; do not invent a second record.
5. **The rungs are curated by hand.** A rung's lesson may still teach a texture in words. What changes is that no piece *establishes* that texture for the app unless a human has decided it.
6. **Never teach wrong** (`docs/00-invariants.md`): correctness outranks coverage. A rung that loses a measured claim is acceptable. A false claim is not.

## Your branch and the rules of this repository

- **Branch:** create `claude/content-truth` from the current head of `claude/piano-teaching-app-bo19td`, and write that base's full sha in your entry. Push only to `claude/content-truth`.
  - Never push to `claude/piano-teaching-app-bo19td`: every push there deploys to the owner's phone.
  - Never merge anything, never touch PR #1, never force-push.
  - The orchestrator lands your branch.
- **Never name an AI model** in any file, commit message or trailer.
- **No number measured on one machine stated as general.**
- **Nothing in this process can hear music.** Say *unverified as music* where that applies, and leave any judgement that needs an ear open.
- **Lanes in flight on other branches. Do not edit their files:**
  - CL12a (`chatgpt/cl12a`): `app/src/curriculum/session.ts`, `sessionPurpose.ts`, `app/src/data/sessionRun.ts`, `app/src/ui/screens/TodayScreen.ts`, `PlanScreen.ts`, `app/src/ui/help.ts`.
  - If your change truly needs one of them, stop and say so.
- **CL10a is superseded by this lane.** Read its record: `docs/prompts/runs/CL10a/` holds the checks files, the corpus diff, `research-texture.md` and `oracle.md`. The branch is `chatgpt/cl10a`, implementation `ce47aef2`.
  - You may reuse its notation work: the clef per staff and change, the key in force per bar, the pickup handling, the metre read for simple time.
  - Do not reuse its share rule or any texture rule.
  - Reused code must keep CL10a's tests for those parts and add your oracle below.

## Environment

The cloud session clones the repository. Set up as CI does (`.github/workflows/ci.yml`):

```sh
pip install -r tools/content/requirements.txt
cd app && npm ci && cd ..
python3 tools/content/build.py          # not --offline: it fetches the score library the build needs
```

Then the checks: `python3 tools/content/validate.py --allow-nc --personal`, `python3 -m unittest discover -s tools/content/tests -t tools/content`, and from `app/`: `npx tsc -b` (never `tsc --noEmit -p`; it checks nothing), `npm run lint`, `npx vitest run`. If browsers are available, run Playwright with `--workers=2` and one suite at a time. If they are not, say so: the orchestrator runs the browser specs and captures the pictures.

**Built-content caveat:** tests that read lessons read the *built* content, so rebuild before vitest after any content change. If a step cannot run in this environment, say exactly which and why; never report it as passed.

## What to do

### Part A: the inventory of claims (before any change)

Every musical claim the app makes or uses: what it says, its source, and who reads it. Look at least at these:
- detector demands (`detect.ts`, `tools/content/demands.py`, the build's `attach_demands`);
- rung claims and needs-versus-taught (`tools/content/claims.py`, `validate.py`, `untaught_options.py`, `rung_audit.py`, `content/curriculum/stage-*.json`, `content/curriculum/vocabulary/demands.json`, `skills.json`);
- evidence and eligibility (`app/src/evidence/rungState.ts`, `evidence.ts`, `app/src/curriculum/eligibility.ts`, `candidates.ts`, `eligibilityCore.ts`, `transfer.ts`, `skillActivation.ts`; and `docs/design/evidence-truth.md`, which is approved);
- generated families' teaching claims (`tools/content/generate_exercises.py`, `family_contracts.json`, `study.py`, `excerpts.py`);
- imported scores' metadata (title, composer, style, key, tempo, level);
- lesson prose (`content/lessons/*.md`, 109 files) and the help text;
- the level scalar. Inventory it only: CL17 owns it (`docs/design/one-level.md`). Do not change it.

Class every claim by its source:
- **MEASURED-FACT:** a notation fact a test can verify.
- **MEASURED-JUDGEMENT:** a detector deciding a musical judgement.
- **DECIDED:** a recorded human decision.
- **AUTHORED:** written by an author or generator with no check. Name who wrote it if the record says.
- **UNKNOWN.**

For each, give the readers: is it shown to a learner, does it gate, does it count as evidence.

Write `docs/prompts/runs/CT1/inventory.md`, with the search commands that produced it, runnable, so a reader can rerun them. Count by class.

### Part B: the provenance model and its enforcement

- **`docs/design/content-truth.md`** defines the three states a claim may have: measured fact, decided, unverified. It defines what each may do: be learner-facing truth, gate, count as evidence. It also defines how a claim moves from unverified to decided (the microscope and `decisions.jsonl`, with who and when).
- **One validator rule set**, in the build or `validate.py` where the existing rules live. It **fails the build** when:
  - an unverified or judgement claim feeds a gate, evidence or a learner-facing *teaches/establishes* statement;
  - a new demand or claim kind is added without a declared class;
  - a generated family declares a teaching claim that is not a measured fact or decided.
- **The runtime readers** (eligibility, evidence, the Skills screen's states, rung claims) read only measured facts and decided claims. The evidence semantics change, so bump `EVIDENCE_DEFINITIONS` with one recompute, as CL11b did. Name it.

### Part C: prove the notation facts with an independent oracle

A detector cannot be proven by tests written by the same reasoning that wrote it (`operating-procedure.md` §12: a builder's own tests prove intent, not correctness).

- **Build a second, independent reading** of the notation facts straight from the MusicXML, in Python. `music21` 10.5.0 is already in `tools/content/requirements.txt` (the converter and the generator use it); keep the oracle's code apart from both. Do not port `detect.ts`. The build reads the TypeScript detectors through E0's bridge, so a Python reading is a genuinely second implementation.
- **Compare the two on every catalogue item**, for every notation-fact demand. Publish the disagreements in `docs/prompts/runs/CT1/notation-diff.*`, and resolve each one by reading that score.
- **Add a test** that keeps the two in agreement, or records each accepted difference with its reason.

### Part D: demote the judgement detectors, and the consequences, itemised

- **Demote them:** remove `leftHandPattern`, `walkingBass`, `handsTogether`, `syncopation` and `beyondPosition` from every gate, evidence count and learner-facing claim, except where a decided record supports a specific item.
- **Run the corpus before and after.** Itemise every change:
  - every rung claim lost or kept;
  - every option no longer offered;
  - every learner-facing sentence changed (where, before, after, why);
  - every pin moved.
- **Lessons:** a rung whose lesson teaches one of these textures keeps its lesson. List those rungs. They are the first candidates for human decisions.
- **Stop for the owner if** a rung would be left with no playable option, or a learner would lose access to music they had before.

### Part E: the human checklist, so the loop closes with a musician, not another AI

Write `docs/review/musician-checklist.md`: what a piano teacher checks in about an hour.

- **The sample:** the judgement claims the curriculum most relies on. Pick them from Part D's rung list and give the reason for each pick.
- **Per item:** the piece, the bars, what the app would claim, and the yes/no or short answer needed.
- **The answers' route:** they go into `decisions.jsonl` through the microscope, or a documented import. Say which, and make it work.

Nobody in this process can do this check. Write it so the owner can hand it to a musician.

### Part F: so future content cannot diverge again

Write the rules where every consumer reads them (`operating-procedure.md`, and the content tools' README if there is one), and enforce each with the validator where it can be enforced. Consider at least these sources of future divergence, and say for each what stops it:

1. **A new detector or demand.** It needs a declared class. A judgement class needs:
   - a research note (`docs/prompts/runs/CL10a/research-texture.md` is the model);
   - an oracle set of real items picked by someone other than its builder;
   - decided records before it gates anything.
2. **A generator family's claims** (`family_contracts.json`): it claims only measured facts, and *teaches X* for a judgement needs a decision.
3. **Imported metadata** (PDMX, kern, MuseTrainer, Mutopia): title, composer, key, tempo, level, style and excerpt ranges are AUTHORED. Say which ones a learner sees, and which are cross-checked against the notation (key, tempo).
4. **Lesson prose** making a claim about specific music (*this piece uses an Alberti bass*, a note name, a chord name). Find whether such sentences exist. Say what checks them: a structured claim the validator reads, or the musician checklist.
5. **Fingering** (G30: printed only where sourced).
6. **Chord symbols and roman numerals** in lead sheets and drills, checked against the sounding notes.
7. **Note names and spelling** (*never a wrong note name*).
8. **Model-written content in future**, such as tips and lesson drafts: it is AUTHORED until a decision.

## Done when

- Parts A to F exist. The validator rules are in the build, and each new rule has a red-first test: a case that fails before the rule exists.
- The notation oracle runs on the whole catalogue, with its disagreements resolved or recorded.
- The judgement detectors gate nothing, and the corpus before/after is itemised.
- `EVIDENCE_DEFINITIONS` is bumped with its recompute.
- Every check in *Environment* has run, with its exit code recorded. The browser specs touching the Skills screen or the rung claims are named for the orchestrator if you cannot run them.
- These docs are updated in the same change:
  - `docs/08-test-map.md`;
  - `docs/04-ui-spec.md`, where learner-facing words change;
  - `docs/02-curriculum.md`, where the curriculum's claims change;
  - `docs/prompts/checks.json`, if a new browser spec imports a shared helper.
- `docs/prompts/runs/CT1/ENTRY.md` begins `### Entry 231 — CT1`. It holds:
  - the judgement first: what a learner meets now;
  - the counts by class, before and after;
  - the mechanism, with file and line;
  - the cases;
  - the itemised changes;
  - what you did not do and why;
  - where this brief was wrong;
  - the base sha.

**Stop and hand back** (state the options and what a learner meets under each) if:
- a change needs a product or pedagogy choice not written down;
- a rung would lose all its playable music;
- a stored-schema change goes beyond the evidence-definitions bump;
- the in-flight lane's files are in the way.

## Before reporting, the checklist (`CLAUDE.md`; answer each in your entry)

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

## Reply when done

Reply with:
- the branch head sha;
- the judgement in three sentences;
- the counts by class, before and after;
- what the musician checklist asks;
- what you could not run.

Commit at each stopping point. Push to `claude/content-truth` only.

## Record

lane: CT1 · closes: — · entry: 231
index: Every musical claim has a source that can be checked; nothing unchecked teaches, gates or counts as evidence: the content-truth lane (`CT1-every-musical-claim-has-a-checkable-source.md`) | build | drafted 2026-10-03 (`CT1-every-musical-claim-has-a-checkable-source.md`); Entry 231
in-flight: drafted 2026-10-03 (`CT1-every-musical-claim-has-a-checkable-source.md`): the owner's direction; claims classed by source, judgement detectors demoted, notation facts proven against an independent reading, a musician checklist, rules for future content; supersedes CL10a (Entry 231)
state: with-reviewer 2026-10-03: the owner's prompt for a cloud session, with the outside reviewer before it is pasted (Entry 231)
- held 2026-10-03: Part D would let untaught music through (eligibilityCore.ts:286); being revised with the reviewer's replacement under the rule that uncertainty only restricts
