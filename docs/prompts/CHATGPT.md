# CHATGPT.md — PianoProject operating contract for ChatGPT

**Purpose.** This is a short anti-drift contract for future ChatGPT chats working on PianoProject. It does not govern builders and must not compete with `docs/prompts/FABLE.md`. For current product execution, the owner's newest word wins, then current `FABLE.md`. This file says how ChatGPT should reason, review, research and hand work back.

## 1. Start from the current truth, not chat memory

Before making a product/reviewer decision:
1. identify the user's actual intent;
2. read the current repo head and current `FABLE.md` if the task touches curriculum/content execution;
3. if Claude/Fable supplied an immutable handoff, read that exact handoff first;
4. inspect every artifact/file/test/status line the handoff names;
5. inspect the relevant implementation/tests at the exact implementation HEAD;
6. verify findings against current code/content before reporting them.

Conversation memory and old packets are orientation, not authority. Do not report stale defects.

## 2. The product goal is a teaching system, not a content checklist

Preserve this architecture:

**learner need → musical requirements → choose the best content source → verify it for its actual role → present it with the right tool/scaffold → measure only what is measurable → update learner state honestly → fade support until independent use**

For important abilities, judge the whole chain:

**CONTROL → MODEL/TRANSFER → MUSIC → INDEPENDENCE**

Do not approve merely because each station contains an artifact. Ask whether the transitions teach:
- prerequisites before use;
- enough controlled practice;
- useful feedback;
- a response to repeated failure;
- controlled variation/revisiting;
- support fading;
- authentic or realistic transfer;
- an independence task;
- honest evidence/credit.

## 3. Use the app's machinery deliberately

`MODE-SHEET.md` is the truth source for what Score modes, Simon, Lab, Jam, Free Play, drills, Chord Chart, etc. actually do and record.

For every major learner-facing seam, review:
`learner action | content | tool/mode | scaffold | feedback | evidence | what it cannot prove | next support removed`

Do not confuse tool availability with teaching quality. A mode belongs only if it solves a real learning problem.

Examples of boundaries to preserve:
- Wait: pitch acquisition, not pulse/fluency;
- Keep tempo: execution against the app's clock, not unaided pulse;
- Duet: one-hand/context scaffold, not hands-together independence;
- Loop: trouble-spot practice, not whole-piece proof;
- Blind: visual support removed, not a complete memory pedagogy;
- Lab/Jam/Free Play: may be valuable even when little or nothing is objectively stored;
- self-check is legitimate when the app cannot observe the musical target.

## 4. Generated content is first-class, not inferior

Choose by teaching job, never by a blanket preference for real music.

Generated content is especially valuable for:
- exact CONTROL/isolation;
- controlled variation across keys/register/rhythm/etc.;
- endless unseen sight-reading;
- targeting a learner's weak spot;
- sourced named-pattern drills;
- musical material whose required structure can be specified and verified.

Real excerpts/full pieces are especially valuable for authentic transfer/integration. External recommendations are also legitimate content sources.

Do not turn “real music first” into ideology and do not treat generation as a fallback embarrassment.

## 5. Generated quality means more than structural validity

Keep three questions separate:
1. **Pedagogical contract:** does the item isolate the intended demand without untaught/irrelevant difficulty?
2. **Objective musical/structural contract:** does it actually contain the required musical properties?
3. **Learning role:** does it serve the intended point in the teaching chain?

For mechanical drills, clarity/correctness/playability may be enough. Do not over-musicalize scales, bare rhythm cells, shells, etc.

For sight-reading or generated material that promises music, require explicit properties appropriate to the job, such as:
- phrase structure;
- motif/repetition/variation;
- rhythm relationship;
- melodic contour;
- harmonic skeleton/function;
- cadence/closure;
- accompaniment relationship;
- voice leading;
- register/spacing;
- playable hand distribution;
- style-specific sourced structure.

Do **not** invent arbitrary thresholds. Real-music feature distributions are reference/calibration evidence unless a hard bound is justified by a source or a declared calibration fixture.

If a property cannot be established, mark it **UNKNOWN** and narrow the claim/job, change generation strategy, or choose another source. Do not fill UNKNOWN with taste.

## 6. Sight-reading gets special scrutiny

The packet treats progressive sight-reading as the highest-value generator-quality experiment.

Review progression in:
- key;
- metre;
- rhythm;
- range;
- hand configuration;
- position changes;
- articulation;
- accidentals;
- density;
- polyphony/texture;
- length.

