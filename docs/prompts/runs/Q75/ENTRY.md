### Entry 131 — Q75 — the Pages build fails on the strict licence's placeholders, not a cold cache: the claim rule now judges only what a build measured (an unmeasured option refutes nothing, so its claim is warned, never failed), the report counts the unmeasured apart, the Pages job restores CI's cache for speed only, and the public build's placeholders are recorded (2026-09-29)

**Judgement.** Nothing was looked at on a screen and nothing was heard. This seam has no browser layer, and what it changes is the build's verdict, not a view.

- **The phone's build after this lands** is the Pages workflow's strict build, whether the cache hits or misses. The cache changes how long the build takes, not what it produces (below). Its content is what the runner logged on 2026-09-29 (Pages run 36552375999, head 31e60857):
  - 2,089 catalogue items;
  - KERN 116 imported, 47 placeholders, 73 excluded;
  - PDMX 367 imported, 175 placeholders;
  - demands measured on 1,783, with 235 unmeasured and 71 made at runtime.
- **Here, a strict build with every conversion cached** writes the same counts line for line (`build-strict-committed.txt`). Under this change the validator passes that build with two new warnings instead of the two errors:
  - `2.4 claims tie (tie), not judged on this build: 1 of its options unmeasured here … and none of its 7 checked options establishes it`;
  - `ragtime.8 claims stride-bass …: 5 of its options unmeasured here … none of its 6 checked options` (`validate-strict-after.txt`, exit 0).
- **On the runner this is unverified** until the Pages run on the record commit is read. The deploy step and the phone picking up the new build are unverified too.
- **The phone's placeholders are the licence's and stay.** They are the 235 unmeasured items: the brief's 222 (KERN 47 + PDMX 175) plus the MuseTrainer and rock rows. By kind, read from the strict catalogue here, whose totals equal the runner's (`strict-claims-three-rules.txt`):
  - 175 PDMX rows whose composition is not public domain;
  - 46 Sapp Joplin rags (CC BY-NC-SA);
  - 6 MuseTrainer *Beautiful* pieces whose composition is not public domain;
  - the 8 rows that are placeholders on every build (seven rock import rows, the Op. 25 no. 7 étude).
  - Separately, one excerpt is not cut because its parent is not bundled.
- **Product consequence, recorded and not fixed.** On the phone, 2.4's tie is practised at density by no bundled piece: its one tie option, *Ga je mee op zoek naar het koningskind* (PDMX, composition unknown), is "import your own copy". ragtime.8's stride bass is the same: its one establishing option is *Pine-Apple Rag*, a Sapp edition. F2's rule surfaced these gaps; it did not create them. That the phone already had them in its last good build (14866282) is inferred: the licence rule predates F2. It was not checked against that build's catalogue.

**The brief's causal model does not hold, and that changed two items.**

