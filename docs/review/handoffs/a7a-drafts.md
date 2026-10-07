# Reviewer handoff — the next two chains drafted (A7a.3, St James Infirmary; A7a.1, Blues Riff in C); one app-wide counting gap

**Scoreboard: 1 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** A7b.1 stays `draft`; its BB2, PF2 and PH2 lanes are running.

The commit carrying this handoff. Respond in `responses/a7a-drafts.md`. Response required before either probe dispatches (new chain designs, FABLE §10). Nothing heard.

## 1. What to read

- `docs/chains/A7a.3.yaml` and `briefs/probe-stjames.md` (14 steps; St James as a minor-key tune to walk and comp on, never as the minor twelve-bar model, per R26).
- `docs/chains/A7a.1.yaml` and `briefs/probe-bluesriff.md` (15 steps; the riff as transfer material, its B natural kept as written).
- Both pass the checker as drafts; the brief lint passes. The preflight finds 15 FAILs on A7a.3 and 22 on A7a.1, every one needing a placement decision, a build or an intake (listed in each record's header and below).

## 2. Ids

FABLE §2 step 5 names jobs, not ids. "Jam comping and walking bass" matches only a SHOULD row (`ABILITY-MAP.md:250-251`); the one MUST block naming St James is A7a.3 (`:350-354`), whose CONTROL is the minor-blues walking bass, so the record is A7a.3. Blues Riff in C is A7a.1's full-form transfer (`:315-316`). Confirm, and I will name the ids in FABLE §2.

## 3. One app-wide gap, verified at the code

`app/src/evidence/rungState.ts` never reads which hands a run played (`meetsStandard`, `measured`, lines 220-254; the word does not occur in the file), while the skill evidence does (`app/src/evidence/evidence.ts:307`). So a one-hand Duet run of a two-hand item meets a run requirement, against both drafts' `never_credits` and any rung whose item means both hands. It is app-wide, so app work under FABLE §10. Proposed: a requirement may say `hands: both`, read from `SessionRow.hands.played`; and a preflight class that fails a counted step whose tool can play one hand when the requirement does not say which. Rule on the shape.

## 4. Decisions before the probes

1. **The dispatch rule and fact-gathering probes.** These probes clear at most Blues Riff's six "not in the catalogue" FAILs; the rest are placements and builds the probes inform. May a probe that builds nothing dispatch with FAILs it does not clear?
2. **The minor twelve-bar's bars 9-10** are written two ways: the generator ♭VI7 then V7 (`tools/content/generate_exercises.py:3963-3965`), the Lab V7 then iv7 (`app/src/engine/sightReading.ts:2226-2230`); no lesson states either. The probe researches a cited source; say if you want it decided otherwise.
3. **The walking-bass family's job:** NAMED-PATTERN presented as music (needs a sourced definition and a near-miss, both UNKNOWN today) or CONTROL presented as a drill.
4. **A7a.3's home:** blues.6 (the map) or jam.6; St James and St. Louis as optional songs there (the Insensatez precedent) or opened earlier as review; the requirement naming `exercise.walking-bass.c.minor-blues`.
5. **A7a.1's counted run:** place the C shuffle on blues.8 with a requirement naming it (today blues.8 counts any of five unrelated exercises).
6. **Blues Riff's playable edition:** a re-staffing build (riff on the upper staff, roots on the lower), and whether the rootless voicings stay.
7. **A checker rule for authored exercise ids** (`exercise.blues.twelve-bar-shuffle.c` cannot resolve today), without which A7a.1 cannot become `reviewed`.
8. **St James waits for PH2:** today's chart shows only the first chord in 13 of its 24 bars.
