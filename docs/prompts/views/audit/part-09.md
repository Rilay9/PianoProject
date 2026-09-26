===== PART 9: THE REVIEWER'S FULL-TREE SWEEP (2026-09-27) =====

With the repository tool the reviewer enumerated the branch at 422e0cf (about 1,857 tree
entries: 56 UI source files, 26 audio, 24 engine, 17 data, 14 score, 11 curriculum, 10 import,
8 MIDI, 7 PDF, plus the Python content and PDMX toolchain and its tests). The conclusion: the
app is more feature-packed than the discussions credited; the problem is increasingly not
"build more features" but "turn all these features into one coherent teacher". Nothing in the
sweep interrupts C4.5; everything below goes into the later waves.

Still standing from the earlier sweep: (2) content delivery will outgrow precache-everything
(core offline: app, soundfont, curriculum, lessons, essential exercises, starter repertoire;
cached or downloaded: PDMX excerpts, larger repertoire, collections, projects, upcoming
material); (3) `ScoreViewportPlan` as a real abstraction: musical and visual facts + viewport +
preference + practice context → a pure plan that OSMD renders, testable without the renderer,
and the basis of portrait karaoke; (4) layout understands musical density, not only geometry,
but renderer density is never pedagogical difficulty; (5) audit every notation surface, not
only the score renderer (OSMD score, drill staff notation, chord charts, PDF, keyboard strips
and ribbons, lesson-embedded notation); (6) a real-hardware truth corpus: the same
performances through the HP-130's MIDI, the phone microphone and perhaps a third route, then
compare the learner-facing conclusions — the diagnostics system already supports MIDI
inspection, mic diagnostics, latency calibration, acoustic loopback, raw captures, render
timing, analysis cost and device reporting; (7) generator separation: musical knowledge →
pedagogical recipe → realiser → structural validator → pedagogical validator →
musical-quality evaluator; (8) generator identity and cache (family + specification + seed +
generator version); (9) the generator microscope; (10) a real-phone threshold for huge
MusicXML first render, with excerpt files, segmentation or preprocessing rather than whole-
score parsing; (11) the laptop deserves a deliberate experience, but separate device
capability from interaction context (at the piano with hands occupied: giant controls,
hands-free lifecycle, minimal tapping, notation priority, continuity; planning and browsing:
repertoire discovery, progress analysis, skill map, lessons, projects), never phone = playing,
laptop = analysis.

