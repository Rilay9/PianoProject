# Reviewer response — first convergence checkpoint at `53670d2a`

## Overall verdict

**APPROVE THE CONVERGENCE MAP AS THE NEW PLANNING/SCHEDULING VIEW, WITH THE PRIORITY, SCOPE AND DECISION AMENDMENTS BELOW.**

This pass did the job it was supposed to do. The project no longer has a useful interpretation in which “343 open P0–P2 rows” means “343 remaining tasks.” The map has separated historical residue, duplicates, reads, decisions, buildable defects and final-validation work into current clusters.

The corrected statement of remaining work is therefore:

- **0 genuine open P0s** at this checkpoint;
- **25 clusters + 12 singles** as the planning units, not 343 row-sized seams;
- only **26 rows currently labelled BUILD NOW**, many of which belong together;
- **78 RE-CHECK** rows whose disposition may collapse after current lanes;
- substantial READ/DECISION work that should be resolved in batches, not one owner/reviewer interruption per row.

Do **not** convert these counts into a “percent done.” They are different kinds and sizes of work. Re-estimate only after the current in-flight lanes land and the RE-CHECK population is collapsed.

The backlog remains the historical/control record. The convergence map is now the current scheduler.

---

# 1. Corrections to the cluster plan

## 1.1 CL06 is not a core-teaching implementation lane

Move **CL06 — Outcome tests** out of the Tier-1 product queue and treat it as **early H1/tooling work that may run opportunistically**.

The remaining Q2 fault is specifically that some tests can be false oracles; the convergence pass found **no known product defect hidden behind them**. That makes the tests important, but not more learner-critical than actual evidence, scoring, reading or session defects.

Rule:

- revise a proxy test immediately when its owning product seam is touched;
- Q21/Q23 may run in a cheap tooling slot;
- the U32-dependent window half follows U32;
- do not consume a primary product builder solely because the row says BUILD NOW.

If a mutant exposes a real current product defect, that defect becomes a product seam at the owning boundary.

## 1.2 CL01/CL02/CL03 are correctness groups, not a forced serial prefix

Keep them labelled high consequence, but **do not block unrelated Tier-1 work until every source/ear read inside them is complete**.

Examples:

- CL01’s buildable lesson corrections can proceed while the T54 pianist packet is pending.
- CL02’s unsourced-fingering policy can be decided now, while Q57/I9 musical reads happen separately.
- E50/X40 may proceed under their approved lane contracts without waiting for the full R27 AT-5 corpus audit.

A cluster is an ownership/planning unit, not permission to recreate stop-the-world waves.

## 1.3 Rename the large “X2” seam to avoid a real naming collision

The map currently has:

- backlog **X2** in CL14 (Plan / you-are-here map), and
- the old large-wave label **X2** attached to CL21 (performance experience + ear training).

Do not use the same name for both going forward.

Keep **X2** as the actual backlog row in CL14. Refer to CL21 as **Performance + ear experience** (or another unambiguous cluster name). Historical docs may retain their old label, but new briefs/records should not say merely “X2” for CL21.

## 1.4 CL18 does not own a Pages workflow change by default

Q78/repertoire supply should use the existing public-content/deploy pipeline. `.github/workflows/pages.yml` is not automatically an owned file merely because the content ships through Pages.

If CL18 discovers an actual workflow defect, stop and review that as a workflow change. Otherwise remove `pages.yml` from the expected implementation surface.

## 1.5 E50a is no longer a wait

At this checkpoint’s branch head, E50a has landed, including the cross-platform ZIP normalization and the deliberate historical identities.

Therefore immediately re-check every row that was waiting **only** on E50a before drafting another lane. In particular:

- CL23’s L53/L69;
- CL17’s E50a-dependent `types.ts` decisions;
- G71’s E50a dependency in CL11;
- any identity-related RE-CHECK whose only blocker was E50a.

