# FABLE.md: the operating contract for building the packet (the owner, 2026-10-06)

**Read this file first, every session. It is short on purpose.** It says what governs, what to build next, and what "done" means. Everything else is reference. If this file and an older document disagree, this file wins. If this file and the owner's newest word disagree, the owner wins; edit this file the same day.

## 0. What governs, in order

1. The owner's newest word, then **this file**.
2. `docs/prompts/charter.md`: the ownership gate and the four numbers that only go down.
3. `CLAUDE.md`: house rules, including *Reuse before reinvention*.
4. **Reference only**, for detail, never re-litigated:
   - the packet: `docs/prompts/runs/restart-2026-10-05/Fable_Restart_Packet_2026-10-05_v3.md`;
   - the curriculum review (`docs/prompts/runs/curriculum-review-2026-10-05/`):
     - `ABILITY-MAP.md`: which abilities and which stations;
     - `ORCHESTRATION-CONTRACT.md`: what each chain field means;
     - `MODE-SHEET.md`: what each tool really does and records;
     - `GENERATOR-ADDENDUM.md`: families, jobs A–D, and the sight-reading and music-claim lanes;
     - `INTAKE-GATE.md`: technical admission of a score;
   - the outside reviewer's inputs: `docs/prompts/inputs-2026-10-06/`.

Do not write a new governing document. New instructions from the owner or the reviewer become an **edit to this file**: replace, never append. Keep it under 200 lines. The source text goes in `docs/prompts/inputs-<date>/`.

## 1. The target, and the one number that shows progress

The packet asks for a teaching system, not placed content:

> learner need → musical requirement → best content source → verified for its role → presented with the right tool and scaffold → measured only where measurable → learner model updated honestly → support faded until the learner does it alone.

**Scoreboard:** of the MUST abilities in `ABILITY-MAP.md`, how many are **SHIPPED**? SHIPPED means three things:
- its chain record (§3) passes the checker;
- every step is playable on the owner's phone build;
- the step's acceptance test passed.

Report this number in every handoff, as *shipped / total MUST*. Planning documents, briefs and research do not move it; only shipped chains do.

## 2. Order of work from now (finish one before opening the next, except where marked parallel)

1. **Finish the running builder and land it.** Do not interrupt running work to reformat it.
2. **The chain record and its checker** (§3). Small and narrow; one Sonnet builder. Finish condition:
   - the checker runs in CI;
   - the Bizet chain is the first record and passes;
   - one deliberately broken record fails for each rule.
3. **Ship the Bizet / latin.4 slice end to end** under its rewritten brief (`0ea6ca2d`). This proves the path: source → intake → verified content → chain → app → acceptance. Write down what the path needed and generalise only that.
4. **Packet traceability table** (§8). One Opus pass, then the outside reviewer. Parallel with step 3; it must not block it.
5. **Repeat the proven path, one ability per builder, on disjoint files.** Start with abilities whose real music is already chosen: Blue Bossa (minor ii-V-i), St James Infirmary (jam comping and walking bass), Blues Riff in C (twelve-bar). Then follow the map's cluster priority.
6. **The sight-reading quality lane** (`GENERATOR-ADDENDUM.md` §5), with §5 below replacing its human-reader step.

**Research only when a named next build cannot be written without the answer. Build machinery only when a named current item needs it.**

## 3. The chain record: the teaching design as data the build checks

One file per ability: `docs/chains/<ability-id>.yaml`. The ability id is the one `ABILITY-MAP.md` uses. Field meanings are in `ORCHESTRATION-CONTRACT.md` §1. The record is the contract: a brief for a learner-facing ability points at its record, and a builder builds what the record says.