Missed before seeing the tree: (12) MIDI import is a potentially major product feature — the
browser-side transcription reads arbitrary MIDI, keeps two-track hands, splits one-track
performances, merges ambiguous tracks, estimates key, respells, chooses quantisation grids per
bar, detects and de-swings swing, handles repeated notes, slices into writable rhythms, fills
rests, writes MusicXML, reads it back, verifies nothing was lost, checks bar durations and
reports what could not be represented; the workflow "bring me music I care about → convert
and analyse → what is usable → sections into a project, excerpt or plan", with transcription
uncertainty visible and provenance and confidence carried, never silently canonical; (13) a
substantial harmony and improvisation teacher already exists (chord identification, charts,
live matching, backing loops, bass, drums, comping, swing, modes, chord-scale, extended
chords, Roman numerals, transposition, ear tunes, dictation, trading fours, generated calls);
build no new harmony feature — integrate into one strand: hear tonic and dominant → recognise
chords → play symbols → I/IV/V → transpose → charts → scales over chords → comping →
constrained improvisation → call and response → trading fours → repertoire and jam; (14)
trading fours is underused; its result rightly is not evidence today; later an improvisation
evidence grammar (form, entry, phrase length, continuity, chord-tone targeting, scale fit,
motif reuse, register, response), never "72 % improvisation accuracy"; (15) the backing loop
is infrastructure, not the finished accompaniment experience: pedagogical backing (clear,
exposes harmony and rhythm) is a different audio design from musically satisfying backing;
(16) chord charts need the hands-busy audit too; the audit spans Score, Chord Chart, Drills,
Jam and trading, PDF, Free Play; (17) ear training as a progression (hear → imitate →
identify → sing or anticipate → find on the keyboard → recognise in repertoire → use in
improvisation), not games of growing length; (18) the chord-dictation silence threshold
(about 120 ms, helped by expected-next-chord membership) is a measurement, not a construct —
segmentation carries confidence in the eventual evidence audit; (19) the hand split should be
user-correctable, the correction saved and reflected in rendering, demands, difficulty and
assignments; (20) imported-score difficulty (the TypeScript port with parity tests) must not
resurrect "Level 4, therefore appropriate": estimated level plus measured demands; (21) PDF
system detection (ink profile, staff lines, systems, barline reasoning, user correction
persisted) makes "Follow my PDF" viable: system navigation, automatic progression, timer,
bookmarks, goals, never pretending to know the notes; (22) no full OMR until the non-OMR PDF
experience is excellent; (23) diagnostics become a guided setup ("Play these notes. Good. I can
hear your piano. Now I'll measure the delay. Done."), the technical screen kept for
troubleshooting; (24) `devicePreview.ts` exists: H extends it into a device-matrix harness
(342 × 740, ~412 × 915, both orientations, tablet, laptop, short laptop, browser chrome and
keyboard) rather than another simulator; (25) the test infrastructure is richer than credited
(four Playwright configurations, an on-demand full render workflow): extend, do not invent;
(26) the content toolchain (archive search, PDMX quarry, shortlist and review, fingering and
Hanon extraction, Kern, MuseTrainer, ABC, authoring, checks, difficulty fitting, render
validation, licensing, rung audits, ladder reports, truncation scans, video checks, notation
analysis, demand extraction) becomes one developer-facing workbench; (27) E evolves the
existing `tools/content/pdmx/` package into the excerpt workbench, not a new pipeline; (28)
content provenance universal (where from; transformations; measured, inferred or supplied;
analyser and generator versions) as an E-level invariant; (29) an external recommendation as
its own object type, distinct from playable catalog content; (30) a content-source decision
policy: choose the kind of experience first (controlled drill, generated exercise, generated
study, sight-reading phrase, PDMX excerpt, full repertoire, ear drill, chord chart, jam or
trading, PDF project, external recommendation), then the content; (31) evidence grammars
differ by experience (sight-reading; technique; ear; harmony; improvisation; repertoire; PDF
and external) and one learner model consumes all without pretending they are measured alike;
(32) feature-packed means composable experiences with a reason, not a menu of 37 modes; (33)
hands-busy as a cross-cutting interaction context (playing / between attempts / browsing)
governing auto-start, count-in, cues, control visibility, accidental taps, continuation,
notation changes, feedback timing and settings lock; (34) audio cues as the hands-free
channel; (35) voice control not yet; (36) MIDI gestures as commands, opt-in, outside judged
windows, never letting musical input become UI input by accident; (37) free play feeding the
teacher descriptively, never a score, much later; (38) keep the parity tests, demote the
scalar level's authority; (39) documentation supersession hygiene (current / superseded /
historical); (40) decompose the giant modules only when H or X works the area, along
conceptual boundaries; (41) help as contextual support in three kinds (operate; what the
musical thing means; why the teacher assigned this); (42) setup ends by proving the practice
loop; (43) accessibility audited in the playing state; (44) performance budgets per device
class, the owner's phone primary; (45) don't build everything now — record the requirements in
their waves.

The 17 consolidated additions and the overarching sentence — *the finished teacher chooses an
experience before it chooses an item; features are teaching tools, not destinations* — are
mapped row by row in `sweep-2026-09-27-mapping.md`. The reviewer can now read the exact
reviewer packet, enumerate the branch and inspect the implementation and tests directly.

