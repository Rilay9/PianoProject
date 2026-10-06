# Reviewer handoff — Entry 264 (SR4): the hold stored on the run at play time; your required change on SR3, applied

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.**

Implementation HEAD: `fe33cba9`. Respond in `responses/sr4-landing.md`. The artefact review of one bounded change; by your `sr3-lb1-landing` §3, SR3 is closed once it lands. Nothing heard.

## The required shape, as built

`opened.hold?: string` on the run header (`app/src/data/db.ts`), meaning only that this sight-reading phrase was deliberately generated under this lower learner-rung hold while `opened.rung` judged the run. The Score screen decides it when it writes the phrase (`storedHold`, pure and exported: the route's hold, only when a judging rung exists, the hold differs from it and the curriculum names the hold's rung) and `runHeader` stores it; an unheld run stores nothing. `rungState` reads the stored fact (`heldWhenPlayed`: held when `opened.hold` is present and differs from `opened.rung`); the inference `heldBelowItsRung` is deleted (no consumer left; SR2's offer comparison is untouched; the adversary test keeps the comparison as its oracle); `rungStates.ts` and `SkillsScreen.ts` compute nothing and `rungStates` no longer loads the catalogue. Legacy rows with no hold are never classified held. `material` is unchanged; no `DB_VERSION` change: every row path copies the whole row (the run write, the rung rows, the evidence job's `replaceSessionEvidence`, `compactObservation`, `exportAll`, `streamBackup`, `importAll` into a fresh store), verified by round-trip cases that were green on the base because no whitelist exists.

## The required tests

The five SR3 cases and the 75-run sweep green on the stored fact; a legacy-row case; `storedHold`'s cases; a check that no source file names the inference. The adversary you asked for (`heldFactStoredAtPlay.test.ts`): one held run (the 1.1 daily read judged by 1.5) and one unheld run (`-2-right` judged by 2.2) written through `recordRun` and read back through `loadRungStates`; then the in-memory vocabulary moved (`interval.skip` to 2.1; `range.beyond-position` to 2.2) so that today's comparison classifies them the other way. Red on Entry 262's code: "the held run was re-credited to 1.5 once the vocabulary moved" and "the unheld run lost its 2.2 credit once the vocabulary moved"; green on the stored fact; the oracle asserts each move flips the comparison.

## Recorded

A store holding held runs from Entries 258-262 has none of them marked held and, as you required, they are not guessed, so such runs now credit 1.5 (none known; no real store read). No browser case plays a held run through to the store; the write path is proven through `storedHold`, the function `runHeader` reads. The encounter source carries no hold (not a credit path). The whole unit suite, typecheck, lint and the SR2/SR3 browser case are green on this head (the one standing local red is the CRLF-only blues.3 case). Two pins CI caught after Entries 262-263 are fixed on this branch: the 3/4 sweep now draws eight seeds over every rung and move (thirty ran past the runner's cap), and the loop spec is listed as a reader of the MIDI mock and the score-controls helper in `checks.json` (the check-map change LB1's brief flagged).
