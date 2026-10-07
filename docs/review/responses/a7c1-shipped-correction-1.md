# Review response correction — A7c.1 automated acceptance

**Verdict: APPROVE — the automated learner-facing journey replaces the manual owner phone walk.**

This correction supersedes `docs/review/responses/a7c1-shipped.md` §3 only. The earlier requirement that the owner manually walk the 20 lesson steps is withdrawn under the current FABLE audience boundary: objective learner-facing acceptance belongs to automation, not to the owner as a test harness. Nothing here changes the musical-truth boundary; nothing was heard.

## 1. Evidence accepted

I read the pushed acceptance artefacts at `52d8fdf0`, not only the summary:

- `app/tests/e2e/a7c1-phone-walk.spec.ts`
- `docs/prompts/runs/A7S/phone-walk-playwright.md`
- `docs/prompts/runs/A7S/phone-walk-playwright/results.json`

The run is one 390 × 844 mobile/touch Chromium journey with the repository MIDI mock and the learner-visible controls. It records **24 / 24 PASS, 0 STOP** across the 20 lesson rows / 24 chain actions. In particular it proves the two counted runs move the lesson from 0/2 → 1/2 → 2/2, latin.4 becomes complete on Plan, the required printed-bar loops are reachable, the unsupported latin.6/latin.7 naming task is present, and the self-checked/practice actions do not substitute for the two counted items.

This is sufficient learner-facing acceptance. A physical phone, the Pages deployment, or human listening is **not** an additional shipping gate.

## 2. The older test head does not require a rerun

The journey ran on `c6c4ab6a`. I compared that tree with the current working line before this ruling. The intervening learner-facing app change is the unrelated Chord Chart backing work; no latin.4 lesson, Score path, Plan completion, loop implementation, Bizet/tresillo content, or A7c.1 counted-run behavior changed.

The only A7S change is that `phone-walk.md` is now explicitly marked superseded because the manual-owner gate violated the audience boundary. Therefore rerunning the same 20-step browser journey on the current head would not materially increase confidence.

## 3. Step 7a is not a product blocker

The old phone-walk table shortened step 7a into an order that cannot literally be performed after reopening the drill in Wait for me: Keep tempo has to be selected before the Rhythm-only row exists. The automated run records that order swap.

That does **not** block A7c.1. The manual table is now provenance only, and the learner-facing lesson wording remains executable in its intended sequence. No lesson/product correction is required for shipping on this evidence.

## 4. Mechanical landing before `shipped`

The substantive acceptance is complete. The remaining work is bookkeeping required by the checker, not another acceptance run:

1. land `app/tests/e2e/a7c1-phone-walk.spec.ts` and its recorded acceptance artefacts from `52d8fdf0` onto the working branch;
2. add the exact line `// acceptance-ability: A7c.1` to that spec, satisfying current R9;
3. set `docs/chains/A7c.1.yaml` `acceptance_journey: app/tests/e2e/a7c1-phone-walk.spec.ts` and `status: shipped`;
4. run the chain checker/docs-integrity in that state;
5. if green, move the scoreboard to **1 / 28**.

No second browser walk, owner verification, deployment confirmation, fresh musical judgement, or unrelated seam is required.
