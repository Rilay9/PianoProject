# Second read: the reviewer's four responses at 122a5224 (HEAD 7de0ee2d)

Read-only, with no build and no test. Read: the four responses; the CL23 and CL15 briefs; `demandReadings.ts`, `readingState.ts`, `session.ts`, `TodayScreen.ts`, `progressStore.ts`, `evidenceJob.ts`; `material.ts`, `types.ts`, `record.ts`, `transfer.ts`, plus a grep of the learner-material consumers; `family_contracts.py`, `review.py`, `build.py`, `generate_exercises.py` (the tremolo maker), `identity_pins.json`, `test_family_contracts.py` and `content/catalog.schema.json`; the 18 tremolo/pentatonic rows of the local built `app/public/content/catalog.json`; backlog rows U113 :177, E50 :688, X42 :746 and X34; the three briefs' Record blocks and handoffs.

## 1. CL23's required change: agree, with a note the builder needs

The stop condition does not fire. The store alone can compute a protected set that contains the reader's reach, with no change to `demandReadings.ts`. That set is a superset, though, because the reach is not per item as the brief (premise 13) and the response (:13–15) describe it.

- **The actual reach.** `demandReadings` (:219–233) pools every row it is handed by skill (:220–226) and keeps the newest `DEMAND_WINDOW_READS` = 5 measured entries per reading-strand skill (:230, :62). That is per skill across items. The rows are the union of every sight-reading item's newest 500 (`TodayScreen.ts`:1387–1390, `READING_HISTORY` :1384, not exported). `session.ts`:2682 keeps the sight-reading skill's readings. The "rarely revisited item" case is really "fewer than five measured sight-reading reads in 90 days across all items".
- **The exact set is out of the store's reach.** Computing it needs the catalogue's `drill.kind` (`TodayScreen.ts`:1388) and the vocabulary's skill kinds (`demandReadings.ts`:228). The data layer has neither.
- **The superset the store can compute:** per (itemId, skill), the newest five measured entries. Any entry in the pooled newest five is also in its own item's newest five, because every newer entry of that item is in the pool. This matches the response's "for its item" wording. It over-protects by at most items × skills × 5 rows and folds only rows proven outside. The brief should call it a deliberate superset and give the reason.
- **"Proven outside" must mirror the reader's filters.** Otherwise a row the reader does reach gets counted as outside and folded:
  - (a) Count only measured, non-refusal entries (`demandReadings.ts`:223; `readingState.ts`:58), and count entries, not rows (:224).
  - (b) Evidence stamp. A row is read only if `evidenceDefinitions === EVIDENCE_DEFINITIONS` (`readingState.ts`:55). `EVIDENCE_DEFINITIONS` is a value (`evidence.ts`:190), but `progressStore.ts` imports types only from evidence (:37), and `holdsEvidence`'s note (:1002–1004) keeps the evidence module out of the store. A rule that needs no constant: count as newer only entries on rows stamped the same as the candidate. This is safe because a compacted row is never recomputed (`evidenceJob.ts`:91 `no-steps`), and a stamp bump makes the candidate stale too.
  - (c) The 500 cap. `sessionsForItem` takes the newest `limit` rows by `byItem` key and then sorts them by date (`progressStore.ts`:621–633). After a restore, older runs sit under newer keys (:617–619). So a newer-by-date row can fall outside the cap while the candidate is inside it. The number lives unexported in a screen file CL23 does not own. Two options: move it (which touches `TodayScreen.ts`), or fold nothing for an item whose key order and date order disagree above the candidate.
  - (d) The reader skips rows dated after `today` (`demandReadings.ts`:223). Compaction should not count rows dated after its own `now` as newer.
  - (e) Ties on `at` at fifth place. The stable sort's tie order follows the catalogue item order of the flattened union, which the store cannot see. Protect every row tied with the fifth.
- **Monotone.** A row outside stays outside. Measured rows are never deleted (`holdsEvidence` :1000–1005, `pruneSessions` :1073), and the window only moves forward as rows are added. The two exceptions are a device clock set back and a replace-restore.
- **A trigger gap neither document names.** `compactObservation` returns a row unchanged once `steps` is gone (:925). `compactSessions` counts such a row as settled and stops after `COMPACT_STOP` = 50 of them (:913, :948). A row protected at its first compaction and pushed out later is normally far behind the edge, so it would never be revisited. The deferred fold needs its own trigger. Under the superset, the only event that pushes a row out is a new run of the same item, so a `byItem` pass for the item `recordRun` just wrote (:317) is enough. The settled test must also treat kept arrays as not compact. Never folding is safe for `demandReadings`, but it leaves L69's budget unmeasured for exactly these rows.
- **Add to the discriminating case.** Beside the reviewer's six-reads case:
  - a two-item case: item A read five times recently, and item B with one old read. B's row is outside the pooled window but inside its own five, so it stays unfolded, and `demandReadings` is identical before and after compaction;
  - a newer row with a stale stamp, which must not count toward the five.

## 2. CL15's required change: agree, with a note the builder needs

