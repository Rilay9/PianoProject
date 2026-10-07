# Reviewer response — E59 (Entry 184)

## Verdict

**APPROVE**

The seam now matches the product fact it was meant to encode: when an edition states no tempo, the converter may supply 96 for playback, but it must not manufacture a printed metronome mark. The domain inventory is complete for the current converter callers; the 238 moved identities are continuity repairs rather than tempo repairs; and the app reader/screen checks correctly show that no learner timing or playback event changed.

## 1. “of the suggested tempo”

**Settled: keep it.**

For a `tempo-defaulted` row, 96 is the app/converter’s suggested playback tempo, not an edition-written tempo. Removing the invented printed `quarter = 96` makes that wording *more* accurate, not less. E60 remains the separate truth gap for kern/MuseTrainer rows that are not tagged defaulted and therefore still say “of written” for a supplied tempo.

## 2. `tempoChanged: false`

**Confirm.**

The field answers whether the repair changed the tempo against which an old stored run was measured. E59 changes representation only: 0 of 2,013 rows change tempo-event position, bpm or source, and the moved files still sound the same 96. Marking these relations `tempoChanged: true` would incorrectly make valid historical tempo evidence incomparable.

This class is intentionally different from E50/E57, whose repairs changed the tempo truth a run must be compared against.

## 3. kern and MuseTrainer — two relations each

**Confirm the two-relation shape.**

Those build-generated files have two concrete historical identities that matter: the dated identity E50a recorded and the undated identity the catalogues then served. A single dated relation would leave the latter without learner continuity. PDMX’s committed-file path has only the one relevant relation here; the difference is provenance, not a special rule for the corpus.

## 4. excerpt cuts and zip system

**Leave the cut relations at their actually re-proved system-0 identities here; E55 owns the platform-zip problem. Do not synthesize system-3 aliases in E59.**

This is the same boundary accepted at E50b: a repair alias names a concrete historical identity that is proved, not an identity manufactured because another platform *could* have produced it. E55 exists because the cutter itself still writes platform-dependent ZIP identities; it must make that domain deterministic and account for the concrete served cut identities together, including Wabash and these three E59-derived cuts. Fixing only E59’s three cuts here would leave the same class split across seams.

If E55’s read proves a specific system-3 old cut was actually served, that concrete identity should be related there. Until then, keep E59’s relation table evidence-based rather than speculative.

## Content / identity check

I checked the E59 itemisation as a mechanical content claim against the implementation and its exhaustive inventory:

- 169 PDMX rows are exactly the committed `tempoDefaulted` class moved by the no-tempo transform;
- 60 kern and 6 MuseTrainer rows are the build-generated callers that take the branch;
- 3 excerpt cuts derive from moved PDMX parents;
- Mutopia, authored ABC and generated material contribute zero rows to this branch;
- the transform removes only the manufactured printed mark while preserving the sounding 96 and the app’s tempo-event reading;
- the identity/continuity table uses `tempoChanged: false` for this class and the lineage test proves old runs remain comparable.

No item in the 238-row manifest was skipped at the **claim/inventory** level. I did not manually open all 238 binary scores one by one; four representative score renders were checked by the lane, while the full class is established by the exhaustive byte/reader/inventory checks. No musical-quality or listening judgement is needed because the sounding tempo is unchanged.

E59 may close. E55, E58 and E60 remain their separate recorded follow-ups.