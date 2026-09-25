# Invariants

**Read this before starting any substantial piece of work, and before writing any
agent brief.** These are not style preferences. Every one of them is here because
breaking it cost real time, and most of them cost it more than once.

They are the owner's rules, collected. Where one has a story, the story is the
reason it is believed.

---

## 1. Design and UX

**Decide the information hierarchy before touching markup.** What is the one thing
someone opens this screen to find? What is second? What is merely available? Then
make the screen say that, with visual weights that differ. The Plan screen was
"confusing and cluttered" because stage cards, section headings and rung cards all
carried the same weight.

**Never say the same thing twice.** Plan announced every unit as an all-caps heading
and again as the card beneath it, with the track name repeated inside its own
heading: `CLASSICAL: … — CLASSICAL`.

**No internal identifiers on screen.** `classical.5.1` means nothing to a person.
Keep them in `data-` attributes.

**The thing you tap gets the room.** Plan truncated the rung title on the card while
a heading above showed it in full. That is backwards.

**A control that looks pressable must do something.** Plan's three visible track
chips were rendered as pressed toggles with no click handler at all. Dead controls
are bugs, not cosmetics. `trackOrder`'s drag and arrows are still live controls
acting on nothing.

**Reorganise rather than delete.** Clutter is a grouping and ranking problem. The
exception is content that can never work — rungs built on songs that are not
redistributable and have no file.

**Fill the width with music, not with space.** Never stretch a system past natural
note spacing; a stretched bar is harder to read than a smaller one. What to do with
the room left over is a *judgement*: another bar is a good answer, centring the
narrower system is equally good. Filling the width is not a goal in itself.

**Every change is checked across modes, orientations and sizes.** Phone upright
(342x740) and sideways (740x342), tablet, light and dark, 100 % and 115 % text. A fix
that improves one picture and ruins another is not a fix — that happened twice in one
night to the size machine.

**`04` §0 is the screen contract.** R1 the subject starts in the first screenful, R2
rows ≤ 96 px (with the Library/folder exception for archive titles, written down),
R3 **at most** one filled button, R4 nothing dead.

Read R3 and R4 in the spec rather than from this line. "At most one" is not "one":
Progress deliberately has none, because nothing on it is done on most visits and a
filled box would have been pointing at the rarest action on a screen fifty rows
long. R4 is the other half — an *empty* screen draws the sentence saying so and the
one control that sentence suggests, so the Shelf's `Add a book` is filled while the
shelf is empty and quiet once it is not. Paraphrasing either rule as a count is how
a considered decision gets read as a bug; it happened here on 2026-09-12.

---

## 1a. Claims

**An absence is a claim about a search; give it the search's scope and no more.** "There
is no tempo ladder" is a claim about the repository; "grep for `tempoLadder|autoTempo`
under `app/src` returned nothing" is a claim about a command, and it is the true one.
"Every TypeScript reader of `foo` under `app/src` was grepped and there are none" is a
perfectly good sentence; "there are no consumers anywhere" needs much stronger evidence.
The difference is not pedantry — the scoped sentence shows the reader the hole. (Reworded
2026-09-25: the old heading, *never state an absence*, had produced sentences that refused
to conclude anything; the rule is that the claim's scope matches the search's.) The ladder exists and is spelled
`LADDER_*`; it was reported missing to the owner twice off that grep. On the same pattern,
a filter over genre-tagged songs returned zero and became "the library has no early-stage
genre repertoire", which sent a session writing generators; and the same filter said core
`4.5` had nothing in compound time when it already had four things in 6/8, two of them
songs. **Three wrong absences in one working period, each one expensive.**

A search that returns nothing means the search returned nothing. Before it means anything
more, run a second one shaped differently — a different spelling, a different field, no
filter — or say plainly that you only ran the one.

**Never infer a property of a piece of music from its name, its id or its level.** Those
are asserted; `notation` on the catalog row is measured. An eleven-bar right-hand melody
with no chord symbols went onto the rung teaching left-hand chords because it was called
*12 Bar Blues*, a piece in F major onto the rung teaching the minor, and a 4/4 carol onto
the rung teaching the waltz bass — four wrong placements out of eight, all from titles.
`requires` on a rung and `validate.py`'s `notation_requirements` now refuse this; do not
work around them.