- **Hypothesis (the brief's):** the Pages job builds cold, and a cold conversion leaves the 222 scores as placeholders.
- **Alternative:** the Pages job sets `PIANOPATH_STRICT_LICENSE: 1` (the runner's log shows it) and CI does not. A strict build placeholders the CC BY-NC editions and the non-public-domain compositions, however warm the cache is.
- **Discriminating test:** the strict build here with the full cache (KERN "116 cached, 0 converted") reproduces the runner's cold Pages log exactly:
  - KERN 116/47/73, PDMX 367/175;
  - 2,089 items;
  - 1,783 measured, 235 unmeasured;
  - the reports line "550 checkable … 336 not established, 8 kept by no option";
  - the same two errors word for word.
- **Control:** the personal build here reproduces CI's log line for line (`build-baseline-personal.txt`).
- **The runner's own evidence:** the Pages log shows the cold KERN step converting all 116 of its files, with the same 73 exclusions as CI's cached run.
- **Result:** the alternative holds, and a cold cache is ruled out as the cause.
- **Item 3 changes nothing in the phone's catalogue.** It still restores the cache, for speed.
- **Item 1 as literally decided still fails the Pages build.** The literal rule is "still failing where checked options exist and none establishes". On the strict catalogue 2.4 has 7 checked options and 1 unmeasured, and ragtime.8 has 6 checked and 5 unmeasured. So the literal rule fails both, exactly as F2 does.
- **Rule comparison over every judged concept claim on the strict catalogue** (deferrals excluded; `scripts-strict-claims.py`):

| Claim on the strict build | Established / checked / unmeasured | F2 (committed) | Brief, literal | Built |
| --- | --- | --- | --- | --- |
| 2.4 tie | 0 / 7 / 1 | fail | fail | warn |
| ragtime.8 stride bass | 0 / 6 / 5 | fail | fail | warn |
| the other 40 judged claims | — | pass | pass | pass |

**The deviation, and why.** One condition of item 1 was built differently from the brief's words.

- **The rule built:** an unmeasured option on a rung whose checked options do not establish the claim makes the claim *not judged on this build*, which is a warning naming the unmeasured count. A claim fails only where no option is unmeasured.
- **Why:**
  - It is the brief's own principle: "unmeasured material establishes nothing, not that it refutes anything". The claim "some option of this rung establishes it" cannot be refuted while an option that may establish it is unread.
  - It is the only rule in the comparison that lets the phone's build pass without touching the curriculum, which item 5 rules out.
  - It changes no finding on the personal build (local and CI). The report there counts 0 unmeasured option-claim pairs. `compare-validator-personal.txt` shows the same zero errors and the same five deferral warnings under HEAD and under the change; only the count line gains its unmeasured figure.
- **Runtime drills keep F2's treatment.** They neither keep nor defer a claim (a pin below). Unlike a placeholder, they are material no build measures.
- **If the reviewer prefers the literal rule,** it is one condition: warn only where `checked == 0`. The Pages build then fails as it does today, and the phone waits for curricular options.

## Done

1. **The rule judges only what the build measured (item 1).**
   - Technically:
     - `claims.CHECKED` = established, incidental, absent. `rung_claims` counts `measurable` over those alone and carries `unmeasured` on every claim row, every introduced row and the summary.
     - The claims no checked option keeps (`keptByNone`) follow from the claim rows. A claim whose every option is unmeasured is no longer listed as unkept.
     - `concept_claim_findings` behaves as follows:
       - a claim with runtime drills or missing ids only is not judged, as F2 had it;
       - an unmeasured option beside non-establishing checked ones gives the `WARNING (rung claims, Q75) … not judged on this build` line, as does a rung whose options are all unmeasured;
       - a failure says "(0 unmeasured on this build)";
       - a deferral with unmeasured options is used and warned with the count, never stale. It was F2's stale-error path that would have fired once a deferred claim's options were all placeholders.
     - The deferral table is untouched.
     - `rung_claims_warning` states the unmeasured pairs beside the checkable ones.
   - Pedagogically: nothing in the curriculum changes. The two warnings name a real gap on the phone, recorded under follow-ups.
2. **The report says it too (item 2).**
   - `render_rung_claims` puts the summary's unmeasured count beside the checkable count, and appends "(+N unmeasured here)" after a checked count wherever N > 0: in the every-rung table, the claims no option keeps, and the introduced table.
   - On the strict catalogue that reads "485 can be checked … unmeasured on this build: 65; 214 established, 271 not established" (`strict-report-after.txt`). The runner logged 550 and 336 for the same build under F2's counting.
   - The regenerated `docs/prompts/rung-claims.md` differs from the committed one in wording only, 8 lines, with every number the same (`report-diff.txt`).
   - `docs/prompts/inventory.md` was regenerated identical in content (line endings only): nothing to commit.
3. **The Pages build restores CI's cache (item 3).**
   - The step is CI's step, the same `path`, `key` and `restore-keys`. It uses `actions/cache/restore@v4`, because `actions/cache@v4` would save on a miss (the brief's deviation clause).
   - Its comment says what it does: speed only, never the content, and not the placeholders.
   - The two steps side by side (`step-diff.txt`, the only differing line):

   ```
   ci.yml    uses: actions/cache@v4          | pages.yml uses: actions/cache/restore@v4
   path: build/cache, build/render-manifest.json; key: content-${{ hashFiles('tools/content/*.py', 'content/sources/*.json', 'app/package-lock.json') }}; restore-keys: content-   (identical in both)
   ```

   - The restored cache holds the personal build's conversions, the Sapp editions among them. It sits under `build/`, is never copied into `app/dist` (the uploaded path), and the strict build never asks for those entries: `import_kern` converts only what it bundles.
   - Built, not pushed. It waits for the reviewer's word (the 2026-09-29 rule for workflow changes).
4. **What the public build cannot bundle is recorded (item 4).** `docs/03` §3a gains "The public build's placeholders, which no cache changes":
   - which rows the strict build placeholders, and why;
   - the runners' two log lines;
   - no runner lacks a tool or dataset: the Sapp, Chopin Institute and MuseTrainer repositories are fetched, the PDMX slice is committed, and the cache is written only on runners (CI's job and `render-full.yml`), never from the owner's machine;
   - the phone shows those placeholders for as long as the deploy is strict (§1).
   - The backlog row's text is under Doc rows.
5. **Item 5 held.** No curriculum, option, `ci.yml` or strict-build behaviour changed.
6. **The path map:** `docs/prompts/checks.json` had no row for `.github/workflows/pages.yml`. I added one, spliced as text (no checks: no test opens it and no local check can run it; the reviewer reads it before the push). No JSON file was re-serialised in this seam.

## Not done

- **Reading the Pages run on the record commit.** That is the orchestrator's, after the reviewer's word and the push. Until then the runner's strict validation under the new rule is unverified.
- **The backlog row itself.** `backlog-2026-09-25.md` is not among this seam's files, so the text is under Doc rows for the record commit.

## Follow-ups

- **The phone's catalogue is the public build** (product, P1 for the phone). It holds the 235 placeholders above, among them every Joplin rag on the ragtime track. On it, 2.4's tie and ragtime.8's stride bass are kept by no bundled piece. Candidate fixes, none Q75's:
  - Mutopia's public-domain Joplin editions (`docs/03` §2 already notes them: 18 rags, `license = "Public Domain"`) for the strict build's rags;
  - a public-domain tie piece on 2.4;
  - or the owner's D19 route: a private repository and a personal build on the phone, which ends the strict deploy (the owner's choice, already written down).
- **CI's content cache is saved only when CI's whole job is green.** `actions/cache`'s post step was skipped in run 36545038230, whose e2e step failed. While CI is red, both jobs restore an older cache through `restore-keys` (CI's log: "Cache hit for restore-key: content-107a1d89…"). This affects speed only.
- **A possibly stale `docs/03` §3 sentence (adjacent, not fixed).** It says the two flavours "differ in four fields … and in nothing else, which is checked". Since E0, a strict placeholder also differs in `measurement`, `demands` and `provenance`. Which check that sentence means was not traced.

