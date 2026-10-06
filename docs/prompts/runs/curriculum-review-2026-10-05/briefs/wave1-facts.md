# Brief: wave-one pre-dispatch facts (fact-gathering, 2026-10-05)

Decision rationale (§10b): the reviewer lifted the block on the plan of record (`docs/review/responses/e8ac9382.md`) with one required change: each wave-one proposal becomes an exact contract before a build brief is cut, with no unverified mode or material assumption passed to a builder. Two of its four applications are facts to read from the code and the content, not decisions; this lane reads them. Alternatives: let the build brief's author read them (mixes drafting with fact-finding), or the orchestrator (long reading at the wrong cost). What would reverse it: nothing; facts are facts. Uncertainty: the facts may fail, in which case the brief takes the reviewer's stated fallbacks.

The agent writes exactly one file, `docs/prompts/runs/curriculum-review-2026-10-05/WAVE1-FACTS.md`, changes nothing else, commits nothing, never checks out, stashes or resets. Read-only scripts are allowed (`py -3.11`, `PYTHONIOENCODING=utf-8`; music21 10.5.0 is installed). Do not touch `docs/review/pdmx-dump-2026-10-05/`. Never name an AI model. Every claim carries file:line or the script output; observed is marked apart from inferred.

## Part 1: wave 1(c), the blues right hand over the learner's own left hand (map block for blues; `ABILITY-MAP.md` wave one (c))

Read `app/src/ui/screens/ChordChartScreen.ts` and whatever it imports for its controls, plus `docs/04-ui-spec.md` §3b. Establish, each with file:line:

1. Whether the comp layer and the bass-and-drums layer can each be silenced by the learner from the chord-chart UI (a visible control, not only a code field); name the control and its default.
2. Which catalog items open in the chord chart: the rule in code (chord symbols present? a flag? a track?), and whether a twelve-bar item with chord symbols (name the shipped candidates: the authored twelve-bar shuffles on blues.4, `song.classical.12-bar-blues.pdmx`, any blues lead sheet with symbols) opens there. Confirm from `app/public/content/catalog.json` which blues items carry chord symbols and would qualify.
3. How the form tracker and the click are removed or hidden for a last "no support" step, if at all; and whether a run in the chord chart is stored (what session row, judged or not), per `MODE-SHEET.md`'s chord-chart block.
4. If any of 1 to 3 fails: state it plainly; the brief will take the Metronome or self-check fallback the reviewer named.

## Part 2: wave 1(b), early core transposition (map block for transposition; `ABILITY-MAP.md` wave one (b))

The map proposes checking a learner's transposition of Ode to Joy into G with Blind against an existing second-key copy. The reviewer requires exact expected events, not a key-and-hand match. Establish:

1. List every shipped second-key copy of a core tune: `song.classical.ode-to-joy.*` (which keys and hands), Twinkle in F, Saints in F, and any other authored transposed edition (grep `content/catalog.static.json` and `app/public/content/catalog.json` for `transpos`, `in G`, `in F`, `.g`, `.f` ids). For each: id, key, hands, bars.
2. With music21, transpose the original C-major right-hand Ode (`song.classical.ode-to-joy.rh`, bars 1-8) up a fifth and compare pitch-by-pitch and duration-by-duration with the shipped G edition's right hand (the exact event lists; say which bars match, which differ, and why). Do the same for Twinkle C to F if both exist.
3. Compare `exercise.five-finger.g-major.right` against the transposed Ode: same events or not (expected: not; state the first difference).
4. Conclude which shipped copy, if any, is an exact target for a Blind check of the learner's transposition, and for which tune and bars; otherwise state that the first transposition is self-checked. Note what Blind can and cannot show here (it cannot show the learner transposed rather than read; `MODE-SHEET.md` Blind block).

Reply in at most ten lines: the file path; Part 1 findings in one line each (silenceable yes/no, which items open, tracker/click, stored); Part 2's exact-target conclusion; anything you could not establish.