**The strategy review (2026-09-27, before C4.5's packet).** The reviewer read the mapping, the
post-B plan and rules, the new and strengthened rows, and Part 9. Verdict: the incorporation
is strong and substantially faithful; none of the 45 observations dropped; the five
qualifications accepted (E14 gated on demonstrated pressure; hardware capture batched around
the owner; audio cues that discriminate themselves from piano and metronome; MIDI commands
opt-in and never accidental; Free Play observation opt-in, visible, later); M7 as the gate is
correct. Four corrections, all applied: (1) C5 does not own L67 or L68 — it remains the
focused retirement of the old progression semantics via L8/L9/S8; improvisation evidence and
chord-dictation confidence come with their experiences; (2) R33/R34 split — E owns import
truth (conversion reliability, uncertainty, provenance, correctable hands, measured demands,
a trustworthy content object), X owns the learner workflow (bring me music I care about, the
correction UX, usable sections into projects and practice); E is never the whole import
product wave; (3) E14's gate made measurable — during E measure install and precache bytes,
install and update cost, storage behaviour on the target phone and the projected
excerpt-corpus size, then keep or trigger; (4) one balancing rule on experience-first —
selection responds to evidence, curriculum intent, retention and transfer, learner goals and
well-rounded exposure (L26), not merely remediation of the weakest measured skill. Otherwise
the placements and weighting stand: do not reopen C0–C4; do not interrupt C4.5; no duplicate
harmony, PDMX or test infrastructure; the scalar level demoted, not deleted; provenance an E
invariant; hands-busy a cross-cutting X concept; M7's freeze retained. The strategy
incorporation is reviewed; the C4.5 implementation packet remains a separate review.

**The C4.5 review (2026-09-27, against 4921646, file-first).** The reviewer read the checkpoint
and both diaries, then the named unit and e2e tests and the evidence, demand-reading,
reader-control, generator-contract and `readingOffer` code. Verdict: the architectural repair
is successful enough to keep; do not redesign C0–C4.5. The original failure is genuinely
repaired: demand-local evidence preserves overlap without asserting cause; selective
contrasting observations identify a relevant demand; ambiguous observations stay ambiguous;
the reader adapts the supported demand rather than backing out the last-added dimension; the
tests drive generated phrases through the real engine and evidence path. The thirty-day
trajectory is materially better; the later 3.1 density and "Now with a leap" are later
curriculum and generator-quality questions, not reasons to reopen the evidence repair. Do the
bounded follow-up before C5; both P1s are real: (1) S29 — extend the contract from single
control moves to composed recipes the live reader can reach (not the Cartesian product):
recipes reachable by legal reader transitions, representative accumulated combinations at
every served rung; every promised demand detector-confirmed, untaught demands absent,
impossible or unreliable combinations explicit to the reader rather than silently generated
differently; (2) L72 — the hands-together opportunity must mean meaningful two-hand
coordination (onset or left-hand change), not every right-hand event over a sustained note,
with regressions that distinguish sustained accompaniment from genuine coordination and keep
legitimate two-hand evidence. On L76: yes in principle to a discriminating read — ten days of
"not sure yet" is honest but pedagogically passive — but not in this repair: it is a distinct
diagnostic-probe experience, not remediation (persistent ambiguity → deliberately isolate one
competing demand while holding the established ones → ordinary observations and evidence →
adapt only if the probe discriminates; the learner-facing line must not claim the diagnosis
beforehand); record and design now, implement after C5 unless S29's work makes it essentially
free. C5 remains next after S29/L72. One packet defect reported: `docs/pending-review.md`
appeared empty to the reviewer's tool at 4921646 — the file is intact (16,481 lines, about
1.7 MB, larger than the tool fetches); Entries 74–77 are copied into
`docs/prompts/entries-74-77.md` for the packet. The verdict is provisional until the chain and
CI on 4921646 finish; any failure is reviewed as a fix, not overridden by this review. After
S29/L72: rerun the skip learner, the two-hand skip learner, the ambiguity adversary and the
composed-recipe contract; if green with the chain and CI, proceed to C5.