## Questions

1. **The rule's one condition:** keep the built rule (an unmeasured option defers the verdict; the phone's build passes with two warnings), or the brief's literal one (the Pages build keeps failing until 2.4 and ragtime.8 get public options)?
2. **Item 3 is speed only now that the cause is known.** Keep it, or drop it? The runner's logs show the cold strict content build at 884 s and CI's cached one at 532 s. It does not affect the phone's content either way.

## Files

- Changed:
  - `tools/content/claims.py`: `CHECKED`, `rung_claims`' counts, `render_rung_claims`, `_unmeasured_here`, the module note.
  - `tools/content/validate.py`: `concept_claim_findings` and its docstring, `rung_claims_warning`.
  - `tools/content/tests/test_validate_claims.py`: two classes, 12 cases, the module note.
  - `.github/workflows/pages.yml`: the restore step. Held for the reviewer.
  - `docs/03-content-pipeline.md`: the §3a paragraph.
  - `docs/prompts/rung-claims.md`: regenerated.
  - `docs/prompts/checks.json`: the `pages.yml` row.
- Not to commit (line endings only, no content change): `docs/prompts/inventory.md`, and `content/scores/imported/SOURCES.md`. The build rewrote the ledger because the copied repositories have no `.git`; it was put back from HEAD after each build.
- Captures: `docs/prompts/runs/Q75/`, with this entry, the logs below and the scripts `scripts-who-establishes.py`, `scripts-strict-claims.py`, `scripts-strict-report.py`, `scripts-compare-validator.py`.
- Copied read-only from the main checkout (`copy.txt`, robocopy 1 = copied each):
  - `build/cache/convert`;
  - `build/positions-cache.json`, `build/demands-cache.json`, `build/notation-cache.json`;
  - `build/midi-real`;
  - `content/scores/imported/kern` and `musetrainer`, without `.git`.
  - The main checkout's `build/cache` was neither moved nor deleted.
- `npm ci` ran in `app/` (`npm-ci.txt`) for the build's detector run.

## The red lines

`red-test_validate_claims.txt`, the new cases on the committed `claims.py` and `validate.py` (exit 1; 9 of the 12 red):

- `test_its_one_establishing_option_unmeasured_here_is_warned_not_failed`: `Lists differ: ['F.1: its concepts name walking-bass (tex[204 chars] it'] != []`.
- `test_one_unmeasured_and_one_measured_absent_is_warned_not_failed` (the Pages case): the same error.
- `test_the_failing_message_says_how_many_were_checked_and_unmeasured`: the message lacks "0 unmeasured on this build".
- `test_a_deferral_whose_options_this_build_could_not_measure_is_not_stale` and `…placeholder_beside_its_checked_options…`: red on the missing unmeasured count. The behaviour they pin (no stale error) was already green there. They guard this change's side effect.
- `test_a_claim_counts_its_checked_and_its_unmeasured_options_apart` and `test_the_summary_counts_unmeasured_pairs_apart_from_the_checkable`: `KeyError: 'unmeasured'`.
- `test_the_markdown_shows_the_unmeasured_count_beside_the_checked`: `'unmeasured on this build: 1' not found`.
- `test_the_validators_count_line_says_it_too`: `'1 of 1 checkable claims' not found` (it read "2 of 2").
- Green by design, both before and after (pins): the same option measured and absent still fails; one unmeasured and one measured establishing is no finding; a runtime drill beside a measured absent option still fails.

