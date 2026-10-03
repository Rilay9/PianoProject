# The composed day (CL12)

## Judgement and evidence boundary

A learner should see several reasons to play today, rather than one serial lesson wearing five slot names. The purpose is an intention attached to an offer, never evidence that its musical benefit happened. Retire the automatic return to bypassed lessons; keep those lessons browsable and offer targeted practice only when actual evidence or the learner's choice justifies it. Keep the existing scoring, skill standards, identity and project-lifecycle boundaries.

This is a design for review, not a built or browser-verified result. Source was read at working branch `f572066f`; the measurement is the published `docs/prompts/runs/CL12/checks-dff16046.txt`, whose app/tools/content equal base `9dedcc0560503f46b18387a5eddf6d0274d54fe2`. No music was heard; musical efficacy remains *unverified as music*. No implementation pass is claimed.

The governing brief is `CL12-the-composed-day-says-what-each-row-is-for.md`, including *From the review*. It and `responses/385c0131.md` §2 require one purpose spine, with L93, L96 and X19 as its discriminating cases. `session-item-story.md` supplies the existing item story; `evidence-truth.md` supplies the independent evidence contract. The explicit no-quota correction in `path-forward-2026-09-30-addendum.md` §7 and the operating procedure's current precedence rule supersede the old 70/30 target.

## What the measurement actually showed

The first probe did not load: `describe.sequential` is unavailable in the installed runner. The orchestrator replaced it with `describe` and reran with file parallelism off. The published second run reports exit 0 and eight passing tests: six unchanged composed-contract tests and two diary-printing tests. These are the orchestrator's results, not a new run of this design.

The log has 110 morning cards and 550 rows: skip 30 mornings, both ambiguity variants 10 each, intermediate and musician 30 each. Every printed row has an item and nonblank reason. A nonblank reason therefore does not establish a typed purpose or a useful rotation.

| Learner | Review mornings | “Nothing due” mornings | Distinct review items | Longest consecutive same review item |
| --- | ---: | ---: | ---: | ---: |
| skip | 30 | 30 | 3 | 10 |
| ambiguity-b | 10 | 10 | 1 | 10 |
| ambiguity-a | 10 | 10 | 1 | 10 |
| intermediate | 30 | 20 | 23 | 4 |
| musician | 30 | 20 | 14 | 7 |

Across these fixtures, 90 of 110 review offers use the lesson fallback and 20 use actual retention. Those are fixture observations, not population estimates. The skip learner re-establishes the checkpoint's three review items and ten-day repetition. The ambiguity variants are additional measurements. The musician's technique item repeats for 23 days and repertoire item for 20; this identifies stale offers worth testing, not a rule that every repeated item is bad. A repeated reading item id can contain a different seed and recipe: its thirty-day id streak is not thirty identical phrases.

The ten exhaustion records are explicitly synthetic: statuses are changed in memory without writing evidence. With ordinary work ahead marked met, all five calls return `0.1`. With all ordinary work marked met and set-aside preserved, four return null and the musician returns `4.1`. Thus two separate fallback paths contradict the settled placement/set-aside rule. They are not observations of any learner naturally finishing the whole ladder.

### Costliest constraint and its measured alternative

The expensive constraint is preserving honest evidence while ending the apparent obligation to return. Compare the measured current policy (retain behind and set-aside as eventual debt) with the proposed policy (automatic development considers only work ahead on active strands; targeted retrieval may still use older material).

The current policy generates five behind-placement exhaustion recommendations and one set-aside recommendation in the ten printed counterfactuals. The proposed first-slice oracle requires zero automatic behind/set-aside debt recommendations on those same inputs. This is an acceptance expectation, not a measured result of unbuilt code. It avoids fabricated completions or a migration through historical evidence; the cost is an explicit “no further authored lesson” state and a Today/Plan summary that can describe retention, reading and projects without pretending the ladder is complete. Targeted earlier practice needs a reason tied to measured evidence and never reopens the old rung as a debt. A status-only deletion would be cheaper but would leave Today and Plan telling different stories; marking skipped rungs met would be cheaper still and false.

Keeping the fixed review slot through lesson filler also has a measurable cost: 90 fixture mornings consume a review-labelled offer without retention due. The design keeps the existing minute template but changes that offer's actual purpose and words; it does not erase ninety practices or add a new arithmetic quota.

## One purpose model

The composer owns purpose; UI and runner consume it. Slot kind remains the arrangement/time budget (`review`, `new`, etc.), claim remains why a candidate is defensible, and purpose says what this particular attempt is intended to do. There is no permanent kind-to-purpose table.

