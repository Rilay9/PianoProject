### Entry 95 — D2: the microscope and the human review record — one builder-only route where a person sees an item drawn by the app's renderer, plays it through the app's audio, reads its contract and measured facts beside it, and records decisions one dimension at a time, bound to the item's identity; an append-only record merged idempotently from an exported file; the build reading it into every item's provenance and the rung-claims report; the first decision made through the screen and merged (2026-09-27)

**Judgement: the screen as a reviewer meets it, one music-family item from queue to decision.** Driven through the screen in headless Chromium at 342 × 740 (the owner's width) and 1280 × 800, on this worktree's build; the pictures are in `pictures/`. **Nothing was heard by a person**: I cannot listen, so the one decision I made rests on the notation, and says so.

- **The queue.** `#/dev/microscope` opens on the first tier, *Music families · 46*, the chip pressed, the picker listing the 46 canonical items of the fourteen music families and `meter`'s twelve-eight row, each marked `··` (undecided), `✓·` or `✓✓`. The tumbao in C (`exercise.tumbao.c`) is 41st of 46. On a phone the tiers scroll in one row and ◀ / ▶ step within the tier, so the item's title and notation start in the first screenful (`queue-342x740.png`).
- **Seen.** At 342 px the stage takes the whole width of the phone, as the Score screen's does, and draws what the Score screen draws there: the same three buffers (bar 1 in the window, bar 2 beside it, bar 3 dimmed ahead), engraved at the same widths and scaled 0.563 against the Score screen's 0.5625 — the stages differ in height by the Score screen's own rows — measured on both screens in one browser. I read the eight bars one window at a time (`tumbao-342x740-window-1.png` … `-8.png`): bass clef under an empty treble staff, three flats, 4/4; every bar the contract's figure — a dotted-quarter rest, the chord's fifth on the and of two (G2 over Cm, C3 over Fm, finger 2), an eighth rest, the next chord's root on four (F2, then C2, finger 5) tied over the barline; Cm and Fm alternating; bar 8's anticipation ending on the final barline. The notes read here were cross-checked against the file's own events (music21, bar by bar).
- **Played, not heard.** *Hear it — both hands* started the app's piano at the written tempo (♩ = 88, 100 %), scheduled exactly the item's pitches (C2 F2 G2 C3, the left hand; the right hand has none, so *Right hand alone* is disabled) and, played to the end, turned on the `heard` basis for that visit; a stop part way says "a partial playback stays notation" and leaves it off. Headless Chromium renders to a null device: the path ran, nobody listened.
- **The facts beside it**, each under its own hook: the identity the decision binds to (generator `tumbao` v1, seed `null` — "a deterministic family: the recipe is the identity" — recipe and tempo); role canonical; promise *music*, "a bass pattern with the chord anticipated"; *unheard*; target syncopation, also tie and dotted-quarter; every measured demand with its located count and the contract's verdict — `rhythm.syncopation` 8, **required, at density**; `interval.leap` 11, `rhythm.ties` 7, `rhythm.dotted-quarter` 7, `clef.bass` 16, `pitch.ledger` 4 established and assumed; `interval.step` 4, `range.beyond-position` 1 incidental; the physical limits (one-hand span 12, a leap of up to 14 semitones with at least a second, fingering "the generator's own convention, not a published source"); the provenance facts as E0 labels them; the one rung listing it, `latin`, where syncopation is established, the walking bass absent, and clave, tumbao, montuno, comping, bossa nova and tango need a person's judgement; and "No review of it yet".
- **The decision** (`tumbao-342x740-decided.png`): usable score **yes**, category notation, basis **notation**, reason and note as below; teaching use left undecided, because whether it grooves is exactly what the page cannot show. Exported as `review-decisions-20260927T220431.jsonl`, merged by `review.py --merge` (appended 1; a rerun appended 0), and the build then wrote `provenance.review = {score: true, teaching: null}` and a `reviewedScore` fact on that item, and "1 items with a score review, 0 with a teaching-use review" in the inventory.
- **A teacher's read, beyond the one bit.** The notes and rhythm are right and readable. Three things a teacher would say, all in the decision's note: the empty treble staff (whole rests) spends half the phone's height on a left-hand-alone exercise, so each system holds one bar; at one bar per system every tie over the barline breaks at the system's end with only its outgoing half drawn — the learner sees a tie leave and never arrive; and bar 8's anticipation on four has no bar to tie into. Unverified as music: not heard.

**The PDMX item** (`anh113-342x740-*.png`, `anh113-1280x800-*.png`): Anh. 113 opens in the third tier (*claims no detector checks*, 275th of 604), drawn at the phone's width, its facts from the source: no family, so promise, heard and target say none applies; every measured demand with its density verdict, among them `rhythm.triplets` (24 located) marked untaught on its one rung, `classical.3`, and taught at 4.5, and `rhythm.sixteenths` (16) taught at no rung; the rung's claims no detector can check (baroque dance, articulation, two-voice texture); and its quarry keep, shown as "a source-level decision, neither bit". The triplet the facts flag is on the glass in bar 2 (three eighths under a 3); whether this edition's triplets are Anh. 113's is a question for a person with the notation, and I did not decide it.

Four things the reviewer should hear first:

- **The brief's identity hypothesis is half wrong: `drill.generator` is not an item's identity.** The seed is `null` on every family the plan ships, so the triple names 63 identities for 1,176 items (read from the built generated catalogue). Every item in C of one family shares one triple. The identity is G21's: the triple **and** the recipe that wrote the notes (`drill.params` with the hands, and the tempo) — so a recipe changed without a version bump (bars 8 → 4) makes the old decision stale, which the triple alone would miss (case `ev-case5-b`). A notated item's identity is the built file's sha256, E0's cache key, as the brief supposed; the screen hashes the bytes it rendered, and the merge refuses a line whose identity the catalogue no longer has.
- **The Hear it hypothesis holds, on a two-hand groove first.** On the Latin groove (`exercise.latin-groove.c.son-3-2`) the app's `ScoreSession` Listen run, built by the microscope and recording nothing, scheduled only the right hand's pitches for *Right hand alone* (63 67 68 72), only the left's for *Left hand alone*, and both for *both* (the e2e holds it; probe in the browser pane first). Each hand alone is the app's own "play the hand you are not practising". No product change.
- **Found while proving it: the Score screen's Hear it is silent when the screen is opened by address.** `ScoreScreen` builds its session with `audioEngine.contextOrNull` at load, before any gesture on a fresh open (a reload, a link, a home-screen shortcut to a piece), and the session keeps that `null` for the whole visit. Probe (`probe-score-hear.txt`): sample starts after Hear it, opened by address, **0**; opened after a tap on another screen, 5. P0, a learner screen's, not fixed here (Follow-ups). The microscope builds its session inside the first Hear it tap, so it does not share the fault.
- **The report's data reaches the screen through the build**, not through a Python-free recomputation: the reports step writes `content/review/microscope.json` (the queue, each item's contract verdicts, rungs and claims, and the record's events), about 2.6 MB, which the PWA does not precache (`vite.config.ts` `globIgnores`, one line). That is a build step outside "the `reviewed` facts only", and the one vite line outside the brief's list; the reason is that the screen must show the rung-claims report's data and the contract's verdicts, and the app can read neither `build/` nor `tools/`. The alternative, recomputing claims and verdicts in TypeScript, is a second definition of both.

## The mechanisms, and the tests that told them apart

**Per-dimension resolution (the reviewer's required change).** *Hypothesis:* one event per dimension, resolved per item and dimension by time among valid human events, keeps R42's two truths apart. *Alternatives, each spliced into the resolver and run against the shared cases:* one basis per item, the strongest winning across both dimensions (the brief as first drafted); line order instead of time order; the identity ignored; a triage line counted. *Result:* each turns the cases red, in both languages — Python `red-resolution-mutations.txt` (four mutants, four reds), TypeScript `red-unit-record-mutations.txt` (four mutants — the fourth an unidempotent merge — each red on the case written for it; `record.ts` restored byte for byte after each).

**One contract, two implementations.** The build's half (`review.py`) and the screen's half (`record.ts`) read one fixture of cases (`tools/content/tests/fixtures/review_cases.json`), and a Vitest case holds the screen's resolution equal to the build's bits on every built item, hashing each built file as the screen does.

**The build's reviewed facts.** *Test:* `test_review_record.TestTheBuildFillsTheReviewedFacts`, called as the committed build calls `attach_provenance`, red on the committed provenance step (`red-build-reviewed-facts.txt`: `{'score': None, 'teaching': None} != {'score': True, 'teaching': None}`), green after.

**`heard` held to the record.** *Test:* the committed table with `tumbao` marked heard and nothing heard in the record: red (`red-heard-consistency.txt`: "tumbao is marked heard with no heard decision on a current item of it"); the table as committed: green. The adversaries — no decision, a notation decision, a stale identity, a triage line — each fail; a heard decision on a current item passes; `heard: false` beside a heard decision is allowed (never the reverse).

**The route and the learner's stores.** The microscope spec against a build whose router and shell are the committed ones (the microscope unreachable): 4 of 4 red, "element(s) not found" on the screen (`red-e2e-committed-app.txt`; the navigation case's own assertions pass on both by design — it fails there on opening the item first). Against a mutant whose microscope records a run when Hear it is stopped: the store case red, the diff naming a new `progress` row, a `sessions` row and the streak's minutes (`red-e2e-mutant-writes-a-run.txt`). So the byte-identity check sees a write; on D2's build it passes.

**The queue's stand-ins.** A family with no canonical item at all (`power_chord` ships A, D and E; its contract makes C canonical) is stood in for by its first item. The first rule stood in for families whose canonical items were already in the first tier (`intro`, `modal_vamp`, `riff`, `stride`, `secondary_rag` — music families the app also does not judge); the queue test caught it (`red-queue-standin.txt`), and the rule now stands in only where a family has no canonical item anywhere.

## The builder's calls, each with its reason

- **Time order decides; `supersedes` is recorded, not required.** One reviewer on one device is the expected case, and time order needs no chain repair when a line is lost; the screen writes `supersedes` when it knew what it replaced, for the reader. Ties go to the later line.
- **`at` always carries milliseconds and `Z`,** so the strings sort as the times they name (`…:56Z` sorts after `…:56.789Z`; the short form is refused).
- **A bit is `yes` → true, `no` and `fix` → false**: E0's schema and type keep `boolean | null`, and "usable as it stands" is false for a score that needs a fix; the value, basis, date and event id are in the `reviewed` fact beside it (`reviewedScore`, `reviewedTeaching`). No app code reads the bits; `claims.py` counted only true ones as "reviewed", and now counts any decision.
- **The reviewer's name stays in the record and the screen's data, not in the catalogue**: the fact carries the event id, which leads to it.
- **Categories**: the usable score's from R42's list (notation, transcription, fidelity, identity, rendering, playback, other); the teaching use's from R42 and Part 15 §18 (role, opportunity, demands, physical, musical shape, style, usefulness, placement, other).
- **The screen's decisions live in localStorage under `pianopath.microscope.*`**, not a new IndexedDB store: no schema version bump, no path near a learner store, and the e2e compares every IndexedDB store and every other localStorage key.
- **`heard` is offered only after a complete both-hands playback at 100 % in that visit** — the screen enforces what the record means; a person can still choose `notation` after hearing.
- **Hear it is the Score screen's path** (`ScoreSession`'s Listen run through the shared piano), not a playback helper: the same scheduler, the same piano, the same tempo map, which is what "the app's audio" has to mean. Built inside the first tap, for the reason above. No helper file was needed.
- **The notation is drawn from the learner's display settings, as the Score screen draws it**, and on a phone the stage breaks out of the card to the screen's width, because the renderer's bars per window follow the stage's size; at 342 px the two screens were measured drawing the same buffers.
- **`review.py --check` exits 1 only for a fault in the record** (a refused line, an event on an item the catalogue does not have), never for undecided items: nearly all of the catalogue will stay undecided for a long time, and a check that is always red says nothing.
- **Within tiers:** families in name order; rung options in the curriculum's order with generated before authored before imported; the rest by source, then id.
- **The reviewer's name for my decision is "D2 builder (Entry 95)"**: what I am in this repository, and no model's name.

