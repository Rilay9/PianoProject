# F0 — Never teach wrong: the P0 and P1 content corrections, each with its verification layer named

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/00-invariants.md` (never teach wrong is the product rule that outranks every other); `docs/prompts/audit-2026-09-25-outside.md` Part 10 in full (the reviewer's content and pedagogy audit: the factual errors, the technique rules, the safety overclaims, the theory errors, the swing definition, the three-layer rule, the twelve gates); `docs/prompts/plan-2026-09-25.md` (Wave F redefined; the three-layer rule under the rules for all waves); the matrix rows T28–T41, T51, M11 in `docs/prompts/backlog-2026-09-25.md`; the earlier content audit's open findings (search `docs/` for the lesson audit the reviewer names: 98 lessons, 323 issues, 236 corrected; its theory, musical-judgement, unverified and historical lists are the 85 items T40 names); `content/lessons/*.md` (109 files); `tools/content/validate.py` and `app/tests/unit/lessonClaims*.test.ts` (what the validator and the claims tests prove — agreement with the app, never truth); `app/src/ui/help.ts` and `app/src/engine/Scoring.ts` (the technique measures' words, for T51).

## The goal, in the orchestrator's words

A learner reads these lessons today and some of them are wrong: the rhythm sentence is backwards, the dotted-note rule breaks on a double dot, the anacrusis convention is called a rule the app's own tune breaks, and the half-pedal lesson gives the wrong model of what the foot does. Others state as fact what is one school's habit, a heuristic, or a guess: the octave fingering, swing as two to one, chord scales as harmony, injuries "almost always" from one cause. This task corrects the P0 and P1 cases the reviewer named and resolves the old audit's open theory and unverified-app-claim items, and for every change it says which layer verified the new sentence: an outside source for a fact, a teacher's judgement for a heuristic written as a heuristic, the app's code for an app claim. It does not rewrite the lessons' voice; that is F.

## What is decided

1. **The four factual errors** are corrected (T28 the rhythm arithmetic; T29 the dotted note stated for a single dot; T30 the anacrusis as a convention with the app's counter-example; T31 the half-pedal mechanism — the dampers' partial engagement, sourced from a piano-technique or piano-mechanism reference, and the technique measure's words made to agree, T51).
2. **The theory errors** are corrected (T38 tonicisation versus modulation; T39 chord-scale relationships as one improvisational framework and the modes' effects as colour, not law), and the 18 open theory items of the old audit are each resolved: verified with a source, rewritten as a heuristic, or removed.
3. **The unverified app claims** surviving from the old audit (16) are each checked against the code at the lines and corrected or removed; the 4 historical claims are sourced or removed; the 47 musical or pedagogical judgements are listed for F with the reviewer's classification, not rewritten here unless one is a P0.
4. **The rigid or unsafe technique rules** (T32, T33's "always", "only", "not a suggestion" cases) are softened to one common practice with the alternatives named and the reason; the technique framework rewrite is F's.
5. **The safety lesson** keeps pain awareness and drops the causal law and the precise comparison (T35), sourced where a claim remains.
6. **Swing** becomes a first demonstration of unequal eighths, said so (T41).
7. **Every corrected sentence** passes the teacher test (gate 12) and names its layer in the entry's table: source (with a citation the owner can open), teacher's judgement (a heuristic written as one), or code (an app claim verified at a line). Where you cannot verify a fact, you do not guess: you write the sentence as uncertain or remove it, and list it for an outside expert.
8. **The lint** (T49's first step): a script under `tools/content/` that lists every absolute word (always, never, only, every, exactly, the reason, the fix, the main reason, all, none, most) per lesson with its sentence, for F's human review; it fails nothing.

## The tests

- The lesson-claims tests keep proving agreement with the app; a new test proves the note-value arithmetic of every lesson that states one (T28) and that no lesson states the half-pedal as a treble filter (T31).
- The content build and validator green; the lint script's output committed as `docs/prompts/lint-absolutes-2026-09-26.md` for F.
- Every touched lesson's `readingTime` and claims rows revised where the text changed; each test touched classified.

## Rules and files

You own `content/lessons/*.md` (the lessons T28–T41 and T51 name, and those the old audit's theory and app-claim items name), `tools/content/` (the lint script; `validate.py` only if a claims row changes), `app/src/ui/help.ts` and `app/src/engine/Scoring.ts` (the technique measure's words only, T51), `app/tests/unit/lessonClaims*.test.ts`, `docs/02-curriculum.md` (Part F or wherever the lessons' standards live; one dated note), `docs/08-test-map.md`. Not the curriculum's structure, not the generator, not the app's screens. Never name an AI model. Every change with a red first where a test can express it (the arithmetic, the half-pedal words); every touched test classified. Run the content build once after your edits, unpiped, and the validator, the content tests and `npx vitest run`; no browser is needed except to look once at the half-pedal lesson page and the corrected rhythm lesson at 342 × 740 (one config, port 4173, stop the preview before a build). No commits, no push, no stash, never `git add`. Your entry goes to your scratch folder as `ENTRY.md`, headed "### Entry 82 — F0: …" (numbers 80 and 81 are C6's and C7's), with a table of every corrected sentence: lesson, before, after, layer, source.

## When to deviate

If a correction needs a musical judgement you cannot source and cannot honestly write as a heuristic, leave the sentence out and list it for the outside expert with what you would have written. If a fact is contested between sources, write it as contested. Never trade one certainty for another.

## Report

Judgement first: the four factual errors as a learner now reads them, and the half-pedal sentence with its source; then Done / Not done / Follow-ups / Questions / Files; the table of corrected sentences with their layers; the old audit's 85 items each with its disposition; exit codes from unpiped runs; unverified beside what passes (say plainly which claims an outside expert must still check).
