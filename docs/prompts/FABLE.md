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
- every learner-facing step is reachable/playable in the deployed phone build; objective acceptance is automated rather than assigned to the owner;
- the acceptance path passed; this does not turn the owner into a test harness (the owner's phone use is feedback, never a gate, §5).

Report this number in every handoff, as *shipped / total MUST*. Planning documents, briefs and research do not move it; only shipped chains do.

## 2. Order of work from now (finish one before opening the next, except where marked parallel)

1. **Finish the running builder and land it.** Do not interrupt running work to reformat it.
2. **The chain record and its checker** (§3). Small and narrow; one Sonnet builder. Finish condition:
   - the checker runs in CI;
   - the Bizet chain is the first record and passes as a `draft` (its CID resolves once step 3's intake commits the source);
   - one deliberately broken record fails for each rule.
3. **Ship the Bizet / latin.4 slice end to end** under its rewritten brief (`0ea6ca2d`). This proves the path: source → intake → verified content → chain → app → acceptance. Write down what the path needed and generalise only that.
4. **Packet traceability table** (§8). One Opus pass, then the outside reviewer. Parallel with step 3; it must not block it.
5. **Repeat the proven path, one ability per builder, on disjoint files.** Start with abilities whose real music is already chosen: Blue Bossa (minor ii-V-i), St James Infirmary (jam comping and walking bass), Blues Riff in C (twelve-bar). Then follow the map's cluster priority.
6. **The sight-reading quality lane** (`GENERATOR-ADDENDUM.md` §5), with §5 below replacing its human-reader step: dispatched in parallel with step 3 on disjoint files (the owner, 2026-10-06). After the Bizet slice, the next chain exercises a generator contract (minor ii-V-i or bossa), and a per-cluster skeleton of structure (step pattern, typical fades, failure routes), never a fixed lesson, is extracted from the shipped chain.

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
    tool: <a mode or drill named in MODE-SHEET.md, or lesson: the lesson page, a presentation surface that measures nothing>
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
  - {family: ..., job: CONTROL|SIGHT-READING|NAMED-PATTERN|MUSICAL, presented_as: drill|music, contract: <path>, checker: <path>, musical_properties: {<property>: <how established> | UNKNOWN}}
                                    # every step whose content kind is generated names a family listed here; presented_as: music puts a NAMED-PATTERN under the musical-property rule
status: draft|reviewed|shipped
```

**The checker** (`tools/content/check_chains.py`, run in CI) enforces these rules and nothing else:
- every field is present;
- every `tool` is one MODE-SHEET names;
- every `ref` resolves (file, family id, CID in a committed source record, or a built generated id in `tools/content/generated_ids.json`) once `status` is `reviewed` or `shipped`; a `draft` may hold unresolved refs, and the checker lists them;
- every step after the first removes at least one scaffold, or carries a one-line reason;
- the last step's scaffold is a strict subset of the first step's;
- `never_credits` is not empty;
- every generated family has its job, contract and checker, and every generated step's family is listed; SIGHT-READING, MUSICAL and NAMED-PATTERN with `presented_as: music` list their musical properties, each with how it is established or UNKNOWN (§5); a mechanical CONTROL lists none;
- `status: shipped` requires an acceptance-test path that exists, and an `acceptance_journey` browser spec under `app/tests/e2e/` carrying the exact line `// acceptance-ability: <ability id>`.

A brief that names a learner-facing ability without a record that passes is not dispatchable.

**Brief headings.** Every major curriculum brief also carries three headings, taken from its record:
- **Instructional chain**: learner action | content source | tool/mode | scaffold | feedback | evidence | next support removed.
- **Failure route**: failure | smallest useful change in teaching strategy.
- **Independence test**: what the learner eventually does without the original scaffold.

A brief that creates, changes or newly relies on generated content adds a **Generated content** block. It names:
- the job: CONTROL, SIGHT-READING, NAMED-PATTERN or MUSICAL;
- the learner demand isolated;
- what varies and what stays fixed;
- the musical properties required;
- the libraries and verifiers used;
- the adversarial and boundary cases;
- the review denominator;
- where the learner transfers out of generation.

A major curriculum brief declares itself with one line, `ability: <id>`; the checker's brief lint reads every brief that carries it and rejects one missing these headings or whose record does not pass. Tiny wording or truth fixes carry no marker and none of this.

## 4. Choosing content: generated material is a first-class source (the owner, 2026-10-06)

Ask **which source teaches this learner need best**, never "can generation be avoided?" Generated is not inferior, and real is not automatically better.
- **Generated CONTROL** when precise isolation or variation is useful.
- **Generated SIGHT-READING** because unseen material is intrinsic to the skill.
- **Generated NAMED-PATTERN** when an exact sourced contract can be produced reliably (habanera, bossa, guajeo, walking bass).
- **Generated MUSICAL** material when its musical structure can be specified and verified well enough (§5).
- **Real excerpt or full piece** when authentic transfer or integration is the better job.
- **External material** (a book, a recording, a song to transcribe) when that is genuinely best.

Never over-musicalise a deliberately mechanical drill: a scale, a bare habanera cell, a ii-V-i shell. It should be clean, accurate, playable, varied where useful and efficient. **Experience variety** (the owner, 2026-10-06, `inputs-2026-10-06/owner-experience-variety.md`): choose the tool or mode because it is the best learner action for that step, never because Score is the easiest path; across the MUST abilities Simon, Lab, Jam, Free Play, Duet and one-hand work, hearing, Rhythm only, generated CONTROL and generated musical material, excerpts, full repertoire, chord charts and improvisation each get real teaching use where they fit, none credited for evidence it cannot establish; no quota and no mode count; the chain records are the experience map, reviewed for accidental monoculture at cluster boundaries and in the final learner journey.

## 5. Generated-content quality, with no human judgement (the owner, 2026-10-06)

The owner does not want human judgement as a gate, the owner's or anyone else's ("idk"). Nobody in this process hears music, so nothing may claim to have been heard. A generated output passes because its required properties are **established**, not because somebody likes it.

**The musical contract.** Where it applies, the brief names the required musical properties: phrase structure; motive, repetition and variation; harmonic skeleton and function; cadence and closure; melodic contour; the accompaniment's relationship to the melody; voice leading; register and spacing; the stylistic pattern; playable hand distribution. Each one is checked with a library (§7), against a sourced contract, or against real music (method 2 below).

**UNKNOWN is a legal answer.** If an important property cannot be established objectively, mark it UNKNOWN, then do one of three things: narrow the claim or the job; switch to a more verifiable generation strategy (a template, real-derived cells); or choose another content source. Never fill an UNKNOWN with taste.

Two methods are recommended, and the claim names the one used.

**1. Musical by construction.** Material that promises music can be built from cells taken from verified real music, where that is the more verifiable strategy. Those cells are:
- rhythm cells, motif shapes, cadence formulas, harmonic skeletons and accompaniment patterns;
- extracted by script from verified real repertoire or corpora at the appropriate level (Beyer, Mutopia, PDMX, the admitted library), with source and bars recorded; rights or export status is never a generator-quality input;
- each recorded with its source and bars (`GENERATOR-ADDENDUM.md` §5 step 5 already proposes phrase cells).

The generator chooses and combines. Other construction (templates, constraint solving) is fine when its properties are verified.

**2. Measured against real music of the same level.** For each family that promises music, a reference set of real pieces at that level is the oracle, not a person and not a "musicality score":
- Compute the same objective features on the reference set and on a fixed generated corpus, with music21 or partitura, never the generator's own read-back. The features: rhythm-motif reuse per four bars; step/leap share; leap recovery; contour reversals; interval-sequence repetition; phrase-end on a stable degree with a longer value; implied cadence at phrase ends; range and register.
- **Use:** the reference distributions are evidence and regression diagnostics, never automatic gates. A hard bound on a feature is allowed only when a cited source justifies it, or a calibration fixture shows it keeps declared real cases and rejects declared counterexamples; Hypothesis may search the parameter space and shrink violations of the resulting contract.
- The corpus and its denominator are fixed before the run: seeds chosen in advance, plus boundary and adversarial cases. Rerun the same seeds after any generator change, and show that the contract still holds.

**Also required, by job:**
- **All jobs:** the pedagogical contract (what is isolated, allowed, forbidden; the difficulty envelope); an independent check by representation: a MusicXML file through partitura, musicxml-io or another event reader independent of the generator; runtime theory or harmony objects through music21, Tonal or another independent theory witness; a parameter space through Hypothesis or property tests; a sourced near-miss where a named structural or style claim needs one, and it goes red; the brief records why the chosen witness is independent enough for that property; automated notation and playability checks (spelling, beaming, range, hand span, ledger lines, accidental churn).
- **NAMED-PATTERN:** a sourced definition and the sibling near-miss; voicing and harmony checked like any musical property.
- **Outside reviewer (ChatGPT):** reads notation for a declared sample and returns findings as evidence, never as a verdict.

**The only claims allowed:** "meets contract X"; "property P established by Q"; "within the real-music reference for level L on features F, corpus N"; "P is UNKNOWN"; "not heard".

Never "musically good". The owner playing an item on their phone is welcome feedback, never a gate. This replaces every "human audition" line in the inputs and in `GENERATOR-ADDENDUM.md`.

## 6. Evidence and the learner model

Every chain says, in `evidence`, what updates the learner state, what is self-checked, and what never earns credit (§3). No ability goes green before the learner has done its independence test, and the summary and Progress never present a green rung as the ability where the independence test is self-checked (the owner, 2026-10-06). A Wait run, a lit chord tone, a looped section or a Lab bed never certifies the target ability (`MODE-SHEET.md`). Where the app cannot observe the target, the task is honest self-check, or the requirement changes. The app never pretends. A reviewer may decide teaching use and placement from verified content facts and the chain's stated role; this is not a musical-quality claim, and reviewer identity alone is never evidence. No word or reading-time limit on a lesson (the owner, 2026-10-06): length never outranks accuracy and communication. **Enforcement of the existing addressee rule:** do not assign the owner objective validation work; learner/owner instructions use current UI language and must be actionable by their actual addressee.

## 7. Libraries, before custom code

For every objective fact (spelling, intervals, keys, Roman numerals, voice-leading, events in a file, parameter-space search), choose one per property, and record the choice in the brief:
- **reuse** a library: music21, partitura, musicxml-io, Tonal, Hypothesis, or a constraint solver where it replaces brittle search;
- **compare** two independent witnesses where a disagreement would matter;
- **keep** small custom code, with the reason.

No library is a pedagogy oracle. Do not rewrite working code only to use a library.

## 8. Packet traceability: once, bounded

One Opus pass writes `docs/prompts/PACKET-TRACE.md`:
- a table with one row per operative packet requirement: *ability or family | requirement | where implemented | SATISFIED / PARTIAL / MISSING / DEFERRED BY PACKET | concrete failure | smallest correction | enforcement check*;
- SATISFIED needs an acceptance test, not a mention in a document;
- the requirement list is in `inputs-2026-10-06/chatgpt-packet-compliance.md`, read under §4–§5 here. No essay.

The outside reviewer reviews it. The corrections become chain records or briefs. Then the table is updated by status edits only. There is no second reconciliation.

## 9. Done

- **An ability is development-done** when its chain record is `shipped`, its independence task is present in the app and its learner-facing acceptance path has been exercised: a measurable independence test has its evidence behaviour tested; a self-checked one has the app expose and record only the permitted self-check and award no unsupported skill evidence. An unobservable musical ability is never required to "pass in the app".
- **A slice is done** when learner-facing acceptance proves the steps on the deployed/build-equivalent app; “phone build” never means an owner manual-QA gate.
- **The curriculum work is done** when three things hold:
  - every MUST ability is shipped;
  - every operative PACKET-TRACE row is SATISFIED or explicitly DEFERRED (by the packet or the owner); PARTIAL is an in-progress state, never a final one (the owner, 2026-10-06);
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
- **Review before building for a design decision; a narrow seam may land before its artefact review** only when all hold (the owner and the reviewer, 2026-10-06): its design decision and semantic boundary were already reviewed; it adds no product rule, schema meaning or inference; red-first tests pin the exact defect; its blast radius is declared in advance; a before-and-after differential proves no unrelated behaviour changed; an unexpected change is a stop, never explained after landing. New inference rules, schemas, authority or broad migrations are reviewed before building.
- **Every handoff** opens with the scoreboard and PACKET-TRACE's PARTIAL and MISSING counts, then what shipped, then what is blocked and on what; before asking the owner for anything, apply `CLAUDE.md`'s addressee rule and remove work the builders/tests/reviewer can do.
- **An app capability gap becomes app work** when two chains need it or it is plainly app-wide; otherwise it stays recorded (the owner, 2026-10-06).
