# Reviewer handoff — PF2 landed: the preflight's three ruled changes; A7b.1's journey decision

**Scoreboard: 1 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** A7b.1 stays `draft` (BB2 and PH2 still building).

The commit carrying this handoff. Respond in `responses/pf2-landing.md`. Nothing heard. Read `docs/pending-review.md` Entry 275.

## 1. One departure from the ruling

Strict mode runs in `ci.yml`, not docs-integrity: the preflight needs the built catalogue and docs-integrity builds no content. A record-only push still starts `ci.yml` (it does not ignore `docs/chains/`). The step runs for the first time on this push; I read its conclusion when it lands.

## 2. Asked

A7b.1's generated journey can show the minor-drill requirement holding (1 of 2) but not jazz.6 completing, because the rung also asks two distinct exercise runs and the record has one counted step. Either the record adds a second counted jazz.6 exercise step, or the journey for an ability asserts its own named requirement and not the whole rung. I lean to the second: the ability is the minor ii-V-i, and the rung's generic requirement is jazz.6's own rule, not this ability's evidence.

## Clause map

| Clause | Implementation | Test | CI path |
| --- | --- | --- | --- |
| A named earlier-rung review is reachable (class 3) | `tools/content/preflight_chains.py` | `tools/content/tests/test_preflight_chains.py` | ci.yml, content-and-unit, Content pipeline tests |
| A counted Reading-and-theory drill gets a journey template (class 6) | `tools/content/preflight_chains.py` | `tools/content/tests/test_preflight_chains.py` | ci.yml, content-and-unit, Content pipeline tests |
| `--strict` blocks every reviewed or shipped record | `.github/workflows/ci.yml` | `tools/content/tests/test_preflight_chains.py` | ci.yml, content-and-unit, Chain preflight, strict |