```yaml
ability: A7c.1                      # id from ABILITY-MAP.md
learner_cannot: ...                 # the deficiency
independent_target: ...             # what they do alone at the end
steps:                              # in teaching order
  - action: ...                     # what the learner does
    content: {kind: generated|excerpt|piece|chart|external|explanation, ref: <family id | CID+bars | file | URL>}
    tool: <a mode or drill named in MODE-SHEET.md>
    scaffold: [ ... ]               # help present on this step
    feedback: ...                   # what the learner is told
    recorded: ...                   # what MODE-SHEET says this tool stores
    cannot_establish: ...           # what that record does not prove
    removes: [ ... ]                # scaffold gone compared with the step before
failure_routes:                     # observed failure → next teaching action
  - {observed: ..., next: ...}
independence_test: ...              # the support-free task
evidence: {updates: [ ... ], self_checked: [ ... ], never_credits: [ ... ]}
generated:                          # one entry per generated family used
  - {family: ..., job: A|B|C|D, contract: <path>, checker: <path>, reference: <path, for jobs B, C-as-music and D>}
status: draft|reviewed|shipped
```

**The checker** (`tools/content/check_chains.py`, run in CI) enforces these rules and nothing else:
- every field is present;
- every `tool` is one MODE-SHEET names;
- every `ref` resolves (file, family id, or CID in a committed source record);
- every step after the first removes at least one scaffold, or carries a one-line reason;
- the last step's scaffold is a strict subset of the first step's;
- `never_credits` is not empty;
- every generated family has its job, contract and checker, and jobs B and D (and C when presented as music) have a `reference` (§5);
- `status: shipped` requires an acceptance-test path that exists.

A brief that names a learner-facing ability without a record that passes is not dispatchable.

## 4. Choosing content: real music and generators are both first-class (the owner, 2026-10-06)

Generators are valuable when they are **verified correct and useful**. Pick by the job, not by preference:
- **Real music wins** when it does the same teaching job: modelling, transfer, style, motivation. Use real excerpts from PDMX, Mutopia or the library, through intake.
- **Generation wins** when the job needs:
  - control: isolate one demand;
  - variation: keys, registers, near-misses;
  - quantity, or material never seen before (sight-reading needs an endless supply);
  - targeting a learner's weakness;
  - availability, because no suitable real material exists.
- **External recommendation** is a legitimate source: a book, a recording, a song to transcribe. Use it where the app cannot hold the material well.
- For a **generated mini-piece** (job D), the default order is real excerpt → simplified arrangement → curated templates → free generation. Skip a step only with a written reason, such as needing many unseen variants.
- Never over-musicalise a technical drill (job A). Precision beats charm there.

## 5. Generated-content quality, with no human judgement (the owner, 2026-10-06)

The owner does not want human judgement as a gate, the owner's or anyone else's ("idk"). Nobody in this process hears music, so nothing may claim to have been heard. Musical quality is earned in two ways, and the claim says which:

**1. Musical by construction.** Anything that promises music (sight-reading, style grooves, mini-pieces) builds from material taken from verified real music. That material is:
- rhythm cells, motif shapes, cadence formulas, harmonic skeletons and accompaniment patterns;
- extracted by script from admitted public-domain repertoire, Beyer, Mutopia or PDMX at the matching level;
- each recorded with its source and bars (`GENERATOR-ADDENDUM.md` §5 step 5 already proposes phrase cells).

The generator chooses and combines. It does not invent the musical grammar from scratch.

**2. Measured against real music of the same level.** For each family that promises music, a reference set of real pieces at that level is the oracle, not a person and not a "musicality score":
- Compute the same objective features on the reference set and on a fixed generated corpus. Use music21 or partitura, never the generator's own read-back. The features:
  - rhythm-motif reuse per four bars;
  - step/leap share;
  - leap recovery;
  - contour reversals;
  - interval-sequence repetition;
  - phrase-end on a stable degree with a longer value;
  - an implied cadence at phrase ends;
  - range and register.
- **Gates:**
  - the generated corpus falls inside the reference set's 10th–90th percentile on every feature;
  - every single item outside the 5th–95th percentile is listed and regenerated;
  - the corpus and its denominator are fixed before the run: seeds chosen in advance, plus boundary and adversarial cases (use Hypothesis to search the parameter space and shrink counterexamples).
