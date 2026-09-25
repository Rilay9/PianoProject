# T39 — Five-finger patterns levelled by their key, and the catalog rebuilt honestly

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13;
`docs/prompts/diagnosis-2026-09-25.md` problem 1 (the five-finger paragraph) and D4 (what
`level` must not become; this task does *not* build D4); the trace
`docs/prompts/traces/2026-09-25-generated-exercise.md` §4 and finding 5. Code:
`tools/content/generate_exercises.py` (`make_five_finger` near 874–905, `scale_level` near
197–250 and the level table above it, `catalog_entry` near 635–668), `tools/content/validate.py`
(`level_band_errors`, the core reach rule, the three-alternatives rule), `tools/content/build.py`,
`tools/content/README.md`, `docs/02-curriculum.md` Part E (the stages' keys) and the rungs
that list five-finger items (`grep -l five-finger content/curriculum/*.json`), `docs/03-
content-pipeline.md` §3.

## The goal, in the orchestrator's words

A five-finger pattern in a key with black keys is not offered to a learner as the equal of
one in C position. Today `make_five_finger` levels every one-hand pattern at 1.1 and every
two-hand pattern at 2.1 whatever the key, while `02` Part E gives Stage 1 the keys C and G
and Stage 2 the keys C, G, F, D and A, and `scale_level` in the same file already ranks keys.
After this task the level says what the notation asks, the catalog is rebuilt, and no rung
band is widened to hide the change.

## What is decided

1. `make_five_finger` levels by key the way `scale_level` does, for major and minor, one
   hand and both: C and G one-hand at Stage 1; the Part E Stage 2 keys at Stage 2; keys
   with more black keys later, on the same table the scales use. State the rule in a
   comment beside the table it comes from, and say in the report which item moved where
   (48 items: 24 one-hand, 24 two-hand, by the built catalog's count; re-count).
2. The catalog is rebuilt (`python tools/content/build.py`; read the README for the
   arguments the build takes) and `validate.py` runs. **If a rung's band no longer
   contains an item it lists, the band is not widened.** Either the item is genuinely at
   that rung and the level rule is wrong for it (say why and adjust the rule), or the item
   does not belong on that rung's list and comes off it with a one-line reason in the
   entry. Report every such case.
3. The swap sheet on rung 1.1 is checked after the rebuild by reading `alternativesFor`'s
   inputs (levels within 0.5 and a shared tag): it must no longer rank A♭ major beside C
   position. Reason it through from the new levels; do not start the app.
4. `levelSource: "judged"` stays as it is on generated items (D4 owns that question); note
   it once in Follow-ups.

## What is the agent's judgement

The exact placement of each key on the table (follow `scale_level`'s ranking; where it has
no entry for a five-finger case, the nearest scale's). Whether the minor patterns sit a
step above their majors, as scales do. Whether any lesson names a five-finger key that has
now moved (grep the lessons for the item ids and for "five-finger"); if so, the lesson's
sentence follows the level, and you say which.

## Rules and files

You own: `tools/content/generate_exercises.py` (the five-finger family and its level rule
only), `tools/content/tests/**` (a test that fails on the old rule), the generated
`content/catalog.generated.json` or whatever the build writes for generated items (read
`build.py` to see), `content/curriculum/*.json` **only** to remove an item from a rung's
list per item 2, `content/lessons/*.md` only per the judgement above, `docs/02` Part E (one
dated line), `docs/03` §3 if the level rule is documented there, and a new entry in
`docs/pending-review.md` (next free number after the tail; another task may append before
you). **Not** anything under `app/src` or `app/tests`, and not `content/catalog.static.json`
(another task owns nine rows in it and runs the build after you). Never `git add -A`; no
commits, no push, no stash. Never name an AI model.

Before re-serialising any JSON file compare a round-trip against the raw bytes and splice
text if it differs (CLAUDE.md's JSON hazard: Python writes `0.0`, key order and escapes
differ). Run the build once, after all edits; another task builds after you, so leave
`app/public/content` as the build writes it. No browser, no Playwright.

## When to deviate

If `scale_level`'s table turns out not to fit five-finger patterns (a five-finger pattern
never leaves the position, so the black-key cost may be smaller than a scale's), say so,
choose a rule that Part E supports, and state it. If the rebuild fails on something
unrelated to your change, report the failure with its line and stop rather than fixing it.

## Report

Judgement first: does a learner at 1.1 still meet only C and G, and what moved. Then Done /
Not done / Follow-ups / Questions / Files; the table of moved items; every band case under
item 2 with its disposition; the build's and validator's exit codes from unpiped runs; the
red line of the test. Append the same as the entry.
