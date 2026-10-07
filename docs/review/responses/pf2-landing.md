# Review response — PF2 preflight strict / earlier-rung review / counted-drill journey

**Verdict: APPROVE WITH ONE REQUIRED CHANGE**

<!-- reviewer-closure-v1 -->
REVIEW-CLOSE: PF1-strict-reviewed-shipped | impl=.github/workflows/ci.yml, tools/content/preflight_chains.py | test=tools/content/tests/test_preflight_chains.py | CI run 37615810847 executed Chain preflight, strict successfully after the content build.
REVIEW-CLOSE: PF1-earlier-rung-review | impl=tools/content/preflight_chains.py | test=tools/content/tests/test_preflight_chains.py | named prerequisite/earlier-rung review now requires an actual earlier rung in the placed rung's ancestry, that rung must list the item, and the step must name that rung as review/prerequisite.
REVIEW-CLOSE: PF1-counted-drill-journey | impl=tools/content/preflight_chains.py | test=tools/content/tests/test_preflight_chains.py | Reading-and-theory chord drills now get a MIDI-driven generated journey step that completes the drill and observes the lesson counts line.
REVIEW-OPEN: PF1-ability-journey-scope | Class 6 must prove the chain ability's own counted evidence and journey claims, not require unrelated generic rung requirements to be completed before the ability journey can pass.

**Scoreboard: 1 / 28 MUST abilities shipped.** A7b.1 remains `draft`.

I read the immutable handoff first at the PF2 implementation head, then the landed preflight code, its broken-record tests, the CI workflow step, the generated A7b.1 journey, and the current A7b.1 preflight output. I also checked the first CI execution after PF2: on run `37615810847`, the content build passed and **Chain preflight, strict** completed successfully before the rest of the content/unit job. Nothing heard.

One handoff artefact is missing as named: `pf2-landing.md` says to read `docs/pending-review.md` Entry 275, but Entry 275 is not present there at the PF2 head. The durable PF2 row does exist in `docs/prompts/tasks/README.md`. This is a handoff bookkeeping defect, not a reason to reject the implementation.

## 1. Earlier-rung review reachability — APPROVE / clause closed

The new `named_review_rung()` boundary is the right one.

A step does **not** pass merely because its prose contains “review.” It passes only when:
- the placed rung exists;
- the named review rung is in the placed rung's actual ancestry;
- that earlier rung really lists the item;
- the step names that rung id in a clause that says review or prerequisite.

The adversaries cover a later rung, an id that is only a substring of another id, and the existing placed/later-rung cases. This preserves the distinction we wanted for A7b.1 step 3: the seventh-quality ear drill remains on jazz.5, is intentionally revisited from jazz.6, and does not enter jazz.6's counting pool.

The departure from “same rung only” is therefore accepted.

## 2. Counted Reading-and-theory drill journey — APPROVE / clause closed

The generated class-6 journey now has a bounded template for MIDI-answerable Reading-and-theory chord drills.

It:
- opens the drill from the correct rung row;
- reads each card's own `data-expects` rather than inventing the answer;
- plays those pitches through the existing MIDI mock;
- waits until the drill really reaches `finished`;
- verifies a new stored drill run exists;
- observes the lesson counts line after the run.

The tests also preserve the boundary:
- a drill the step says does not count leaves the counts line unchanged;
- unsupported drill kinds remain `test.fixme`, not fake PASS;
- the ear-chord drill remains outside this template.

That is the small reusable class-6 addition the prior ruling required.

## 3. Strict mode in CI — APPROVE / clause closed

The handoff's departure from my earlier wording is correct.

Strict mode belongs in `.github/workflows/ci.yml`, not docs-integrity, because PF1 reads the built catalogue. The CI ordering is correct: **Build content → Content pipeline tests → Chain preflight, strict**.

The implementation also has the right status boundary:
- a `draft` may report PF1 FAILs without failing CI;
- `reviewed` or `shipped` records fail strict mode on any PF1 FAIL;
- no record run is itself an error.

This was not merely inspected: CI run `37615810847` executed the strict step successfully after the built catalogue existed. The enforcement is therefore in force.

## 4. Required change — class 6 proves the ability, not the entire rung

PF2's own A7b.1 result exposed the remaining semantic error.

A7b.1's counted ability evidence is the **named minor ii-V-i shell drill**. That one run also happens to be one of jazz.6's generic exercise runs, so after it the UI truthfully reads **1 of 2**. The second generic jazz.6 exercise is a rung-completion requirement, but it is not evidence for the A7b.1 ability.

Class 6 currently treats any unheld rung requirement as a failure:

> the journey cannot assert completion

and therefore asks the ability record to manufacture a second unrelated exercise run merely to make jazz.6 complete. That is the wrong level of abstraction. A slice is an ability carried through the learner path; it is not “complete every other requirement of whatever rung happens to host it.”

Required correction:

- class 6 must distinguish **ability acceptance** from **full-rung completion**;
- every counted run that the chain says contributes to its evidence must have a generated journey step and must produce the expected visible count/evidence consequence;
- every **named requirement/evidence update that belongs to the ability** must be demonstrated;
- an unrelated generic rung requirement may remain unheld without failing the ability journey;
- the generated journey must not claim Plan/rung **complete** unless the record's own counted steps actually satisfy the whole rung;
- for A7b.1, one passing minor-drill run should therefore make class 6 PASS for the ability while observing the honest partial rung state **1 of 2**, with no fake second exercise.

Keep the existing adversary that proves a whole-rung completion assertion would be wrong; change its expected result so the **ability journey passes but Plan completion is not asserted**. Add the complementary case where the chain itself claims or contains enough counted work to complete the rung, and then the journey may assert completion.

Do **not** add an unrelated second jazz.6 exercise step to A7b.1 just to satisfy PF1. That would corrupt the chain to satisfy the checker.

This is one bounded PF1 fix-forward. No new product design is needed.

## 5. Current A7b.1 / BB2 state

BB2 has now landed after the PF2 handoff, but it is not part of this PF2 approval.

I inspected enough of the current tree to note the direction:
- the ear drill remains off jazz.6 and the lesson routes to jazz.5 as review;
- Insensatez is now optional jazz.6 repertoire and the lesson defers the bars 13–15 answer to its final paragraph;
- tests pin those learner-facing claims.

However, the committed `docs/prompts/runs/PF1/preflight-A7b.1.txt` on the current head still contains the **older four-FAIL snapshot**, even though BB2's landing record says a fresh PF1 run is down to one FAIL. Treat that committed file as the historical PF1 snapshot unless/until its provenance is made explicit; do not cite it as the current BB2 result.

The existing reviewer-ledger requirements `A7b1-insensatez-jazz6`, `A7b1-zero-preflight-before-reviewed`, and `PH2-source-measure-direct` remain OPEN here. This response closes only the three PF2 clauses it actually reviewed.

## 6. Next state

PF2's three original required changes are closed.

The only PF2 fix-forward is `PF1-ability-journey-scope`. Once that lands and its targeted tests pass, rerun PF1 on A7b.1. If BB2's placement is then independently reviewed/closed and PH2 has not introduced another FAIL, A7b.1 may proceed toward `reviewed` under the existing zero-FAIL requirement.

No owner/device check is requested.
