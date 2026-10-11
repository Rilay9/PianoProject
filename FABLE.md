# PianoProject — purpose and working direction

**Authority.** The owner's newest explicit decision overrides this file, older plans and branch history. This file records enduring intent and safeguards. It is not a feature specification or a script for the next conversation. The owner's actual words live in `docs/inputs/`; never attribute Claude's paraphrase to the owner.

## 1. Purpose

An exceptional, enjoyable, dependable piano-learning app, from beginner towards advanced playing in the styles the owner chooses. The owner is the first learner; what they learn, enjoy, struggle with and demonstrate shapes what comes next. The path taken can mature into something other people can use.

**Current priority: make the application skeleton and its real learner journeys excellent.** Curriculum, lessons and repertoire grow in thoughtfully chosen increments as the owner learns, not as a bulk catalogue. Each step must still be coherent and grounded in established pedagogy, graded syllabuses, actual scores and evidence from playing. Research on the older branches is useful input, not binding.

The owner gives goals, preferences, experience and the big tradeoffs. Claude is responsible for the engineering and the educational preparation, including objective correctness. ChatGPT reviews independently when useful. The owner is not a notation inspector, test runner or XML verifier.

## 2. Stable qualities, evolving choices

**Stable:** musical truth; useful and engaging learning; readable, accessible presentation on a phone in portrait and landscape and on a tablet; responsive interaction; honest feedback and measurement; durable progress; safe data and releases; a low-friction practice experience.

**Not frozen:** modes (their number, names, controls and mechanics), component architecture, renderer, content schemas, generator designs, lesson format, repertoire sources, rung structure, cadence, and the order and number of activities. Simon, duet, the Accompaniment Lab, Wait, tempo modes, karaoke and drills are capabilities and design references, not a mandatory inventory: improve, combine, split, replace or drop one where the learning purpose and evidence justify it. Keep what works; avoid change for novelty.

Examples, here and in conversation, show intent, not quotas or templates. Flexibility never excuses wrong content, incoherence or an inconsistent experience. "Everything is data" is not dogma either: some pedagogical behaviour belongs in code, and schemas grow as real content needs them.

## 3. Port selectively

The old app on `claude/piano-teaching-app-bo19td` holds most of the features; `claude/piano-rebuild` holds research and content tools. Inspect the actual implementation at its current commit before judging or copying. Prefer working components and proven behaviour; compare alternatives, including established libraries, where a real weakness or integration need warrants it. Port by coherent learner-facing flows, not necessarily file by file, and verify behaviour after adaptation: a successful copy or build is not the finish.

Areas to consider, not a redesign checklist: score readability and read-ahead, navigation, accessibility, input latency, playback timing, generator verification, practice tools, import and library, progress, feedback, offline storage and recovery. Work on demonstrated gaps and on whatever the next usable experience needs.

The learner's whole journey is the test: find → understand → play → get useful feedback → retry → keep progress → revisit. Compiling, one good screenshot or passing its own tests does not make a feature excellent.

## 4. Content as we learn

For each learning step, choose the structure and activities that serve it: explanation, controlled exercise, creative work, listening, generated music, a real excerpt, a full piece, collaboration, or something else. No prescribed sequence, song count, mode mix, conversation ritual or weekly template. Claude suggests the next direction from prerequisites, graded methods and what the owner has played; the owner is not asked to supply pedagogy.

Generated exercises are first-class and need independently checked structural, musical and playability claims. Real scores (PDMX or other MusicXML) need verified facts at exact measures, suitable excerpts and clear provenance. A title, grade, tag, detector result, plausible AI reading or completed exercise does not by itself prove teaching suitability or mastery; mark uncertainty UNKNOWN rather than invent certainty. The unverified 135-score review claims are not teaching facts.

**The owner supplies experience, not certification.** Claude establishes notes, rhythms, texture and prerequisites from evidence, and never asks the owner whether a musical fact is correct.

## 5. Feedback, progress, safe evolution

Make feedback easy wherever it is useful: difficulty, enjoyment, confusion and a note, with enough context to act on (item and version, passage, activity, settings, result, time), exportable to Claude and tied to the actual attempt. Check existing data and UI before adding a store or workflow. Feedback informs adaptation; it is not proof of mastery. Keep the distinctions between encountering, practising, performing, an observed result, self-report and demonstrated ability. Preserve progress across content revisions and re-imports, with simple migration and recovery.

Keep source identity, provenance and licence accurate for a public repo and a shareable curriculum. The owner's method-book PDFs and personal device data are never pushed; scores may be, when their licence allows. Keep the stable installed app separate from work in progress; choose and verify the actual route when designing deployment.

## 6. How work proceeds now

**Current focus:** inspect, selectively port and refine the existing application into a dependable, flexible learning skeleton, exercising it with representative content, without bulk curriculum generation. The next task and its finish condition come from current evidence and the owner's approved scope, not from an order in this file.

Within an approved scope Claude investigates, implements, tests, fixes and integrates routine details without asking each time. The owner decides scope changes, product and educational tradeoffs, exposure of personal material and changes to the stable deployment. Commit named paths only; agents never commit or push.

Before new work: current objective → evidence of deficiency → what exists → learner consequence → smallest useful intervention. No duplicate infrastructure, mass inventories, invented frameworks or governance cycles. Test in proportion to risk, on real devices when rendering or interaction is involved. Say what was checked, what is unknown and what counts as finished.

**Cost.** Spend tokens where they buy quality: real device checks, independent verification of generated music, review at genuine design risk. Save them elsewhere: scripts over agents, a cheaper model for a mechanical job, no repeated passes or agent fan-out, never Fable agents. Never trade correctness for cheapness.

When the owner redirects, update this section and the directly affected lines only.

## 7. Branches

- `claude/piano-loop`: active. Its HEAD is what exists.
- `claude/piano-teaching-app-bo19td`: the previous app and its specifications. Inspect; don't assume it sound or flawed.
- `claude/piano-rebuild`: curriculum and score research and tools. Reference evidence, not a programme.
- `docs/inputs/`: the owner's preserved words; the latest instruction wins.

**Success is what a learner can understand, practise, play, enjoy and demonstrate, with an app that improves as they learn.**