The minimal contract is an `intent` with:
- one `purpose`: retrieval, application, development, exploration or project;
- `basis`: the existing claim/reading decision, explicit learner choice, or an episode id;
- a precise `target`: the existing skill, demand, rung requirement, piece or passage that justified selection, if one is actually known;
- the source reference needed to say why now (last supporting run/date, requirement, existing project, or episode observation);
- an opening role, only where applicable: criterion attempt or preparation, using X46's semantics.

Do not create a skill target from a piece's notation. Do not classify an old activity from its slot name or frozen sentence. Absence of an intent on legacy stored activities means unknown historical intent; existing outcome/words remain usable. A targetless free-play offer is exploration with learner-chosen material, not a claim to teach a particular skill.

| Purpose | What justifies an offer | Selection and truthful outcome |
| --- | --- | --- |
| retrieval | Existing supported skill or learned piece is due under the existing retention policy; or an earlier skill has a named measured weakness | Preserve due sorting and the one gate. Outcome is what that run measured; retention restored only when the existing reader establishes it. |
| application | Use an already introduced objective in eligible musical material, including a rung's song-run requirement or the existing `ready` demand offer | A named demand is practice intent, not skill evidence. A song ask can name its requirement without inventing a target skill. Prefer an actually score-verified usable real excerpt where it fits. |
| development | An unmet active-strand requirement or a specific next reading move/practice need | Preserve the actual requirement and reading move. Counted progress follows the existing standard, never the purpose label. |
| exploration | An existing transfer-intended offer, a diagnostic where the reader is unsure, or explicitly chosen open play | Novelty comes from the existing contact adapter and material identity, not ids. State the question or choice; do not promise transfer or inferred mastery. |
| project | Work on an existing active piece project or authored project-stage activity | Preserve the project's current lifecycle and the learner's chosen piece. No lesson pass or skill is created by finishing the activity. |

For the reading row, `back`/`forward` are development, an `unsure` probe is exploration, and fluency/easy or stay reads retain the reader's actual explanation under application unless a retention claim explicitly chose them. A fresh seed alone does not make development exploration. These labels add no new threshold or selection rule.

For existing claims: retention is retrieval; `asked` is development except a song-run's application or a project-stage project's project intent; `ready` is application; `transfer` is exploration. A `rung`, `skill`, `demand`, `prerequisite`, `exposure` or jam fallback gets its purpose from the objective actually selecting it: direct unmet work is development, consolidation of known work is application, explicitly open discovery is exploration. If the claim cannot establish the intended distinction, keep the existing honest reason and do not invent an aim: the builder hands back the ambiguous claim case before expanding selection. “Application” does not say a musician has acquired the musical skill.

The typed intent is snapshotted with newly composed session activities, alongside `reason`; shared text functions read it before play. After play, X46's live outcome replaces frozen preparation language. `passed-full`, `failed`, `unknown`, performed time, requirement progress and mastery stay separate. A success in preparation is not a criterion pass.

### Ownership, durability and compatibility

The small shared type/reader belongs beside the composer, in a focused `curriculum/sessionPurpose.ts` module rather than a second recommendation engine. Selection still calls `eligibility`, `contactOf`, `rungState`, the reading chooser and project lifecycle adapters.

New `SessionSlot.intent` is in-memory composition data. New optional validated `ActivitySlot.intent` and `OutsideEntry.intent` are an explicit additive stored-shape change to the existing session settings record, not a new IndexedDB object store, evidence row or evidence-version change. A builder must preserve valid format-1 sessions without intent, accept their existing fields and leave intent absent; malformed present intent is refused without corrupting the otherwise valid legacy record (log the rejected metadata and keep the existing activity). Do not bump the format solely to discard running sessions. Swap/repurpose must recompute or explicitly clear intent; cloning must keep it. Compatibility cases cover an old session resumed and a new session rewritten without optional intent by an old-shaped input. This design does not authorize a destructive migration.

The next day's decisions read real runs plus existing session activity states. A skipped pending activity is a known offer the learner did not play; simply not opening the app or not starting a session establishes no rejection. No persistent history of offers is introduced. Daily session record replacement limits that signal to the retained record; do not claim long-term avoidance learned from it.

## L96: when nothing is due, give the row a truthful job

Preserve the primary due-retention selection and its ordering. Only the `review(ctx, 'fallback')` branch changes. Current `countedOnStrands` puts counted lesson items first on every fallback; that is why the skip learner gets the same option for ten days.