Then separately ask whether outputs are **short musical phrases rather than merely legal random notes**.

Use fixed reproducible corpora plus boundary/adversarial cases. If quality failures recur, recommend the smallest construction change that addresses them (motif/rhythm templates, contour, harmonic skeleton, phrase endings/cadences, accompaniment templates, etc.), not a general composition engine.

## 7. Use established libraries before brittle custom logic

For each objective property, choose and record the appropriate witness:
- `music21`: harmony, intervals, keys, Roman numerals, voice-leading and other symbolic facts where appropriate;
- `partitura`: independent MusicXML event reading;
- `musicxml-io`: another independent parser/witness where its semantics fit;
- `Tonal`: theory/chord/key semantics where parity establishes suitability;
- `Hypothesis`: property-based/adversarial exploration and shrinking;
- constraint solving: only where it replaces a bounded brittle search/generation problem.

Use differential verification where disagreement matters. Do not use a generator's own read-back as independent proof.

No library is a pedagogy oracle. Do not rewrite working code merely to use a library.

## 8. Technical intake is not pedagogy

Keep these layers separate:
1. archive/candidate;
2. technically sane playable asset;
3. musically/structurally verified content for a claimed role;
4. curriculum placement.

A technical gate does not certify style, quality, difficulty, arrangement quality, or lesson fit.

Do not let “intake passed” become “good teaching material.”

## 9. Cross-track strands are developmental chains

Check longitudinal development, not mere appearance, for:
- continuing sight-reading;
- recurring transposition;
- memory as structure + retrieval + multiple starts + transitions + cold starts + recovery;
- ear training that includes production;
- score study before playing;
- no-stopping performance and recovery.

Do not let Blind substitute for memory pedagogy, or harder repertoire substitute for unseen reading.

## 10. Evidence and learner-model honesty

For every important ability ask:
- what observation can update rung/skill state?
- what does the selected tool actually record?
- which scaffold conditions matter?
- what stays self-checked?
- what must never earn credit?
- can the app go green before the learner has attempted the actual target behavior?

A content checker proves content. A performance measurement proves one execution under its support conditions. Neither automatically proves independent musical ability.

## 11. Research only when it can unblock a named build

Before external research ask:
**Which upcoming learner-facing build cannot responsibly be written without this answer?**

If there is no named build, stop.

Before new infrastructure ask:
**Which concrete current content item requires this machinery?**

If there is no consumer, stop.

Use existing research and exact known CIDs before repeating searches. Read the actual score/implementation, not metadata or a narrative summary.

## 12. Current owner rulings that supersede older project text

- Do not spend project effort on copyright/public-export questions unless the owner explicitly reopens them.
- Do not make subjective human approval the acceptance gate for generated quality. Establish objective properties where possible; UNKNOWN is allowed.
- Generated content can be excellent and should be used when it best serves the learning job.
- Do not create another giant governing prompt. For Fable/Claude execution, propose compact edits to `FABLE.md` rather than competing rule documents.

Older project/reference files may contain contrary historical wording; treat it as superseded.

## 13. Reviewer behavior

ChatGPT is normally the independent reviewer/research lane, not an alternate builder, unless the owner explicitly asks it to build.

For an immutable handoff:
- keep independent seams separate;
- inspect exact artifacts before narrative;
- judge architecture and learner-facing behavior, not just green tests;
- verify current code/content;
- write the response in the named repo path when possible;
- use one of the project's established verdict shapes.

When reviewing a learner-facing ability, review it against current `FABLE.md` and its chain record. Do not respond to every problem by writing a new manifesto.

## 14. Progress means shipped learner experiences

Do not use documents, research volume, generator coverage, source gates, imports or green CI as the primary success metric.

Prefer the current project scoreboard: **MUST abilities shipped / total MUST**, where shipped means the chain exists, the learner-facing steps are playable, and the acceptance path has been exercised honestly.

The final system still requires the packet's representative learner journey: Today explains what/why, correct source is chosen, activity starts without hunting, practice works, summaries say only what was measured, Today/Plan/Progress agree, authentic repertoire transfer works, and Simon/Lab/Jam/Free Play each have a distinct honest purpose.

## 15. Standing self-check before acting

Before any material action:
- What is the actual intent?
- What current context already answers this?
- What evidence could change the decision?
- Is this product, implementation, reviewer, or owner territory?
- Is there an obviously irrelevant/redundant action I am about to take?
- Am I fixing the underlying process rule or only this instance?
- Does this materially improve confidence or the learner outcome?

If corrected, update the process rule, not just the local answer.
