# Reviewer handoff — MT1, G6b and the preflight landed; A7b.1's three placement decisions; the preflight's strict mode

**Scoreboard: 1 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** A7c.1 shipped (Entry 270). A7b.1 stays `draft`.

The commit carrying this handoff. Respond in `responses/mt1-g6b-pf1-landing.md`. Response required before PH2 is dispatched and before A7b.1's remaining steps are changed. Nothing heard.

## 1. Landed, for artefact review

- **MT1 (Entry 274):** `app/src/score/metre.ts`, `app/src/ui/screens/ChordChartScreen.ts`, `app/src/audio/BeatScheduler.ts`, `app/tests/e2e/chart-metre.spec.ts`, `docs/prompts/runs/MT1/`. One choice for your read: until PH2 the screen still draws its old grid keyed by printed number, and each grid bar takes the signature of the first source measure printed with that number. Say whether that counts as the second key scheme your §4 forbids; it disappears when PH2 iterates source measures. At landing the measurement fingerprint was completed with `metre.ts`, `tempoFromXml.ts` and `measureWalk.ts` (`tools/content/demands.py`, `app/src/data/measuringFingerprint.ts`), the passage facts re-proved, and a new check added under the convergence rule: `tools/content/tests/test_facts_current.py` fails when a committed demand fact was proved under other definitions (Entry 274 tells how a build before the re-proof briefly lost latin.6's tresillo).
- **G6b (Entry 273):** the minor drill on jazz.6 with its answer staff in the named key, and the lesson. Read the lesson text in `content/lessons/jazz.6.md` (the five new paragraphs and the repertoire paragraph); its sources are in the entry.
- **PH1a (Entry 271):** source-measure identity; conflicts 43 to 31. The "543 carry changes" figure in my last handoff was wrong: about 40 bars in 18 files change; the rest were bars drawn past the end.
- **PF1 (Entry 272):** the chain preflight, six classes from the Bizet slice, report mode. It found one real gap in shipped A7c.1 (an update naming its item in words, fixed). **Asked:** may `--strict` become a blocking check in docs integrity now, for every record not in `draft`?

## 2. A7b.1: three steps the preflight fails after placement

A learner on jazz.6 cannot open these from the rung's page. Each is a curriculum decision.

1. **Step 3, the ear drill of seventh qualities**, is an option of jazz.5 and theory.5, not jazz.6. Options: open it from jazz.5 as review (the step says so); or add it to jazz.6's exercises, where it would then count toward the generic two-exercise requirement. I lean to the first: the record's `never_credits` keeps ear-drill runs out of the ability's evidence, and adding it to jazz.6 makes it count for the rung.
2. **Steps 14 and 15, the unseen Insensatez decision and its reveal**, use a piece that is an option of a Latin rung. Options: add Insensatez to jazz.6's songs (no song requirement exists, so it counts for nothing) with the reveal paragraph in jazz.6's lesson; or move both steps to that Latin rung, whose lesson then names the bars. I lean to jazz.6: the decision is this chain's transfer step and belongs beside the drill it tests.
3. Either way the record names where each step opens, and the preflight is rerun to zero FAILs before A7b.1 goes to `reviewed`.

## 3. Next, unless you redirect

PH2, the chart's visible consumers of positioned harmony, on MT1's metre clock.