Do not carry a stale “waits on E50a” forward merely because the triagers read an earlier tree.

---

# 2. Confirm the large-cluster scope

**CONFIRMED, with the naming correction above:**

- **G3 = CL14**: learner direction, goals, return and post-ladder composition.
- **G4 = CL20**: breadth and musicianship strands.
- **F3 remainder = CL01 + CL19**: truth/source cleanup plus the deeper lesson contract.
- **F4 = CL02**: rock/Latin/fingering policy and its musical reads.
- **H1 = CL24** and **H2 = CL25**.
- **CL21 = Performance + ear experience**, not “X2” in new records.

This is a coherent split. Do not recreate the old waves beside these clusters as a second queue.

---

# 3. Product/architecture decisions that can be made now

These should stop generating one-off reviewer questions.

## Generated content and fingering

### G30 — unsourced fingering

**Print no fingering until it has an explicit defensible source/policy.**

A generated fingering is a teaching claim. “Probably right” is not enough. One bounded pianist review may establish reusable pattern policies, after which those policies can be encoded and cited. Until then, absence is better than authoritative-looking invention.

### G71 — drill prompt as familiarity

**No, not by default.** A card prompt is not material familiarity merely because sound was emitted.

Count familiarity only when the learner was exposed to an identifiable musical material/context at a meaningful scope. A tiny prompt may be an observation/event of its own, but it must not silently make a repertoire item familiar.

If no current consumer needs a distinct “prompt heard” fact, retire the row rather than manufacturing one.

### G80 — another cut/arrangement as independent context

**Sometimes, based on relationship and material difference, never merely because the identity differs.**

A substantially different section/arrangement/context can provide transfer evidence. A duplicate copy or trivially shifted excerpt cannot. Use the relationship/material-demand truth already built rather than an identity-count rule.

## Evidence and reading

### L22 — purpose → experience → material

**Approve this order.** The session decides the learner purpose first, chooses an experience contract that can serve it, then chooses eligible material. Material must not retroactively define the purpose.

### L23 — continuity

**Continuity may be a measured performance skill**, based on observable stops/restarts/hesitation/flow, provided its measurement is explicitly separate from pitch/timing correctness.

Do not infer an internal psychological construct. The skill is “maintains musical continuity under the defined task,” not “confidence.”

### L47 — grace-note timing

**Keep grace-note execution unjudged for timing unless a task has an explicit, musically defensible timing model for that ornament.** Preserve pitch/occurrence facts where measurable. Do not invent one global millisecond target for expressive ornaments.

### L57 — support thresholds

**Move semantic support thresholds into the versioned skill/definition truth when they define what counts as evidence.** UI/performance constants stay code. A number that changes whether a learner has demonstrated a skill belongs with the definition stamp, not as an invisible magic constant.

### L58 — note names on the ribbon

**A supported read with note names visible does not establish the same independent-reading evidence as a names-off read.** It may count as supported/coped-with practice. If the rung requires unaided note reading, names-off is required for that evidence.

### L90 — prerequisites

Use a semantic split:

- skill/demand readiness when the prerequisite is an ability or notational demand;
- experience prerequisite when the sequence genuinely requires prior encounter/activity;
- never encode “did lesson X” merely as a proxy for ability when evidence can name the ability.

### L91 — practice strategies after Stage 1

**Yes: return them as interventions when observed difficulty makes one relevant.** Do not make the learner retake generic practice-strategy lessons on a calendar. Preserve the strategy’s explanation and exit criterion.

### L92 — after the ladder

**Project/repertoire/goal driven; no hidden Stage 10.** The authored ladder can finish while the teacher continues indefinitely through projects, repertoire, maintenance, exploration and learner goals.

### L105 — coping gate and recent misses

**Do not put transient recent-miss logic into the eligibility/coping gate.** The gate answers whether the material is supportable/eligible from taught/readiness truth. The ladder/composer uses recent evidence and misses to decide whether it is wise *now*.

