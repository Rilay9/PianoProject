# Re-check after E50a/E50b (amendment item 5)

HEAD at check time: `050ce620`. Note: this commit itself (landed during this
check) annotated `docs/prompts/convergence-2026-09-30.md`'s cluster "Waits on"
lines with landed-lane markers and says the amendment-§5 rows are "being
re-checked and go to the reviewer with the next handoff" — a parallel effort.
It touched only that doc's cluster prose (lines ~1-322); the row table (`##
The table`) and all code below are unaffected, and this report is an
independent read of the code and the record, not of that annotation.

Scope: CL23 L53, L69; CL17's E50a-dependent `types.ts` decisions (R1, G6);
G71 (CL11); plus every RE-CHECK row in the map whose dependency column is
exactly `E50a` alone (grepped `## The table`): E50, L69, X37.

---

## L53 (CL23) — db.ts / progressStore.ts

(a) Row: "PERFORMANCE_REACH 2,200 (progressStore.ts:846); sessions carry
byItem and byDate indexes only (db.ts:1153-1154)." Waited on: `E50a; the next
DB_VERSION bump`.

(b) Entry 166 (E50a), `docs/pending-review.md:32692`: "no `DB_VERSION` move,
no upgrade, no stored row written." E50a's progressStore.ts edit was for
former-identity resolution only, not this area. At HEAD: `PERFORMANCE_REACH
= 2_200` at `app/src/data/progressStore.ts:851`; `sessions.createIndex`
calls at `app/src/data/db.ts:1153-1154` still only `byItem`/`byDate`;
`DB_VERSION = 9` at `app/src/data/db.ts:70` — unmoved by E50a or E50b.

(c) **Now buildable as stated.** E50a landed without touching this area or
bumping `DB_VERSION`, so the file is free and the build is its own: add an
index (or flag) letting Progress list performance-flagged runs past the
2,200-run reach, under a new `DB_VERSION` bump (10) with a migration test.

## L69 (CL23) — progressStore.ts

(a) Row: "compactObservation drops only `steps`; byDemand and otherDemands
survive compaction." Waited on: `E50a`.

(b) Entry 166 as above. At HEAD, `compactObservation`
(`app/src/data/progressStore.ts:865-869`) still destructures out only
`steps`; `byDemand`/`otherDemands` are untouched and are read elsewhere
(`progressStore.ts:273`). E50a's edit to this file did not touch this
function.

(c) **Now buildable as stated.** Fold `byDemand`/`otherDemands` to counts at
compaction, with the budget test carrying evidence rows.

## R1 and G6 (CL17) — `types.ts` decisions

(a) R1: "`level`, `levelSource`, `levelBand` and `abrsmGradeApprox` are all
still carried... `levelLabel` prints one scalar." Waited on: `E50a; G96`.
G6: "generate_exercises.py:941 writes levelSource 'judged'... LevelSource
is…" Waited on: `E50a; R1`.

(b) Entry 166 (E50a) touched `types.ts` only for provenance/identity fields,
not the level fields. Entry 168 (G96), `docs/pending-review.md:32818`,
merged at `48bfc167` (`app/src/ui/widgets.ts` git log). At HEAD: `level`
(`types.ts:54`), `levelSource` (`:64`), `abrsmGradeApprox` (`:128` and
`:632`), `levelBand` (`:616`) all still present — four numbers, one scalar
still printed. `LevelSource` (`types.ts:28`) is still exactly `'judged' |
'estimated'`; `generate_exercises.py:941` still writes `'judged'`;
`selectors.ts:125` still ranks estimated 0 / judged 1.

(c) R1: **needs the reviewer's decision.** Both named blockers (E50a,
G96) have landed, so the question — which one level survives and how it is
derived — is now fully ripe to decide; nothing here needs more building
first.
G6: **still blocked**, by R1 — its own dependency (R1) has not been decided
yet, independent of E50a.

## G71 (CL11) — encounterStore.ts / DrillScreen.ts / LabScreen.ts

(a) Row: "E50a edits encounterStore.ts. DrillScreen.ts and LabScreen.ts
import no encounterStore (grep)." Waited on: `E50a (encounterStore.ts);
X15`.

(b) E50a's diff did touch `encounterStore.ts` (git log: `338cc916`), for the
same former-identity/material resolution as elsewhere. At HEAD, `grep
encounterStore app/src/ui/screens/DrillScreen.ts
app/src/ui/screens/LabScreen.ts` still returns nothing — the premise is
unchanged. X15 (CL05): per `docs/prompts/backlog-2026-09-25.md:719`, its
brief was only drafted 2026-09-30 ("with the reviewer before dispatch, Entry
187"); no Entry past 182 exists in `docs/pending-review.md` — X15 has not
been dispatched or built.

(c) **Still blocked**, by X15 (not yet dispatched). E50a's part of the
dependency is cleared, but the underlying question — is a drill card's
prompt a hearing a familiarity reader should consume — also still needs the
reviewer's decision once X15 lands.

## E50 (CL03) — dependency column is `E50a` alone

(a) Row: "conditionally approved at ba0126ad... E50 runs only after E50a...
which is [in flight]." Evidence needed: "E50a's landing and its
identity-alias semantics."

(b) Entry 166 (E50a) landed and unblocked dispatch. Entry 163 — E50 itself
— `docs/pending-review.md:33616`, merged `16df185b`: the seven bundled
PDMX rows (plus the Wabash cut) now play at their printed tempo instead of
the tempo-defaulted 96, via `tools/content/repaired_identities.json`
relating each repaired file to its old identity for learner continuity
only. Done item 1: "The ruling — built as quoted: the converter changed,
identities re-measured, the stale approval handled explicitly."

Entry 163 left three reviewer questions open. Entry 181 (E50b),
`docs/pending-review.md:34587`, is the required correction answering two:
it adds the Wabash cut's own relation and a tempo guard so a run naming one
of the eight repaired ids "meets no standard that asks one, however high
its stored percentage" — refusal, not rescale. The third (mastery-day
residue) stays a live, separately-named follow-up question in E50b, not a
re-check of E50.

(c) **Closed by the landing** — by E50 (Entry 163) and E50b (Entry 181)
together, both dispatched once E50a landed. Built and merged; the
mastery-day residue is E50b's own open question, not part of this row.

## X37 (CL03) — dependency column is `E50a` alone

(a) Row: "at the next quarry each out-of-band piece gets a placement review,
never a widened band... The quarry is E50a's file." Evidence needed: "after
E50a: the next quarry's re-measure under one definition, with the three
placements reviewed."

(b) `tools/content/pdmx/quarry.py` was last touched at `392890bc`, well
before E50a — E50a never actually edited it; the row's premise was about
lane ownership during E50a's window, not a code change. The ruling exists
(`responses/aa16c702.md`, quoted in full at
`docs/prompts/backlog-2026-09-25.md:741`): move a piece if the estimate is
credible, correct the difficulty truth if musical review shows it wrong,
widen a band only if the lesson's own range was too narrow. Entry 163 (E50)
only checked the seven repaired rows' own levels/bands ("No band is left; no
placement review is owed" — that note is scoped to those seven, not the
full corpus). X31's full re-measurement (140 of 542 PDMX rows would move)
has not run since.

(c) **Now buildable as stated** — the file lock is gone and the ruling is
already recorded; the build is to run the next PDMX quarry re-measurement
under the committed difficulty model and apply the ruling per out-of-band
piece (move / correct / widen-only-if-too-narrow). Whether any specific
piece's new placement is musically right is **unverified as music**.

---

Not in scope here (same cluster, not named by item 5, not RE-CHECK-only-on-
E50a): L51, L99, E39 (CL23, plain DECISION rows); R16, R28 (CL17); R27 and
S38 (dependency includes E50a plus another named blocker, so excluded by
"only E50a").