When there is no due retention:
1. Find eligible consolidation material with an explicit established/introduced objective on reached material, retaining the existing admission and lifecycle gates. Say application, not “due review”. Prefer real score-verified eligible material where it serves the objective.
2. Among candidates for that same objective, prefer material least recently played; a never-played candidate cannot be described as something remembered. Stable ties follow the existing catalogue order; shuffle remains within the same objective.
3. Avoid duplication on the card. The latest retained session's unplayed/skipped automatic offer gets an alternative of the same objective when one exists, without treating silence as rejection or lowering readiness.
4. If no defensible consolidation target exists, use a genuine already-supported exploration/reading offer only if the current reader/contact rules can justify it. Otherwise keep the existing playable fallback as an honestly named practice offer, or a non-counting “Choose something to play” prompt where no playable offer exists. Never call this retrieval; never manufacture an evidence weakness.

A single eligible candidate may repeat. It says what it trains/practises, does not say new/due, and the test records the constrained pool. Repetition alone never causes a rung to be passed, a project revived, or an unready piece admitted. Due retrieval outranks this fallback, as before. No content, threshold or evidence activation changes are authorized here.

## X19: an episode that goes away and returns

Start with a transient practice episode owned by the runner coordinator for the current browser session. It persists across internal screen navigation in memory and ends on reload, explicit cancellation, ending/recomposing the session, invalidated source/activity, or completion of the return attempt. It is never serialized into the presently null `SessionRun.detour`; `validateRun` currently rejects any non-null detour. No episode stored-schema change is required before the first episode slice or the first purpose/L93 slice can land; the optional purpose metadata extension is independently itemised above.

The object has:
- `source`: session id/version/activity token where present, source item identity and complete return route/passage/loop selection;
- `observation`: the actual saved run reference and the recorded feature that motivated practice (e.g. selective reading evidence), or explicitly “learner requested practice”;
- `practice`: target objective and candidate selected by an existing defended rule/gate; material identity/contact retained;
- `exit`: the already-existing practice-standard predicate for that supported observable, or explicit learner choice to return where the application cannot be measured;
- `phase`: offered, practising, return-offered, returning, ended.

The source passage is fixed before leaving. Practice completion offers the return; it never marks the source passed or its skill fixed. The return is a fresh attempt in the same source context, observed and stored through the ordinary save path. It ends the episode whether successful, failed or unmeasured, with the actual outcome visible; another detour is a new explicit decision, not an endless auto-loop.

Where source playing measures only note accuracy and not the named musical feature, the episode may be learner-requested and unmeasured for that feature. It must not diagnose phrasing, groove, expression, harmony or other unheard qualities, nor manufacture skill evidence from a piece. An exercise pass says practice reached its existing standard, and the button says return to the passage; “the problem is fixed” is forbidden. A self-report remains self-report.

No automatic new cause-to-exercise policy is decided here. A first build supports only an existing explicit observable/target pairing that the current reader and catalogue can already defend, plus a learner-requested route with an explicitly chosen practice item. If none exists for a proposed automatic detour, stop that case with its two choices: learner-directed unmeasured practice now, or a separate pedagogical decision defining the target/observable/material. Do not make up a mapping from a demand in notation to a learner weakness.

After reload, the ordinary source session can resume; the transient detour cannot. Never infer a return link from the latest exercise or claim that the episode survived. Durable cross-reload episodes would require a separately reviewed extension to the session record's detour type/validator, including source identity, passage and cancellation semantics. It is deliberately outside the first episode slice; future evidence must justify the extra durability.

## Ordered implementation slices

Each slice gets its own immutable head, checks and post-build handoff. These are proposals for dispatch after this design review, not authorizations to modify records now. The test map/spec changes belong to the builder of each slice; this design lane changes neither app nor records.

### Slice A — purpose spine and L93 together (dispatch-ready first slice)

**Goal in learner terms:** Today names the work its card actually offers. Plan points to active strands ahead, never to a behind/set-aside lesson as standing debt. Owner's settled goal is L93's retirement of return; this design's implementation choice is one shared forward-strand summary, preserving actual evidence.

**Rows:** L93 / SG04 first slice; purpose data needed for Today and Plan. L96 and X19 selection are not built yet.