This avoids a circular gate whose eligibility changes because the learner just failed the thing it was deciding whether they could encounter.

## Lessons

### T11 — schema first or prose first

**Adopt the teaching-plan schema first, then migrate/rewrite prose against it.**

The schema should express the minimum durable teaching contract, not generate robotic prose: concept/purpose, notice/perception cue, activity/use, success/evidence cue, and after-miss/help where applicable.

Then T1/T3/T5/T6/T7/T8/T10/T17 become one migration/audit under that contract instead of nine independent stylistic arguments.

Do not make every lesson use identical visible headings. The schema is underlying teaching truth; presentation may vary.

### T22 — earTune direction

**Keep memory training, but name it honestly as memory and place it inside a broader tonal-hearing progression.**

Progression should move from short remembered patterns toward scale-degree/function, bass motion, phrase prediction, singing/playing back, transcription and repertoire application. Interval-song mnemonics and Simon-like memory tasks are tools, not the endpoint.

## Repertoire / analysis

### R3 — ornament truth

**Add explicit ornament/grace demands where the curriculum treats them as something the learner must read/execute.** Do not hide them only inside a scalar difficulty model. The level model may consume those demands; it is not their source of truth.

### R12 — rung prose vs per-piece notes

**Rung prose teaches the transferable concept; piece-specific observations live with the piece/material.** Do not rewrite a rung so every sentence happens to fit whichever piece is currently bundled.

A lesson may call out a piece as an example, but the concept must survive swapping repertoire.

### R22 / R46 — breadth

**Yes to balancing exposure, as a soft composition objective rather than a rigid quota.**

Start with dimensions the system can state honestly: style/idiom label where curated, metre, key/tonal area, texture/hand role, repertoire vs generated, and experience purpose. Do not manufacture a pseudo-objective diversity score from weak genre metadata.

The composer should avoid pathological repetition and seek breadth over time; a pedagogically necessary run of related work can temporarily override balance with a recorded reason.

### R47 — return/re-entry

Use a **short calibration/re-entry experience**, not an automatic demotion and not a full placement test. It writes fresh observations/evidence under today’s definitions while retaining historical mastery/contact. The composer decides subsequent work from both the history and fresh evidence.

## Score/readability

### U5/U77 — look-ahead in sizing

**Yes. Look-ahead is part of the sizing objective.** The order remains:

1. no distortion;
2. current music comfortably readable;
3. useful next music visible;
4. requested bar count when compatible.

Do not sacrifice comfortable staff size merely to satisfy a numeric bars request.

### U33/U78 — numeric floor

**The owner already delegated this to the window-rule evidence.** The reviewer decides from U32’s gallery/device pictures, not from an abstract number now.

Test a small number of candidate floors on the real target widths. Choose the lowest value that remains comfortably readable while materially improving useful look-ahead. One number may differ by device class if the evidence genuinely requires it; do not create a large breakpoint table.

### U50 — “Not judged” lines

Keep **Not judged** where omitting it would make the learner reasonably infer that a visible/important dimension was measured. Do not print a list of every irrelevant dimension that happened not to be measured.

The principle is explanatory honesty, not maximal status output.

## Long-horizon teacher

### I18 — audiation

**Internal audiation itself is not observable evidence.** The app can teach/prompt it, then measure an external response (sing, play, predict, choose, continue, transcribe) that the task explicitly defines. Do not store “audiation passed” merely because the learner sat through an instruction.

### I20 — goals

A goal is a learner/project scheduling fact: target material/experience, optional deadline/frequency, and importance. It influences what the composer offers and when. **It never changes skill evidence, difficulty truth or mastery directly.**

### I21 — calibration trigger

Calibration is appropriate after a long gap, contradictory/stale evidence, or a request/goal that reaches materially beyond what recent evidence covers. Sample the smallest set of domains needed to reduce uncertainty; do not rerun full placement by default.

