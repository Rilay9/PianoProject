# Decision notes

One file per decision taken mid-phase, named `<date>-<topic>.md`, dated, with the reasoning.
They are the honest record of why the project is shaped the way it is rather than the way
`docs/00`–`07` first described it; a spec that disagrees with a note is the spec being stale.

| Date | Note | One line |
|---|---|---|
| 2026-09-05 | [`apk-and-private-repo`](2026-09-05-apk-and-private-repo.md) | Delivery is a TWA APK from a private repository; Pages becomes a test deploy (`00` D19). |
| 2026-09-05 | [`default-branch`](2026-09-05-default-branch.md) | The default and deployment branch is `claude/piano-teaching-app-bo19td`; there is no `main`. |
| 2026-09-05 | [`offline-first-and-exercise-breadth`](2026-09-05-offline-first-and-exercise-breadth.md) | Everything runs locally after the first launch, and exercises are first-class (`00` D20, D21). |
| 2026-09-05 | [`p1-midi-audio-choices`](2026-09-05-p1-midi-audio-choices.md) | P1: where the MIDI modules live, which soundfont, and how settings are stored. |
| 2026-09-05 | [`p2-score-rendering`](2026-09-05-p2-score-rendering.md) | P2: ScoreModel extraction and what OpenSheetMusicDisplay 2.1.2 actually does, measured. |
| 2026-09-05 | [`p3-engine`](2026-09-05-p3-engine.md) | P3: the practice engine's judgement calls — chord windows, laps, the clock. |
| 2026-09-05 | [`p3b-mic`](2026-09-05-p3b-mic.md) | P3b: microphone note detection against real audio; where `05` §11's sketch had to bend. |
| 2026-09-05 | [`p4-content-licensing`](2026-09-05-p4-content-licensing.md) | P4: what the content sources turned out to allow, and how many were lost to NC licences. |
| 2026-09-05 | [`p4-pdf-sheet-music`](2026-09-05-p4-pdf-sheet-music.md) | P4: PDF sheet music cut into systems and shown one at a time. |
| 2026-09-05 | [`p5-authored-content`](2026-09-05-p5-authored-content.md) | P5: what was authored in ABC, what was skipped, and why. |
| 2026-09-05 | [`p5b-exercise-breadth`](2026-09-05-p5b-exercise-breadth.md) | P5b: the generator families, `alternatives[]`, and three things the breadth work found. |
| 2026-09-06 | [`examination`](2026-09-06-examination.md) | An examination pass after P6 and P7: what the two phases left inconsistent. |
| 2026-09-06 | [`once-over`](2026-09-06-once-over.md) | What PianoPath became, where the documents still said otherwise, and what was missed. |
| 2026-09-06 | [`p10-chopin-and-breadth`](2026-09-06-p10-chopin-and-breadth.md) | P10 run 2: the Chopin first editions (CC BY) and wide upper rungs. |
| 2026-09-06 | [`p10-kern-import`](2026-09-06-p10-kern-import.md) | P10 run 1: the `[KERN]` tier under `--allow-nc`, and what the ladder could not supply. |
| 2026-09-06 | [`p11-replan`](2026-09-06-p11-replan.md) | The replan: a quarried library, a generated backbone, and the owner's own music (P11–P19). |
| 2026-09-06 | [`p11-robustness`](2026-09-06-p11-robustness.md) | P11: the conversion cache, the render manifest, and the blind spots the pipeline can now see. |
| 2026-09-06 | [`p12a-technique-families`](2026-09-06-p12a-technique-families.md) | P12a: one level table, nineteen technique families, a technique rung per stage. |
| 2026-09-06 | [`p12b-harmony-ear`](2026-09-06-p12b-harmony-ear.md) | P12b: harmony, ear and reading families, and the rungs that stopped at Stage 5. |
| 2026-09-06 | [`p13-pdmx-tooling`](2026-09-06-p13-pdmx-tooling.md) | P13: the PDMX quarry tooling, built and tested without the archive. |
| 2026-09-06 | [`p14-folder-library`](2026-09-06-p14-folder-library.md) | The archive lives on the phone and the app reads a folder (`00` D24). |
| 2026-09-06 | [`p14-pdmx-quarry`](2026-09-06-p14-pdmx-quarry.md) | P14: the quarry run, the levelling model, and where it stops. |
| 2026-09-06 | [`p15-finder-import`](2026-09-06-p15-finder-import.md) | P15: finders on every rung and concept, and the two-tap import. |
| 2026-09-06 | [`p16-shelf-paper`](2026-09-06-p16-shelf-paper.md) | P16: the shelf, practice against paper, and blind mode. |
| 2026-09-06 | [`p17-tips-practice`](2026-09-06-p17-tips-practice.md) | P17: tips for every drill, coaching rules, and the how-to-practise module. |
| 2026-09-06 | [`p18-carry-overs`](2026-09-06-p18-carry-overs.md) | P18: the six things P6–P8 had honestly left open, done. |
| 2026-09-06 | [`p19-final-pass`](2026-09-06-p19-final-pass.md) | P19: what the review found, what it missed, and what the build proves. |
| 2026-09-06 | [`p6-score-screen`](2026-09-06-p6-score-screen.md) | P6: the Score screen — `ScoreSession` joins renderer, engine, piano and metronome. |
| 2026-09-06 | [`p7-screens-storage`](2026-09-06-p7-screens-storage.md) | P7: the five tab screens, storage, import and the PDF viewer — what was decided along the way. |
| 2026-09-06 | [`p8-drills-ui`](2026-09-06-p8-drills-ui.md) | P8: the drills UI — one screen with a face per kind. |
| 2026-09-06 | [`p9-qa-and-packaging`](2026-09-06-p9-qa-and-packaging.md) | P9: performance, offline, the PWA audit, the APK toolchain, and what could not be done without the phone. |
| 2026-09-06 | [`render-full-on-demand`](2026-09-06-render-full-on-demand.md) | The full render check runs on demand (`render-full.yml`), not on a schedule. |
| 2026-09-07 | [`first-run-on-the-phone`](2026-09-07-first-run-on-the-phone.md) | The first run on the real S25 with the HP-130: what it showed. |
| 2026-09-07 | [`settings-row-budget`](2026-09-07-settings-row-budget.md) | A settings row that carries a sentence is 100 px, not 80 (P21b D2). |
| 2026-09-07 | [`the-ux-tour`](2026-09-07-the-ux-tour.md) | Reviewing the look of the app by making it photograph itself. |
| 2026-09-07 | [`ux-decisions`](2026-09-07-ux-decisions.md) | The UX pass: four rules, nine answers, and what the pictures actually show (`04` §0, `00` D26). |
| 2026-09-08 | [`p21e-round-three`](2026-09-08-p21e-round-three.md) | P21e by the reviewer: one size for the run, chunks sideways, and round four on the state machines. |
| 2026-09-09 | [`setup-tour`](2026-09-09-setup-tour.md) | The setup tour (P20): calibration and the owner's own preferences, chosen by looking. |
| 2026-09-15 | [`pedagogical-quarry`](2026-09-15-pedagogical-quarry.md) | Quarrying the graded teaching collections for the middle of the curriculum. |
| 2026-09-15 | [`quarry-rerun`](2026-09-15-quarry-rerun.md) | The quarry re-run without PDMX's deduplication flag. |
| 2026-09-15 | [`score-folder-index`](2026-09-15-score-folder-index.md) | The score folder: what the platform offers in 2026, and the manifest-first index that fits it. |
