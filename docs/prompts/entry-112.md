### Entry 112 — G1: one factual encounter model — what this learner met, as small durable rows beside the runs (`encounters`: viewed once a visit, heard, demonstrated; `DB_VERSION` 8, no other store touched), the runs staying the record of runs and every run the sessions cap deletes folded first into a durable, evidence-free summary per material (`contacts`), one query over the three (`encounterStore.familiarity`: per facet the most recent time or null, passage by passage, an excerpt's bars in its parent's, the composition beside), sight-reading's first contact derived from that history and a visit id instead of a per-visit flag, the same fact written on every notated, excerpt and import run, an import its stored bytes, D4's contact saying how it was met (2026-09-29)

**Judgement.** Nothing was heard: the phrases read here are generated sight-reading phrases, **unverified as music**, and G1 claims nothing about them. What I looked at: the Progress history line and the summary sheet at 342 × 740 after today's phrase was played to the learner at noon and read in the evening (`pictures/g1/progress-history-342x740.png`, `summary-heard-at-noon-342x740.png`, the DOM and stored rows in `pictures/g1/facts.json`), the stored rows of the unit harness, and the code.

- **What the history line says after a phrase was heard earlier** (observed, the probe on G1's app): the row reads *Sight-reading generator, level 1 · 2026-09-29 23:00 · Keep tempo* over **100% at 70% · not first sight · 0 min**, the meta line whole inside its row (`metaFitsTheRow: true`: its `scrollWidth` within its `clientWidth`). The sheet over the run: **Run finished**, then *Sight-reading counts only on music you have not heard — this run is kept as practice.*, and under *Not judged*, *Sight-reading — it counts only on music you have not seen or heard*. The store: one run, `unseen: false`; three encounters — the noon visit's `viewed` and `demonstrated`, the evening visit's `viewed`, each with its visit id and its source (`today`, `daily-read`, rung 1.5).
- **Heard the day before** gives the same line and the same stored fact: first contact compares visits, never days (the harness's *heard, left, returned later* case stores `unseen: false` and the history helper prints *not first sight*). The browser case and the picture use noon and evening of one day because a day later Today's card carries the next day's phrase, and the brief's adversary is that one.
- **Before G1** (HEAD's app, the red of the new browser case): the same evening run was stored `unseen: true` — a first reading of a phrase heard at noon — so by `historyDetail`'s rule its line carried no flag, the reading was evidence, and the day's read was ticked by it (inferred from the stored flag and the code; HEAD's line was not captured as a picture).
- **As observations against the rules:** the record now says what happened; a perfect reading of music already heard does not count as sight-reading and the learner is told why, once, on the sheet, and again on the history line. What it costs: **today's phrase opened and left, or reloaded, before it was played can no longer be the day's read** — the rule the brief and the reviewer set (a viewing on another visit is prior contact) — and Today's card still offers it as unread, because the card reads runs only (Follow-ups 1; X's L32 recheck). The sheet says why and offers *New phrase*.
- **Adjacent, not G1's:** the history's time label is the UTC hour — *23:00* for a run at 19:00 local — because `ProgressScreen.drawHistory` prints `session.at` sliced as text (Follow-ups 2).

## The mechanism

**The fault.** The Score screen remembered a hearing for the visit only (`phraseHeard`) and stored nothing; `unseen` was decided per visit from the seeds on record and that flag; a notated piece or an import carried no first-contact fact; the only "seen" in the store was the flag on generated runs. And the sessions cap could delete the run that was the only proof an item was met (G63; the reviewer's constraint on D4).

**The discriminating tests** (red on the committed code, green now): a phrase demonstrated on one visit and read on the next is stored `unseen: false` (was `true`: the e2e red, and the unit harness's 14 of 15 cases red with HEAD's Score screen); a practised passage pruned by the real cap is still practised, and contact still `met` (the `prune-folds-nothing` mutant turns it red); a piece played again stays passed and meets its rung (red with HEAD's rung state).

**The change, on the mechanism:**

1. **The store** (`db.ts`): `DB_VERSION` 8 creates `encounters` (keyPath `id` = `<visit>:<n>`, indexed `byKey` on the material's key and `byItem`) and `contacts` (keyPath the material's key); the upgrade touches no other store (the version-7 fixture's every store, rows and keys, deep-equal before and after). Both stores are in `STORE_NAMES`, so the backup carries them; a merge restore puts encounters by id (restoring twice adds nothing) and joins summaries.
2. **The summary before deletion** (`progressStore.pruneSessions`): the one transaction now spans `sessions` and `contacts`; each run the cap deletes is folded (`foldRun`) into its material's summary (`mergeSummaries`, a join: first the earlier, last the later, ids and sources as sets), keyed by the material or, for a run that knew none, by the id with `byId: true`. Only the projection is kept: material or id, item ids, and per span `practised` or `performed`, the printed bars, first, last, sources — never evidence, accuracy or a verdict.
3. **The query** (`encounterStore.ts`): `familiarityIn(target, history, { visit })` and `familiarity(target)` over the store — facts from encounter rows, live runs (`rungRows`) and summaries; matched by material (D4's `sameMaterial`; `materialKey` agrees with it), by id where the row knew no material and the target's id names its material (never for a runtime phrase), or through the catalogue's hierarchy (an excerpt's bars normalised into its parent's by `fromBar`); covered → the facet, touched only → `partly`; the composition facet over every item of `provenance.composition`.
4. **The Score screen** (`ScoreScreen.ts`): a visit id minted as the screen opens; the material a run plays computed once (`material.playedMaterial`: the phrase's identity, an import's loaded bytes, the row's); the history read beside the engraving and awaited before play; a viewing written where the notation is first drawn (never in Blind); a playback written by the learner's action; `unseen` derived at the summary (phrase whole; anything else over the bars the run covered) and read again before storing (`confirmFirstContact`), which only ever turns a first contact into none and, for a reading, says so on the sheet.
5. **The first-contact fact on every run, and its readers scoped** (`db.isPhraseRun`): see Questions 1.

## The query's table (`familiarityIn`; `encounterModel.test.ts`)

| History | Asked | Answer |
| --- | --- | --- |
| nothing | the piece | every facet null, `byId: false`, `partly` null, `composition` null facets |
| a viewing (another visit) | the piece | `viewed` at, the rest null — viewed, not practised |
| *Play it to me* | the piece | `heard` at, `demonstrated` null |
| *Hear it* | the piece | `heard` and `demonstrated` at (heard is the superset, explicitly) |
| a run (no evidence, or not measured and answered, or `unseen: false`) | the piece | `attempted`, `practised` at |
| a performance take | the piece | `attempted`, `performed` at; `practised` null |
| a run over bars 1–8 | bars 1–8 / 3–5 | `practised` at |
| a run over bars 1–8 | bars 25–32 | null, `partly` null |
| a run over bars 1–8 | bars 5–12 / the whole | `practised` null, `partly.practised` at |
| a bar held down (bar 3) | bar 3 | `demonstrated` at |
| the whole piece played | its excerpt bars 25–32 | `practised` at |
| excerpt A (bars 1–8) played | excerpt B (25–32) | nothing, `partly` nothing |
| excerpt A played | the whole piece / bars 2–6 | `partly.practised` / `practised` at |
| excerpt C (5–12) | beside A | `partly.practised` |
| bars 2–3 of excerpt B's own score | the parent's 26–27 / 25–26 | `practised` at / null |
| the piece practised over 25–32 | excerpt B / excerpt A | `practised` at / nothing |
| another arrangement heard (same `provenance.composition`) | this arrangement | notation facets null, `viewed` null; `composition.heard` at |
| the same, target naming no composition, or no catalogue | — | `composition: null` (unknown, never manufactured) |
| a run with no material (legacy) or `none`, same id | the piece | `attempted`, `practised`, `byId: true` |
| a run of other known material, same id | the piece | nothing, `byId: false` |
| a legacy run of a reading row | a phrase of it | nothing — a row id names a recipe, every seed other material |
| a viewing of this visit | asked by this visit / another | null / at |
| a pruned run's summary over bars 1–8 | bars 1–8 / 25–32 | `attempted`, `practised` at / null |

## The adversaries (Part 27's, at this layer)

| Adversary | What the history holds | What the app says | Test |
| --- | --- | --- | --- |
| view without playing | `viewed` | viewed, not practised | `encounterModel` › each kind |
| hear before playing | `demonstrated` on an earlier visit | the run `unseen: false`; the evidence a refusal *condition:unseen*, no measured record with `firstContact` | `firstContactOnTheScore` › heard, left, returned; `lab.spec` › heard at noon |
| practise bars 1–8 | a run over 1–8 | bars 25–32 novel; first contact over them true, over the whole false | `encounterModel` › range rule, first contact › a passage |
| an excerpt over practised bars | the piece over 25–32, or whole | excerpt B practised; its first run `unseen: false` | `encounterModel` › an excerpt over bars practised; `firstContactOnTheScore` › the piece played whole |
| a duplicate import | the first import's run and viewing, by sha256 | contact `met` (`metAs` the first id); the duplicate's first run `unseen: false` | `firstContactOnTheScore` › an import is its stored bytes |
| another arrangement heard | a hearing of arrangement E | `composition.heard`; this notation `viewed: null` | `encounterModel` › composition facet |
| a new seed of the same family | a run of seed 8 | seed 9 first contact; contact `unmet`, `metById` | `encounterModel` › first contact, D4's cases |
| a planned sight-read heard at noon, read in the evening | a demonstration on the noon visit | the run not first contact; *not first sight* | `lab.spec` (Today's door; the rule and screen are the Library's too); `firstContactOnTheScore` (route from the Library) |
| the same passage after a restore | encounters, summaries in the file | the same answers | `encounterModel` › backup; `encounterRetention` › backup after pruning |
| **the retention adversary** | bars 1–8 practised, no evidence, no rung; a legacy run beside it; the store at `MAX_SESSIONS` + `PRUNE_SLACK`; a run recorded as every run is, whose own tidy prunes | both runs deleted; the passage still `attempted` and `practised`, bars 25–32 null, excerpt 1–8 practised, excerpt 25–32 nothing; `contact` `met`, `how: ['played']`; the legacy id `met-by-id`, `byId`; a backup taken after the prune restores the same answers; the summary holds only the projection | `encounterRetention.test.ts` |
| nothing but a viewing or a playback writes | — | `recordEncounter` called from the Score screen's two writers only | `encounterModel` › the one writer |

Save without opening, retired-and-returned, one play creating no project, "learn this" before success and pausing deleting nothing are G1b's.

## The visit (the reviewer's constraint)

A visit is one opening of the Score screen: its id minted when the screen is built, named on every encounter written there. First contact excludes the viewings of **this** visit and counts every other visit's.

| Case | Stored | The run |
| --- | --- | --- |
| viewed on this visit only, then read | one `viewed` (this visit) | `unseen: true`, a measured record with `firstContact` |
| viewed, Back, returned, read | two `viewed`, two visits | `unseen: false`, *…not seen before…* on the sheet |
| viewed, reload, read | two `viewed`, two visits (module memory and database handle reset between) | `unseen: false` |
| another tab's viewing before this one opened | the other tab's row written straight to the database | `unseen: false` (read before play) |
| another tab's viewing after this one opened, before the run was stored | the same, after the history read | `unseen: false` (read again before storing; the mutant `no-recheck-before-storing` is caught) |
| Blind | nothing | no viewing (Blind draws none; toggling it is a new visit) |

## The hearing kinds (the reviewer's constraint)

| Action | Row | Bars |
| --- | --- | --- |
| `Hear it` | `demonstrated` only | the loop's, or none (the whole) |
| a bar held down | `demonstrated` only | `[bar, bar]` |
| *Play it to me* (a Listen run) | `heard` only | the loop's, or none |

One playback, one row, one kind (`hear-it-writes-heard` caught). The query's `heard` is the superset, by name; `contact.how` lists the kinds stored.

## Done

1. **Item 1, the store and durability** — `encounters` and `contacts` at version 8; the visit id; the hearing kinds; rows never pruned and in the backup, a fixture round-trip; one mechanism for run contact, the summary folded before deletion in the same transaction, idempotent, evidence-free, carried by the backup; the facets by what happened — **the attempt threshold is the run record's own: every stored `SessionRow` is an attempt — the Score screen stores one only for a run of a judging mode that ended, finished or stopped (never a Listen or Free run, which record nothing, and a run nothing heard only with its answer), and the drill and paper screens store theirs at a run's end**, practised every such run but a performance, performed only `performance: true`; legacy rows by id with `byId`; the retention adversary through the real pruning path. Technical: done. Pedagogical: none claimed.
2. **Item 2, identity and passage** — an import's material is the sha256 of the stored text the Score screen loads (`material.textIdentity`), written by `runFacts` on its runs and on its encounters; passage scope in 1-based printed positions (E1's count), an excerpt's bars in its parent's.
3. **Item 3, the one query** — `familiarityIn` / `familiarity`, the composition facet read from `provenance.composition` (present on 819 rows, carried to excerpts), `byId`, no boolean called familiar.
4. **Item 4, first contact derived** — the phrase's `unseen` from the history and the visit, `seedsOnRecord` and `phraseHeard` kept (the seed guard; the fast path, now any item's); `unseen` written on every notated, excerpt and import run for the first time.
5. **Item 5, contact** — `progressStore.contact` reads runs, encounters and summaries; `met` gains `how`; D4's verdicts unchanged (the three `contactNovelty` assertions gained `how: ['played']`, their verdict fields as they were); `evidence.ts` and `ladder.ts` untouched.
6. **Items 6–7** — the adversaries above; legacy history answered from runs, nothing manufactured.
7. **Docs** — `docs/04` (§5's paragraph on what the screen writes and reads, §5f's new sentence, §6's history line) and `docs/01` §4.5 (the two stores, version 8, the module list, the bullet) edited here; the rows for `docs/02`, `docs/03`, `docs/08` below.

## Not done

1. **The session's transfer offer still reads contact from runs alone.** `session.transferOffer` calls `contactIn(rows, item.id, material)`; "unmet by any kind" there needs `contactIn(rows, item.id, material, { encounters, summaries })`, with Today loading both into the session input (`encounterStore.encountersFor` / `allEncounters`, `progressStore.contactSummaries`). `session.ts` and `TodayScreen.ts` are outside G1's files (the brief names them); E2a is binding the chooser's novelty to contact and can take the argument. Until then a scale heard in the Library and never played can still be offered as "something new", and a pruned transfer run's item reads unmet on that path (the store-wide `contact` is durable). No verdict D4's cases give changed.
2. **Other screens' playbacks** — the drill screen's and the lab's *Hear it* write nothing (not G1's files; item 8). The lesson page renders no identified material and has no *Hear it*; the excerpt view with one is the builder's workbench.
3. **`materialOfItem` still answers `none` for an import** where the bytes are not in hand (the brief's deviation clause: hashed where the Score screen loads them and passed down instead).
4. **In a browser:** the held bar, the reload, the back-and-return and the two tabs are unit-harness cases only (the real Score screen, stubbed engraver and session, real stores on a fake IndexedDB); the browser case is the noon-and-evening one.

## Follow-ups (recorded, not fixed)

1. **P2 — Today's daily read after an earlier viewing.** Opened and left, or reloaded, before it is played, today's phrase can no longer be a first reading; Today's card still offers it as unread (it reads runs only). The strict visit rule is the approved one; the card should read the viewings, or offer a fresh phrase — the session's contact recheck (X, L32) or Today's composition.
2. **P0, small, adjacent — the Progress history prints the UTC hour** (`drawHistory`: `session.at.slice(0, 16)`): a 19:00 run shows *23:00* here, and after 20:00 in the US the date too is the next day's, against `dayKey`'s local rule. Seen in G1's product look; one line; not G1's.
3. **P2 — first contact and the composition.** A notated reading's `unseen` reads this notation and its passages; another arrangement heard does not make it `false`. The composition facet is in the query for G2 and X to weigh.
4. **P3 — `encounters` grows without a cap** by design (a few rows a visit). A budget check like `sessionRetention.test.ts`'s is worth adding before it is large.
5. **P2 — passage identity under transformation** (Part 27's continuation): a hands-separate run covers its bars for both hands in G1's facts; transposition, tempo and simplified arrangements are other material or the same by identity only.
6. **Backlog:** G63 (contact facts prunable) is built for the store-wide contact and pending on the session path (Not done 1); L97's model is built; S8's derivation is built; L59's "heard" kind is available to E2a.

## Questions

1. **The first-contact fact on every run, and the four readers that gave it sight-reading's consequences.** The brief's item 4 (the reviewer's answer 3) writes `unseen` on notated and imported runs, "read by nothing new". The premise does not hold at the lines: `recordRun` treated `unseen !== undefined` as "a generated phrase" (no pass, no mastery, no best) and `unseen: false` as "not evidence"; the rung state's `measured` refused `unseen: false`; the history line printed *not first sight* on it; the evidence job read its presence as a phrase's mark. Written as briefed and left so, every repeated piece would lose its pass and its rung credit. I kept the one field and scoped those readers to a phrase's run (`db.isPhraseRun`: the recipe, or the flag on a run whose material is a sight-reading generator's or absent — which reads every row written before G1 exactly as before), touching `rungState.ts`, `evidenceJob.ts` and `ProgressScreen.ts` (no other builder's files). The alternative is a separate field for the non-phrase fact, touching no reader; Part 26 §1's "unseen never the universal novelty flag" leans that way. A one-sentence ruling either way; the change to the other is contained.
2. **A reload is another visit.** The reviewer asked for the reload case to be specified; I made every opening a visit, so the strict rule holds across a reload (conservative: never a false first contact). A reload of the same route could instead keep the visit (session storage), which would save today's read from a service-worker update's reload at the cost of a rule timestamps and storage can fool. My choice; the alternative is small.

## Red lines (`runs/G1/red/`)

- `red-vitest-committed-code.txt` — the new and revised files before any source: the three new files cannot load (*Cannot find module '../../src/data/encounterStore'*); `contactNovelty` ×3 *expected { contact: 'met', … } to deeply equal { …, how: ['played'] }*; `backup` *No objectStore named encounters*; `observationsFromRun` *expected undefined to be false*.
- `red-vitest-final-tests-committed-consumers.txt` — the final test files over HEAD's `ScoreScreen.ts`, `rungState.ts`, `ProgressScreen.ts`, `evidenceJob.ts` and `backup.ts` (restored by sha256): 17 of 62 red — the summary join (*expected [ [ 'practised', [1, 8], … ] ] to deeply equal ArrayContaining*), a piece played again (*expected false to be true*: the rung state refused it), the one writer, and 14 of 15 harness cases (*expected +0 to be 1* encounters, *excerpt A played made excerpt B met: expected undefined to be true*, *the whole piece played left its excerpt a first contact: expected undefined to be false*, the import *expected { kind: 'none' } to deeply equal { kind: 'file' }*). Blind's case is green there by design (nothing was written before G1); its red line is the mutant.
- `red-e2e-heard-at-noon-head-app.txt` — the new browser case on HEAD's app (`vite build` of HEAD's sources, restored by sha256): *a phrase heard at noon went on the record as a first reading in the evening — Expected: false, Received: true*.
- `mutants.txt` — 25 mutants (`scripts/mutants.py`, each file restored by sha256): 24 caught on the first run; `phrase-history-not-read` survived — the record-time recheck stored the right fact, but the sheet said why only after the second read — and was caught once the harness case asserted the sheet's sentence as it is drawn (`mutants-survivor-rerun.txt`). Mechanisms: the upgrade, the backup's stores and its join, the range rule (three), the excerpt mapping (two), the composition, the visit (two), the superset, the phrase's id, the recheck, the hearing kind, Blind, the history read, the phrase scoping (three readers), the summary's join and its id, contact's encounters, the import's bytes, the prune's fold.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `app/tests/unit/encounterModel.test.ts` | add | — | the key against `sameMaterial`; an import's text identity; the version-7 upgrade; the store with and without a database; the backup (replace, merge twice, join); the query's table; first contact on constructed visits; contact with `how` and D4's verdicts; the summary's join and id; `isPhraseRun`, a piece played again passing and meeting its rung, the history line; the one writer |
| `app/tests/unit/firstContactOnTheScore.test.ts` | add | — | the real Score screen into the real stores: the viewing, Blind, the three hearing kinds, heard-then-read (sheet at once, evidence), viewed earlier, viewed now, reload, two tabs, a run under another id, a piece, two excerpts, a duplicate import |
| `app/tests/unit/encounterRetention.test.ts` | add | — | the retention adversary through the real prune at the real cap, and a backup after it |
| `app/tests/e2e/lab.spec.ts` › heard at noon, read in the evening | add | — | the browser case of the brief; the four existing Today's sight-read cases preserved |
| `app/tests/unit/contactNovelty.test.ts` (3 assertions) | revise | a `met` contact had no `how` | `how: ['played']` beside the same verdict fields (G1 item 5) |
| `app/tests/unit/observationsFromRun.test.ts` › a demonstrated take | revise | a piece's run carries no `unseen` ("first sight is not a claim it makes", C1) | `unseen: false` — G1 writes first contact on every run (the reviewer's answer 3); this take was demonstrated inside |
| `app/tests/unit/backup.test.ts` › every store | revise | ten stores | twelve: an encounter and a summary seeded and restored |
| `app/tests/unit/help.test.ts` › §5f sentences | revise | — | the new *…not seen before…* sentence printed in §5f |
| D4 and D4a's files, the evidence, session, store and Score-screen consumers (`named-files.txt`) | preserve | — | green but the two recorded `lessonClaimsAboutApp` reds (blues.3, 4.7: a literal LF against this CRLF checkout), red identically with HEAD's `ScoreScreen.ts` (`lessonClaims-at-head.txt`) |

## Exit codes (unpiped; each capture ends with its exit)

| Run | Exit | What it said |
| --- | --- | --- |
| `npm ci` (`npm-ci.log`); parity reference (`parity.log`) | 0, 0 | installed; four references, three real-MIDI inputs absent and skipped |
| copies from the main checkout (`copy.txt`) | robocopy 1 each | `kern`, `musetrainer` without version control, `build/cache/convert`, the three caches |
| `build.py --offline` (`content-build.log`) | 0 | 2,090 items, validation OK; `SOURCES.md`, `inventory.md`, `rung-claims.md` put back to HEAD's text (`scripts/restore_reports.py`) |
| `npx tsc -b` (`tsc-final.txt`) | **0** | — |
| `npm run lint` (`lint-final.txt`) | **0** | after the HEAD build folder and the Playwright output were removed from `app/` (a first final run counted their files) |
| vitest, the named and consumer files (`vitest-named-final.txt`) | 1 | 52 files, 944 passed, 2 failed — the two recorded `lessonClaimsAboutApp` reds, and only those |
| `npm run build:app` (`build-app.txt`, no preview running) | **0** | `dist/` with the service worker |
| `vite build --outDir dist-head`, HEAD's sources (`build-app-head.txt`) | 0 | the before app; G1's sources restored by sha256 |
| Playwright, port 4183, HEAD's app, the new case (`red/…`) | 1 | the red above |
| Playwright, port 4183, two workers, `lab.spec.ts` (Today's sight-read), `converted-import.spec.ts`, `transfer-offer.spec.ts` (`e2e-sightread-import-transfer.txt`) | **0** | 10 passed |
| the pictures probe (`pictures-probe.txt`; `scripts/zz-g1-pictures.spec.ts`) | 1, then 0 | a probe fault of mine (a locator for a missing element waited out the test); then 1 passed |
| mutants (`mutants.txt`, `mutants-survivor-rerun.txt`) | harness 0 | 24 of 25, then 1 of 1 |
| after the runs, a whitespace repair in `SettingsScreen.ts` (one doubled carriage return my edit script wrote at the new import line, which made git read the file as non-text); then `tsc -b`, lint and the three quickest G1 files again | 0, 0, 0 | the file's diff back to its four lines; 62 passed |

**Unverified**, beside what passes: the phrases unverified as music; the reload, back-and-return, two-tab and held-bar cases in a browser (unit harness only); *Reset progress* clearing the two new stores (no test runs it); the store-wide `familiarity` over a real learner's years of rows (constructed histories and the fixture store only); the phone look is one learner, one row, one width, read from the DOM and the pictures; **CI has not run this tree.**

## Files

In the worktree `agent-afc0715835fd56ff3`; nothing committed, nothing staged.

- New: `app/src/data/encounterStore.ts`; `app/tests/unit/encounterModel.test.ts`, `firstContactOnTheScore.test.ts`, `encounterRetention.test.ts`.
- Changed, in the brief's list: `app/src/data/db.ts` (version 8, the two stores and their types, `STORE_NAMES`, `isPhraseRun`, the `unseen` and `material` notes), `app/src/data/progressStore.ts` (`contact`/`contactIn` with the history and `how`; `foldRun`, `mergeSummaries`, `contactSummaries`, `runBars`; the prune's fold; `recordRun` through `isPhraseRun`), `app/src/curriculum/material.ts` (`textIdentity`, `materialKey`, `playedMaterial`, `runFacts`'s `loaded`), `app/src/ui/screens/ScoreScreen.ts` (the visit, the writes, the history read, the derivation, the recheck, the sheet's sentence), `app/src/data/backup.ts` (the summary join, the cache forgotten), `app/src/ui/screens/ProgressScreen.ts` (the history flag a phrase's only), the tests above, `app/tests/e2e/lab.spec.ts`, `docs/04-ui-spec.md`.
- Changed, outside the list, and why: `app/src/evidence/rungState.ts` and `app/src/data/evidenceJob.ts` (Questions 1: their `unseen` reads scoped to a phrase's run, or every piece played again loses its rung credit); `app/src/ui/help.ts` (`SUMMARY_TEXT.sightReadSeen`, the sheet's sentence for a phrase seen on another visit); `app/src/ui/screens/SettingsScreen.ts` (*Reset progress* clears the two new stores: practice history); `docs/01-architecture.md` (§4.5 documents the stores; no builder holds it). None is E2a's, F2's or Q47's.
- Beside this entry: `runs/G1/` (`red/`, `scripts/` — `mutants.py`, `head_swap.py`, `restore_reports.py`, `playwright.g1-4183.config.ts` and `zz-g1-pictures.spec.ts` as they ran, removed from `app/`; `named-files.txt`, the captures above) and `pictures/g1/` (`progress-history-342x740.png`, `summary-heard-at-noon-342x740.png`, `facts.json`).

**Orchestrator's note at the landing (2026-09-29).** G1's worktree committed by name (b48342f) and merged clean (e13f9c3) over E2a, Q47, F2, D4a, D5, E2 and D4. The chain on the merged main checkout (app code only): typecheck, lint, the new unit files with the contact, backup, help, observation, rung-state, evidence-job, ladder, transfer, session, gate and material consumers, the app build, the sight-reading, import, transfer-offer and lab specs on the default port (tsc 0; lint 0; vitest-targeted 1; build-app 0; e2e-consumers 0; vitest-materialLayer-rerun 0; `runs/G1/orchestrator-exit.txt`; the targeted run held only the two recorded line-ending reds). The builder's captures beside this entry (`runs/G1/`, `pictures/g1/`); the doc rows for `docs/02`, `docs/03` and `docs/08` spliced in this record commit where their anchors held, else kept below; `docs/04` and `docs/01` the builder edited directly. The builder's question 1 (the `unseen` field on piece runs read as a first-sight marker only on phrase runs — `rungState.ts` and `evidenceJob.ts` outside the list, belonging to no other builder) and its not-done (the session's transfer offer still reads contact against runs only: `session.ts` and `TodayScreen.ts`, X1's and G2's; the drill and lab playbacks not written as hearings) go to the reviewer. Follow-ups recorded: L32's note (a phrase opened and left before it is played can no longer be the day's read while Today still offers it — X's recheck), U76 (the Progress history prints the UTC hour), G71 (the drill and lab playbacks as hearings). Nothing heard; unverified as music. Meters at this landing: see the plan's log.


## Doc rows

**`docs/02-curriculum.md` Part G, the first-reading bullet** — after "*A sight-read the learner has heard* — `Hear it`, a held bar or *Play it to me*, before the run or during it — is not a first reading, the same rule as a repeat, and is recorded only as practice (C1, below);" insert:

> on any visit since G1 — a playback is a stored encounter (`encounterStore`), read back when the phrase is opened again — and neither is a phrase looked at on another visit; looking at it on this visit, before playing, is what sight-reading is. A visit is one opening of the Score screen: a reload, Back and a return, a second tab are each another. A notated piece, an excerpt or an import carries the same first-contact fact on its run (`unseen`, over the bars the run covered) as an audit fact that refuses it nothing: a piece played again passes and meets its rung as before (`db.isPhraseRun`: the first-reading rules read a phrase's run only).

**`docs/02-curriculum.md` Part E2, the D4 paragraph's contact bullet** — append:

> Since G1 (`progressStore.contact`) contact reads the encounters that are not runs and the summaries of runs the retention cap deleted as well: material viewed, heard or demonstrated and never played is *met*, a pruned run's material is still *met*, and a *met* says how (`how`: `played`, `heard`, `demonstrated`, `viewed`). The session's offer still calls `contactIn` over the runs alone until the chooser passes the rest (Entry 112, Not done 1).

**`docs/03-content-pipeline.md` §4a** — a bullet after `excerpt`:

> - **An import's identity** (G1): the build keys none, and the catalogue row an import becomes carries no bytes, so `material.materialOfItem` answers `none` for it; where the Score screen loads the stored score it hashes the text (`material.textIdentity`: the sha256 of its UTF-8 bytes) and the import's runs and encounters carry `{kind: 'file', sha256}` — a duplicate import under a new id is the same material. An excerpt's `fromBar`/`toBar` also scope what the learner met: the encounter query normalises an excerpt's bars into its parent's by them (`encounterStore.familiarityIn`).

**`docs/08-test-map.md`, the state-machine table** — a row after D4a's:

> | **What the learner met, and first contact from it** (G1; Part 27, L97; the brief approved with its required change, `responses/7863bee.md`; the durability constraint, `responses/9193261.md`): `db.ts` version 8 (`encounters`, `contacts`), `encounterStore` (`recordEncounter`, `familiarityIn`, `firstContactIn`, `historyFor`, `familiarity`), the Score screen's visit, viewing, playback writes, history read, derivation and recheck, `progressStore.pruneSessions`'s fold (`foldRun`, `mergeSummaries`), `contact` with `how`, `material.textIdentity`, `db.isPhraseRun`, the backup's join | a phrase played to the learner on one visit and read on the next recorded as a first reading; this visit's viewing counted against it, or another visit's (a reload, a return, another tab — before this one opened or after) not counted; a playback written as both kinds, or *Hear it* as a hearing; a viewing in Blind; bars 1–8 practised making bars 25–32 or the whole piece familiar; excerpt A making excerpt B or the whole familiar; the whole piece leaving its excerpt new; another arrangement claiming this notation read; a phrase met by its row's id; a duplicate import restoring first contact; the cap deleting the only proof a passage was practised; a summary carrying evidence or growing on a second fold; a restore overwriting a device's summary; a piece played again losing its pass or rung credit to the first-contact fact | `app/tests/unit/encounterModel.test.ts`, `firstContactOnTheScore.test.ts`, `encounterRetention.test.ts` (added); `tests/e2e/lab.spec.ts` (one case added); `contactNovelty.test.ts`, `observationsFromRun.test.ts`, `backup.test.ts`, `help.test.ts` (revised) — red on the committed code; 25 mutants caught | done (G1, Entry 112); nothing heard; the reload, return, two-tab and held-bar cases unit only; the session's offer reads runs only (Not done 1) |

**`docs/08-test-map.md`, the file lists** — the unit list gains, in its order:

> - `encounterModel.test.ts` — the encounter model (G1): the material key against D4's equality; an import's identity its text's sha256; the version-7 upgrade leaving every store as it was; encounters stored, found by material, kept in memory without a database; the backup's two stores, a merge restored twice adding nothing and joining summaries; the query per facet (the kinds, heard the superset, the run facets by what happened, the range rule, parent to excerpt and not back, an excerpt over practised bars, the composition facet, a legacy history by id, a phrase never by its row's id, the visit, a pruned run's summary); first contact on constructed visits; contact with `how`, D4's verdicts; the summary's join and its id; a piece played again passing, meeting its rung, flagged nothing; the Score screen the one writer.
> - `encounterRetention.test.ts` — the retention adversary (G1): a practised passage and a legacy run pruned by the real job at the real cap; the passage still practised, the other passage novel, the excerpts right, contact met with `how`, the legacy id met by id; a backup after the prune restoring the same answers.
> - `firstContactOnTheScore.test.ts` — the Score screen writes what the learner met and reads it back (G1): one viewing a visit with its source and visit, none in Blind; `Hear it` and a held bar a demonstration, *Play it to me* a hearing; heard then read on another visit (the sheet's sentence as drawn, no first-contact evidence), viewed earlier, viewed now, a reload, two tabs before and after opening, a run under another row id; a piece's first and second runs, an excerpt beside other bars and of a piece played whole, a duplicate import by its bytes.

> and the entries for `contactNovelty.test.ts` ("… and the store's every row read through `contact`" gains "; since G1 a `met` says how, and the encounters and pruned runs' summaries are read beside the runs"), `observationsFromRun.test.ts` ("`unseen` true and false" gains ", and on a piece since G1"), `backup.test.ts` (gains "; the encounters and the summaries of pruned runs, G1"), `help.test.ts` (gains "and G1's *seen before* sentence"), and the e2e `lab.spec.ts` line gains at its end: "Since G1, today's phrase demonstrated at noon, the screen left, read in the evening (the clock fixed by the test): the run `unseen: false`, the sheet's *not heard* sentence, and Progress's history line *not first sight*."
