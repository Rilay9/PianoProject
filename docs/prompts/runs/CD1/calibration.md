# CD1: the D4a density calibration, kept as the record of a falsification

**Status.** Superseded by the brief's §3a. Neither cell has a density rule. Both are curated-only (`opportunity-density.json`'s `curatedOnly`). They are established only by a family contract (the witness agreeing) or by a verified passage fact (a `demand` row of `content/sources/verified-facts.json`). This record stays as evidence of why there is no general rule. Nothing here establishes anything.

**Measured through the hand model HD2 corrects.** The numbers below were read through the bridge (`demands.measure_opportunities`, the call the build makes) before HD2. They are pre-HD2 readings, not catalogue truth. The rerun after HD2 uses the same declared sets and is appended below when it is done.

## The declared sets (fixed before the run, D4a)

- Tresillo positives: `exercise.tresillo.c`, `.f`, `.g`; The Crave.
- Tresillo counterexamples: *All of Me* (John Legend, easy); *Apex of the World*; *Mr Blue Sky*.
- Habanera positives: Por Una Cabeza; Solace; the Bizet parent.
- Habanera counterexamples: *Auld Lang Syne* (anonymous edition); Schumann's *A Little Romance*, Op. 68 No. 19; *Sans*.

The rule was fixed in advance:
- `min` is the smallest `located` among the positives;
- `perBar` is the smallest located-per-bar among the positives, rounded down at the second decimal;
- the rule is then checked against every counterexample.

## The pre-HD2 reading

`located` is the detector's places, counted over the unrolled model. Bars are the model's measures, repeats unrolled.

| Item | Declared | Located | Bars | Per bar | Verdict under the derived rule |
| --- | --- | --- | --- | --- | --- |
| exercise.tresillo.c / .f / .g | tresillo + | 24 each | 8 | 3.00 | kept |
| The Crave | tresillo + | 78 | 53 | 1.47 | kept (sets `perBar`) |
| *All of Me* | tresillo − | 114 | 70 | 1.63 | **established: crosses** |
| *Apex of the World* | tresillo − | 90 | 200 | 0.45 | rejected by `perBar` |
| *Mr Blue Sky* | tresillo − | 18 | 155 | 0.12 | rejected |
| Por Una Cabeza | habanera + | 224 | 66 | 3.39 | kept (sets `min`) |
| Solace | habanera + | 312 | 152 | 2.05 | kept (sets `perBar`) |
| Bizet parent | habanera + | 340 | 90 | 3.78 | kept |
| *Auld Lang Syne* (anon.) | habanera − | 48 | 20 | 2.40 | rejected by `min` |
| *A Little Romance* | habanera − | 8 | 22 | 0.36 | rejected |
| *Sans* | habanera − | 16 | 12 | 1.33 | rejected |

The derived rules:
- **Tresillo:** `min` 24 and `perBar` 1.47. *All of Me* crosses, so the result is **UNKNOWN**: no `min`-and-`perBar` rule keeps The Crave and rejects *All of Me*. Even at the witness's 27 Crave bars (81 places), the per-bar value is 1.53, still below 1.63.
- **Habanera:** `min` 224 and `perBar` 2.05. Every counterexample is rejected by `min`. But Solace's reading went through the voice-home hand rule, which T7 found wrong on four of its bars.

## The decision taken from it

- The reviewer ruled route 2 for the tresillo (`docs/review/responses/33497357.md` §2).
- The orchestrator extended it to the habanera (the brief's §3a). The reasons:
  - one claim mechanism for both cells;
  - no named consumer needs a general rule;
  - the habanera numbers would need recalibration after HD2.
- What reverses it: a later named consumer with a predeclared calibration that separates its cases.

## After HD2 (the rerun, evidence only)

The same declared sets, read from the built catalogue on HD2's model with the verified hand rows applied (`build/CD1/calibrate_built.py`).

| Item | Declared | Located | Bars | Per bar | Under the strictest rule keeping the positives |
| --- | --- | --- | --- | --- | --- |
| exercise.tresillo.c / .f / .g | tresillo + | 24 each | 8 | 3.00 | kept |
| The Crave | tresillo + | 81 | 53 | 1.53 | kept (sets `perBar`, now 1.52) |
| *All of Me* | tresillo − | 114 | 70 | 1.63 | **crosses** |
| *Apex of the World* | tresillo − | 90 | 200 | 0.45 | rejected |
| *Mr Blue Sky* | tresillo − | 18 | 155 | 0.12 | rejected |
| Por Una Cabeza | habanera + | 224 | 66 | 3.39 | kept (sets `min`) |
| Solace | habanera + | 344 | 152 | 2.26 | kept (sets `perBar`) |
| Bizet parent | habanera + | 340 | 90 | 3.78 | kept |
| *Auld Lang Syne* (anon.) | habanera − | 48 | 20 | 2.40 | rejected by `min` |
| *A Little Romance* | habanera − | 8 | 22 | 0.36 | rejected |
| *Sans* | habanera − | 16 | 12 | 1.33 | rejected |

- **Tresillo:** still falsified on the corrected model. *All of Me* crosses the strictest rule that keeps The Crave.
- **Habanera:** still separates, by `min` alone. It stays curated-only under §3a anyway: one claim mechanism for both cells, and no named consumer for a general rule.

**Who carries each cell on this build:**
- `rhythm.tresillo` is carried by 18 items. It is established on the three controls only, by the family's contract with the witness agreeing.
- `rhythm.habanera` is carried by 30 items and established on none by any count.
- The claims that count come from the verified passage facts in `verified-facts.json`:
  - The Crave bars 21-26 (latin.6);
  - Por Una Cabeza bars 1-14;
  - the Bizet parent's bars 1-12;
  - the Bizet left-hand cut's bars 1-12.

  The last three prove the habanera for no rung yet.
- No clave, latin-groove or dotted-quarter drill item carries either cell.
