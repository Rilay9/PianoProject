# Reviewer handoff — AID1 and HB1 landed; the St James and Blues Riff probes' findings and decisions

**Scoreboard: 1 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** A7b.1 stays `draft` (PH2 back with its builder for the position-preserving fallback).

The commit carrying this handoff. Respond in `responses/a7a-lanes-landing.md`. Response required before A7a.3's or A7a.1's placement and the Blues Riff edition build. Nothing heard.

## 1. Landed

- **AID1** (`docs/pending-review.md` Entry 278): authored ids resolve from the literal `PIANOPATH["id"]` read with `ast.parse`, never run; duplicates fail; A7a.1's only unresolved refs are now Blues Riff's three. `.abc` authored sources are not read.
- **HB1** (Entry 279): `hands: both` on a runs requirement; no stage file carries it. The preflight's matching check is building (PF4), so the hands requirement's preflight clause stays open.

## 2. The St James probe (`docs/prompts/runs/A7a3/`, decisions in `drafts.md`)

The minor twelve-bar's bars 9-10 have no single standard form: the generator's ♭VI7-V7 (as in "Mr. P.C.") and the Lab's V7-iv7 are both attested, and an open theory text gives iiø7-V7 (`SOURCES.md`, with quotes and citations). Proposed: keep the generator's form for the walking items and name each form as a variant wherever it is taught, never as the form. Two readers agree on all 41 of St James's symbols and 23 of St. Louis Blues's; the four minor walking items pass an independent reading with planted errors going red. Corrected premises: St James is a 16-bar verse plus an 8-bar refrain; today's chart draws 41 cells for its 24 bars and, with no Count off, judges every bar against bar 1's chord. Seven decisions are listed in `drafts.md`: the minor form (above); blues.6's existing requirement replaced or a minor one added beside it (proposed: beside); teaching use of the four items; step 14's key (the E♭ minor item spells ♭VI7 as B7); St. Louis Blues bars 1-4 or 1-12 (proposed: 1-12); St James's repeat count; step 14's feedback line.

## 3. The Blues Riff probe (`docs/prompts/runs/A7a1/`)

Blues Riff in C is not admitted: it is a three-part ensemble with a drum part (G3, G4, G7). Its events were read by two readers (249 notes and 54 rests agree); the B naturals are structural, as the map says. The re-staffing brief is drafted (`brief-bluesriff-restaff.md`): keep the riff and root parts by id and convert unchanged; tried in scratch, 69 of 69 notes kept. Decisions: the catalogue route (a source row with a derivation block, recommended, or an authored module); committing the raw source so CI can check the edition (recommended); the tempo (the converter's default 96, recommended, or the 120 in the title only). Two findings for A7a.1's record: the preflight's hand coverage counts only demand facts, so an authored two-staff item cannot pass class 1 by any existing route (two options drafted in the README); and the Settings metronome volume is also the Lab bed's and the chart backing's volume, so step 3 should use the Score screen's Metronome row instead.

## Clause map

| Clause | Implementation | Test | CI path |
| --- | --- | --- | --- |
| Authored exercise ids resolve from the literal id, read statically and never run | `tools/content/check_chains.py` | `tools/content/tests/test_check_chains.py` | docs-integrity.yml, The chain checker goes red on each broken record |
| A runs requirement may declare hands: both, and rung completion reads the recorded hands | `app/src/evidence/rungState.ts` | `app/tests/unit/runsRequirementHands.test.ts` | ci.yml, Content and unit tests |
| The schema admits hands: both alone, and the build refuses other values | `content/curriculum.schema.json` | `tools/content/tests/test_evidence_gate.py` | ci.yml, Content and unit tests (Content pipeline tests) |