**Identity in the built catalogue.** For example, `exercise.tremolo.c.left` is `{kind: generator, family: tremolo_octaves, version: 1, seed: null, recipe: {key: C, shape: octave, fingeringVerified: false, hands: left}, tempoBpm: 60}`. Where it comes from:
- `family_contracts.py`:146–148 stamps `drill.generator` as `{family, version: <contract version>, seed}`;
- `review.py`:248–261 adds the params (with `hands`) and `tempoBpm`;
- `build.py`:1082–1084 writes it as `provenance.identity`.

**Where the version enters.** The stored key is `materialKey` (`material.ts`:217–220), which canonicalises family, version, seed, recipe and tempoBpm. The exact-review equality is `review.py`:287–288 and `record.ts`:251. None of the 18 rows (12 `tremolo_octaves`, 6 `pentatonic`) carries `formerIdentities` today.

**No existing reader resolves an old generator identity.**
- `learnFormerIdentities` skips non-file current rows (:91) and non-file former identities (:93).
- `learnerMaterial` returns any non-file identity unchanged (:149).
- `learnerMaterialKeys` returns only the row's own key for a non-file identity (:241).
- `types.ts`:290 and the schema (`content/catalog.schema.json`:458–479, items `kind: const file`, `additionalProperties: false`) accept files only.

**The smallest widening: a generator-specific field.** For example, `provenance.formerGeneratorIdentities: Extract<Identity, {kind: 'generator'}>[]`, rather than widening `formerIdentities`.
- This leaves the E50a/E50b file path untouched, including the `tempoRepairedFrom` subset rule, which reads `one.sha256` (:97–99).
- In `material.ts`: a second map from `materialKey(former)` to the current generator identity, under the same rule that a current identity is never a former one (:79–82). `learnerMaterial` resolves a generator through it, and `learnerMaterialKeys` adds the former keys.
- Every existing learner-material reader then gets continuity with no edit of its own: `encounterStore.ts`:274, 299, 303, 332, 351, 387, 394, 426; `progressStore.ts`:350, 706–708, 730; `projectStore.ts`:167; `transfer.ts`:173.
- Guard 5 holds by construction: transfer reads `identity.family`/`material.family` (`transfer.ts`:146, 177, 190), and the bump leaves the family as it is.

Notes for the builder:
- **More files must enter than the response names.** It names only `types.ts` and `material.ts`, but the change also needs the schema (`content/catalog.schema.json`, with an identical copy at `app/public/content`), `build.py`'s attach step (:1080–1100, which writes former identities for file rows only), a committed relation table, and app unit tests. The lane is then no longer tools/content only (brief :3). Its harness needs `npm ci` in `app/`, and its chain needs Vitest, `tsc -b` and lint.
- **Prove "unchanged" per item, not by shape or form name.** The pins hold one digest per family (`identity_pins.json`:161–165, :246–250; `test_family_contracts.py`:243–256), so nothing pinned says a sibling's music is unchanged. Record each sibling's v1 per-item `music_digest` (the function the clash test already uses, :237) in the relation. The build or a test then re-proves that the current per-item digest equals it, the generator analogue of the byte re-proof at `build.py`:1087.
  - This matters in this lane. `make_tremolo_octaves` writes a left-hand item as two staves with a silenced right (`generate_exercises.py`:2625–2626). U68's census (brief :48, "right-hand part carries zero struck notes") can therefore pick up the three octave-left tremolos. If U68 moves them to one staff, they are changed items and get no continuity.
- **What "stops matching" covers.** Progress rows are keyed by item id (`db.ts`:1151), and the ids do not change, so mastery and status never lost continuity. The relation serves only the material-keyed readers listed above. The brief's "learner history would stop matching" (:87) should say so.
- **Exact review.** A version change marks review events stale (`review.py`:316). A grep of `content/review/decisions.jsonl` finds none of the 18 ids, so guard 4 makes no review stale today.

## 3. E50c, X42 and U113 closes: nothing in the record contradicts the three approvals

The close lines still need these points:
- **E50c.** Its Record says `closes: —`, which is correct. The response lets the E50 chain close too. The E50 row (:688) is still pending, and its Fix column records Built only for E50a (Entry 166) and E50c (Entry 190). E50 itself (Entry 163, merged 16df185b) and E50b (Entry 181, merged d5c6491f) are recorded in `in-flight.md`:22 and :26 but not on the row, so the close line should name all four.
  - The precondition behind Q2 holds at HEAD. None of the eight repaired rows carries the `tempo-defaulted` tag in the local built catalogue, so a Score run of one stores `source: 'written'` (`ScoreScreen.ts`:3478, :3499–3500) and is comparable.
- **X42.** Its Record says `closes: X42`. Row :746's Fix column still opens with the superseded "within R = 1.1" rule ahead of its Built note, so the close line should state the serialization rule instead. Satie's divergence is recorded on the X34 row, as the response says. `ragtime.7`:47–48 makes no pace claim, which fits the ruling.
- **U113.** Its Record says `closes: U113`, but the approval makes the close conditional on the owner's one-line product decision. Row :177 says the question is with the owner. U113 stays open until that line is recorded; do not carry out the Record's close on this approval alone.
  - For the orchestrator: the owner's standing order of 2026-09-23 (no distortion, then look-ahead, then the count) is in memory. The trade cell's disagreement over what counts as look-ahead (a system gained against a greyed row lost, handoff :7) is exactly what that order does not settle.
