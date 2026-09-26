===== PART 21: IMPORT TRUTH AND LEARNER GUIDANCE (2026-09-26, the reviewer's audit addendum; onto existing rows) =====

A. **Stale C5 language in the import path** — verified: `assignSheet.ts:72` tells the learner
   "Assigning it to a rung makes it one of that rung's song options — it counts towards
   finishing the rung…" and `docs/OWNER-GUIDE.md:402` repeats it. After C5 that is misleading;
   the implementation is better than the prose (`overlayImports()` puts the piece into
   `songOptions`, and `rungState` counts a qualifying measured run of it judged for that rung
   toward a `runs` requirement); assignment is neither progress nor evidence. The wording
   becomes "…one of that rung's practice options; the app can then suggest it there and use
   measured practice on it toward that rung's requirements"; the historical comments in
   `load.ts:151` and `importOverlay.test.ts:5` ("cannot count for a rung", "could not complete a
   rung") are kept only where they unambiguously mean qualifying practice; a regression proves
   assignment alone yields no evidence and meets no rung, and a qualifying run can. → E21, T52
   (a small task after the C6 fix-forward, before C7; never-teach-wrong in app copy).
B. **The MIDI importer is not another file picker** — E with R34, R35 and X. The assign sheet
   already exposes that time signature, key and quantisation grid are converter guesses before
   the learner accepts, and keeps note and timing claims apart; that epistemic distinction is
   kept. R34: where the importer admits the hand split is inferred, the learner corrects it and
   the correction becomes source truth for rendering, measured demands, difficulty, assignment,
   recommendation and later practice, never a visual override. R35 covers the importer: enough
   provenance to answer "from MIDI; these properties from events; these inferred by converter
   version X; these corrected by the learner" — inferred, measured and user-supplied never
   flattened. Recommendation of an imported score under E uses measured demands and the learner
   model, never "estimated Level 4, therefore a Level-4 learner's piece"; level stays a sort
   signal. Acceptance case → Q8: import a one-track MIDI whose automatic split is wrong; observe
   the conversion and provenance; correct the split; reload; the notation changes; recompute
   demands; difficulty and recommendation inputs see the corrected truth; assign it; assignment
   gives no evidence; perform it; only measured demands and results enter evidence.
C. **A focused guidance audit in X, not a resurrected manual** (X18). The setup tour stays: it
   is resumable, skippable, writes the real Settings values, previews actual score geometry,
   lets the learner prove MIDI at once, and has microphone fallback and calibration. The missing
   question is what happens after setup at a first encounter or a confusion. The model:
   first-use cue → contextual explanation at the point of need → learn by doing → concise
   reminder → deeper reference only on request. Per major surface (Today and the session, Score,
   Lesson, the Drill families, Chord Chart, Lab, Jam and trading, Library and import, PDF, Free
   Play, Plan and Skills, Settings diagnostics), five questions: can a person tell what this is;
   what to do now; what the app will observe or judge, if anything; how to stop without damaging
   progress; and, later, is the answer available locally without leaving practice. Prefer
   one-line contextual teaching, first-use affordances, empty-state guidance, tiny "?"
   explanations; no persistent tutorial prose beside the piano once understood; during playing
   X15 wins (stable notation, no prose mutation, no popups). Two states tested for the major
   surfaces: the novice's first encounter and the returning learner who dismissed the
   explanation, the second materially quieter. → X18, Q42.
D. **Importing is a workflow, not a success toast**: bring music in → understand what the app
   inferred → correct it → decide where and why it belongs → preview or try it → save or assign
   → the app surfaces it intelligently later → practice produces appropriate evidence. A parse is
   not the outcome; the learner finishes an import knowing what to do with the music next. It
   connects to E's source chooser: imported music is a legitimate source beside generated
   material, PDMX excerpts, bundled repertoire and external recommendations, chosen because its
   measured demands match, never only because the learner attached it to a rung. Not built now;
   the contracts are recorded so C7 and interim work cement nothing E must undo. → E21, L22.

The reviewer's next passes: the contextual-help implementation (`help.ts`, the Guide, lesson and
tool entry points, first-use state) against the progressive-disclosure contract; the importer's
post-conversion workflow; the broader content-source selection path.