**Do not imply broader verification than you performed.** When you write "X and Y are Z",
"all N are Z", or a bare plural, you have almost certainly checked one of them. Name
which, check the rest, or say in the same sentence that the rest are unchecked. The
grammatical tell below is a self-check, not a rule about prose: the fault is the unearned
scope, and a sentence with "both" in it that was fully checked needs no editing. Joining
two things in one clause is how an unchecked thing borrows a verified thing's
credibility, and it happened three times in one day: `genres` was measured unreliable —
the Library's filters held no songs at all — and the sentence "genres and tags are
uploader-written" carried `tags` across without a single check (tags are on 8% of rows
with 16,619 distinct values, so the conclusion was right and the method was not); seven
generated families were proposed for re-levelling after two were examined, and three of
the seven turned out not to need it; and "the Phase 1 families are levelled 4.1–4.5" was
two families, asserted of all of them.

The tell is grammatical, which is what makes it checkable by someone who knows neither
the music nor the code: if the sentence contains *and*, *both*, *all*, *every* or a
plural, the evidence must be enumerated per item, or the claim must admit it is partial.

**Never describe what your own code produced without looking at what it produced.** Not
the exit code, not the count, the artefact. A build reported "1975 read from the score"
while every field it wrote was empty, because `ElementTree.iter()` does not support the
`{*}` wildcard and only `bars` had been computed with `findall`. A generated cell named
"minor-hook" rendered in C major. A docstring promised four bars over music that was two.
All four passed every mechanical guard.

## 2. Tests

**Never assert a number measured on this machine.** Not a pixel, not a duration, not
a count of today's content. Express the relationship: a share of the viewport, a
comparison against another element, a count derived from the data. The only literals
allowed are the spec's own (R4's forty pixels).

Three of these failed on CI in one week: a 1,050 px sheet budget (1,093 on the
runner), a folder notice allowed to cost exactly zero pixels (6 on the runner), and a
sweep asserting "at least 90 lessons" that an approved deletion took to 86.

**Assert what you mean, not a proxy for it.** "The sheet is under 1,050 px" was
standing in for "a control sits beside its words". Ask the real question.

**Never wait on a transient — observe it.** Install the watcher *before* the action.
A count-in lasts two bars; polling for it after the tap finds nothing under load.

**Every fix ships with a test proved to fail without it.** Make the change, write the
test, revert *just* the source change, confirm red, restore. Say so.

**A suite-only failure is timing, not weather** — but prove it before dismissing it.
Two whole suite runs were read as regressions this week when the cause was the
machine, and an agent was nearly blamed for the second.

**Run what CI runs before pushing, and wait for the previous run to report.**

**Read the CI log.** `gh run view <id> --log-failed`. Do not theorise about a failure
you can read.

---

## 3. Running things

**One Playwright suite at a time.** All configs share port 4173 and `test-results/`.

**Local runs are pinned to four workers** (`playwright.config.ts`). Unpinned,
Playwright takes half of twenty logical processors and ten Chromium instances
rendering full scores thrash a 16 GB machine. Thrashing does not look like slowness;
it looks like forty unrelated failures.

**Do not run a suite while an agent is working.** Same reason.

**Typecheck with `npx tsc -b`.** `tsc --noEmit -p tsconfig.json` exits 0 having
checked nothing.

**Look at the pictures.** Every visual fault this week was found by opening a PNG, and
two of three faults *read off* a PNG did not survive being measured. Looking finds
that something is off; measuring says what.

---

## 4. Documents

**The specs are a debugging aid, not a contract.** When the implementation makes more
sense, change the spec — in the same commit, with the reason beside it. A doc that has
drifted is worse than none: it makes every later reader argue from something untrue.

**Update the spec, the test map and the guides with the change**, not afterwards.

**Never name an AI model anywhere** — commit message, comment, document, or a
`Co-Authored-By` trailer.

---

## 5. Working in this repository

**Commit named paths only.** Never `git add -A`; agents are often mid-edit in the same
tree and a broad add has already swept half-finished work into a push.

**Agents do not commit, push, stash, reset or checkout.** Several share one working
tree.

**Give every agent explicit file ownership**, and let exactly one own `style.css`.

**Report as:** Done / Not done or blocked / Follow-ups / Questions / Files touched.

**Lead a report with the judgement, not the diff** — the hierarchy chosen, the design
rejected — because that is the part worth disagreeing with.