**Own:** `app/src/curriculum/session.ts` (`nextRecommended`, `readerPosition`, `strandsOf`, composed intent assignment); focused `app/src/curriculum/sessionPurpose.ts`; `app/src/data/sessionRun.ts` optional intent validation/retention; `app/src/ui/screens/TodayScreen.ts` header, `activityEntryFor`, row labels; `app/src/ui/screens/PlanScreen.ts` next-card summary; `app/src/ui/help.ts` shared words; relevant unit/browser tests, `docs/02-curriculum.md`, `docs/04-ui-spec.md`, `docs/08-test-map.md`. Do not touch evidence semantics, content claims, gates, project lifecycle or old records.

**Mechanism:** share the already-established forward-strand reading behind `strandsOf` rather than delete two fallbacks while adding a rival ladder. `nextRecommended` remains a compatibility single-position reader for ahead work; no behind/aside fallback. Audit each reader (Today, Plan, Skills, tests/diaries) for legitimate undefined. Preserve strict-prerequisite locked-ahead behavior as explicitly blocked ahead work, never classify an inaccessible row as playable. Preserve invalid-placement behavior consistent with `strandsOf` (unknown placement holds nothing back). Summaries distinguish ahead work, blocked ahead work, and no further authored work; no claim every lesson was passed.

Show a compact list of the actual active strands, ordered as the composer serves them. Plan uses the same summary, linking its active lesson(s), plus Today for the day's mixed work. A targeted retrieval can refer to older material with measured evidence; it does not select that old rung as `nextRecommended`, reopen its status or owe its unplayed requirements.

**Red-first acceptance:**
- Unit: placed-ahead learner with all ordinary work ahead met returns no behind lesson; set-aside-only remaining work returns no debt; legacy carried progress stays separate from measured status.
- Unit: older practice offered only from a named measured weakness/retention source or explicit learner choice, with that source in intent. A mere `word` or behind position is insufficient. Absence of evidence fabricates no completion.
- Unit: multi-track forward summary agrees with composition; strict blocked-ahead state, unknown placement, core-only exhaustion and project-stage case are independent fixtures.
- Unit: new intent survives session creation, validation and transitions; an old session without intent remains resumable without invented purpose; swap/repurpose drops stale target.
- Diary: replay the five measured learners and both exhaustion scenarios without fabricated rows; the six forbidden automatic returns disappear. Reading recipes and actual rung-standard progress stay intact.
- Browser: Today/Plan agree after placement, exhaustion, set-aside, track toggle and a measured retrieval from older material. Three surfaces below, 115% text, whole lesson names and whole actions; no “complete” claim on bypassed rows.

**Falsifier:** any automatic development recommendation behind placement/set-aside without a measured target, a “complete” statement when only ahead work ended, a changed rung/evidence state caused by purpose, or Today/Plan using different active-strand answers. If the shared reader changes strict lock behavior, narrow the helper rather than silently relax the setting.

### Slice B — L96 gives fallback consolidation its actual purpose

**Own:** `session.ts` `review` fallback/candidate ordering plus `sessionPurpose.ts` and `help.ts`; Today row labels only as needed; `app/tests/unit/firstThirtyDays*.test.ts`, relevant composer tests/browser Today spec, test map/spec.

**Acceptance:** unit due retention still wins; nothing due selects only eligible, nonwithdrawn, nonduplicated candidates for the same defended objective; counted status never substitutes for readiness; least-recently-played tie order is pinned. A single-candidate pool repeats honestly. Explicit skipped/unplayed offer gets another same-objective candidate where available; an unstarted session is not a rejection. Diary prints intent target, selection basis and actual material recipe/seed with the existing counts; compare 90 no-due fixture mornings, not a fabricated target of zero repeats. Browser no-due row says application/development/exploration as actually chosen, due row retains its retrieval reason, and repeated constrained offer has no “new” badge.

**Falsifier:** fresh candidate is selected merely to raise distinct-item counts, an unready/paused/put-away piece appears, due retrieval loses priority to variety, or no-due consolidation is labelled evidence-backed retrieval. Delete assertions enforcing perpetual rung review and replace them with semantic acceptance; do not weaken evidence assertions.

### Slice C — purpose through outcome and next-day offer replacement

**Own:** `sessionRun.ts` event/metadata handling where necessary, `sessionRunner.ts` transition adapter, Today running/finished rows, `help.ts`; current Score completion adapter only where passing an intent to the transition requires it. Never reinterpret the score.