- Rerun the same seeds after any generator change, and show that the contract still holds.

**Also required, by job:**
- **All jobs:**
  - the pedagogical contract (what is isolated, what is allowed and forbidden);
  - an independent structural check (partitura events against a contract taken from a source);
  - a near-miss that goes red;
  - automated notation and playability checks (spelling, beaming, range, hand span, ledger lines, accidental churn).
- **C (named style):** add a sourced definition, the sibling near-miss, and voicings and harmony taken from a real model.
- **Outside reviewer (ChatGPT):** reads notation for a declared sample and returns findings as evidence, never as a verdict.

**The only claims allowed:**
- "meets contract X";
- "within the real-music reference for level L on features F, corpus N";
- "unverified as music: not heard".

Never "musically good". The owner playing an item on their phone is welcome feedback, never a gate. This replaces every "human audition" line in the inputs and in `GENERATOR-ADDENDUM.md`.

## 6. Evidence and the learner model

Every chain says, in `evidence`, what updates the learner state, what is self-checked, and what never earns credit (§3). No ability goes green before the learner has done its independence test. A Wait run, a lit chord tone, a looped section or a Lab bed never certifies the target ability (`MODE-SHEET.md`). Where the app cannot observe the target, the task is honest self-check, or the requirement changes. The app never pretends.

## 7. Libraries, before custom code

For every objective fact (spelling, intervals, keys, Roman numerals, voice-leading, events in a file, parameter-space search), choose one per property, and record the choice in the brief:
- **reuse** a library: music21, partitura, musicxml-io, Tonal, Hypothesis, or a constraint solver where it replaces brittle search;
- **compare** two independent witnesses where a disagreement would matter;
- **keep** small custom code, with the reason.

No library is a pedagogy oracle. Do not rewrite working code only to use a library.

## 8. Packet traceability: once, bounded

One Opus pass writes `docs/prompts/PACKET-TRACE.md`:
- a table with one row per operative packet requirement: *requirement | where it is implemented | SATISFIED / PARTIAL / MISSING / DEFERRED BY PACKET | evidence | gap | smallest correction | seam*;
- SATISFIED needs an acceptance test, not a mention in a document;
- the requirement list is in `inputs-2026-10-06/chatgpt-packet-compliance.md`, read under §5 here.

The outside reviewer reviews it. The corrections become chain records or briefs. Then the table is updated by status edits only. There is no second reconciliation.

## 9. Done

- **An ability is done** when its chain record is `shipped` and its independence test has passed in the app.
- **A slice is done** when the owner's phone build shows every step and the handoff names its commit.
- **The curriculum work is done** when three things hold:
  - every MUST ability is shipped;
  - PACKET-TRACE has no MISSING row;
  - the packet's representative learner journey has passed end to end. In that journey:
    - Today explains what and why;
    - the right source is chosen;
    - the activity starts without hunting;
    - the summary says only what was measured;
    - Today, Plan and Progress agree;
    - real-repertoire transfer works;
    - Simon, Lab, Jam and Free Play each serve a distinct, honest purpose.

## 10. How Fable orchestrates

- **Fable decides; builders build; the outside reviewer reads diffs, tests and content.**
- **Briefs:**
  - one brief per ability or seam, citing this file's sections and the chain record;
  - a brief for a learner-facing ability names its chain record;
  - every brief states its finish condition and stop conditions.
- **Model choice:** Opus for design and cross-cutting work; Sonnet for narrow ruled builds and checks; scripts before agents.
- **Builders** work on disjoint files. Each landing is reviewed against its chain record and the scoreboard.
- **The reviewer's verdicts** become record or status edits. They do not trigger new planning rounds.
- **Every handoff** opens with the scoreboard, then what shipped, then what is blocked and on what.