## Tests

| Step | Exit | Note |
| --- | --- | --- |
| `parity_reference.py` (`parity.txt`) | 0 | Q24's first step |
| copies (`copy.txt`) · `npm ci` (`npm-ci.txt`) | 1 each (robocopy: copied) · 0 | — |
| `build.py --offline`, committed code (`build-baseline-personal.txt`) | 0 | CI's log reproduced; reports identical to the committed ones apart from line endings |
| `build.py --offline --strict-license --out build/q75-strict/content`, committed code (`build-strict-committed.txt`) | 1 | the runner's Pages log reproduced, same two errors |
| red `test_validate_claims` (`red-test_validate_claims.txt`) | 1 | 9 of 12 new cases red |
| green `test_validate_claims` (`green-test_validate_claims.txt`) | 0 | 23 |
| three rules on the strict catalogue (`strict-claims-three-rules.txt`) | 0 | the table above |
| `validate.py --dir build/q75-strict/content --strict-license`, after (`validate-strict-after.txt`) | 0 | the two Q75 warnings; unverified on the runner |
| strict report under the change (`strict-report-after.txt`) | 0 | — |
| `build.py --offline`, after (`build-after-personal.txt`) | 0 | reports regenerated |
| HEAD against the tree on both builds (`compare-validator-personal.txt`, `compare-validator-strict.txt`) | 0, 0 | personal: identical findings; strict: 2 errors → 0, 2 warnings |
| `unittest test_validate_claims test_validate test_checks_for_paths` (`targeted-tests.txt`) | 0 | 67 |
| `unittest discover -s tools/content/tests -t tools/content` (`content-tests-all.txt`) | 0 | 1,410, 4 skipped (not identified) |
| `validate.py` (`validate-personal-after.txt`) · `review.py --check` (`review-check.txt`) | 0 · 0 | — |
| `checks_for_paths.py` over the changed paths (`checks-for-paths.txt`) | 0 | 10 matched, 0 unmatched |
| `npx vitest run` (`vitest-all.txt`), the map's `unit` for `tools/content/*.py` | 1 | 294 of 295 files pass; the 2 failures are the recorded `lessonClaimsAboutApp` line-ending pair (blues.3, 4.7; Entry 101), which imports nothing changed here |
| `npm run build:app` (`build-app.txt`) | 0 | — |

Not run: Playwright (no browser layer). Unverified:
- the Pages run's validation and deploy on the record commit;
- the restore step on a runner: a hit, and a miss that neither saves nor fails.

## Doc rows

- **`docs/08` — a new row** after F2's:
  - Row name: **The claim rule judges only what a build measured** (Q75, the Pages deploy failing since F2).
  - What it covers: `claims.CHECKED`, where an `unmeasured` option is not a checked option. The claim rows, introduced rows and summary count it apart (`unmeasured`), and the report shows it beside the checked count. `validate.concept_claim_findings` warns a claim whose checked options do not establish it as not judged on this build where any option is unmeasured, and fails it only where none is, saying "0 unmeasured on this build". A deferral whose options the build could not measure is not stale. `rung_claims_warning` states the unmeasured pairs.
  - What it guards against: the Pages deploy's strict build failing because its licence placeholders counted as checked options that establish nothing (2.4's tie, ragtime.8's stride bass); a failure the runner's log could not tell from a wrong claim; a deferral declared stale because a build could not look.
  - Tests: `tools/content/tests/test_validate_claims.py`, added `TestOnlyWhatThisBuildMeasured` (8) and `TestTheReportCountsTheUnmeasuredApart` (4).
  - Status: done (Q75, 2026-09-29). The runner's strict validation is unverified until the Pages run on the record commit is read.
- **`docs/08`, the file line for `test_validate_claims.py`**, append: "and since Q75 an unmeasured option counted apart from the checked ones: a claim it might keep warned as not judged on that build, never failed; the report's unmeasured counts".
- **`docs/03` §3a:** in this change.
- **Backlog, a new row** (area: content and corpus):
  - Problem: the phone runs the public strict build.
  - Evidence: the runner's log (Pages run 36552375999) shows 235 unmeasured items. They are 175 PDMX rows whose composition is not public domain, 46 Sapp Joplin rags, 6 MuseTrainer *Beautiful* pieces, and 8 rows unbundled in every build. On the phone, 2.4's tie and ragtime.8's stride bass are practised by no bundled option.
  - Decision: recorded (Q75); not a cache or runner fault.
  - Candidates: Mutopia's public-domain Joplin for the rags (`docs/03` §2), a public-domain tie option on 2.4, or D19's private-repository route (the owner's).
  - Verification: the strict build's report shows those rungs kept.
