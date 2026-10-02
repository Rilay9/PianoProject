# SG08 — the Skills screen: every skill's whole name reads at a glance, and the skills the app measures lead (a design and build in three designs; U64 with U93)

Labels: **VERIFIED**, **SETTLED**, **HYPOTHESIS**, **OPEN**, **OUT OF SCOPE**, as in `CL11-what-counts-as-evidence-traced-and-decided.md`.

## What a learner meets

*Review a skill* lists every concept. Each row carries the skill's name, *Drill it*, and *Find more* where a finder exists. The state sits on its own line under the row (`SkillsScreen.ts`, about :272–300).

- **U64.** In C7's pictures, at 342 px, the names were cut by the two buttons ("Three-four t…") (`docs/prompts/pictures/c7/owner-skills-342x740.png`). Of the rows, 269 each said "not judged by the app": honest, but heavy going.
- **U93,** after U90. A long name beside both buttons takes three or four short lines, and such a row stands past R2's 96 px. At 115 % text the buttons already drop under the words.

**HYPOTHESIS:** since U90, names wrap rather than cut, so the remaining faults are the height of a row and the weight of the unjudged rows. **The test that refutes it, run first:** pictures of the screen today at 342 x 740, 740 x 342 and 1024 x 768, and at 115 % text. Measure each row's height and check whether any name is clipped.

## SETTLED

- **The reviewer** (`responses/994586f9.md`): the complete title and the complete actions (*Drill it*, *Find more*) stay independent requirements. Neither is ever shortened or clipped to win width.
- **The C7 review:** unmeasured concepts are never merged into fake skills, and never given an invented state.
- **Three designs, each on its own terms:** phone upright, phone sideways, tablet (`04` §0 R7). The phone needs the most care.
- **Show what the moment needs** (`04` §0): progressive disclosure is allowed; hiding a skill the learner came for is not.

## OPEN: yours to decide, with what the learner meets

- **Row structure on each design.** For example: the name on its own line with the actions under it, as the Library's upright rows do, or something better on that design.
- **How the unjudged skills sit under the measured ones:**
  - grouped,
  - collapsed behind a line that says how many there are and why the app does not judge them,
  - or another shape that keeps every skill reachable.

## Done when

- **Before and after pictures** on the three designs, and at 115 % text upright. In each:
  - every name is whole;
  - every action is whole;
  - the rows meet R2's height rule, or the design says why R2 yields there.
- **A browser case at 342 px:** no name and no action is clipped or ellipsised, and no row overlaps its neighbour.
- **A case for the order:** measured skills come before unjudged ones, and every concept is still reachable.
- **Learner-facing text itemised:** where, before, after, why.
- **Spec and records updated:** `docs/04-ui-spec.md` (the Skills section) and `docs/08-test-map.md`.
- **The checks list:** a new browser spec that imports a shared test helper joins that helper's reader list in `docs/prompts/checks.json`.

## OUT OF SCOPE

- **CL22's sheets and words** (G91, G97, Q92, X18, T13).
- **What a skill's state means** (CL11).

## Stop and hand back if

- **No structure fits a whole name and both whole actions** within the phone's width without giving up something the reviewer settled. Show the cells and the options.

**Scope:**
- `app/src/ui/screens/SkillsScreen.ts`, `app/src/style.css` (the Skills rules);
- the screen's tests;
- `docs/04-ui-spec.md`, `docs/08-test-map.md`;
- `docs/prompts/runs/SG08/`, `docs/prompts/pictures/sg08/`.

The harness is `operating-procedure.md` §14. Never name an AI model in any file.

## Record

lane: SG08 · closes: U64, U93 · entry: 228
index: The Skills screen in three designs: every skill's whole name reads at a glance, and the measured skills lead (`SG08-the-skills-screen-in-three-designs.md`) | app | drafted 2026-10-02 (`SG08-the-skills-screen-in-three-designs.md`); Entry 228
in-flight: drafted 2026-10-02 (`SG08-the-skills-screen-in-three-designs.md`): measured first on three designs and at 115 per cent text; the row's structure per design, the unjudged skills under the measured ones and still reachable (Entry 228)
state: with-reviewer 2026-10-02: in the batch review of five briefs before dispatch (Entry 228)
