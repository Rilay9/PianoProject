# CL10a — the detectors read the clef, the key in force, the metre and a held tune, and judge a pattern by its share of bars (a build; CL10's detector rows)

Labels: **VERIFIED**, **SETTLED**, **HYPOTHESIS**, **OPEN**, **OUT OF SCOPE**, as in `CL11-what-counts-as-evidence-traced-and-decided.md`.

## What a learner meets

A rung says its music teaches the bass clef, a key signature, a walking bass or a left-hand pattern. Some of those readings are wrong today, so rung claims rest on misreadings, and five claims are deferred by hand. After this lane a claim stands only where the music holds it.

## VERIFIED at `385c0131`

- **The model has no clef.** `detect.ts:21–23` reads staff 1 as treble and staff 2 as bass, and says that a one-staff bass part or a clef change reads wrong. `score/types.ts` has no clef field (searched for `clef` in that file).
- **The model keeps one key per score.** `score/types.ts:185` has `keySig?: string`. `extractScoreModel.ts:208` already reads the key in force in each printed measure, but only for written accidentals (T41).
- **A walk is counted by length, not by metre.** `walkingBass` (`detect.ts`, about :531–548) accepts a bar whose quarters number `barLength(metre)`. In 6/8 that is three, so a broken chord in quarters in 6/8 reads as a walk (R36).
- **A pattern needs every bar.** `leftHandPattern` (:519) and `walkingBass` (:546) require every bar. `validate.py:1532`, `DEFERRED_CONCEPT_CLAIMS`, holds five rung claims, each refused for a few bars: an introduction, a closing bar, or one bar that returns to a pitch (12 of 13 bars, for example).

## HYPOTHESIS: test it first

**R37.** `tune(bar)` (`detect.ts` :518, :545) looks for a staff-1 note that starts in the bar. So a bar where the melody only holds a tied note would count as having no tune.

**The test that refutes it:** a fixture with a tune tied across a 6/8 barline and a left-hand pattern under it. If `leftHandPattern` already finds the pattern, close R37 as not reproduced and keep the fixture.

## SETTLED

- **E22:** a pin in `demandsOfFiles` moves only when its reading changes. List each move with the reading that moved it.
- **Share, not every bar** (the reviewer, E22's convergence row): an introduction, an ending or one returning bar does not unmake a pattern.
- **One set of detectors.** The build reads the app's detectors (`build.py`'s `attach_demands`, through E0's bridge). There is no second detector in Python.
- **R3 is separate.** Its ruling makes ornament and grace demands explicit; that work is not in this lane.

## OPEN: yours to decide, with the reason in musical terms

- **The share rule, per detector.** Decide which bars count (bars where the hand plays? introduction and coda excluded?) and what share makes "a piece with a walking bass" a fair claim. Justify the rule against the deferred cases, and against a case that must stay refused: a piece that walks in two bars only.
- **How the clef enters the model:** per staff, per measure or per note. Show what a one-staff bass part and a mid-piece clef change look like in the model.
- **How a key change reaches the key-signature and chromatic detectors,** and whether `keySig` stays as the opening key for its current readers.

## Done when

- **Red-first unit cases, one per reading:**
  - a one-staff bass-clef part reads as bass;
  - a clef change reads correctly;
  - a key change makes an accidental diatonic;
  - three quarters in 6/8 are not a walk;
  - the held-tune bar is read as having a tune, or R37 is closed as above;
  - under your share rule, a mostly-walking piece is accepted and a two-bar walk is refused.
- **Pins:** every `demandsOfFiles` pin that moves is listed with its reading. The untaught table is re-pinned the same way.
- **The deferral table:** each `DEFERRED_CONCEPT_CLAIMS` entry is removed where the new reading establishes the claim, or kept with its reason restated. An empty table is the aim; never force it.
- **Rung claims gained or lost are itemised:** rung, concept, before, after, why.
- **Checks green:** `build.py --offline`, `validate.py --allow-nc --personal`, the content unit tests, vitest and `tsc -b`.
- **Mutants:** one per mechanism.

## Consumers to check

- `tools/content/rung_audit.py`;
- `validate.py`'s concept-claim findings;
- every reader of `keySig` (search for it);
- the level model's features, where they read demands (R3);
- `docs/08-test-map.md`.

## OUT OF SCOPE

- **CL10's validator rows** (G12, R31, L114, L47, R3): already ruled, and a later lane.
- **R8** (bands replaced by needs-versus-taught): goes with CL17, whose ruling retires the band as a gate.

## Stop and hand back if

- **A share rule needs a teaching judgement no fixture can settle.** State the cases and what each candidate rule claims about them; nothing in this process can hear music.
- **The model change needs a stored-schema change** beyond the built score model.
- **A rung would lose a claim its lesson teaches.** That is a curriculum decision.

**Scope:**
- `app/src/demands/detect.ts`, `app/src/score/types.ts`, `extractScoreModel.ts`;
- `tools/content/validate.py` (the deferral table);
- `content/curriculum/vocabulary/demands.json`, only if a definition changes;
- their tests;
- `docs/08-test-map.md`;
- `docs/prompts/runs/CL10a/`.

The harness is `operating-procedure.md` §14. Never name an AI model in any file.

## Record

lane: CL10a · closes: R32, R36, R37, E22 · entry: 225
index: The detectors read the clef, the key in force, the metre and a held tune, and judge a pattern by its share of bars (`CL10a-the-detectors-read-what-the-music-holds.md`) | build | drafted 2026-10-02 (`CL10a-the-detectors-read-what-the-music-holds.md`); Entry 225
in-flight: drafted 2026-10-02 (`CL10a-the-detectors-read-what-the-music-holds.md`): CL10's detector rows; the clef and the key per bar in the model, the walk read in simple time, the held tune, share in place of every bar, the deferrals emptied where readings establish them (Entry 225)
state: with-reviewer 2026-10-02: in the batch review of five briefs before dispatch (Entry 225)