## The queue (`review.py --check`, `runs/run-check.txt`)

On the final build, exit 0:

| Tier | Items | What it holds | Score decisions | Teaching-use decisions |
| --- | --- | --- | --- | --- |
| Flagged by triage (never counted) | 0 | — | — | — |
| 1. The music families' canonical items | **46** | the fourteen music families and `meter`'s twelve-eight row: clave 10, comping 10, boogie 6, walking bass 5, montuno 3, ostinato 2, riff 2, and one each of intro, Latin groove, meter (12/8), modal vamp, secondary rag, stride, tresillo, tumbao | 1 (the tumbao in C) | 0 |
| 2. The not-judged families' canonical items | **165** | the 38 families the app cannot judge, less the five that also promise music and are met in tier 1 (intro, modal vamp, riff, secondary rag, stride); `power_chord`, with no canonical item, stood in for by its first | 0 | 0 |
| 3. Options a rung lists for a claim no detector checks | **604** | every option on a rung with at least one unmeasurable concept (the report's 467 concept claims sit on these rungs), less tiers 1–2; generated, then authored, then imported, in the curriculum's order | 0 | 0 |
| 4. Everything else | **1,246** | by source, then id | 0 | 0 |
| **All** | **2,061** | every catalogue item exactly once | 1 | 0 |

The record: 1 event, by a person, current; 0 triage, superseded, stale or on an unknown item.

## Done

1. **The microscope (item 1).** `#/dev/microscope` and `#/dev/microscope/<item id>` (`router.ts`'s `DEV_IDS`; the shell mounts it lazily); `DevMicroscopeScreen.ts`: the queue with counts and a jump; the notation by `OsmdView` and `WindowRenderer` from the learner's display settings, paged by window; Hear it, both hands and each alone, at the written tempo; the facts under hooks (`identity`, `family`, `version`, `seed`, `role`, `promise`, `heard`, `target`, `musical`, `demands`, `physical`, `provenance`, `rungs`, `reviews`); the decision form per dimension; a triage flag; the device's decisions with their state (unexported, exported, merged, stale) and the export.
   - *Technical:* the spec's four cases green on two workers; red on the committed app; the store check red on a writing mutant.
   - *Pedagogical:* the screen puts a person in front of the item and remembers what they said; it judges nothing. Whether the facts' words are what a teacher needs to decide quickly is unverified until someone reviews a run of items through it.
2. **The record (item 2).** `content/review/decisions.jsonl` (one line: mine) and `content/review/README.md` (every field, identity, resolution, who reads it).
3. **Export and merge (item 3).** The export file is the record's own line format; `review.py --merge` appends, refuses with line numbers, is idempotent (a rerun appended 0 — `runs/run-merge.txt`); `--check` lists the queue music families first.
4. **The build reads the record (item 4).** `attach_provenance` → `review.fill_reviewed`: both bits and the `reviewed` facts on every item; the rung-claims report's priority tables carry a *Teaching review* column and their "review bit" line counts; `heard` held to the record in the contract test.
5. **The queue (item 5).** Four tiers, every catalogue item exactly once; flags from triage lines on top.
6. **Triage (item 6).** `by: "triage"`, never counted (cases 5 and 6; the resolver's mutant).
7. **The first decision**, made through the screen, merged, the record's first line:

```
{"v":1,"event":"ev-4c480747-d912-46de-a776-47cb756ae3fe","item":"exercise.tumbao.c","identity":{"kind":"generator","family":"tumbao","version":1,"seed":null,"recipe":{"key":"C","offsets":[1.5,3],"bars":8,"hands":"left"},"tempoBpm":88},"dimension":"usableScore","value":"yes","basis":"notation","category":"notation","reason":"Read on the page at 342 px, all eight bars: C minor spelled in its key; every bar is the contract’s figure — nothing on one, the chord’s fifth on the and of two, the next chord’s root on four tied over the barline — alternating Cm and Fm; fingering 2 and 5 printed throughout.","note":"Not heard: no playback was listened to. Seen: the empty treble staff (whole rests) takes half the height a left-hand-alone item could use on a phone, so each system holds one bar, and every tie over the barline then breaks at the system end with only its outgoing half drawn; bar 8’s anticipation on four has no bar to tie into.","by":"D2 builder (Entry 95)","at":"2026-09-27T22:04:31.655Z"}
```

8. **Record.** `docs/03` §3 (the merge and reports steps), §4a (`review`), new §4b (the record and the merge); `docs/06` (the builder-only routes); `docs/08` (a row for D2 and every new or revised test file).

## The red lines

Seen before the change each proves, for its reason; the worktree restored byte for byte after every splice (each script checks it).

- `red-build-reviewed-facts.txt` — the build's reviewed facts against the committed provenance step: `{'score': None, 'teaching': None} != {'score': True, 'teaching': None}`.
- `red-resolution-mutations.txt` — the shared cases against four wrong resolvers in Python: strongest basis wins across the two dimensions (the case "a heard teaching-use event leaves the score review's value and basis untouched": `'basis': 'heard'` where `notation` stood); line order (`ev-case4-a` current where `ev-case4-b` should be); identity ignored (`ev-case5-a` filling the score bit); triage counted. RED ×4.
- `red-unit-record-mutations.txt` — the same in TypeScript through `reviewRecord.test.ts`, plus the merge made unidempotent (a rerun appending; two cases red). RED ×4.
- `red-unit-microscope-route.txt` — `microscopeRoute.test.ts` against the committed router: 5 of 5, `expected { tab: 'today' } to deeply equal { tab: 'today', dev: 'microscope' }`, `expected [ 'score' ] to include 'microscope'`.
- `red-heard-consistency.txt` — the heard rule on the table with tumbao marked heard: `['tumbao is marked heard with no heard decision on a current item of it'] != []`; green on the table as committed.
- `red-e2e-committed-app.txt` — the microscope spec against the committed router and shell: 4 failed, the screen never appears.
- `red-e2e-mutant-writes-a-run.txt` — the store case against a microscope that records a run on Stop: the learner's `progress`, `sessions` and `streak` differ.
- `red-queue-standin.txt` — the queue test on the first stand-in rule: `riff`, `intro`, `modal_vamp`, `stride` stood in for twice.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `tools/content/tests/test_review_record.py` | add | — | the shared cases; malformed lines by number; the merge idempotent and refusing (cases and the command, twice on one file); the build's reviewed facts (red first); every built item's bits and facts equal to the record's current decisions; the report's review column; the queue's tiers and every item once; the screen's data; `--check` |
| `tools/content/tests/fixtures/review_cases.json` | add (fixture) | — | six resolution cases, three malformed-line cases, three merge cases, one vocabulary, read by both implementations |
| `test_family_contracts.py` › *every music family is marked unheard* | **replace** → *heard is held to the record* | no hearing could be recorded, so every music family is `heard: false` | a family marked heard has a heard decision on a current item; an unheard music family still says so in its unjudged lines |
| `test_family_contracts.py` › *a family marked heard without a heard decision fails* | add | — | the adversaries: none, notation, stale, triage; heard on a current item passes; never the reverse |
| `test_measured_truth.py` › *provenance on every entry* | revise | no person has decided anything, so a quarry-keep item's bits are null | a bit is filled only beside its `reviewed` fact, and a quarry keep never fills one |
| `app/tests/unit/reviewRecord.test.ts` | add | — | the shared cases through `record.ts`; an exported line reads back; identity per kind; resolution equal to the build's bits on every built item |
| `app/tests/unit/microscopeRoute.test.ts` | add | — | the route by id, round trip, refusal, a second item a new route, never a tab |
| `app/tests/e2e/microscope.spec.ts` | add | — | item 1's facts and the settled notation; Hear it per hand; export accepted by `--merge`, twice; the learner's stores byte-identical; the navigation |
| every other test | preserve | — | see the runs |

## Checks (unpiped; exit codes read)

Every run's output is under `runs/`, its exit code its last line.

| Run | Exit | What it said |
| --- | --- | --- |
| `npm ci` (app/) | 0 | from the lockfile (`node_modules` was absent) |
| `python tools/midi-cleanup/tests/parity_reference.py` | 0 | the reference files, the absent real-MIDI inputs skipped as the script allows |
| setup | — | the main checkout's `kern` and `musetrainer` libraries (no version-control folders), `build/cache/convert`, and its `build/demands-cache.json` and `build/notation-cache.json` (caches keyed on each file's bytes and the definitions' fingerprint, so a stale entry is discarded, never trusted) copied in (`scripts/copy_setup.py`) |
| `python tools/content/build.py --offline`, committed tree (baseline) | 0 | 2,061 items, validation OK; its two reports differ from the committed ones only in line endings |
| the same, after the merge (build 1) | 0 | 2,061 items; `provenance.review` on the tumbao `{score: true, teaching: null}`; inventory "1 items with a score review" |
| the same, final (after the queue's stand-in fix) | **0** | `run-build-final.txt`: "content validation OK … (2061 catalog items)"; the reports step wrote the teaching-review column and the microscope's data. `SOURCES.md` restored to its committed bytes after every build |
| `python tools/content/validate.py --allow-nc --personal` | **0** | content validation OK; the rung-claims warning unchanged ("0 human teaching-use reviews" — the one decision is a score review) |
| `python tools/content/review.py --merge <export>` | 0, then 0 | appended 1; the rerun appended 0, "already in the record 1" |
| `python tools/content/review.py --check` | **0** | the queue above |
| `python -m unittest discover -s tools/content/tests -t tools/content` | **0** | **1,103 tests, OK (skipped=4)** — E0's 1,086, the 16 of `test_review_record.py` and the heard adversary |
| targeted before the final build: `test_review_record` (16), `test_measured_truth` (25), `test_family_contracts.TestTheRowsAreWellFormed` (4) | 0 each | — |
| `npx tsc -b` | **0** | — |
| `npm run lint` | **0** | — |
| `npx vitest run` (final build) | 1 | **6,103 tests: 2 failed, 6,096 passed, 5 skipped** (264 files). The two are `lessonClaimsAboutApp` › *blues.3* and › *4.7*, which read a literal LF in `ScoreScreen.ts` and `style.css` — neither touched by D2, both CRLF in this checkout: the worktree reds Entries 84–92 recorded (their discriminating check not rerun here). The 21 new cases (`reviewRecord` 16, `microscopeRoute` 5) pass |
| `npm run build:app` (no preview running) | **0** | precache 2,200 entries; `dist/sw.js` names nothing under `content/review/` |
| `npx playwright test microscope.spec.ts --workers=2` (port 4193, `pw/playwright.d2-4193.config.ts`), draft build | 0 | 4 passed |
| the same, final build | 1, then **0** | the first attempt never ran a test: the scratch config could not load `@playwright/test` (its `node_modules` junction had gone); junction remade, **4 passed** |
| the red app and the writing mutant (`scripts/red_app_swap.py`, built with `npx vite build`, served on 4193) | 1, 1 | the red lines above; the worktree's three files restored and checked byte for byte before each run |
| `probe-score-hear.spec.ts` (scratch, not the suite) | 0 | by address 0 sample starts; after a tap 5 |

The port was 4193 throughout, started by hand from this worktree and stopped before every app build; ports 4173 and 4183 were never used. The browser pane is shared: one navigation of mine landed on another builder's tab (`127.0.0.1:4183`) before I pinned every action to my own tab; I set that tab's viewport back to the 1300 × 1000 it had. The `diff-growth` hook may fire on `docs/prompts/rung-claims.md`, whose priority tables gained a column on every row (152 rows rewritten by the build).

## Unverified, beside what passes

1. **Nothing heard by a person**, on this item or any other. The playback path ran headless to a null device; the one decision rests on the notation, and its note says so.
2. **The screen as a working tool**: I walked one music-family item and looked at one PDMX item. Whether the facts read quickly enough to review a tier in a sitting, and whether the phone layout suits a reviewer, are unverified until someone reviews a run of items through it.
3. **The notation "as the Score screen draws it"** was measured equal at 342 × 740 (the buffers and their scale on both screens); at 1280 × 800 the microscope's stage is the card's width, narrower than the Score screen's, so the window can differ there.
4. **The decision's identity for a notated item** is the sha256 of the file the screen fetched; that it equals the build's was checked on every built item by the Vitest case (Node hashing the built files), and in the browser only on the items opened.
5. **The categories are mine** (from R42 and Part 15 §18); a reviewer may want others.

## Not done

- **Nothing of the brief is not done.** Named so it is not claimed: the teaching-use review of the tumbao (a person's, by hearing it through this screen); any musical judgement; the excerpt view (E1).

## Follow-ups

- **P0, Score screen (found proving hypothesis 1):** Hear it plays nothing on a Score screen opened by address before any gesture — the session keeps the `null` context it was built with (`ScoreScreen.ts` ~4258, `audioEngine.contextOrNull` read before `getPiano()`); sample starts 0 against 5 (`probe-score-hear.txt`). The fix is the screen's: give the session the context once the gesture makes it (or build it inside the first tap, as the microscope does).
- **P2, content (D0's):** `power_chord`'s contract makes the C item canonical and the plan ships A, D and E, so the family has no canonical item; the queue stands its first item in.
- **P2, notation (seen on the tumbao):** a left-hand-alone generated item is written on a grand staff with an empty treble staff, which on a phone costs half the notation's height; at one bar per system its ties over the barline show only their outgoing half. The generator's staff choice is the family owner's; the half-drawn tie is the renderer's (OSMD draws the arrival half on the next system only when the systems are in one engraving).
- **P3, screen:** the microscope's stage at laptop widths is the card's width, not the Score screen's.

## Questions

None that block. One for the reviewer: the export and the record carry the reviewer's name as typed; the catalogue carries only the event id. If the owner prefers initials in the record too, it is the README's rule, not code.

## Files

In the worktree (`C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a7d183981b546b17f`), nothing committed, nothing added to the index:

- **New, in the brief's list:** `app/src/ui/screens/DevMicroscopeScreen.ts`; `content/review/decisions.jsonl` (one line), `content/review/README.md`; `tools/content/review.py`; `tools/content/tests/test_review_record.py`; `app/tests/unit/reviewRecord.test.ts`; `app/tests/e2e/microscope.spec.ts`.
- **New, beside the brief's list:** `app/src/review/record.ts` (the screen's half of the record's contract — parse, validate, identity, resolve, merge, serialise; kept apart from the screen so the unit test reads it); `app/tests/unit/microscopeRoute.test.ts` (the route); `tools/content/tests/fixtures/review_cases.json` (the cases both halves read).
- **Changed, in the brief's list:** `app/src/router.ts` (the dev-route list, the item, `navigateDev`); `tools/content/build.py` (`attach_provenance` → `review.fill_reviewed`; and `step_reports` writing the microscope's data — outside "the reviewed facts only", for the reason in the judgement); `tools/content/tests/test_family_contracts.py`; `docs/03-content-pipeline.md`, `docs/06-build-plan.md`, `docs/08-test-map.md`.
- **Changed, outside the brief's list, and why:** `app/src/ui/AppShell.ts` (six lines: the shell mounts the new dev route; the router's list alone mounts nothing); `app/vite.config.ts` (one `globIgnores` line: no learner precaches the microscope's data); `tools/content/claims.py` (the report's review column, which item 4 decides, and its counts — a `no` or `fix` is a review too); `tools/content/tests/test_measured_truth.py` (its review-bit assertion encoded "no one has decided anything").
- **Regenerated by the build:** `docs/prompts/rung-claims.md` (the *Teaching review* column on the priority rungs' tables), `docs/prompts/inventory.md` ("1 items with a score review"). `content/scores/imported/SOURCES.md` was rewritten by each offline fetch and restored to its committed bytes after each build.

Beside this entry (`…\scratchpad\D2\`):

- **Pictures:** `pictures/` — `queue-342x740.png`; the tumbao at 342 × 740 (`tumbao-342x740-viewport.png`, the eight windows `-window-1` … `-8`, `-decided.png`, `-exported-full.png`) and at 1280 × 800; Anh. 113 at both widths. The queue and decision pictures were taken before the stand-in fix, so their second to fourth chips read 169 / 602 / 1244; the item pictures were retaken on the final build.
- **The export:** `export/review-decisions-20260927T220431.jsonl`.
- **Red lines** (above) and **runs:** `runs/`.
- **Scripts:** `scripts/` (the copies of the import libraries and caches, the SOURCES restore, the splices, the mutation reds, the red-app swap, the microscope data for iteration); `pw/` (the port-4193 configuration, its storage state, `package.json`, and the decision and probe specs, not part of the suite).
