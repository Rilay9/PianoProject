# C0b — The test-suite inventory (AT-15): every test classified by the assumption it encodes

**Read-only.** You edit nothing under `app/`, `content/` or `tools/`. Your output is one
document: `docs/prompts/test-inventory-2026-09-26.md`, plus a machine-readable
`docs/prompts/test-inventory-2026-09-26.csv` (one row per test file; columns below).

**Read first:** `docs/prompts/operating-procedure.md` whole; `docs/prompts/audit-2026-09-25-
outside.md` Part 6 ("the existing tests need to be treated as historical assertions that
must be classified, not as a contract the new architecture has to preserve") and the
matrix's area 11 (`backlog-2026-09-25.md`, rows Q1–Q17); `docs/08-test-map.md` (the index
of every spec by screen and state machine, your starting point); `docs/00-invariants.md`
§2 (the test rules: no machine-measured numbers; assert what you mean, not a proxy; never
wait on a transient); the six revisions of 2026-09-25 as worked examples of the classes
(`git log --oneline -12` and the diffs of `score.screen.spec.ts`, `score.layout.spec.ts`,
`score.spec.ts`, `dark-ink.spec.ts`, `perf.spec.ts`, `scoreControls.ts`,
`lessonClaimsAboutApp.test.ts`).

## The goal, in the orchestrator's words

Before any later wave rewrites what the suite asserts, know what each test protects. The
suite is large (about 200 unit files, 110 end-to-end specs, the state and tour specs, the
content and converter tests) and much of it encodes the model being replaced: the stage
number as level, the item-flag pass, count completion, the fallback windows, declared
generator levels, the seven-level sight-reading table, the old slot rules. A green suite
that encodes the old model is not evidence for the new one; a test that reads an intent
flag or an internal calculation can pass over a wrong screen. Classify every test so a
wave can delete or replace with its reason, and so no genuine invariant is deleted by
accident.

## The classes (the reviewer's five)

- **preserve**: protects a genuine product or technical invariant (MusicXML and render
  validity; deterministic generation where determinism is intended; note and fingering
  correctness; timing and event ordering; the state-machine tables; no distortion measured
  on the outcome; persistence and data integrity; `04` §0's screen contracts; the
  build gates).
- **revise**: the behaviour it protects stays important, but the assertion encodes the old
  implementation or a proxy (an intent flag, an internal count, a machine-measured number,
  a read before the state settles, a click that assumes a bar stays).
- **delete**: it locks in obsolete behaviour or a known bug, and nothing it protects
  survives the change that removes it.
- **replace**: the concern survives, the frame does not (a test of `lessonComplete`'s
  count becomes a test of rung state derived from evidence).
- **add**: missing coverage, named against the matrix's Q6–Q11 rows.

## The columns, per test *file* (and per test where a file mixes classes)

`file | suite (unit, e2e, states, tour, content, converter) | what it protects, in one
sentence | the assumption its assertions encode | reads outcome or proxy? (outcome,
proxy: name the proxy) | class | which wave's change makes it obsolete or revises it
(B done, C, D, E, F, G, X, H) | notes`.

## What the inventory must also produce

1. **The invariant list**: every *preserve* test, grouped by the invariant it protects, so
   a later wave can check a deletion against it.
2. **The proxy list**: every test that passes or fails on something other than the
   learner-facing result (intent flags like `data-stretch` was; internal counts; strings
   read from code; timing waits that race), with the outcome it should read instead.
3. **The obsolete list by wave**: the tests each planned change (C: observations,
   evidence, skill state, in-rung selection, fallbacks; D: generator intent, validators,
   the sight-reading table; E: demands into the catalog, one level, excerpts; F: the
   lesson schema) will make obsolete, so the wave's brief can name them.
4. **The gaps** against Q6–Q11, as concrete test names to add, one line each.
5. **Statistics that mean something**: how many tests per class per suite; how many
   assert a literal number measured on some machine; how many read a string from code
   rather than the glass; how many wait on a fixed timeout rather than a state.

## Method

Start from the test map; then walk every file under `app/tests/unit`, `app/tests/e2e`,
`app/tests/states`, `app/tests/tour`, `tools/content/tests`, `tools/midi-cleanup/tests`.
Read each file's describe and test names and its assertions; do not run the suite (the
orchestrator's chain has). For a file that mixes classes, list the tests that differ.
Where a test's purpose is unclear from its text, read the source it tests once; do not
audit the source itself. Sample nothing: every file gets a row, and a row you could not
classify says so with the reason.

## Rules

Builder tier only. No edits outside `docs/prompts/`. No browser, no builds, no test runs.
Never name an AI model. Do not imply broader verification than you did: the inventory is
a reading of the tests, not proof that they pass or that the invariants hold. A test
agent runs beside you under `app/` and uses the browser; you do not.

## Report

Judgement first: in five lines, how much of the suite protects the product, how much
protects the old model, and the three proxies most likely to let a wrong screen pass.
Then the statistics, the four lists' sizes, and the files read (by count per suite).
