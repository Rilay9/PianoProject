# Reviewer handoff — BB2 and PF3 landed: Insensatez on jazz.6, the ability-journey scope, A7b.1 at zero preflight FAIL

**Scoreboard: 1 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** A7b.1 stays `draft`: PH2 (the chart's split bars, which steps 10 and 16 need) is still building.

The commit carrying this handoff. Respond in `responses/bb2-pf3-landing.md`. Nothing heard.

## 1. What to read

- `docs/pending-review.md` Entry 276 (BB2) and Entry 277 (PF3).
- The lesson text BB2 added to `content/lessons/jazz.6.md`, for content review: the paragraph routing to the ear drill on Stage 5 as review; the Insensatez paragraph (read bars 13 to 15 on the chart and decide before listening); and the answer as the page's last paragraph. Entry 276 has them.
- `docs/prompts/runs/PF1/preflight-A7b.1.txt`: 0 FAIL. The generated `journey-A7b.1.spec.ts` asserts "1 of 2" after the minor drill and does not assert jazz.6 complete.

## 2. Requirements this landing asks you to close

- `A7b1-insensatez-jazz6`: Insensatez is jazz.6 optional repertoire with no song requirement; the lesson withholds the bars 13 to 15 answer until its last paragraph; the ear drill stays a jazz.5 option only.
- `PF1-ability-journey-scope`: class 6 passes on the record's named counted evidence, leaves an unrelated generic requirement honestly unheld, and asserts completion only when the record's own counted steps hold every requirement (A7c.1's journey byte-identical).
- `A7b1-zero-preflight-before-reviewed`: met as a condition (0 FAIL at this HEAD); A7b.1 still does not move to `reviewed` until PH2 lands and you read its consequences.

## Clause map

| Clause | Implementation | Test | CI path |
| --- | --- | --- | --- |
| Insensatez is an optional jazz.6 song with no song requirement and no credit | `content/curriculum/stage-6.json` | `app/tests/unit/jazz6MinorShellCompletion.test.ts` | ci.yml, Content and unit tests |
| The lesson asks the bars 13 to 15 decision before the answer, which is its last paragraph | `content/lessons/jazz.6.md` | `app/tests/unit/lessonClaimsAboutApp.test.ts` | ci.yml, Content and unit tests |
| Insensatez's chart opens from its jazz.6 row, Comp and Bass + drums off until Count off | `content/curriculum/stage-6.json` | `app/tests/e2e/jazz6-minor-shells.spec.ts` | ci.yml, E2E tests |
| The ear drill is opened from jazz.5 as review and never counts for jazz.6 | `docs/chains/A7b.1.yaml` | `app/tests/unit/jazz6MinorShellCompletion.test.ts` | ci.yml, Content and unit tests |
| The ability journey passes on the named counted evidence and leaves the generic requirement unheld | `tools/content/preflight_chains.py` | `tools/content/tests/test_preflight_chains.py` | ci.yml, Content and unit tests (Content pipeline tests) |
| Completion is asserted only when the record's own counted steps hold every requirement | `tools/content/preflight_chains.py` | `tools/content/tests/test_preflight_chains.py` | ci.yml, Content and unit tests (Content pipeline tests) |
| A7b.1 reports zero preflight FAIL | `docs/chains/A7b.1.yaml` | `tools/content/preflight_chains.py` | ci.yml, Content and unit tests (Chain preflight, strict) |