**Acceptance:** unit criterion/preparation counted and uncounted cases still produce X46's marks; pending skip vs attempted move-on remains separate; stale token/session/version is refused. New optional intent on outside prompts stays non-counting. Diary tomorrow consults only a real run/current retained session fact; explicit skipped offer replacement preserves objective and readiness, completing practice advances only the relevant current evidence. Browser failed/unknown/preparation sheets give the existing retry/continue route without frozen “not counted yet” under a counted outcome, and after restart legacy sessions show existing words.

**Falsifier:** purpose completes an activity, raises a skill or counts a requirement; an offered-but-unseen row is treated as refusal; replacement silently overrides the learner's latest swap or lifecycle decision.

### Slice D — X19 transient episode and tested return

**Own:** a focused transient coordinator `app/src/ui/practiceEpisode.ts`; `sessionRunner.ts`; Score route/open adapter and Score completion/return sheet at the existing passage/loop boundaries; `help.ts`; targeted unit/diary/browser tests and test map. Keep durable `SessionRun.detour === null`; do not add an evidence target to pieces or modify the project store.

**Acceptance:** unit immutable source route/passage and run reference; practice success offers return without passing source; unknown musical outcome uses explicit learner return; stale/cancelled/reloaded source cancels the transient link; repeated callbacks cannot duplicate the return. Diary a source attempt, one defended practice target, then the same source passage produces ordinary independent run records and ends the episode. Browser exact source passage opens again on all three surfaces, with Keep tempo/Wait/counting semantics untouched; reload during practice has no promised resumable detour.

**Falsifier:** isolated exercise success is reported as source mastery; a new source/passages is substituted without choice; return overwrites the original run; inferred weak skill appears from piece notation; automatic detour requires an unwritten pedagogical target. Stop the unsupported automatic case rather than block unrelated A–C slices or store an invented episode.

## Learner-facing text inventory

These are the complete new/changed templates proposed by this design. Dynamic names/dates/counts come from their existing sources; internal ids never appear. Existing factual reading reasons, criterion sentences, outcome marks, lifecycle warnings and item titles remain unchanged. Where a builder needs another sentence, itemise it for review rather than silently add one.

| Moment / before | Proposed words / condition |
| --- | --- |
| Today header: “Working on Stage … · …” | “Today: {strand titles}” where ahead strands exist; ordered exactly as the composer. |
| Today exhausted: “Every lesson in the plan is complete. Pick anything from Library.” | “No further authored lesson ahead. Keep reading, revisit music, or choose a project.” No assertion of completion. |
| Today blocked ahead | “The next lesson is waiting for {prerequisite title}.” Descriptive, no automatic behind assignment. |
| Plan single “Next up” serial card | Heading “Your active strands”; each forward strand link “{strand title}: {lesson title}”; primary link “See today’s practice”. |
| Plan no authored work ahead | “No further authored lesson ahead. Earlier lessons remain available.” |
| Row slot labels Warm-up / Review / New / Repertoire / Jam / Free play / Sight-reading | Use intent labels “Remember”, “Apply”, “Develop”, “Explore”, “Project”; title/detail still distinguish actual activity and minutes. Legacy intent-absent activities keep existing slot labels. |
| No-due review “Nothing due for review — more from this lesson” | “Nothing due for review — practise {objective name}.” Objective must be known; otherwise “Nothing due for review — more practice from {lesson title}.” Label is actual application/development, not Remember. |
| Consolidation material not previously played | “Apply {objective name} in this music.” Never remembered/known. |
| Explicit same-objective replacement | “Another way to practise {objective name}.” No statement that the learner rejected the previous offer. |
| No playable defended fallback | “Choose something to play.” Non-counting prompt, with existing Library action. |
| Targeted older practice | “Revisit {skill name} — {recorded observation}.” Use the existing evidence reader's exact supported observation wording; never fabricate a deficit. |
| Episode offered | “Practise this, then return to {piece title}, {passage label}.” Only with a valid source/passage and selected practice target. |
| Episode actions | “Practise this”; “Return to the passage”; “End this practice detour”. |
| Episode practice reaches its existing standard | “Practice reached its standard. Try it in the passage.” No skill/fix claim. |
| Episode feature unmeasured | “This run does not measure {feature name}. Return to the passage when you are ready.” |
| Episode cancelled/invalidated while still visible | “This practice detour ended. Open the piece to continue.” |
| Episode return result | Existing run outcome/criterion words; “Practice detour finished.” Adds no mastery or pedagogical judgement. |

Purpose names are action labels, not extra coloured badges. The basis sentence says why now; the existing result mark says what happened. Do not print all three as competing headlines.

## Three surface designs