**The reviewer approved 3c6c098** as the correct response to the C4.5 review: S29 and L72 as
C4d before C5 with the distinctions kept (reachable composed recipes, not the Cartesian
product; coordination, not sustain); L76 designed without inventing its threshold; the record
file authoritative with the companion copy; L73–L75 rightly C5's. No further direction: let
the verification finish, then C4d does exactly S29, L72 and the four reruns, then a review
before C5. The chain over 4921646 finished green on all twenty-three steps after this.

**The reviewer approved C4d** (file-first at d31be56, and abc277a checked to hold only the dormant C5 brief): verifications 1 and 4 hold; S29 and L72 accepted as substantive repairs of the demonstrated mechanisms; S30 to D; the composed walk to be described as representative, not exhaustive. C5 may start with one clarification, applied to its brief: keep skill evidence separate from rung and item credit — evidence observed on 2.2 informs the learner's skills everywhere; satisfaction of a rung's requirement is what is scoped to the judging rung; the old item credit across rungs disappears. "This is the point where the project moves from the adaptive reader reasons honestly to the whole curriculum uses that evidence as its authoritative progression model."

**The C5 review (2026-09-26, at d06d7b7, file-first).** Not released to C6/C7 yet. L9 and S8 are
closed to the reviewer's satisfaction; the one-path progression architecture is accepted
(`rungState` is genuinely the derivation, generated reading acquires no piece semantics, the old
count and pass machinery is deleted, the cross-listing tests are substantive: every
multiply-listed exercise and song in the built curriculum, the Petzold case, the two-ear-drill
1.5 regression, the two thirty-day trajectories on the real derivation, carry-over stored apart
and never making a rung met, carried concepts as exposures weaker than measured learning). The
carry-over decisions stand. Two findings first: (1) `done` is not judging-rung scoped — `runs`,
`reads` and `measure` read the rows judged by the rung, `done` searches the learner's whole
history and accepts any row with `missed === 0`; used at 0.1, 0.3 and 0.4, uniquely listed today,
so no present exploit, but it contradicts C5's invariant; prefer scoping it and add an
adversarial test, or make the exception explicit; (2) the production evidence job cannot reach
its "item gone" exclusion, because it enumerates sessions from the current catalog's items; a
historical row whose item is gone is never enumerated; fix the enumeration and report path with
a test through `runEvidenceJob`. Keep the `phraseMatches` limitation live and prominent with the
generator-version work: a regenerated phrase differing only where the learner supplied no early
note can match and be recomputed. After the two fixes, rerun the focused C5 tests and the
relevant chain and report; then C5 closes and C6/C7 start.

**The C5 close (2026-09-26, the reviewer, file-first: the checkpoint, Entry 79, `rungState`, the evidence job, the retirement and S8 tests, both fix-forwards; the C6/C7 commits checked to be documentation only).** C5 closes. C6 may start. L8, L9, S8 and the one-path exit criterion are satisfied: observations → evidence → skill ladder → rung requirements → rung state → progression, with the old item-pass and count path retired rather than operating beside it. The two boundary fixes accepted (`done` judging-rung scoped, the tour's originating rung preserved; the evidence job enumerating the sessions store independently of the catalog). The skill/rung distinction verified in the code: skill evidence is the learner's globally; only run, read, done and measure requirements are judging-rung scoped. Keep L80 at P1 as provenance: generated material must carry enough identity and version to reproduce or refuse historical material; `phraseMatches` must not grow into a substitute. One correction to C6 before it runs: review needs two distinct reasons — skill retention (a skill's evidence not shown recently) and repertoire retention (a learned piece worth keeping playable even when its skills were shown elsewhere); if the calendar is retired, an honest provisional repertoire-retention rule replaces its role and the reason distinguishes the two. The gallery's two contrast findings belong to the later accessibility work. "C5 makes years-long use more feasible because progression is no longer based on consuming a finite number of items."