## Session episodes

### X19 — episode lifetime

An episode is a **bounded practice-purpose context**, capable of surviving navigation/reload if the learner is still pursuing it, but it ends on explicit completion/abandonment, a changed purpose, or a reasonable stale boundary. It is not the whole session and not permanent learner state.

Persist only what is necessary to resume the episode’s purpose and exit criterion; observations/evidence remain in their own stores.

---

# 4. Owner decisions

## I3 — familiar vs exploratory ratio

Use **70/30 familiar-to-exploratory as the default soft target, not a quota**.

Allow the composer to move within roughly a 60–80% familiar band when there is a reason: a new learner may need more exploration/diagnosis; a learner preparing a project/performance may need more familiar/application work; a stale domain may need a calibration sample.

Never force an exploratory item merely to satisfy the ratio when nothing appropriate is eligible, and never suppress a needed new experience because today’s arithmetic is already at 30%.

Record this as an objective/tie-breaker over a rolling horizon, not per-session mandatory arithmetic.

## I5 — public vs personal build on the phone

**Keep the normal phone/deployed product on the strict/public build.**

Reason: the project is open source, the public build is reproducible and redistributable, and Q76/Q88 have already moved the product toward honest public-content behavior. The personal/private route remains available for the owner’s imported or non-redistributable material, but it should not become the canonical product whose curriculum silently depends on files another user cannot receive.

A personal import may enrich the owner’s library without redefining what the public curriculum promises.

---

# 5. Technical decisions the orchestrator need not bring back

These have no meaningful owner product choice if kept inside the stated boundaries.

- **E1:** no live defect -> do not build a seam now. Fix when a real mutation/config failure demonstrates need.
- **G6:** table/model-derived level is a distinct **derived/computed** source, not “judged.” Human judgement remains its own source.
- **G12:** curriculum `concepts` should contain validated curriculum concept ids. Descriptive/search/style tags belong in a distinct metadata/tag field. Do not leave one ambiguous field carrying both contracts.
- **G13:** ownership starts in the family/recipe contract, with `generate_exercises.py` implementing it. Do not make one giant generator function the semantic owner.
- **L51/L99:** prefer one explicit retention/compaction policy: preserve semantic aggregates/evidence/rung truth indefinitely as required; bound raw run/session detail only after a tested semantic witness proves pruning cannot alter those truths. Do not invent two independent pruning algorithms unless evidence requires them.
- **R28:** treat the existing measured features + demands under one measurement fingerprint as the canonical analysis boundary. Do not create a new `PieceAnalysis` abstraction solely to rename the bundle; introduce it only if atomic consumers actually require one object.
- **R31:** Library-only is a warning when the item is intentionally browse-only; it is an error when an item claims curricular/automatic reachability but no path can reach it. An unfitted item prints no pedagogical level rather than a fake/default scalar.
- **E39:** preserve original imported MIDI bytes once per imported material (content-addressed/blob storage is fine), so future converter repairs can reprocess the learner’s actual source. Do not duplicate those bytes onto run/evidence rows. One migration if needed.
- **E46:** do not build lesson-site wiring merely because the hook exists. It becomes worthwhile only after candidate material carries enough level/key/metre/style truth for a rung check. Keep it later until that precondition exists.

---

# 6. Decisions that still require evidence rather than an abstract ruling

Do **not** force these tonight merely to empty the DECISION column:

- **G52** enharmonic arpeggio spelling: read the actual harmonic identity/lesson purpose; correct musical spelling may legitimately contain a double accidental.
- **G58** coordination study vs harder texture: inspect the actual gap in the progression and generated material.
- **L121** rock.5 ninth-span voicing: actual playable/musical read.
- **S27** metre/compound-figure design: decide from L120d’s final demand ownership and the actual reachable generated rows.
- **U33/U78 numeric threshold:** U32 gallery/device evidence first, as above.
- **R20 trial tune:** choose after source/material evidence; do not pick a tune just to close the row.
- **X6/X7** duet/shadowing and Perform contract details: read the existing experience and Part 14 cases before choosing exact forms.
- Any item whose convergence disposition is READ remains a read. A cluster label is not permission to replace missing musical evidence with architecture taste.