These are distinct layouts to build and inspect, not screenshots claimed to exist.

| Surface | Today / Plan | Running activity and episode |
| --- | --- | --- |
| Phone upright | Header is two compact lines: Today, then active strand names. Each card row has a whole two-line title, action-purpose plus minutes on one line, and a two-line reason; Swap and Play stay whole in the trailing control column. Plan has vertically stacked strand links above the browsable ladder; no dense horizontal chips. Long names/115% text grow rows rather than truncate the reason deciding the action. | Preserve Score's music/look-ahead area. Detour lives on the existing completion sheet: source piece/passage, one reason, one primary Practise/Return action; cancellation as a secondary action. No permanent extra score toolbar or new modal layered over the current sheet. |
| Phone sideways | Compact header displays active strands in a wrapping line. Today uses compact rows with title/purpose on the left and reason/actions in the remaining width; vertical scrolling remains available. Plan's strand summary and ladder share horizontal width only when each retains whole titles, otherwise stack. | Completion sheet uses two columns: source/reason left, actions right, one primary action. Never steal a persistent strip from the shallow score viewport. Return restores the exact passage and existing controls. |
| Tablet | Today keeps a readable bounded card width with strand summary above it; a secondary adjacent summary may list active strands, without a second Start button. Plan places strand links beside the browsable ladder at sufficient width. Purpose is one small text line, not five equal sections. | Completion sheet separates source/passage summary and action column. Music keeps its established layout; no expanded detour dashboard. The return destination and whole action text remain visible at 115% text. |

Browser acceptance for each touched surface checks whole labels/actions, reason legibility and no body overflow at the project's current phone/tablet fixtures and 115% text; it checks Score readability/look-ahead has not regressed. Pixel budgets are relationships to those fixtures, not constants measured on a single machine. Plan still exposes every lesson by choice; a no-debt summary does not hide earlier teaching.

## CL14 boundary and stop conditions

The purpose contract accepts an existing project/piece and active strand, an explicitly learner-chosen exploration interest and a recorded last-played/supporting date. This leaves room for CL14 beyond the ladder and after a break. It does not decide interests, new supply, a post-ladder curriculum, project lifecycle, numeric balance or a schema for durable episodes.

No stop condition is needed for the defined first slices: they preserve written evidence rules, use existing objectives, and the episode can be transient. Stop an individual automatic purpose/episode case if it would require a new teaching target, support threshold, cause-to-exercise policy or musical observation that nobody can make. Hand back options and their learner consequence. If product review requires a detour to survive reload before any episode can land, the transient premise no longer holds: stop X19 and return the stored-schema proposal before building it. No one in this process can verify unheard musical improvement.

## Where the brief was narrower or wrong

“Every row has a sentence” is verified by this sample and is insufficient: all 550 reasons are nonblank, yet no shared typed purpose exists. The brief's three-learner checkpoint omits both ambiguity variants; they are included here. `composedContract.test.ts` is a recipe walk with no daily learner and supplies contract checks, not extra purpose counts. Item-id streaks alone exaggerate reading repetition because seeds/recipes vary. The transient episode is deliberately weaker than a durable return across reload; the brief asks to name that decision, not to silently add persistent schema.

## Not done

No app code, durable data, curriculum claims, detector changes, record edits or test-map edits are made in this design lane. No new runtime, typecheck, lint or browser pass is claimed. No lesson is marked met, no skill is activated, and no arrangement/contact/evidence meaning is changed. Future slice builders must execute their discriminating checks and visually inspect the three layouts.

## Decisions at landing (the orchestrator, 2026-10-02)

Weighed under the owner's rule that the orchestrator chooses on design (`operating-procedure.md`, the second-read paragraph). The design is taken as written, with one change to the learner-facing words.

- **Row labels: Review / Apply / Learn / Explore / Project** in place of *Remember / Apply / Develop / Explore / Project*: retrieval is *Review*, development is *Learn*. *Review* and *Learn* are the words a learner and a teacher use for those two jobs. *Remember* reads as an instruction rather than a kind of work, and *Develop* says nothing a learner can act on. The no-due row's wording stands: it already avoids calling consolidation a review.
- **The additive stored shape is accepted:** an optional, validated `intent` on session activities, with legacy sessions resumable without it. No format bump and no destructive migration.
- **The transient episode is accepted:** it does not survive a reload. A durable episode needs its own reviewed extension.
- **Slice A dispatches next.** Its browser acceptance covers the three designs and 115 % text; the new words are itemised in its entry.
