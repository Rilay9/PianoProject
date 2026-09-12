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
R3 one filled button, R4 40 px tap targets.

---

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