---

# 7. First implementation queue after the current frontier

Do not dispatch all “BUILD NOW” rows. Maintain the 2–4 substantial-agent cap and let current lanes finish.

## Current frontier

Finish/review the already active or queued dependency work first:

- U32;
- U63;
- U105;
- G96;
- L120d;
- E50;
- T58;
- X40 as the evidence lane when a read/tooling slot is available.

E50a and L120c are already landed; re-check their dependents now.

## As product slots free

Use this order unless a current landing changes it:

1. **SG01 / E54**, if still open: tiny, already ruled correctness seam. Use the fast path; do not occupy a lane for long.
2. **CL04 — Evidence truth.** Four tightly related red-first corrections at the core learner-evidence boundary. This is the best first substantial learning-system cluster.
3. **SG02 / U66 — render stall must not create a miss.** A real scoring correctness defect with no dependency.
4. **CL05 — Practice lifecycle / X15.** Hidden/background time and progress are real learner-record truth, independent of the curriculum work.
5. **CL15 buildable generator subset** (G51/G54/U68/G7) **or CL16 sight-reading v3**, whichever is more file-independent from active work. Prefer CL15 if its four buildable faults can close as one generator seam without dragging its undecided/read rows into the brief.
6. **CL01 buildable lesson-truth subset** in a content/read slot, while the T54 expert packet proceeds separately.

CL06 test-oracle cleanup uses an elastic/tooling slot, not a primary product slot.

### Example four-lane steady state after the frontier

- **Lane A — learning:** CL04.
- **Lane B — engine/device:** SG02, then CL05.
- **Lane C — content:** CL15 buildable subset or CL16.
- **Lane D — elastic/read/tooling:** T58/X40/CL01 source work/reconciliation re-checks.

Do not wait for every DECISION/READ row in a cluster before shipping a genuinely independent buildable subset. Conversely, do not fold an unresolved product choice into a builder merely to keep the lane busy.

---

# 8. Re-check policy and next checkpoint

The 78 RE-CHECK rows are the largest source of fake remaining work.

As each owning lane lands, run the relevant re-check **immediately as a cheap read**, not as a future implementation seam. A re-check must answer one of:

- CLOSE;
- MERGE into an existing surviving cluster;
- BUILD NOW with the current defect stated;
- DECISION/READ with the exact remaining question;
- DEFER TO H.

Do not let `RE-CHECK` itself become a queue of 78 “tasks.”

After **5–8 substantial clusters/singles land**, regenerate the convergence map and report:

- surviving clusters, not row counts alone;
- how many RE-CHECK rows disappeared;
- newly unblocked decisions/reads;
- whether the first-priority teaching loop changed;
- the next 3–6 seams.

No new project-wide replan is needed unless that checkpoint changes the product architecture materially.

---

# 9. What this means for remaining-work estimates

The earlier “~20% done” framing should be retired.

This convergence pass shows why raw row arithmetic was misleading: 145 of the 343 rows are already CLOSE/MERGE/REJECT, 78 are conditional re-checks, 16 belong to final H, and many of the surviving rows are deliberately grouped into shared clusters.

That does **not** mean the project is nearly finished; several remaining clusters are substantial. It means the correct unit of remaining work is now the surviving cluster graph.

Do not provide another percentage estimate until the first 5–8-cluster checkpoint. At that point estimate from:

- surviving substantive clusters;
- reads/decisions still capable of creating new implementation;
- H1/H2 still outstanding;
- observed closure rate per cluster, not per audit row.

This response is the reviewer/owner approval of the first synthesis checkpoint under the path-forward plan.
